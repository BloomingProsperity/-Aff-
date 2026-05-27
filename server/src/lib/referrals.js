import { randomBytes } from "node:crypto";
import { exec, one } from "./db.js";

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_REWARD_BPS = 1000;

export function normalizeReferralCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function generateReferralCode() {
  const bytes = randomBytes(8);
  let out = "";
  for (const byte of bytes) out += REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length];
  return out;
}

export function calculateReferralRewardCents(orderCents, rateBps = REFERRAL_REWARD_BPS) {
  const cents = Math.max(0, Number(orderCents || 0));
  const bps = Math.max(0, Number(rateBps || 0));
  return Math.floor((cents * bps) / 10_000);
}

export async function findReferrerByCode(db, code, newUserEmail = "") {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  const row = await one(db, "SELECT id, email, referral_code FROM users WHERE referral_code = $1", [normalized]);
  if (!row) return null;
  if (newUserEmail && String(row.email || "").toLowerCase() === String(newUserEmail || "").toLowerCase()) return null;
  return row;
}

export async function maybeGrantReferralReward(db, orderId, rateBps = REFERRAL_REWARD_BPS) {
  const order = await one(
    db,
    `SELECT o.id, o.user_id, o.price_cents, o.status, u.referred_by_user_id
       FROM sms_orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = $1`,
    [orderId],
  );
  if (!order?.referred_by_user_id) return { granted: false, reason: "no_referrer" };
  if (!["finished", "completed"].includes(String(order.status || "").toLowerCase())) {
    return { granted: false, reason: "order_not_complete" };
  }

  const firstOrder = await one(
    db,
    `SELECT id
       FROM sms_orders
      WHERE user_id = $1
        AND lower(status) IN ('finished', 'completed')
      ORDER BY id ASC
      LIMIT 1`,
    [order.user_id],
  );
  if (!firstOrder || Number(firstOrder.id) !== Number(order.id)) {
    return { granted: false, reason: "not_first_order" };
  }

  const rewardCents = calculateReferralRewardCents(order.price_cents, rateBps);
  if (rewardCents < 1) return { granted: false, reason: "reward_too_small" };

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const reward = await one(
      client,
      `INSERT INTO referral_rewards
         (referrer_user_id, referred_user_id, order_id, reward_cents, rate_bps)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (referred_user_id) DO NOTHING
       RETURNING *`,
      [order.referred_by_user_id, order.user_id, order.id, rewardCents, rateBps],
    );
    if (!reward) {
      await client.query("ROLLBACK");
      return { granted: false, reason: "already_granted" };
    }

    const updated = await one(
      client,
      `UPDATE users
          SET balance_cents = balance_cents + $1, updated_at = now()
        WHERE id = $2
        RETURNING *`,
      [rewardCents, order.referred_by_user_id],
    );
    await exec(
      client,
      `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        order.referred_by_user_id,
        rewardCents,
        updated.balance_cents,
        "referral_reward",
        `邀请奖励：订单 #${order.id}`,
      ],
    );
    await client.query("COMMIT");
    return { granted: true, reward, user: updated };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
