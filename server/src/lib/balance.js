export function validateBalanceAdjustment(currentBalanceCents, deltaCents) {
  const current = Number(currentBalanceCents || 0);
  const delta = Number(deltaCents || 0);
  const balanceAfterCents = current + delta;
  if (!Number.isFinite(current) || !Number.isFinite(delta)) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (balanceAfterCents < 0) {
    return { ok: false, reason: "negative_balance", balanceAfterCents };
  }
  return { ok: true, balanceAfterCents };
}
