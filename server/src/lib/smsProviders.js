import { exec, one } from "./db.js";
import { publicChargeQuote, quoteCharge } from "./pricing.js";

export const SMS_PROVIDERS = {
  FIVESIM: "5sim",
  BEESMS: "bee-sms",
  SMSPOOL: "smspool",
};

const CACHE_SECONDS = 300;
const FIVE_SIM_BASE = "https://5sim.net/v1";
const BEE_BASE = "https://api.bee-sms.com";
const SMSPOOL_BASE = "https://api.smspool.net";
const PROVIDER_NAMES = {
  [SMS_PROVIDERS.FIVESIM]: "5sim",
  [SMS_PROVIDERS.BEESMS]: "Bee-SMS",
  [SMS_PROVIDERS.SMSPOOL]: "SMSPool",
};
const PROVIDER_HEALTH_MESSAGES = {
  ok: "余额正常",
  low: "余额偏低",
  empty: "余额为 0",
  error: "余额读取失败",
  disabled: "未配置",
};

const STATUS_ALIASES = {
  pending: "pending",
  received: "received",
  processing: "processing",
  activating: "activating",
  resend: "resend",
  canceled: "cancelled",
  cancelled: "cancelled",
  timeout: "timeout",
  expired: "expired",
  finish: "completed",
  finished: "completed",
  completed: "completed",
  banned: "banned",
  ban: "banned",
  refunded: "refunded",
};

const SMSPOOL_STATUS_CODES = {
  1: "pending",
  2: "expired",
  3: "completed",
  4: "resend",
  5: "cancelled",
  6: "refunded",
  7: "processing",
  8: "activating",
};

const PUBLIC_PROVIDER_ERRORS = {
  no_stock: "当前服务暂时没有可用号码，请稍后再试。",
  invalid_service: "当前服务暂时不可购买，请换一个国家或服务。",
  provider_busy: "当前服务繁忙，请稍后再试。",
  insufficient_provider_balance: "服务暂时不可用，请稍后再试。",
  rate_limited: "请求过于频繁，请稍后再试。",
  unavailable: "上游服务暂时不可用，请稍后再试。",
};

function providerPublicCodeFromText(result = {}) {
  const text = [
    result.error,
    result.message,
    result.data?.error,
    result.data?.message,
    result.data?.detail,
    result.data?.description,
  ].map(value => String(value || "").toLowerCase()).join(" ");
  if (!text.trim()) return "";

  if (/(too many|rate.?limit|throttl|429)/i.test(text)) return "rate_limited";
  if (/(insufficient|not enough|low|empty).*(balance|credit|fund|wallet)|balance.*(insufficient|not enough|low|empty)/i.test(text)) {
    return "insufficient_provider_balance";
  }
  if (/(no|zero).*(number|stock)|out.?of.?stock|sold.?out|no_numbers|no numbers|no.*available.*number/i.test(text)) {
    return "no_stock";
  }
  if (/(service|product|country).*(not found|invalid|unknown|unsupported)|invalid.*(service|product|country)/i.test(text)) {
    return "invalid_service";
  }
  if (/(busy|try again|temporary|maintenance|timeout)/i.test(text)) return "provider_busy";
  return "";
}

const COUNTRY_ISO2 = {
  usa: "us",
  england: "gb",
  france: "fr",
  germany: "de",
  netherlands: "nl",
  canada: "ca",
  australia: "au",
  japan: "jp",
  thailand: "th",
  philippines: "ph",
  malaysia: "my",
  indonesia: "id",
  india: "in",
  turkey: "tr",
  hongkong: "hk",
  singapore: "sg",
  taiwan: "tw",
};

const SERVICE_WORDS = {
  telegram: ["telegram", "tg"],
  whatsapp: ["whatsapp", "wa"],
  google: ["google", "gmail", "go"],
  microsoft: ["microsoft", "outlook", "hotmail"],
  apple: ["apple", "icloud"],
  facebook: ["facebook", "fb"],
  instagram: ["instagram", "ig"],
  twitter: ["twitter", "x"],
  discord: ["discord"],
  tiktok: ["tiktok"],
  amazon: ["amazon"],
  paypal: ["paypal"],
  steam: ["steam"],
  uber: ["uber"],
  openai: ["openai", "chatgpt"],
  wechat: ["wechat"],
};

