export const LOG_RETENTION_DAYS = 30;
export const LOG_RETENTION_TABLES = ["audit_logs", "sms_order_events"];

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

export function logRetentionStatus(state = {}, { days = LOG_RETENTION_DAYS } = {}) {
  const summary = state.lastSummary || {};
  const error = state.lastError;
  return {
    enabled: true,
    days: retentionDays(summary.days || days),
    tables: LOG_RETENTION_TABLES,
    lastRunAt: state.lastRunAt instanceof Date ? state.lastRunAt.toISOString() : "",
    lastDeleted: {
      auditLogs: Number(summary.auditLogs || 0),
      smsOrderEvents: Number(summary.smsOrderEvents || 0),
    },
    lastError: error ? String(error.message || error).slice(0, 160) : "",
  };
}

export function startLogRetention(app, options = {}) {
  const state = { running: false, lastRunAt: null, lastSummary: null, lastError: null };
  const intervalMs = Math.max(60_000, Number(options.intervalMs || 24 * 60 * 60 * 1000));

  async function run() {
    if (state.running) return null;
    state.running = true;
    try {
      const summary = await cleanupOldLogs(app.db, options);
      state.lastRunAt = new Date();
      state.lastSummary = summary;
      state.lastError = null;
      if (summary.auditLogs || summary.smsOrderEvents) {
        app.log?.info?.({ summary }, "old logs cleaned");
      }
      return summary;
    } catch (error) {
      state.lastRunAt = new Date();
      state.lastError = error;
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
  const controller = {
    stop() {
      clearInterval(timer);
    },
    run,
    status() {
      return logRetentionStatus(state, options);
    },
  };
  app.logRetention = controller;
  return controller;
}
