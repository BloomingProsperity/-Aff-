export const ACTIVE_SMS_ORDER_STATUSES = ["pending", "received"];

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function activeSmsOrderStatuses() {
  return [...ACTIVE_SMS_ORDER_STATUSES];
}

export function smsRiskSettings(config = {}) {
  return {
    activeOrderLimit: boundedInt(
      config.smsActiveOrderLimit ?? config.SMS_ACTIVE_ORDER_LIMIT,
      3,
      1,
      20,
    ),
    buyCooldownSeconds: boundedInt(
      config.smsBuyCooldownSeconds ?? config.SMS_BUY_COOLDOWN_SECONDS,
      10,
      0,
      3600,
    ),
  };
}

export function cooldownSecondsLeft(lastCreatedAt, now = new Date(), config = {}) {
  const { buyCooldownSeconds } = smsRiskSettings(config);
  if (!buyCooldownSeconds || !lastCreatedAt) return 0;
  const lastMs = new Date(lastCreatedAt).getTime();
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs)) return 0;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - lastMs) / 1000));
  return Math.max(0, buyCooldownSeconds - elapsedSeconds);
}
