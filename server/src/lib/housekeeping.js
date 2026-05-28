export const RATE_LIMIT_GRACE_SECONDS = 3600;
export const PRODUCT_CACHE_GRACE_SECONDS = 86400;
export const PAGE_VIEW_RETENTION_DAYS = 90;

function epochNow(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : Math.floor(Date.now() / 1000);
}

export async function cleanupOperationalData(db, { nowEpoch } = {}) {
  const now = epochNow(nowEpoch);
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
    [PAGE_VIEW_RETENTION_DAYS],
  );

  return {
    sessions: Number(sessions.rowCount || 0),
    rateLimits: Number(rateLimits.rowCount || 0),
    productCache: Number(productCache.rowCount || 0),
    operationLocks: Number(operationLocks.rowCount || 0),
    pageViews: Number(pageViews.rowCount || 0),
  };
}

export function startHousekeeping(app, options = {}) {
  const state = { running: false };
  const intervalMs = Math.max(60_000, Number(options.intervalMs || 60 * 60 * 1000));

  async function run() {
    if (state.running) return null;
    state.running = true;
    try {
      const summary = await cleanupOperationalData(app.db, options);
      if (summary.sessions || summary.rateLimits || summary.productCache || summary.operationLocks || summary.pageViews) {
        app.log?.info?.({ summary }, "temporary data cleaned");
      }
      return summary;
    } catch (error) {
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
  return {
    stop() {
      clearInterval(timer);
    },
    run,
  };
}
