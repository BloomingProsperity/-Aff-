export const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });

export const readJson = async request => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export const cleanEmail = email => String(email || "").trim().toLowerCase();
export const AUTH_EMAIL_DOMAINS = ["qq.com", "163.com", "gmail.com"];

export function isAllowedAuthEmail(email) {
  const value = cleanEmail(email);
  const domain = value.slice(value.lastIndexOf("@") + 1);
  return AUTH_EMAIL_DOMAINS.includes(domain);
}

export const cleanPart = value => String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
export const cleanOrderId = value => String(value || "").trim().replace(/[^0-9]/g, "");

export const amountToCents = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

export const centsToAmount = cents => Number((Number(cents || 0) / 100).toFixed(2));

export function quoteCharge(env, cost) {
  const raw = Math.max(0, Number(cost || 0));
  const rate = Number(env.SMS_USD_CNY_RATE ?? env.SMS_PRICE_RATE ?? 7.2);
  const margin = Number(env.SMS_MARGIN_CNY ?? env.SMS_PRICE_FIXED ?? 10);
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 7.2;
  const safeMargin = Number.isFinite(margin) && margin >= 0 ? margin : 10;
  const costCents = Math.ceil(raw * safeRate * 100);
  const marginCents = Math.ceil(safeMargin * 100);
  const chargeCents = costCents + marginCents;
  return {
    cost: Number(raw.toFixed(2)),
    costCurrency: "USD",
    costCny: Number((costCents / 100).toFixed(2)),
    rate: Number(safeRate.toFixed(4)),
    fixed: Number((marginCents / 100).toFixed(2)),
    margin: Number((marginCents / 100).toFixed(2)),
    charge: Number((chargeCents / 100).toFixed(2)),
    chargeCents,
    currency: "CNY",
  };
}

export function routeParts(context, key = "route") {
  const raw = context.params[key];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw) return [];
  return String(raw).split("/").filter(Boolean);
}

export function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const hit = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : "";
}

export function sessionCookie(value, url, maxAgeSeconds) {
  const secure = new URL(url).protocol === "https:" ? "; Secure" : "";
  return `hkai_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export const clearSessionCookie = url => sessionCookie("", url, 0);

export const nowIso = () => new Date().toISOString();

export const addDaysIso = days => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