function cleanText(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeProviderStatus(provider, status, fallback = "pending") {
  if (provider === SMS_PROVIDERS.SMSPOOL && status !== undefined && status !== null && status !== "") {
    const numeric = Number(status);
    if (Number.isInteger(numeric) && SMSPOOL_STATUS_CODES[numeric]) return SMSPOOL_STATUS_CODES[numeric];
  }
  const raw = cleanText(status || fallback);
  return STATUS_ALIASES[raw] || raw || fallback;
}

function providerPublicCode(result = {}) {
  if (result.publicCode) return result.publicCode;
  if (Number(result.status) === 429) return "rate_limited";
  const apiCode = Number(result.apiCode ?? result.data?.code);
  if (apiCode === 50001) return "insufficient_provider_balance";
  if (apiCode === 50101) return "provider_busy";
  if (apiCode === 50111) return "no_stock";
  if (apiCode === 50113 || apiCode === 50114) return "invalid_service";
  const textCode = providerPublicCodeFromText(result);
  if (textCode) return textCode;
  return "unavailable";
}

function providerError(result = {}, extra = {}) {
  const publicCode = providerPublicCode(result);
  return {
    ok: false,
    status: result.status || 502,
    error: result.error || "",
    apiCode: result.apiCode ?? result.data?.code,
    publicCode,
    ...extra,
  };
}

export function publicSmsProviderError(result = {}) {
  return PUBLIC_PROVIDER_ERRORS[providerPublicCode(result)] || PUBLIC_PROVIDER_ERRORS.unavailable;
}

function comparable(value) {
  return cleanText(value).replace(/[^a-z0-9]/g, "");
}

function amount(value) {
  const cleaned = typeof value === "string" ? value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] : value;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function cents(value) {
  return Math.max(0, amount(value) / 100);
}

function iso2(country) {
  const key = cleanText(country);
  return COUNTRY_ISO2[key] || key.slice(0, 2);
}

function isoUpper(country) {
  return iso2(country).toUpperCase();
}

function serviceAliases(product) {
  const raw = cleanText(product);
  return [...new Set([raw, ...(SERVICE_WORDS[raw] || [])])].filter(Boolean);
}

function catalogCode(value) {
  return cleanText(value).replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

function itemValue(item, keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return "";
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.services)) return data.services;
  if (Array.isArray(data?.countries)) return data.countries;
  if (data && typeof data === "object") return Object.values(data);
  return [];
}

function matchItem(items, aliases, codeKeys, nameKeys) {
  const wanted = aliases.map(comparable).filter(Boolean);
  if (!wanted.length) return null;
  return items.find(item => {
    const codes = codeKeys.map(key => comparable(item?.[key])).filter(Boolean);
    const names = nameKeys.map(key => comparable(item?.[key])).filter(Boolean);
    return wanted.some(value => codes.includes(value) || names.includes(value));
  }) || null;
}

async function readCache(db, key, now) {
  const row = await one(db, "SELECT data_json, expires_at FROM product_cache WHERE cache_key = $1", [key]);
  if (!row || Number(row.expires_at || 0) <= now) return null;
  try {
    return JSON.parse(row.data_json || "null");
  } catch {
    return null;
  }
}

async function writeCache(db, key, data, now) {
  await exec(
    db,
    `INSERT INTO product_cache (cache_key, data_json, expires_at, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (cache_key) DO UPDATE SET
       data_json = EXCLUDED.data_json,
       expires_at = EXCLUDED.expires_at,
       updated_at = now()`,
    [key, JSON.stringify(data || null), now + CACHE_SECONDS],
  );
}

async function cached(app, key, loader) {
  const now = Math.floor(Date.now() / 1000);
  const cachedData = await readCache(app.db, key, now);
  if (cachedData !== null) return cachedData;
  const data = await loader();
  await writeCache(app.db, key, data, now);
  return data;
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    error: data?.error || data?.message || "上游服务暂时不可用。",
  };
}

async function fetchJson(url, init = {}) {
  try {
    const response = await fetch(url, {
      method: init.method || "GET",
      headers: { Accept: "application/json", ...(init.headers || {}) },
      body: init.body,
    });
    return parseResponse(response);
  } catch {
    return { ok: false, status: 502, data: null, error: "上游服务暂时不可用。" };
  }
}

