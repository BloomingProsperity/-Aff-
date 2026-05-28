import { centsToAmount } from "./common.js";
import { exec, many, one } from "./db.js";
import { writeSmsOrderEvent } from "./smsEvents.js";
import { shouldRefundSmsOrder, smsRefundCents, smsRefundNote } from "./smsRefunds.js";
import { activeSmsOrderStatuses, smsRiskSettings } from "./smsRisk.js";

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function smsMaintenanceSettings(config = {}) {
  return {
    intervalSeconds: boundedInt(
      config.smsMaintenanceIntervalSeconds ?? config.SMS_MAINTENANCE_INTERVAL_SECONDS,
      60,
      10,
      3600,
    ),
    batchLimit: boundedInt(
      config.smsMaintenanceBatchLimit ?? config.SMS_MAINTENANCE_BATCH_LIMIT,
      100,
      1,
      500,
    ),
  };
}

export function shouldRunSmsMaintenance(state = {}) {
  return !state.running;
}

async function expireOneSmsOrder(app, orderId, { actorUserId = null, trigger = "maintenance" } = {}) {
  const settings = smsRiskSettings(app.config);
  const client = await app.db.connect();
  let result = { expired: false, refunded: false, refundCents: 0, order: null, oldStatus: "" };

  try {
    await client.query("BEGIN");
    const locked = await one(client, "SELECT * FROM sms_orders WHERE id = $1 FOR UPDATE", [orderId]);
    if (!locked) {
      await client.query("COMMIT");
      return result;
    }

    const raw = {
      provider: locked.provider || "5sim",
      data: {
        local: "timeout",
        trigger,
        previousStatus: locked.status,
        orderTimeoutMinutes: settings.orderTimeoutMinutes,
      },
    };
    const expired = await one(
      client,
      `UPDATE sms_orders
          SET status = 'expired',
              raw_json = $1,
              updated_at = now()
        WHERE id = $2
          AND lower(status) = ANY($3)
          AND created_at <= now() - ($4::int * INTERVAL '1 minute')
      RETURNING *`,
      [JSON.stringify(raw), orderId, activeSmsOrderStatuses(), settings.orderTimeoutMinutes],
    );
    if (!expired) {
      await client.query("COMMIT");
      return { ...result, order: locked, oldStatus: locked.status };
    }

    result = { expired: true, refunded: false, refundCents: 0, order: expired, oldStatus: locked.status };
    if (shouldRefundSmsOrder(expired)) {
      const refundCents = smsRefundCents(expired);
      const user = await one(
        client,
        `UPDATE users
            SET balance_cents = balance_cents + $1,
                updated_at = now()
          WHERE id = $2
        RETURNING *`,
        [refundCents, expired.user_id],
      );
      const refundedOrder = await one(
        client,
        `UPDATE sms_orders
            SET refund_cents = $1,
                refunded_at = now(),
                updated_at = now()
          WHERE id = $2
        RETURNING *`,
        [refundCents, orderId],
      );
      await exec(
        client,
        `INSERT INTO balance_logs (user_id, admin_id, delta_cents, balance_after_cents, reason, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [expired.user_id, actorUserId || null, refundCents, user.balance_cents, "sms_refund", smsRefundNote(refundedOrder || expired)],
      );
      result = { ...result, refunded: true, refundCents, order: refundedOrder || expired };
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  if (result.expired) {
    await writeSmsOrderEvent(app.db, {
      orderId,
      userId: result.order?.user_id,
      actorUserId,
      type: "maintenance.expire",
      status: "success",
      provider: result.order?.provider || "",
      message: "系统清理超时订单",
      metadata: {
        trigger,
        oldStatus: result.oldStatus,
        newStatus: result.order?.status || "expired",
        refunded: result.refunded,
        refundAmount: centsToAmount(result.refundCents),
      },
    });
  }
  if (result.refunded) {
    await writeSmsOrderEvent(app.db, {
      orderId,
      userId: result.order?.user_id,
      actorUserId,
      type: "balance.refund",
      status: "success",
      provider: result.order?.provider || "",
      message: "订单退款",
      metadata: {
        trigger,
        orderStatus: result.order?.status || "",
        refundAmount: centsToAmount(result.refundCents),
      },
    });
  }

  return result;
}

export async function expireStaleSmsOrders(app, { actorUserId = null, limit, trigger = "maintenance" } = {}) {
  const risk = smsRiskSettings(app.config);
  const maintenance = smsMaintenanceSettings(app.config);
  const batchLimit = boundedInt(limit ?? maintenance.batchLimit, maintenance.batchLimit, 1, maintenance.batchLimit);
  const rows = await many(
    app.db,
    `SELECT id
       FROM sms_orders
      WHERE lower(status) = ANY($1)
        AND created_at <= now() - ($2::int * INTERVAL '1 minute')
      ORDER BY id ASC
      LIMIT $3`,
    [activeSmsOrderStatuses(), risk.orderTimeoutMinutes, batchLimit],
  );

  const summary = { scanned: rows.length, expired: 0, refunded: 0, refundCents: 0 };
  for (const row of rows) {
    const result = await expireOneSmsOrder(app, Number(row.id), { actorUserId, trigger });
    if (result.expired) summary.expired += 1;
    if (result.refunded) {
      summary.refunded += 1;
      summary.refundCents += Number(result.refundCents || 0);
    }
  }
  return summary;
}

export function startSmsMaintenance(app, options = {}) {
  const settings = smsMaintenanceSettings(app.config);
  const state = { running: false };
  const intervalMs = Math.max(10_000, Number(options.intervalMs || settings.intervalSeconds * 1000));

  async function run() {
    if (!shouldRunSmsMaintenance(state)) return;
    state.running = true;
    try {
      const summary = await expireStaleSmsOrders(app, { trigger: "timer" });
      if (summary.expired > 0) app.log?.info?.({ summary }, "sms maintenance expired stale orders");
    } catch (error) {
      app.log?.warn?.({ error: error.message }, "sms maintenance failed");
    } finally {
      state.running = false;
    }
  }

  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return {
    stop() {
      clearInterval(timer);
    },
    run,
  };
}
