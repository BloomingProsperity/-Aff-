import { requirePaidUser, requireUser } from "../lib/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { centsToAmount, cleanOrderId, cleanPart } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { fivesimHttpError } from "../lib/fivesim.js";
import { writeSmsOrderEvent } from "../lib/smsEvents.js";
import { normalizePublicSmsOrder } from "../lib/smsOrders.js";
import { acquireOperationLock, operationLockKey, releaseOperationLock } from "../lib/operationLocks.js";
import { publicChargeQuote, quoteCharge, supplierCostAllowed } from "../lib/pricing.js";
import { maybeGrantReferralReward } from "../lib/referrals.js";
import { enforceRateLimit, isAllowedStateChangingRead } from "../lib/security.js";
import { shouldRefundSmsOrder, smsRefundCents, smsRefundNote } from "../lib/smsRefunds.js";
import { activeSmsOrderStatuses, cooldownSecondsLeft, smsRiskSettings } from "../lib/smsRisk.js";
import {
  buySmsProvider,
  changeSmsProviderOrder,
  checkSmsProviderOrder,
  providerOrderKey,
  providerServiceCatalog,
  publicBestSmsQuote,
  quoteSmsProviders,
  selectBestSmsQuote,
  smsProviderHttpError,
  sortBuyableQuotes,
} from "../lib/smsProviders.js";

const PRODUCT_CACHE_SECONDS = 60;
const QUOTE_CACHE_SECONDS = 20;
const COUNTRIES_CACHE_SECONDS = 3600;
const SMS_LOOKUP_PART_PATTERN = /^[a-zA-Z0-9_-]{1,40}$/;

function smsLookupPart(value, fallback = "") {
  const raw = String(value ?? fallback ?? "").trim();
  if (!SMS_LOOKUP_PART_PATTERN.test(raw)) return null;
  return raw.toLowerCase();
}

function badSmsLookup(reply) {
  reply.code(400);
  return { error: "请求参数不正确。" };
}

function countriesCacheKey() {
  return "countries:5sim";
}

function productCacheKey(country, operator) {
  return `products:${country}:${operator}`;
}

function quoteCacheKey(country, operator, product) {
  return `quote:${country}:${operator}:${product}`;
}

async function readProductCache(db, cacheKey, now) {
  const row = await one(db, "SELECT data_json, expires_at FROM product_cache WHERE cache_key = $1", [cacheKey]);
  if (!row) return null;
  try {
    return {
      data: JSON.parse(row.data_json || "{}"),
      fresh: Number(row.expires_at || 0) > now,
    };
  } catch {
    return null;
  }
}

async function writeProductCache(db, cacheKey, data, now, seconds = PRODUCT_CACHE_SECONDS) {
  await exec(
    db,
    `INSERT INTO product_cache (cache_key, data_json, expires_at, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (cache_key) DO UPDATE SET
       data_json = EXCLUDED.data_json,
       expires_at = EXCLUDED.expires_at,
       updated_at = now()`,
    [cacheKey, JSON.stringify(data || {}), now + seconds],
  );
}

async function loadProductCatalog(app, country, operator) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = productCacheKey(country, operator);
  const cached = await readProductCache(app.db, cacheKey, now);
  if (cached?.fresh) return { ok: true, data: cached.data, cache: "HIT" };

  const result = await app.fivesim(`/guest/products/${country}/${operator}`, "");
  if (result.ok) {
    await writeProductCache(app.db, cacheKey, result.data || {}, now);
    return { ok: true, data: result.data || {}, cache: "MISS" };
  }

  if (cached?.data) return { ok: true, data: cached.data, cache: "STALE" };
  return { ok: false, result };
}

async function loadCountries(app) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = countriesCacheKey();
  const cached = await readProductCache(app.db, cacheKey, now);
  if (cached?.fresh) return { ok: true, data: cached.data, cache: "HIT" };

  const result = await app.fivesim("/guest/countries", "");
  if (result.ok) {
    await writeProductCache(app.db, cacheKey, result.data || {}, now, COUNTRIES_CACHE_SECONDS);
    return { ok: true, data: result.data || {}, cache: "MISS" };
  }

  if (cached?.data) return { ok: true, data: cached.data, cache: "STALE" };
  return { ok: false, result };
}

