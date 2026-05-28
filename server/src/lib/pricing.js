const DEFAULT_USD_CNY_RATE = 7.2;
const FIXED_CUSTOMER_PRICE_CNY = 19.9;

function safeRate(config = {}) {
  const rate = Number(config.smsUsdCnyRate ?? config.SMS_USD_CNY_RATE ?? DEFAULT_USD_CNY_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_CNY_RATE;
}

function fixedCustomerPriceCents() {
  return Math.ceil(FIXED_CUSTOMER_PRICE_CNY * 100);
}

function supplierCostCents(config = {}, cost) {
  const raw = Math.max(0, Number(cost || 0));
  return Math.ceil(raw * safeRate(config) * 100);
}

export function supplierCostAllowed(config = {}, cost) {
  return supplierCostCents(config, cost) <= fixedCustomerPriceCents();
}

export function quoteCharge(config, cost) {
  const raw = Math.max(0, Number(cost || 0));
  const rate = safeRate(config);
  const costCents = supplierCostCents(config, raw);
  const chargeCents = fixedCustomerPriceCents();
  const marginCents = Math.max(0, chargeCents - costCents);
  return {
    cost: Number(raw.toFixed(2)),
    costCurrency: "USD",
    costCny: Number((costCents / 100).toFixed(2)),
    rate: Number(rate.toFixed(4)),
    fixed: Number((chargeCents / 100).toFixed(2)),
    margin: Number((marginCents / 100).toFixed(2)),
    charge: Number((chargeCents / 100).toFixed(2)),
    chargeCents,
    currency: "CNY",
  };
}

export function publicChargeQuote(quote = {}) {
  return {
    charge: Number(Number(quote.charge || 0).toFixed(2)),
    currency: quote.currency || "CNY",
  };
}