function formBody(fields) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined || value === null || value === "") continue;
    body.set(key, String(value));
  }
  return body;
}

async function postForm(url, fields) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody(fields),
  });
}

function configuredProviders(config) {
  return [
    config.fivesimApiKey ? SMS_PROVIDERS.FIVESIM : "",
    config.beeSmsApiToken ? SMS_PROVIDERS.BEESMS : "",
    config.smspoolApiKey ? SMS_PROVIDERS.SMSPOOL : "",
  ].filter(Boolean);
}

function providerToken(config, provider) {
  if (provider === SMS_PROVIDERS.FIVESIM) return String(config.fivesimApiKey || "").trim();
  if (provider === SMS_PROVIDERS.BEESMS) return String(config.beeSmsApiToken || "").trim();
  if (provider === SMS_PROVIDERS.SMSPOOL) return String(config.smspoolApiKey || "").trim();
  return "";
}

export function normalizeProviderHealth(input = {}, options = {}) {
  const provider = String(input.provider || "");
  const configured = Boolean(input.configured);
  const lowBalanceUsd = Math.max(0, Number(options.lowBalanceUsd ?? 1));
  const rawBalance = Number(input.balance);
  const balance = Number.isFinite(rawBalance) ? Math.max(0, rawBalance) : 0;
  const hasError = Boolean(input.error);
  let status = "disabled";
  if (configured && hasError) status = "error";
  else if (configured && balance <= 0) status = "empty";
  else if (configured && balance < lowBalanceUsd) status = "low";
  else if (configured) status = "ok";

  return {
    provider,
    providerName: PROVIDER_NAMES[provider] || provider,
    configured,
    status,
    message: PROVIDER_HEALTH_MESSAGES[status] || "状态未知",
    balance: configured && !hasError ? Number(balance.toFixed(4)) : null,
    checkedAt: input.checkedAt || new Date().toISOString(),
    error: hasError ? "余额读取失败" : "",
  };
}

async function fivesimQuote(app, input) {
  const result = await app.fivesim(`/guest/products/${input.country}/${input.operator || "any"}`, "");
  if (!result.ok) return null;
  const info = result.data?.[input.product];
  const cost = amount(info?.cost || info?.Price || info?.price);
  const count = amount(info?.count || info?.Qty || info?.qty);
  if (cost <= 0) return null;
  return {
    provider: SMS_PROVIDERS.FIVESIM,
    providerName: "5sim",
    providerCountry: input.country,
    providerOperator: input.operator || "any",
    providerProduct: input.product,
    cost,
    count,
    raw: info || {},
  };
}

async function fivesimBalance(app) {
  const token = providerToken(app.config, SMS_PROVIDERS.FIVESIM);
  if (!token) return 0;
  const result = await app.fivesim("/user/profile", token);
  if (!result.ok) return 0;
  return amount(result.data?.balance || result.data?.user?.balance);
}

async function fivesimBuy(app, quote) {
  const token = providerToken(app.config, SMS_PROVIDERS.FIVESIM);
  const result = await app.fivesim(
    `/user/buy/activation/${quote.providerCountry}/${quote.providerOperator}/${quote.providerProduct}`,
    token,
  );
  if (!result.ok) return providerError(result, { provider: SMS_PROVIDERS.FIVESIM });
  const id = result.data?.id;
  if (!id) return providerError({ status: 502, publicCode: "unavailable" }, { provider: SMS_PROVIDERS.FIVESIM });
  return {
    ok: true,
    provider: SMS_PROVIDERS.FIVESIM,
    id: String(id),
    phone: result.data?.phone || result.data?.number || "",
    status: normalizeProviderStatus(SMS_PROVIDERS.FIVESIM, result.data?.status, "received"),
    sms: result.data?.sms || [],
    cost: amount(result.data?.price || result.data?.cost || quote.cost),
    raw: result.data || {},
  };
}

async function beeRequest(app, path, params = {}) {
  const token = providerToken(app.config, SMS_PROVIDERS.BEESMS);
  if (!token) return { ok: false, status: 503, data: null, error: "上游服务暂时不可用。" };
  const url = new URL(`${BEE_BASE}${path}`);
  url.searchParams.set("token", token);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const result = await fetchJson(url);
  if (!result.ok) return result;
  const code = Number(result.data?.code);
  return {
    ...result,
    ok: code === 200,
    apiCode: code,
    error: result.data?.message || result.error,
  };
}

