export const RATE_LIMIT_GRACE_SECONDS = 3600;
export const PRODUCT_CACHE_GRACE_SECONDS = 86400;
export const PAGE_VIEW_RETENTION_DAYS = 90;

function epochNow(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : Math.floor(Date.now() / 1000);
}

function retentionDays(days) {
  const n = Number(days || PAGE_VIEW_RETENTION_DAYS);
  if (!Number.isFinite(n)) return PAGE_VIEW_RETENTION_DAYS;
  return Math.min(Math.max(Math.trunc(n), 1), 365);
}

export async function cleanupOperationalData(db, { nowEpoch, pageViewRetentionDays = PAGE_VIEW_RETENTION_DAYS } = {}) {
  const now = epochNow(nowEpoch);
  const keepPageViewsDays = retentionDays(pageViewRetentionDays);
  const sessions = await db.query("DELETE FROM sessions WHERE expires_at <= now()");
  const rateLimits = await db.query(
    "DELETE FROM rate_limits WHERE reset_at < $1",
    [now - RATE_LIMIT_GRACE_SECONDS],
  );
  const productCache = await db.query(
    "DELETE FROM product_cache WHERE expires_at < $1",
    [now - PRODUCT_CACHE_GRACE_SECONDS],
  );
  const operationLocks = await db.query("DELETE FROM operation_locks WHERE expires_at <= now()");
  const pageViews = await db.query(
    "DELETE FROM page_views WHERE view_date < CURRENT_DATE - ($1::int * INTERVAL '1 day')",
    [keepPageViewsDays],
  );

  return {
    sessions: Number(sessions.rowCount || 0),
    rateLimits: Number(rateLimits.rowCount || 0),
    productCache: Number(productCache.rowCount || 0),
    operationLocks: Number(operationLocks.rowCount || 0),
    pageViews: Number(pageViews.rowCount || 0),
  };
}

export function housekeepingStatus(state = {}, { pageViewRetentionDays = PAGE_VIEW_RETENTION_DAYS } = {}) {
  const summary = state.lastSummary || {};
  const error = state.lastError;
  return {
    enabled: true,
    pageViewRetentionDays: retentionDays(pageViewRetentionDays),
    lastRunAt: state.lastRunAt instanceof Date ? state.lastRunAt.toISOString() : "",
    lastDeleted: {
      sessions: Number(summary.sessions || 0),
      rateLimits: Number(summary.rateLimits || 0),
      productCache: Number(summary.productCache || 0),
      operationLocks: Number(summary.operationLocks || 0),
      pageViews: Number(summary.pageViews || 0),
    },
    lastError: error ? String(error.message || error).slice(0, 160) : "",
  };
}

export function startHousekeeping(app, options = {}) {
  const state = { running: false, lastRunAt: null, lastSummary: null, lastError: null };
  const intervalMs = Math.max(60_000, Number(options.intervalMs || 60 * 60 * 1000));

  async function run() {
    if (state.running) return null;
    state.running = true;
    try {
      const summary = await cleanupOperationalData(app.db, options);
      state.lastRunAt = new Date();
      state.lastSummary = summary;
      state.lastError = null;
      if (summary.sessions || summary.rateLimits || summary.productCache || summary.operationLocks || summary.pageViews) {
        app.log?.info?.({ summary }, "temporary data cleaned");
      }
      return summary;
    } catch (error) {
      state.lastRunAt = new Date();
      state.lastError = error;
      app.log?.warn?.({ error: error.message }, "housekeeping cleanup failed");
      return null;
    } finally {
      state.running = false;
    }
  }

  if (options.runOnStart !== false) {
    setTimeout(run, Number(options.startDelayMs || 45_000)).unref?.();
  }

  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  const controller = {
    stop() {
      clearInterval(timer);
    },
    run,
    status() {
      return housekeepingStatus(state, options);
    },
  };
  app.housekeeping = controller;
  return controller;
}