async function loadPublicQuote(app, country, operator, product) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = quoteCacheKey(country, operator, product);
  const cached = await readProductCache(app.db, cacheKey, now);
  if (cached?.fresh) return { data: cached.data, cache: "HIT" };

  const quotes = await quoteSmsProviders(app, { country, operator, product });
  const data = publicBestSmsQuote(app.config, quotes);
  await writeProductCache(app.db, cacheKey, data, now, QUOTE_CACHE_SECONDS);
  return { data, cache: "MISS" };
}

function enrichProducts(config, products) {
  return Object.fromEntries(Object.entries(products || {}).map(([code, info]) => {
    const cost = Number(info?.cost || info?.Price || info?.price || 0);
    const count = Number(info?.count || info?.Qty || info?.qty || 0);
    const quote = quoteCharge(config, cost);
    if (!supplierCostAllowed(config, cost)) {
      return [code, {
        count: 0,
        charge: 0,
        currency: "CNY",
      }];
    }
    return [code, {
      count,
      ...publicChargeQuote(quote),
    }];
  }));
}

async function refundBalance(db, userId, cents) {
  if (cents <= 0) return null;
  return one(
    db,
    `UPDATE users
        SET balance_cents = balance_cents + $1, updated_at = now()
      WHERE id = $2
      RETURNING *`,
    [cents, userId],
  );
}

async function reserveBalance(db, userId, cents) {
  return one(
    db,
    `UPDATE users
        SET balance_cents = balance_cents - $1, updated_at = now()
      WHERE id = $2
        AND balance_cents >= $1
      RETURNING *`,
    [cents, userId],
  );
}

async function auditSmsBuy(app, request, auth, status, httpStatus, metadata = {}, resourceId = "") {
  await writeAuditLog(app.db, request, {
    actorUserId: auth.user.id,
    targetUserId: auth.user.id,
    action: "sms.buy",
    resourceType: "sms_order",
    resourceId,
    status,
    httpStatus,
    metadata,
  });
}

function providerFailureMetadata(result = {}, row = {}) {
  return {
    provider: result.provider || row.provider || "",
    status: result.status || null,
    apiCode: result.apiCode || null,
    publicCode: result.publicCode || "unavailable",
  };
}