async function beeAreas(app) {
  const data = await cached(app, "provider:bee:areas", async () => {
    const result = await beeRequest(app, "/v1/otp/areas");
    return result.ok ? result.data?.data || [] : [];
  });
  return asArray(data);
}

async function beeServices(app) {
  const data = await cached(app, "provider:bee:services", async () => {
    const result = await beeRequest(app, "/v1/otp/services");
    return result.ok ? result.data?.data || [] : [];
  });
  return asArray(data);
}

async function resolveBeeArea(app, country) {
  const list = await beeAreas(app);
  const direct = iso2(country);
  return matchItem(list, [direct, isoUpper(country)], ["code", "area_code"], ["name", "area_name"]) || { code: direct };
}

async function resolveBeeService(app, product) {
  const list = await beeServices(app);
  const aliases = serviceAliases(product);
  const matched = matchItem(list, aliases, ["code", "service_code"], ["name", "service_name"]);
  if (matched) return matched;
  return aliases[1] ? { code: aliases[1] } : { code: product };
}

async function beeQuote(app, input) {
  const area = await resolveBeeArea(app, input.country);
  const service = await resolveBeeService(app, input.product);
  const areaCode = itemValue(area, ["code", "area_code"]);
  const serviceCode = itemValue(service, ["code", "service_code"]);
  if (!areaCode || !serviceCode) return null;

  const result = await beeRequest(app, "/v1/otp/prices", { area: areaCode, service: serviceCode });
  if (!result.ok) return null;
  const rows = asArray(result.data?.data);
  const row = rows.find(item =>
    comparable(item.area_code) === comparable(areaCode)
    && comparable(item.service_code) === comparable(serviceCode)
  ) || rows[0];
  const cost = cents(row?.amount);
  const count = amount(row?.qty);
  if (cost <= 0) return null;
  return {
    provider: SMS_PROVIDERS.BEESMS,
    providerName: "Bee-SMS",
    providerCountry: areaCode,
    providerOperator: "any",
    providerProduct: serviceCode,
    cost,
    count,
    raw: row || {},
  };
}

async function beeBalance(app) {
  const result = await beeRequest(app, "/v1/user/balance");
  return result.ok ? cents(result.data?.data) : 0;
}

async function beeBuy(app, quote) {
  const maxAmount = Math.ceil(quote.cost * 100);
  const result = await beeRequest(app, "/v1/otp/purchase", {
    area: quote.providerCountry,
    service: quote.providerProduct,
    max_amount: maxAmount,
  });
  if (!result.ok) return providerError(result, { provider: SMS_PROVIDERS.BEESMS });
  const data = result.data?.data || {};
  if (!data.order_id) return providerError({ status: 502, publicCode: "unavailable" }, { provider: SMS_PROVIDERS.BEESMS });
  return {
    ok: true,
    provider: SMS_PROVIDERS.BEESMS,
    id: String(data.order_id),
    phone: data.mobile_number ? `+${data.dialing_code || ""}${data.mobile_number}` : "",
    status: "pending",
    sms: [],
    cost: quote.cost,
    raw: data,
  };
}

async function smspoolRequest(app, path, fields = {}) {
  const key = providerToken(app.config, SMS_PROVIDERS.SMSPOOL);
  if (!key) return { ok: false, status: 503, data: null, error: "上游服务暂时不可用。" };
  const result = await postForm(`${SMSPOOL_BASE}${path}`, { key, ...fields });
  if (!result.ok) return result;
  const success = result.data?.success;
  if (success === 0 || success === false) {
    return { ...result, ok: false, error: result.data?.message || result.error };
  }
  return result;
}

async function smspoolServices(app) {
  const data = await cached(app, "provider:smspool:services", async () => {
    const result = await smspoolRequest(app, "/service/retrieve_all");
    return result.ok ? result.data : [];
  });
  return asArray(data);
}

