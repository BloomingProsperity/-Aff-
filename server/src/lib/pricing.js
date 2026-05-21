export function quoteCharge(config, cost) {
  const raw = Math.max(0, Number(cost || 0));
  const rate = Number(config.smsUsdCnyRate ?? config.SMS_USD_CNY_RATE ?? 7.2);
  const margin = Number(config.smsMarginCny ?? config.SMS_MARGIN_CNY ?? 10);
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