async function refundSmsOrderIfNeeded(app, request, auth, orderId, triggerAction) {
  const client = await app.db.connect();
  let result = { refunded: false, order: null, balanceCents: null };

  try {
    await client.query("BEGIN");
    const locked = await one(
      client,
      "SELECT * FROM sms_orders WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [orderId, auth.user.id],
    );
    if (!locked || !shouldRefundSmsOrder(locked)) {
      await client.query("COMMIT");
      return { refunded: false, order: locked, balanceCents: null };
    }

    const refundCents = smsRefundCents(locked);
    const user = await one(
      client,
      `UPDATE users
          SET balance_cents = balance_cents + $1, updated_at = now()
        WHERE id = $2
      RETURNING *`,
      [refundCents, auth.user.id],
    );
    const refundedOrder = await one(
      client,
      `UPDATE sms_orders
          SET refund_cents = $1,
              refunded_at = now(),
              updated_at = now()
        WHERE id = $2 AND user_id = $3
      RETURNING *`,
      [refundCents, orderId, auth.user.id],
    );
    await exec(
      client,
      `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [auth.user.id, refundCents, user.balance_cents, "sms_refund", smsRefundNote(refundedOrder || locked)],
    );
    await client.query("COMMIT");
    result = { refunded: true, order: refundedOrder, balanceCents: user.balance_cents };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  if (result.refunded) {
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      targetUserId: auth.user.id,
      action: "sms.refund",
      resourceType: "sms_order",
      resourceId: result.order?.id || orderId,
      status: "success",
      httpStatus: 200,
      metadata: {
        triggerAction,
        orderStatus: result.order?.status || "",
        refundAmount: centsToAmount(result.order?.refund_cents),
      },
    });
    await writeSmsOrderEvent(app.db, {
      orderId: result.order?.id || orderId,
      userId: auth.user.id,
      actorUserId: auth.user.id,
      type: "balance.refund",
      status: "success",
      provider: result.order?.provider || "",
      message: "订单退款",
      metadata: {
        triggerAction,
        orderStatus: result.order?.status || "",
        refundAmount: centsToAmount(result.order?.refund_cents),
      },
    });
  }

  return result;
}

async function expireStaleSmsOrdersForUser(app, request, auth, { limit = 20 } = {}) {
  const settings = smsRiskSettings(app.config);
  const rows = await many(
    app.db,
    `SELECT *
       FROM sms_orders
      WHERE user_id = $1
        AND lower(status) = ANY($2)
        AND created_at <= now() - ($3::int * INTERVAL '1 minute')
      ORDER BY id ASC
      LIMIT $4`,
    [auth.user.id, activeSmsOrderStatuses(), settings.orderTimeoutMinutes, limit],
  );
  let expired = 0;
  let refunded = 0;

  for (const row of rows) {
    const raw = {
      provider: row.provider || "5sim",
      data: {
        local: "timeout",
        previousStatus: row.status,
        orderTimeoutMinutes: settings.orderTimeoutMinutes,
      },
    };
    const updated = await one(
      app.db,
      `UPDATE sms_orders
          SET status = 'expired',
              raw_json = $1,
              updated_at = now()
        WHERE id = $2
          AND user_id = $3
          AND lower(status) = ANY($4)
      RETURNING *`,
      [JSON.stringify(raw), row.id, auth.user.id, activeSmsOrderStatuses()],
    );
    if (!updated) continue;

    expired += 1;
    await writeSmsOrderEvent(app.db, {
      orderId: updated.id,
      userId: auth.user.id,
      actorUserId: auth.user.id,
      type: "order.expired",
      status: "success",
      provider: updated.provider || row.provider || "",
      message: "订单超时关闭",
      metadata: {
        previousStatus: row.status,
        orderTimeoutMinutes: settings.orderTimeoutMinutes,
      },
    });
    const refundResult = await refundSmsOrderIfNeeded(app, request, auth, updated.id, "timeout");
    if (refundResult.refunded) refunded += 1;
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      targetUserId: auth.user.id,
      action: "sms.expire",
      resourceType: "sms_order",
      resourceId: updated.id,
      status: "success",
      httpStatus: 200,
      metadata: {
        previousStatus: row.status,
        orderTimeoutMinutes: settings.orderTimeoutMinutes,
        refunded: refundResult.refunded,
      },
    });
  }

  return { expired, refunded, orderTimeoutMinutes: settings.orderTimeoutMinutes };
}

async function smsBuyRisk(app, userId) {
  const settings = smsRiskSettings(app.config);
  const active = await one(
    app.db,
    `SELECT COUNT(*)::int AS total
       FROM sms_orders
      WHERE user_id = $1
        AND lower(status) = ANY($2)`,
    [userId, activeSmsOrderStatuses()],
  );
  const activeCount = Number(active?.total || 0);
  if (activeCount >= settings.activeOrderLimit) {
    return {
      blocked: true,
      httpStatus: 409,
      reason: "active_order_limit",
      metadata: { activeCount, activeOrderLimit: settings.activeOrderLimit },
      error: "当前还有未完成的号码，请先完成、取消或拉黑后再购买。",
    };
  }

  const last = await one(
    app.db,
    `SELECT created_at
       FROM sms_orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId],
  );
  const retryAfter = cooldownSecondsLeft(last?.created_at, new Date(), app.config);
  if (retryAfter > 0) {
    return {
      blocked: true,
      httpStatus: 429,
      reason: "buy_cooldown",
      retryAfter,
      metadata: { retryAfter, buyCooldownSeconds: settings.buyCooldownSeconds },
      error: `下单太快，请 ${retryAfter} 秒后再试。`,
    };
  }

  return { blocked: false, activeCount, settings };
}

