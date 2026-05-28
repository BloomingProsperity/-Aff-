export const LOG_RETENTION_DAYS = 30;

function retentionDays(days) {
  const n = Number(days || LOG_RETENTION_DAYS);
  if (!Number.isFinite(n)) return LOG_RETENTION_DAYS;
  return Math.min(Math.max(Math.trunc(n), 1), 365);
}

export async function cleanupOldLogs(db, { days = LOG_RETENTION_DAYS } = {}) {
  const keepDays = retentionDays(days);
  const audit = await db.query(
    "DELETE FROM audit_logs WHERE created_at < now() - ($1::int * INTERVAL '1 day')",
    [keepDays],
  );
  const smsEvents = await db.query(
    "DELETE FROM sms_order_events WHERE created_at < now() - ($1::int * INTERVAL '1 day')",
    [keepDays],
  );
  return {
    auditLogs: Number(audit.rowCount || 0),
    smsOrderEvents: Number(smsEvents.rowCount || 0),
    days: keepDays,
  };
}

export function startLogRetention(app, options = {}) {
  const state = { running: false };
  const intervalMs = Math.max(60_000, Number(options.intervalMs || 24 * 60 * 60 * 1000));

  async function run() {
    if (state.running) return null;
    state.running = true;
    try {
      const summary = await cleanupOldLogs(app.db, options);
      if (summary.auditLogs || summary.smsOrderEvents) {
        app.log?.info?.({ summary }, "old logs cleaned");
      }
      return summary;
    } catch (error) {
      app.log?.warn?.({ error: error.message }, "log retention cleanup failed");
      return null;
    } finally {
      state.running = false;
    }
  }

  if (options.runOnStart !== false) {
    setTimeout(run, Number(options.startDelayMs || 30_000)).unref?.();
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
