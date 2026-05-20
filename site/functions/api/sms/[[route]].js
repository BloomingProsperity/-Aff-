import { fivesim, fivesimError, fivesimToken } from "../../_lib/5sim.js";
import { requireUser } from "../../_lib/auth.js";
import { centsToAmount, cleanOrderId, cleanPart, json, quoteCharge, readJson, routeParts } from "../../_lib/common.js";
import { enforceRateLimit, verifyTurnstile } from "../../_lib/security.js";

const PRODUCT_CACHE_SECONDS = 60;

function normalizeOrder(row) {
  if (!row) return null;
  let sms = [];
  try { sms = JSON.parse(row.sms_json || "[]"); } catch {}
  return {
    id: row.id,
    fivesimId: row.fivesim_id,
    country: row.country,
    operator: row.operator,
    product: row.product,
    phone: row.phone,
    price: centsToAmount(row.price_cents),
    status: row.status,
    sms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function productCacheKey(country, operator) {
  return `products:${country}:${operator}`;
}

async function readProductCache(env, cacheKey, now) {
  try {
    const row = await env.DB.prepare(
      "SELECT data_json, expires_at FROM product_cache WHERE cache_key = ?",
    ).bind(cacheKey).first();
    if (!row) return null;
    return {
      data: JSON.parse(row.data_json || "{}"),
      fresh: Number(row.expires_at || 0) > now,
    };
  } catch {
    return null;
  }
}

async function writeProductCache(env, cacheKey, data, now) {
  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO product_cache (cache_key, data_json, expires_at, updated_at)
       VALUES (?, ?, ?, datetime('now'))`,
    ).bind(cacheKey, JSON.stringify(data || {}), now + PRODUCT_CACHE_SECONDS).run();
  } catch {}
}

async function loadProductCatalog(env, country, operator) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = productCacheKey(country, operator);
  const cached = await readProductCache(env, cacheKey, now);
  if (cached?.fresh) return { ok: true, data: cached.data, cache: "HIT" };

  const result = await fivesim(`/guest/products/${country}/${operator}`, "");
  if (result.ok) {
    await writeProductCache(env, cacheKey, result.data || {}, now);
    return { ok: true, data: result.data || {}, cache: "MISS" };
  }

  if (cached?.data) return { ok: true, data: cached.data, cache: "STALE" };
  return { ok: false, result };
}

function enrichProducts(env, products) {
  return Object.fromEntries(Object.entries(products || {}).map(([code, info]) => {
    const cost = Number(info?.cost || info?.Price || info?.price || 0);
    const count = Number(info?.count || info?.Qty || info?.qty || 0);
    const quote = quoteCharge(env, cost);
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

async function estimatedPrice(env, country, operator, product) {
  const catalog = await loadProductCatalog(env, country, operator);
  if (!catalog.ok) return 0;
  const info = catalog.data?.[product] || {};
  return Number(info.cost || info.Price || info.price || 0);
}

async function refundBalance(env, userId, cents) {
  if (cents <= 0) return null;
  await env.DB.prepare(
    `UPDATE users
        SET balance_cents = balance_cents + ?, updated_at = datetime('now')
      WHERE id = ?`,
  ).bind(cents, userId).run();
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const parts = routeParts(context);
  const action = parts[0] || "";

  if (!env.DB) return json({ error: "数据库未绑定。" }, { status: 503 });

  if (method === "GET" && action === "countries") {
    const limited = await enforceRateLimit(env, request, { scope: "sms:countries", limit: 90, windowSeconds: 60 });
    if (limited) return limited;

    const result = await fivesim("/guest/countries", "");
    return result.ok ? json(result.data) : fivesimError(result);
  }

  if (method === "GET" && action === "products") {
    const limited = await enforceRateLimit(env, request, { scope: "sms:products", limit: 120, windowSeconds: 60 });
    if (limited) return limited;

    const country = cleanPart(url.searchParams.get("country") || "usa");
    const operator = cleanPart(url.searchParams.get("operator") || "any");
    const catalog = await loadProductCatalog(env, country, operator);
    if (!catalog.ok) return fivesimError(catalog.result);
    return json(enrichProducts(env, catalog.data), { headers: { "x-cache": catalog.cache } });
  }

  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  if (method === "GET" && action === "orders") {
    const rows = await env.DB.prepare(
      `SELECT * FROM sms_orders
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50`,
    ).bind(auth.user.id).all();
    return json({ orders: (rows.results || []).map(normalizeOrder) });
  }

  const token = fivesimToken(env);
  if (!token) return json({ error: "5sim 密钥未设置。" }, { status: 503 });

  if (method === "POST" && action === "buy") {
    const limited = await enforceRateLimit(env, request, {
      scope: "sms:buy",
      extra: `user:${auth.user.id}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const body = await readJson(request);
    const turnstile = await verifyTurnstile(env, request, body.turnstileToken);
    if (turnstile) return turnstile;

    const country = cleanPart(body.country || "usa");
    const operator = cleanPart(body.operator || "any");
    const product = cleanPart(body.product || "");
    if (!product) return json({ error: "请选择服务。" }, { status: 400 });

    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(auth.user.id).first();
    const estimateCost = await estimatedPrice(env, country, operator, product);
    if (estimateCost <= 0) {
      return json({ error: "当前服务暂不可购买，请刷新后重试。" }, { status: 400 });
    }
    const estimate = quoteCharge(env, estimateCost);
    if (estimate.chargeCents > 0 && user.balance_cents < estimate.chargeCents) {
      return json({ error: `余额不足，预计需要 ${estimate.charge} 元。` }, { status: 402 });
    }
    if (user.balance_cents <= 0) {
      return json({ error: "余额不足，请联系管理员充值。" }, { status: 402 });
    }

    const reserve = await env.DB.prepare(
      `UPDATE users
          SET balance_cents = balance_cents - ?, updated_at = datetime('now')
        WHERE id = ? AND balance_cents >= ?`,
    ).bind(estimate.chargeCents, auth.user.id, estimate.chargeCents).run();
    if (Number(reserve.meta?.changes || 0) === 0) {
      return json({ error: `余额不足，预计需要 ${estimate.charge} 元。` }, { status: 402 });
    }

    let reservedCents = estimate.chargeCents;
    const note = `${country}/${operator}/${product}`;
    const bought = await fivesim(`/user/buy/activation/${country}/${operator}/${product}`, token);
    if (!bought.ok) {
      await refundBalance(env, auth.user.id, reservedCents, note);
      return fivesimError(bought);
    }

    const realQuote = quoteCharge(env, bought.data?.price || bought.data?.cost || estimateCost || 0);
    const realCost = realQuote.chargeCents;

    if (realCost > reservedCents) {
      const extraCents = realCost - reservedCents;
      const extra = await env.DB.prepare(
        `UPDATE users
            SET balance_cents = balance_cents - ?, updated_at = datetime('now')
          WHERE id = ? AND balance_cents >= ?`,
      ).bind(extraCents, auth.user.id, extraCents).run();
      if (Number(extra.meta?.changes || 0) === 0) {
        await fivesim(`/user/cancel/${bought.data.id}`, token);
        await refundBalance(env, auth.user.id, reservedCents, note);
        return json({ error: "余额不足，号码已取消。" }, { status: 402 });
      }
      reservedCents = realCost;
    } else if (realCost < reservedCents) {
      const refundCents = reservedCents - realCost;
      await refundBalance(env, auth.user.id, refundCents, note);
      reservedCents = realCost;
    }

    if (realCost <= 0) {
      await fivesim(`/user/cancel/${bought.data.id}`, token);
      await refundBalance(env, auth.user.id, reservedCents, note);
      return json({ error: "余额不足，号码已取消。" }, { status: 402 });
    }

    const updatedUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(auth.user.id).first();
    await env.DB.prepare(
      `INSERT INTO sms_orders
        (user_id, fivesim_id, country, operator, product, phone, price_cents, status, sms_json, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
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
    ).run();
    await env.DB.prepare(
      `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(auth.user.id, -realCost, updatedUser.balance_cents, "sms_order", `${country}/${operator}/${product}`).run();

    const row = await env.DB.prepare("SELECT * FROM sms_orders WHERE fivesim_id = ?").bind(String(bought.data.id)).first();
    return json({ order: normalizeOrder(row), balance: centsToAmount(updatedUser.balance_cents), pricing: realQuote });
  }

  if (method === "GET" && action === "check") {
    const id = cleanOrderId(parts[1] || url.searchParams.get("id"));
    if (!id) return json({ error: "订单编号无效。" }, { status: 400 });
    const row = await env.DB.prepare(
      "SELECT * FROM sms_orders WHERE id = ? AND user_id = ?",
    ).bind(id, auth.user.id).first();
    if (!row) return json({ error: "订单不存在。" }, { status: 404 });

    const checked = await fivesim(`/user/check/${row.fivesim_id}`, token);
    if (!checked.ok) return fivesimError(checked);
    await env.DB.prepare(
      `UPDATE sms_orders
          SET phone = ?, status = ?, sms_json = ?, raw_json = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?`,
    ).bind(
      checked.data.phone || checked.data.number || row.phone || "",
      checked.data.status || row.status,
      JSON.stringify(checked.data.sms || []),
      JSON.stringify(checked.data || {}),
      row.id,
      auth.user.id,
    ).run();
    const updated = await env.DB.prepare("SELECT * FROM sms_orders WHERE id = ?").bind(row.id).first();
    return json({ order: normalizeOrder(updated) });
  }

  if (method === "POST" && ["finish", "cancel", "ban"].includes(action)) {
    const body = await readJson(request);
    const id = cleanOrderId(body.id || parts[1]);
    if (!id) return json({ error: "订单编号无效。" }, { status: 400 });
    const row = await env.DB.prepare(
      "SELECT * FROM sms_orders WHERE id = ? AND user_id = ?",
    ).bind(id, auth.user.id).first();
    if (!row) return json({ error: "订单不存在。" }, { status: 404 });

    const changed = await fivesim(`/user/${action}/${row.fivesim_id}`, token);
    if (!changed.ok) return fivesimError(changed);
    await env.DB.prepare(
      `UPDATE sms_orders
          SET status = ?, sms_json = ?, raw_json = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?`,
    ).bind(
      changed.data.status || action,
      JSON.stringify(changed.data.sms || []),
      JSON.stringify(changed.data || {}),
      row.id,
      auth.user.id,
    ).run();
    const updated = await env.DB.prepare("SELECT * FROM sms_orders WHERE id = ?").bind(row.id).first();
    return json({ order: normalizeOrder(updated) });
  }

  return json({ error: "未找到这个操作。" }, { status: 404 });
}