export async function smsRoutes(app) {
  app.get("/api/sms/countries", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:countries",
      limit: 90,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const countries = await loadCountries(app);
    if (!countries.ok) return fivesimHttpError(reply, countries.result);
    reply.header("x-cache", countries.cache);
    return countries.data;
  });

  app.get("/api/sms/products", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:products",
      limit: 120,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const country = smsLookupPart(request.query.country, "usa");
    const operator = smsLookupPart(request.query.operator, "any");
    if (!country || !operator) return badSmsLookup(reply);
    const catalog = await loadProductCatalog(app, country, operator);
    const providerCatalog = await providerServiceCatalog(app);
    if (!catalog.ok) {
      if (Object.keys(providerCatalog).length) {
        reply.header("x-cache", "PROVIDER");
        return providerCatalog;
      }
      return fivesimHttpError(reply, catalog.result);
    }
    reply.header("x-cache", catalog.cache);
    return { ...providerCatalog, ...enrichProducts(app.config, catalog.data) };
  });

  app.get("/api/sms/quote", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:quote",
      limit: 120,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const country = smsLookupPart(request.query.country, "usa");
    const operator = smsLookupPart(request.query.operator, "any");
    const product = smsLookupPart(request.query.product, "");
    if (!country || !operator || !product) return badSmsLookup(reply);

    const quote = await loadPublicQuote(app, country, operator, product);
    reply.header("x-cache", quote.cache);
    return quote.data;
  });

  app.get("/api/sms/orders", async (request, reply) => {
    if (!isAllowedStateChangingRead(request, app.config)) {
      reply.code(403);
      return { error: "请求来源无效。" };
    }

    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    await expireStaleSmsOrdersForUser(app, request, auth);
    const rows = await many(
      app.db,
      `SELECT * FROM sms_orders
        WHERE user_id = $1
        ORDER BY id DESC
        LIMIT 50`,
      [auth.user.id],
    );
    return { orders: rows.map(normalizePublicSmsOrder) };
  });

  app.post("/api/sms/buy", async (request, reply) => {
    const auth = await requirePaidUser(app.db, request, reply);
    if (auth.response) {
      if (auth.blockedReason && auth.user) {
        await auditSmsBuy(app, request, auth, "failed", reply.statusCode || 403, { reason: auth.blockedReason });
      }
      return auth.response;
    }

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:buy",
      extra: `user:${auth.user.id}`,
      limit: 10,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) {
      const body = request.body || {};
      await auditSmsBuy(app, request, auth, "failed", reply.statusCode || 429, {
        reason: "rate_limited",
        country: cleanPart(body.country || "usa"),
        operator: cleanPart(body.operator || "any"),
        product: cleanPart(body.product || ""),
      });
      return limited;
    }

    const body = request.body || {};
    const requestedCountry = smsLookupPart(body.country, "usa");
    const requestedOperator = smsLookupPart(body.operator, "any");
    const requestedProduct = smsLookupPart(body.product, "");
    if (!requestedCountry || !requestedOperator || !requestedProduct) {
      reply.code(400);
      await auditSmsBuy(app, request, auth, "failed", 400, { reason: "invalid_lookup", hasProduct: Boolean(body.product) });
      return { error: "请求参数不正确。" };
    }

    const buyLock = await acquireOperationLock(app.db, {
      key: operationLockKey("sms:buy", auth.user.id),
      ttlSeconds: 90,
    });
    if (!buyLock.acquired) {
      reply.code(409);
      await auditSmsBuy(app, request, auth, "failed", 409, { reason: "buy_in_progress" });
      return { error: "已有购买请求正在处理，请稍后再试。" };
    }

    let country = "";
    let operator = "";
    let product = "";
    let reservedCents = 0;
    let bought = null;
    let chosen = null;
    let localOrderCommitted = false;

    try {
    country = requestedCountry;
    operator = requestedOperator;
    product = requestedProduct;

    await expireStaleSmsOrdersForUser(app, request, auth);
    const risk = await smsBuyRisk(app, auth.user.id);
    if (risk.blocked) {
      if (risk.retryAfter) reply.header("retry-after", String(risk.retryAfter));
      reply.code(risk.httpStatus);
      await auditSmsBuy(app, request, auth, "failed", risk.httpStatus, {
        reason: risk.reason,
        country,
        operator,
        product,
        ...risk.metadata,
      });
      return { error: risk.error };
    }

    if (risk.settings.buyCooldownSeconds > 0) {
      const cooldownLimited = await enforceRateLimit(app.db, request, reply, {
        scope: "sms:buy:cooldown",
        extra: `user:${auth.user.id}`,
        limit: 1,
        windowSeconds: risk.settings.buyCooldownSeconds,
        config: app.config,
      });
      if (cooldownLimited) {
        await auditSmsBuy(app, request, auth, "failed", 429, {
          reason: "buy_cooldown",
          country,
          operator,
          product,
          buyCooldownSeconds: risk.settings.buyCooldownSeconds,
        });
        return cooldownLimited;
      }
    }

    const quotes = await quoteSmsProviders(app, { country, operator, product });
    const bestQuote = selectBestSmsQuote(quotes, app.config);
    const candidates = sortBuyableQuotes(quotes, app.config);
    if (!candidates.length) {
      reply.code(400);
      await writeSmsOrderEvent(app.db, {
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "provider.no_buyable",
        status: "failed",
        provider: bestQuote?.provider || "",
        publicCode: "no_buyable_provider",
        message: "没有可购买供应商",
        metadata: {
          country,
          operator,
          product,
          quoteCount: quotes.length,
          bestProvider: bestQuote?.provider || "",
        },
      });
      await auditSmsBuy(app, request, auth, "failed", 400, {
        reason: "no_buyable_provider",
        country,
        operator,
        product,
        bestProvider: bestQuote?.provider || "",
      });
      return { error: "当前服务暂不可购买，请稍后重试。" };
    }

    let lastError = null;
    const attempts = [];
    const note = `${country}/${operator}/${product}`;

    for (const candidate of candidates) {
      const quote = quoteCharge(app.config, candidate.cost);
      if (quote.chargeCents > reservedCents) {
        const extra = await reserveBalance(app.db, auth.user.id, quote.chargeCents - reservedCents);
        if (!extra) {
          if (reservedCents > 0) await refundBalance(app.db, auth.user.id, reservedCents);
          reply.code(402);
          await auditSmsBuy(app, request, auth, "failed", 402, {
            reason: "insufficient_balance",
            country,
            operator,
            product,
            requiredAmount: quote.charge,
          });
          return { error: `余额不足，预计需要 ${quote.charge} 元。` };
        }
        reservedCents = quote.chargeCents;
      }

      const attempt = await buySmsProvider(app, candidate);
      if (attempt.ok) {
        if (!supplierCostAllowed(app.config, attempt.cost || candidate.cost || 0)) {
          const overPriceError = {
            provider: candidate.provider,
            status: 400,
            publicCode: "supplier_price_over_fixed_price",
          };
          await changeSmsProviderOrder(
            app,
            { ...attempt, provider: candidate.provider, fivesim_id: providerOrderKey(candidate.provider, attempt.id) },
            "cancel",
          );
          await writeSmsOrderEvent(app.db, {
            userId: auth.user.id,
            actorUserId: auth.user.id,
            type: "provider.price_over_fixed",
            status: "failed",
            provider: candidate.provider,
            publicCode: "supplier_price_over_fixed_price",
            message: "供应商价格超过当前售价，已取消并尝试下一家",
            metadata: {
              country,
              operator,
              product,
              quoteCount: quotes.length,
              selectedProvider: candidate.provider,
            },
          });
          lastError = overPriceError;
          attempts.push({
            provider: candidate.provider,
            status: overPriceError.status,
            apiCode: null,
            publicCode: overPriceError.publicCode,
          });
          continue;
        }
        bought = attempt;
        chosen = candidate;
        break;
      }
      lastError = attempt;
      attempts.push({
        provider: candidate.provider,
        status: attempt.status || null,
        apiCode: attempt.apiCode || null,
        publicCode: attempt.publicCode || "unavailable",
      });
    }

    if (!bought || !chosen) {
      if (reservedCents > 0) await refundBalance(app.db, auth.user.id, reservedCents);
      await writeSmsOrderEvent(app.db, {
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "provider.buy_failed",
        status: "failed",
        provider: lastError?.provider || "",
        publicCode: lastError?.publicCode || "unavailable",
        message: "供应商下单失败",
        metadata: {
          country,
          operator,
          product,
          attempts,
          lastError: providerFailureMetadata(lastError),
        },
      });
      await auditSmsBuy(app, request, auth, "failed", lastError?.status || 502, {
        reason: "provider_buy_failed",
        country,
        operator,
        product,
        ...providerFailureMetadata(lastError),
      });
      return smsProviderHttpError(reply, lastError || { status: 502 });
    }

    const realQuote = quoteCharge(app.config, bought.cost || chosen.cost || 0);
    const realCost = realQuote.chargeCents;

    if (realCost > reservedCents) {
      const extra = await reserveBalance(app.db, auth.user.id, realCost - reservedCents);
      if (!extra) {
        await changeSmsProviderOrder(app, { ...bought, provider: chosen.provider, fivesim_id: providerOrderKey(chosen.provider, bought.id) }, "cancel");
        await refundBalance(app.db, auth.user.id, reservedCents);
        reply.code(402);
        await auditSmsBuy(app, request, auth, "failed", 402, {
          reason: "insufficient_balance_after_provider_buy",
          country,
          operator,
          product,
          provider: chosen.provider,
          requiredAmount: realQuote.charge,
        });
        return { error: "余额不足，号码已取消。" };
      }
      reservedCents = realCost;
    } else if (realCost < reservedCents) {
      await refundBalance(app.db, auth.user.id, reservedCents - realCost);
      reservedCents = realCost;
    }

    if (realCost <= 0) {
      await changeSmsProviderOrder(app, { ...bought, provider: chosen.provider, fivesim_id: providerOrderKey(chosen.provider, bought.id) }, "cancel");
      await refundBalance(app.db, auth.user.id, reservedCents);
      reply.code(402);
      await auditSmsBuy(app, request, auth, "failed", 402, {
        reason: "invalid_provider_price",
        country,
        operator,
        product,
        provider: chosen.provider,
      });
      return { error: "余额不足，号码已取消。" };
    }

    const client = await app.db.connect();
    let updatedUser;
    let row;
    try {
      await client.query("BEGIN");
      updatedUser = await one(client, "SELECT * FROM users WHERE id = $1", [auth.user.id]);
      await exec(
        client,
        `INSERT INTO sms_orders
          (user_id, fivesim_id, provider, country, operator, product, phone, price_cents, status, sms_json, raw_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          auth.user.id,
          providerOrderKey(chosen.provider, bought.id),
          chosen.provider,
          country,
          operator,
          product,
          bought.phone || "",
          realCost,
          bought.status || "received",
          JSON.stringify(bought.sms || []),
          JSON.stringify({ provider: chosen.provider, providerName: chosen.providerName, data: bought.raw || {} }),
        ],
      );
      await exec(
        client,
        `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [auth.user.id, -realCost, updatedUser.balance_cents, "sms_order", note],
      );
      row = await one(client, "SELECT * FROM sms_orders WHERE fivesim_id = $1", [providerOrderKey(chosen.provider, bought.id)]);
      await client.query("COMMIT");
      localOrderCommitted = true;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    try {
      await writeSmsOrderEvent(app.db, {
        orderId: row.id,
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "order.created",
        status: "success",
        provider: chosen.provider,
        message: "订单创建成功",
        metadata: {
          country,
          operator,
          product,
          selectedProvider: chosen.provider,
          attemptedFailures: attempts,
          price: centsToAmount(realCost),
          upstreamStatus: row.status,
          quoteCount: quotes.length,
        },
      });
    } catch (eventError) {
      request.log?.warn?.({
        error: eventError instanceof Error ? eventError.message : String(eventError || "unknown"),
        orderId: row.id,
      }, "sms buy success event log failed");
    }
    await auditSmsBuy(app, request, auth, "success", 200, {
      country,
      operator,
      product,
      provider: chosen.provider,
      price: centsToAmount(realCost),
      status: row.status,
    }, row.id);
    return { order: normalizePublicSmsOrder(row), balance: centsToAmount(updatedUser.balance_cents), pricing: publicChargeQuote(realQuote) };
    } catch (error) {
      const recovery = {
        providerCancelled: false,
        balanceRefunded: false,
        reservedAmount: centsToAmount(reservedCents),
      };
      if (!localOrderCommitted && bought && chosen) {
        try {
          const cancelled = await changeSmsProviderOrder(
            app,
            { ...bought, provider: chosen.provider, fivesim_id: providerOrderKey(chosen.provider, bought.id) },
            "cancel",
          );
          recovery.providerCancelled = Boolean(cancelled?.ok);
        } catch (cancelError) {
          request.log?.warn?.({
            error: cancelError instanceof Error ? cancelError.message : String(cancelError || "unknown"),
            provider: chosen.provider,
          }, "sms buy recovery provider cancel failed");
        }
      }
      if (!localOrderCommitted && reservedCents > 0) {
        try {
          await refundBalance(app.db, auth.user.id, reservedCents);
          recovery.balanceRefunded = true;
        } catch (refundError) {
          request.log?.error?.({
            error: refundError instanceof Error ? refundError.message : String(refundError || "unknown"),
            reservedAmount: recovery.reservedAmount,
          }, "sms buy recovery balance refund failed");
        }
      }
      try {
        await writeSmsOrderEvent(app.db, {
          userId: auth.user.id,
          actorUserId: auth.user.id,
          type: "order.create_failed",
          status: "failed",
          provider: chosen?.provider || "",
          publicCode: "local_order_create_failed",
          message: "订单创建失败",
          metadata: { country, operator, product, recovery },
        });
        await auditSmsBuy(app, request, auth, "failed", 500, {
          reason: "local_order_create_failed",
          country,
          operator,
          product,
          provider: chosen?.provider || "",
          recovery,
        });
      } catch (logError) {
        request.log?.warn?.({
          error: logError instanceof Error ? logError.message : String(logError || "unknown"),
        }, "sms buy recovery log failed");
      }
      throw error;
    } finally {
      await releaseOperationLock(app.db, buyLock);
    }
  });

  app.get("/api/sms/check/:id", async (request, reply) => {
    if (!isAllowedStateChangingRead(request, app.config)) {
      reply.code(403);
      return { error: "请求来源无效。" };
    }

    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    const id = cleanOrderId(request.params.id || request.query.id);
    if (!id) {
      reply.code(400);
      return { error: "订单编号无效。" };
    }
    const row = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1 AND user_id = $2", [id, auth.user.id]);
    if (!row) {
      reply.code(404);
      return { error: "订单不存在。" };
    }

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:check",
      extra: `user:${auth.user.id}:order:${row.id}`,
      limit: 30,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) {
      await writeSmsOrderEvent(app.db, {
        orderId: row.id,
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "provider.check_rate_limited",
        status: "failed",
        provider: row.provider || "",
        publicCode: "rate_limited",
        message: "查询过于频繁",
        metadata: { reason: "rate_limited", orderStatus: row.status || "" },
      });
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        targetUserId: auth.user.id,
        action: "sms.check",
        resourceType: "sms_order",
        resourceId: row.id,
        status: "failed",
        httpStatus: reply.statusCode || 429,
        metadata: { reason: "rate_limited", orderStatus: row.status || "" },
      });
      return limited;
    }

    const checked = await checkSmsProviderOrder(app, row);
    if (!checked.ok) {
      await writeSmsOrderEvent(app.db, {
        orderId: row.id,
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "provider.check_failed",
        status: "failed",
        provider: checked.provider || row.provider || "",
        publicCode: checked.publicCode || "unavailable",
        message: "查询短信失败",
        metadata: providerFailureMetadata(checked, row),
      });
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        targetUserId: auth.user.id,
        action: "sms.check",
        resourceType: "sms_order",
        resourceId: row.id,
        status: "failed",
        httpStatus: checked.status || 502,
        metadata: providerFailureMetadata(checked, row),
      });
      return smsProviderHttpError(reply, checked);
    }
    await exec(
      app.db,
      `UPDATE sms_orders
          SET phone = $1, status = $2, sms_json = $3, raw_json = $4, updated_at = now()
        WHERE id = $5 AND user_id = $6`,
      [
        checked.phone || row.phone || "",
        checked.status || row.status,
        JSON.stringify(checked.sms || []),
        JSON.stringify({ provider: checked.provider || row.provider || "5sim", data: checked.raw || {} }),
        row.id,
        auth.user.id,
      ],
    );
    const updated = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1", [row.id]);
    if (["finished", "completed"].includes(String(updated?.status || "").toLowerCase())) {
      await maybeGrantReferralReward(app.db, updated.id);
    }
    const refundResult = await refundSmsOrderIfNeeded(app, request, auth, updated.id, "check");
    const responseOrder = refundResult.order || updated;
    const oldStatus = String(row.status || "");
    const newStatus = String(responseOrder?.status || "");
    if (oldStatus !== newStatus || (responseOrder?.sms_json || "[]") !== (row.sms_json || "[]") || refundResult.refunded) {
      await writeSmsOrderEvent(app.db, {
        orderId: row.id,
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: "provider.check",
        status: "success",
        provider: checked.provider || row.provider || "",
        message: "订单状态更新",
        metadata: {
          oldStatus,
          newStatus,
          refunded: refundResult.refunded,
          hasSms: normalizePublicSmsOrder(responseOrder).sms.length > 0,
        },
      });
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        targetUserId: auth.user.id,
        action: "sms.check",
        resourceType: "sms_order",
        resourceId: row.id,
        status: "success",
        httpStatus: 200,
        metadata: {
          oldStatus,
          newStatus,
          refunded: refundResult.refunded,
          hasSms: normalizePublicSmsOrder(responseOrder).sms.length > 0,
        },
      });
    }
    return {
      order: normalizePublicSmsOrder(responseOrder),
      balance: refundResult.balanceCents == null ? undefined : centsToAmount(refundResult.balanceCents),
    };
  });

  for (const action of ["finish", "cancel", "ban"]) {
    app.post(`/api/sms/${action}`, async (request, reply) => {
      const auth = await requireUser(app.db, request, reply);
      if (auth.response) return auth.response;

      const body = request.body || {};
      const id = cleanOrderId(body.id || request.params?.id);
      if (!id) {
        reply.code(400);
        return { error: "订单编号无效。" };
      }
      const row = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1 AND user_id = $2", [id, auth.user.id]);
      if (!row) {
        reply.code(404);
        return { error: "订单不存在。" };
      }

      const limited = await enforceRateLimit(app.db, request, reply, {
        scope: `sms:${action}`,
        extra: `user:${auth.user.id}:order:${row.id}`,
        limit: 20,
        windowSeconds: 60,
        config: app.config,
      });
      if (limited) {
        await writeSmsOrderEvent(app.db, {
          orderId: row.id,
          userId: auth.user.id,
          actorUserId: auth.user.id,
          type: `provider.${action}_rate_limited`,
          status: "failed",
          provider: row.provider || "",
          publicCode: "rate_limited",
          message: "订单操作过于频繁",
          metadata: { reason: "rate_limited", action, orderStatus: row.status || "" },
        });
        await writeAuditLog(app.db, request, {
          actorUserId: auth.user.id,
          targetUserId: auth.user.id,
          action: `sms.${action}`,
          resourceType: "sms_order",
          resourceId: row.id,
          status: "failed",
          httpStatus: reply.statusCode || 429,
          metadata: { reason: "rate_limited", action, orderStatus: row.status || "" },
        });
        return limited;
      }

      const changed = await changeSmsProviderOrder(app, row, action);
      if (!changed.ok) {
        await writeSmsOrderEvent(app.db, {
          orderId: row.id,
          userId: auth.user.id,
          actorUserId: auth.user.id,
          type: `provider.${action}_failed`,
          status: "failed",
          provider: changed.provider || row.provider || "",
          publicCode: changed.publicCode || "unavailable",
          message: "供应商操作失败",
          metadata: providerFailureMetadata(changed, row),
        });
        await writeAuditLog(app.db, request, {
          actorUserId: auth.user.id,
          targetUserId: auth.user.id,
          action: `sms.${action}`,
          resourceType: "sms_order",
          resourceId: row.id,
          status: "failed",
          httpStatus: changed.status || 502,
          metadata: providerFailureMetadata(changed, row),
        });
        return smsProviderHttpError(reply, changed);
      }
      await exec(
        app.db,
        `UPDATE sms_orders
            SET status = $1, sms_json = $2, raw_json = $3, updated_at = now()
          WHERE id = $4 AND user_id = $5`,
        [
          changed.status || action,
          JSON.stringify(changed.sms || []),
          JSON.stringify({ provider: row.provider || "5sim", data: changed.raw || {} }),
          row.id,
          auth.user.id,
        ],
      );
      const updated = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1", [row.id]);
      if (["finish", "completed"].includes(action) || ["finished", "completed"].includes(String(updated?.status || "").toLowerCase())) {
        await maybeGrantReferralReward(app.db, updated.id);
      }
      const refundResult = await refundSmsOrderIfNeeded(app, request, auth, updated.id, action);
      const responseOrder = refundResult.order || updated;
      await writeSmsOrderEvent(app.db, {
        orderId: row.id,
        userId: auth.user.id,
        actorUserId: auth.user.id,
        type: `provider.${action}`,
        status: "success",
        provider: changed.provider || row.provider || "",
        message: "供应商操作成功",
        metadata: {
          oldStatus: row.status,
          newStatus: responseOrder.status,
          refunded: refundResult.refunded,
        },
      });
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        targetUserId: auth.user.id,
        action: `sms.${action}`,
        resourceType: "sms_order",
        resourceId: row.id,
        status: "success",
        httpStatus: 200,
        metadata: {
          oldStatus: row.status,
          newStatus: responseOrder.status,
          refunded: refundResult.refunded,
        },
      });
      return {
        order: normalizePublicSmsOrder(responseOrder),
        balance: refundResult.balanceCents == null ? undefined : centsToAmount(refundResult.balanceCents),
      };
    });
  }
}