function serviceCatalogEntry(item, provider) {
  const rawCode = itemValue(item, [
    "short_name",
    "code",
    "service_code",
    "service_id",
    "id",
    "ID",
    "name",
    "service",
    "service_name",
  ]);
  const code = catalogCode(rawCode);
  if (!code) return null;
  const count = amount(itemValue(item, ["stock", "count", "qty", "quantity"]));
  return {
    code,
    provider,
    count: count > 0 ? count : undefined,
  };
}

export async function providerServiceCatalog(app) {
  const providers = configuredProviders(app.config).filter(provider => provider !== SMS_PROVIDERS.FIVESIM);
  const rows = await Promise.all(providers.map(async provider => {
    try {
      const services = provider === SMS_PROVIDERS.BEESMS
        ? await beeServices(app)
        : await smspoolServices(app);
      return services.map(item => serviceCatalogEntry(item, provider)).filter(Boolean);
    } catch {
      return [];
    }
  }));

  const catalog = {};
  for (const entry of rows.flat()) {
    if (!catalog[entry.code]) {
      catalog[entry.code] = { currency: "CNY" };
    }
    if (entry.count !== undefined) {
      catalog[entry.code].count = Math.max(Number(catalog[entry.code].count || 0), entry.count);
    }
  }
  return catalog;
}

async function smspoolCountries(app) {
  const data = await cached(app, "provider:smspool:countries", async () => {
    const result = await smspoolRequest(app, "/country/retrieve_all");
    return result.ok ? result.data : [];
  });
  return asArray(data);
}

async function resolveSmspoolCountry(app, country) {
  const list = await smspoolCountries(app);
  const aliases = [isoUpper(country), iso2(country), country];
  const matched = matchItem(list, aliases, ["id", "ID", "country_id", "code", "short_name"], ["name", "country"]);
  return matched ? itemValue(matched, ["id", "ID", "country_id", "code", "short_name"]) : isoUpper(country);
}

async function resolveSmspoolService(app, product) {
  const list = await smspoolServices(app);
  const aliases = serviceAliases(product);
  const matched = matchItem(list, aliases, ["id", "ID", "service_id", "code", "short_name"], ["name", "service", "service_name"]);
  if (matched) return itemValue(matched, ["id", "ID", "service_id", "code", "short_name", "name"]);
  return aliases[0];
}

function firstObject(data) {
  if (Array.isArray(data)) return data[0] || {};
  if (Array.isArray(data?.data)) return data.data[0] || {};
  return data && typeof data === "object" ? data : {};
}

async function smspoolQuote(app, input) {
  const country = await resolveSmspoolCountry(app, input.country);
  const service = await resolveSmspoolService(app, input.product);
  if (!country || !service) return null;
  const result = await smspoolRequest(app, "/request/price", { country, service });
  if (!result.ok) return null;
  const row = firstObject(result.data);
  const cost = amount(row.price || row.cost || row.amount || row.rate);
  const count = amount(row.stock || row.quantity || row.count || row.qty || (cost > 0 ? 1 : 0));
  if (cost <= 0) return null;
  return {
    provider: SMS_PROVIDERS.SMSPOOL,
    providerName: "SMSPool",
    providerCountry: country,
    providerOperator: "any",
    providerProduct: service,
    cost,
    count,
    raw: row || {},
  };
}

async function smspoolBalance(app) {
  const result = await smspoolRequest(app, "/request/balance");
  if (!result.ok) return 0;
  return amount(result.data?.balance || result.data?.data?.balance || result.data?.data || 0);
}

async function smspoolBuy(app, quote) {
  const result = await smspoolRequest(app, "/purchase/sms", {
    country: quote.providerCountry,
    service: quote.providerProduct,
    max_price: quote.cost,
    pricing_option: 0,
    quantity: 1,
  });
  if (!result.ok) return providerError(result, { provider: SMS_PROVIDERS.SMSPOOL });
  const data = result.data || {};
  const id = data.order_id || data.orderid || data.order_code || data.id || data.request_id;
  if (!id) return providerError({ status: 502, publicCode: "unavailable" }, { provider: SMS_PROVIDERS.SMSPOOL });
  return {
    ok: true,
    provider: SMS_PROVIDERS.SMSPOOL,
    id: String(id),
    phone: data.phonenumber || data.phone || data.number || "",
    status: data.status || "pending",
    sms: data.sms || [],
    cost: amount(data.cost || data.price || quote.cost),
    raw: data,
  };
}

