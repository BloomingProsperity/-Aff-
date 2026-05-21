import { requireUser } from "../lib/auth.js";
import { centsToAmount, cleanOrderId, cleanPart, toIso } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { fivesimHttpError } from "../lib/fivesim.js";
import { quoteCharge } from "../lib/pricing.js";
import { enforceRateLimit, verifyTurnstile } from "../lib/security.js";

const PRODUCT_CACHE_SECONDS = 60;

function normalizeOrder(row) {
  if (!row) return null;
  let sms = [];
  try { sms = JSON.parse(row.sms_json || "[]"); } catch {}
  return {
    id: Number(row.id),
    fivesimId: row.fivesim_id,
    country: row.country,
    operator: row.operator,
    product: row.product,
    phone: row.phone,
    price: centsToAmount(row.price_cents),
    status: row.status,
    sms,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function productCacheKey(country, operator) {
  return `products:${country}:${operator}`;
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

async function writeProductCache(db, cacheKey, data, now) {
  await exec(
    db,
    `INSERT INTO product_cache (cache_key, data_json, expires_at, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (cache_key) DO UPDATE SET
       data_json = EXCLUDED.data_json,
       expires_at = EXCLUDED.expires_at,
       updated_at = now()`,
    [cacheKey, JSON.stringify(data || {}), now + PRODUCT_CACHE_SECONDS],
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

function enrichProducts(config, products) {
  return Object.fromEntries(Object.entries(products || {}).map(([code, info]) => {
    const cost = Number(info?.cost || info?.Price || info?.price || 0);
    const count = Number(info?.count || info?.Qty || info?.qty || 0);
    const quote = quoteCharge(config, cost);
    return [code, {
      ...info,
      cost: quote.cost,
      costCurrency: quote.costCurrency,
      costCny: quote.costCny,
      count,
      charge: quote.charge,
      rate: quote.rate,
      fixed: quote.fixed,
      margin: quote.margin,
      currency: quote.currency,
    }];
  }));
}

async function estimatedPrice(app, country, operator, product) {
  const catalog = await loadProductCatalog(app, country, operator);
  if (!catalog.ok) return 0;
  const info = catalog.data?.[product] || {};
  return Number(info.cost || info.Price || info.price || 0);
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

export async function smsRoutes(app) {
  app.get("/api/sms/countries", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:countries",
      limit: 90,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const result = await app.fivesim("/guest/countries", "");
    return result.ok ? result.data : fivesimHttpError(reply, result);
  });

  app.get("/api/sms/products", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:products",
      limit: 120,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const country = cleanPart(request.query.country || "usa");
    const operator = cleanPart(request.query.operator || "any");
    const catalog = await loadProductCatalog(app, country, operator);
    if (!catalog.ok) return fivesimHttpError(reply, catalog.result);
    reply.header("x-cache", catalog.cache);
    return enrichProducts(app.config, catalog.data);
  });

  app.get("/api/sms/orders", async (request, reply) => {
    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    const rows = await many(
      app.db,
      `SELECT * FROM sms_orders
        WHERE user_id = $1
        ORDER BY id DESC
        LIMIT 50`,
      [auth.user.id],
    );
    return { orders: rows.map(normalizeOrder) };
  });

  app.post("/api/sms/buy", async (request, reply) => {
    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    if (!app.config.fivesimApiKey) {
      reply.code(503);
      return { error: "5sim 密钥未设置。" };
    }

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "sms:buy",
      extra: `user:${auth.user.id}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) return turnstile;

    const country = cleanPart(body.country || "usa");
    const operator = cleanPart(body.operator || "any");
    const product = cleanPart(body.product || "");
    if (!product) {
      reply.code(400);
      return { error: "请选择服务。" };
    }

    const estimateCost = await estimatedPrice(app, country, operator, product);
    if (estimateCost <= 0) {
      reply.code(400);
      return { error: "当前服务暂不可购买，请刷新后重试。" };
    }
    const estimate = quoteCharge(app.config, estimateCost);
    const reservedUser = await reserveBalance(app.db, auth.user.id, estimate.chargeCents);
    if (!reservedUser) {
      reply.code(402);
      return { error: `余额不足，预计需要 ${estimate.charge} 元。` };
    }

    let reservedCents = estimate.chargeCents;
    const note = `${country}/${operator}/${product}`;
    const bought = await app.fivesim(
      `/user/buy/activation/${country}/${operator}/${product}`,
      app.config.fivesimApiKey,
    );
    if (!bought.ok) {
      await refundBalance(app.db, auth.user.id, reservedCents);
      return fivesimHttpError(reply, bought);
    }

    const realQuote = quoteCharge(app.config, bought.data?.price || bought.data?.cost || estimateCost || 0);
    const realCost = realQuote.chargeCents;

    if (realCost > reservedCents) {
      const extraCents = realCost - reservedCents;
      const extra = await reserveBalance(app.db, auth.user.id, extraCents);
      if (!extra) {
        await app.fivesim(`/user/cancel/${bought.data.id}`, app.config.fivesimApiKey);
        await refundBalance(app.db, auth.user.id, reservedCents);
        reply.code(402);
        return { error: "余额不足，号码已取消。" };
      }
      reservedCents = realCost;
    } else if (realCost < reservedCents) {
      await refundBalance(app.db, auth.user.id, reservedCents - realCost);
      reservedCents = realCost;
    }

    if (realCost <= 0) {
      await app.fivesim(`/user/cancel/${bought.data.id}`, app.config.fivesimApiKey);
      await refundBalance(app.db, auth.user.id, reservedCents);
      reply.code(402);
      return { error: "余额不足，号码已取消。" };
    }

    const updatedUser = await one(app.db, "SELECT * FROM users WHERE id = $1", [auth.user.id]);
    await exec(
      app.db,
      `INSERT INTO sms_orders
        (user_id, fivesim_id, country, operator, product, phone, price_cents, status, sms_json, raw_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        auth.user.id,
        String(bought.data.id),
        country,
        operator,
        product,
        bought.data.phone || bought.data.number || "",
        realCost,
        bought.data.status || "received",
        JSON.stringify(bought.data.sms || []),
        JSON.stringify(bought.data || {}),
      ],
    );
    await exec(
      app.db,
      `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [auth.user.id, -realCost, updatedUser.balance_cents, "sms_order", note],
    );

    const row = await one(app.db, "SELECT * FROM sms_orders WHERE fivesim_id = $1", [String(bought.data.id)]);
    return { order: normalizeOrder(row), balance: centsToAmount(updatedUser.balance_cents), pricing: realQuote };
  });

  app.get("/api/sms/check/:id", async (request, reply) => {
    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;
    if (!app.config.fivesimApiKey) {
      reply.code(503);
      return { error: "5sim 密钥未设置。" };
    }

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

    const checked = await app.fivesim(`/user/check/${row.fivesim_id}`, app.config.fivesimApiKey);
    if (!checked.ok) return fivesimHttpError(reply, checked);
    await exec(
      app.db,
      `UPDATE sms_orders
          SET phone = $1, status = $2, sms_json = $3, raw_json = $4, updated_at = now()
        WHERE id = $5 AND user_id = $6`,
      [
        checked.data.phone || checked.data.number || row.phone || "",
        checked.data.status || row.status,
        JSON.stringify(checked.data.sms || []),
        JSON.stringify(checked.data || {}),
        row.id,
        auth.user.id,
      ],
    );
    const updated = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1", [row.id]);
    return { order: normalizeOrder(updated) };
  });

  for (const action of ["finish", "cancel", "ban"]) {
    app.post(`/api/sms/${action}`, async (request, reply) => {
      const auth = await requireUser(app.db, request, reply);
      if (auth.response) return auth.response;
      if (!app.config.fivesimApiKey) {
        reply.code(503);
        return { error: "5sim 密钥未设置。" };
      }

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

      const changed = await app.fivesim(`/user/${action}/${row.fivesim_id}`, app.config.fivesimApiKey);
      if (!changed.ok) return fivesimHttpError(reply, changed);
      await exec(
        app.db,
        `UPDATE sms_orders
            SET status = $1, sms_json = $2, raw_json = $3, updated_at = now()
          WHERE id = $4 AND user_id = $5`,
        [
          changed.data.status || action,
          JSON.stringify(changed.data.sms || []),
          JSON.stringify(changed.data || {}),
          row.id,
          auth.user.id,
        ],
      );
      const updated = await one(app.db, "SELECT * FROM sms_orders WHERE id = $1", [row.id]);
      return { order: normalizeOrder(updated) };
    });
  }
}