async function quoteByProvider(app, provider, input) {
  if (provider === SMS_PROVIDERS.FIVESIM) return fivesimQuote(app, input);
  if (provider === SMS_PROVIDERS.BEESMS) return beeQuote(app, input);
  if (provider === SMS_PROVIDERS.SMSPOOL) return smspoolQuote(app, input);
  return null;
}

async function balanceByProvider(app, provider) {
  if (provider === SMS_PROVIDERS.FIVESIM) return fivesimBalance(app);
  if (provider === SMS_PROVIDERS.BEESMS) return beeBalance(app);
  if (provider === SMS_PROVIDERS.SMSPOOL) return smspoolBalance(app);
  return 0;
}

export async function smsProviderHealth(app, options = {}) {
  const providers = [SMS_PROVIDERS.FIVESIM, SMS_PROVIDERS.BEESMS, SMS_PROVIDERS.SMSPOOL];
  return Promise.all(providers.map(async provider => {
    const configured = Boolean(providerToken(app.config, provider));
    if (!configured) return normalizeProviderHealth({ provider, configured: false }, options);
    try {
      const balance = await balanceByProvider(app, provider);
      return normalizeProviderHealth({ provider, configured: true, balance }, options);
    } catch {
      return normalizeProviderHealth({ provider, configured: true, error: true }, options);
    }
  }));
}

export function sortBuyableQuotes(quotes) {
  return [...(quotes || [])]
    .filter(q => q && q.cost > 0 && q.count > 0 && q.balance >= q.cost)
    .sort((a, b) => a.cost - b.cost || String(a.provider).localeCompare(String(b.provider)));
}

export function selectBestSmsQuote(quotes) {
  return sortBuyableQuotes(quotes)[0] || null;
}

export function publicBestSmsQuote(config, quotes) {
  const buyable = sortBuyableQuotes(quotes);
  const best = buyable[0] || null;
  if (!best) {
    return {
      available: false,
      count: 0,
      charge: 0,
      currency: "CNY",
    };
  }

  const count = buyable.reduce((sum, quote) => sum + Math.max(0, Number(quote.count || 0)), 0);
  return {
    available: true,
    count,
    ...publicChargeQuote(quoteCharge(config, best.cost)),
  };
}

export async function quoteSmsProviders(app, input) {
  const providers = configuredProviders(app.config);
  const quotes = await Promise.all(providers.map(async provider => {
    try {
      return await quoteByProvider(app, provider, input);
    } catch {
      return null;
    }
  }));

  const balances = new Map();
  for (const quote of quotes.filter(Boolean)) {
    if (!balances.has(quote.provider)) {
      try {
        balances.set(quote.provider, await balanceByProvider(app, quote.provider));
      } catch {
        balances.set(quote.provider, 0);
      }
    }
  }

  return quotes
    .filter(Boolean)
    .map(quote => ({ ...quote, balance: balances.get(quote.provider) || 0 }))
    .sort((a, b) => a.cost - b.cost || String(a.provider).localeCompare(String(b.provider)));
}

export async function buySmsProvider(app, quote) {
  if (quote.provider === SMS_PROVIDERS.FIVESIM) return fivesimBuy(app, quote);
  if (quote.provider === SMS_PROVIDERS.BEESMS) return beeBuy(app, quote);
  if (quote.provider === SMS_PROVIDERS.SMSPOOL) return smspoolBuy(app, quote);
  return { ok: false, status: 502, publicCode: "unavailable", error: "上游服务暂时不可用。" };
}

export function providerOrderKey(provider, id) {
  const raw = String(id || "");
  if (provider === SMS_PROVIDERS.FIVESIM) return raw;
  return `${provider}:${raw}`;
}

export function inferProvider(row) {
  if (row?.provider) return row.provider;
  const raw = String(row?.fivesim_id || "");
  if (raw.startsWith(`${SMS_PROVIDERS.BEESMS}:`)) return SMS_PROVIDERS.BEESMS;
  if (raw.startsWith(`${SMS_PROVIDERS.SMSPOOL}:`)) return SMS_PROVIDERS.SMSPOOL;
  return SMS_PROVIDERS.FIVESIM;
}

export function rawProviderOrderId(row) {
  const provider = inferProvider(row);
  const raw = String(row?.fivesim_id || "");
  const prefix = `${provider}:`;
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

function smsArrayFromBeeCode(code) {
  const value = String(code || "").trim();
  return value ? [{ code: value, text: value }] : [];
}

export async function checkSmsProviderOrder(app, row) {
  const provider = inferProvider(row);
  const id = rawProviderOrderId(row);

  if (provider === SMS_PROVIDERS.FIVESIM) {
    const result = await app.fivesim(`/user/check/${id}`, providerToken(app.config, provider));
    if (!result.ok) return providerError(result, { provider });
    return {
      ok: true,
      provider,
      phone: result.data?.phone || result.data?.number || row.phone || "",
      status: normalizeProviderStatus(provider, result.data?.status, row.status),
      sms: result.data?.sms || [],
      raw: result.data || {},
    };
  }

  if (provider === SMS_PROVIDERS.BEESMS) {
    const result = await beeRequest(app, "/v1/otp/sms", { order: id });
    if (!result.ok && result.apiCode === 50106) {
      return {
        ok: true,
        provider,
        phone: row.phone || "",
        status: "pending",
        sms: [],
        raw: result.data || {},
      };
    }
    if (!result.ok && result.apiCode === 50107) {
      return {
        ok: true,
        provider,
        phone: row.phone || "",
        status: "timeout",
        sms: [],
        raw: result.data || {},
      };
    }
    if (!result.ok && result.apiCode === 50112) {
      return {
        ok: true,
        provider,
        phone: row.phone || "",
        status: "cancelled",
        sms: [],
        raw: result.data || {},
      };
    }
    if (!result.ok) {
      return providerError(result, { provider });
    }
    const sms = smsArrayFromBeeCode(result.data?.data);
    return {
      ok: true,
      provider,
      phone: row.phone || "",
      status: sms.length ? "completed" : row.status,
      sms,
      raw: result.data || {},
    };
  }

  if (provider === SMS_PROVIDERS.SMSPOOL) {
    const result = await smspoolRequest(app, "/sms/check", { orderid: id });
    if (!result.ok) return providerError(result, { provider });
    const data = result.data || {};
    const code = data.code || data.full_code || data.sms_code || "";
    const statusValue = data.status ?? data.status_code ?? data.statusCode ?? (code ? "completed" : row.status);
    return {
      ok: true,
      provider,
      phone: data.phonenumber || data.phone || row.phone || "",
      status: normalizeProviderStatus(provider, statusValue, row.status),
      sms: Array.isArray(data.sms) ? data.sms : smsArrayFromBeeCode(code || data.sms),
      raw: data,
    };
  }

  return { ok: false, status: 502, publicCode: "unavailable", error: "上游服务暂时不可用。" };
}

export async function changeSmsProviderOrder(app, row, action) {
  const provider = inferProvider(row);
  const id = rawProviderOrderId(row);

  if (provider === SMS_PROVIDERS.FIVESIM) {
    const result = await app.fivesim(`/user/${action}/${id}`, providerToken(app.config, provider));
    if (!result.ok) return providerError(result, { provider });
    return {
      ok: true,
      status: normalizeProviderStatus(provider, result.data?.status, action),
      sms: result.data?.sms || [],
      raw: result.data || {},
    };
  }

  if (provider === SMS_PROVIDERS.BEESMS) {
    if (action === "cancel" || action === "ban") {
      const result = await beeRequest(app, "/v1/otp/cancel", { order: id });
      if (!result.ok) return providerError(result, { provider });
      return { ok: true, status: "cancelled", sms: [], raw: result.data || {} };
    }
    return { ok: true, status: "finished", sms: [], raw: { local: true } };
  }

  if (provider === SMS_PROVIDERS.SMSPOOL) {
    if (action === "cancel" || action === "ban") {
      const result = await smspoolRequest(app, "/sms/cancel", { orderid: id });
      if (!result.ok) return providerError(result, { provider });
      return { ok: true, status: "cancelled", sms: [], raw: result.data || {} };
    }
    return { ok: true, status: "finished", sms: [], raw: { local: true } };
  }

  return { ok: false, status: 502, publicCode: "unavailable", error: "上游服务暂时不可用。" };
}

export function smsProviderHttpError(reply, result) {
  reply.code(result?.status || 502);
  return { error: publicSmsProviderError(result) };
}
