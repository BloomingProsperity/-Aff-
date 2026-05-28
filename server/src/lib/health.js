function safeVersion(value) {
  const raw = String(value || "").trim();
  return /^[a-zA-Z0-9._-]{1,40}$/.test(raw) ? raw : "unknown";
}

function safeCommit(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/[a-f0-9]{7,40}/i);
  return match ? match[0].slice(0, 7).toLowerCase() : "unknown";
}

function safeEnvironment(value) {
  const raw = String(value || "").trim().toLowerCase();
  return /^[a-z0-9_-]{1,24}$/.test(raw) ? raw : "unknown";
}

function buildIdentity(config = {}) {
  return {
    service: "hkai-sms-api",
    version: safeVersion(config.appVersion),
    commit: safeCommit(config.appCommit),
    environment: safeEnvironment(config.nodeEnv),
  };
}

export async function healthStatus(db, config = {}) {
  const checkedAt = new Date().toISOString();
  const identity = buildIdentity(config);
  try {
    await db.query("SELECT 1 AS ok");
    return {
      httpStatus: 200,
      body: {
        ...identity,
        ok: true,
        database: "ok",
        checkedAt,
      },
    };
  } catch {
    return {
      httpStatus: 503,
      body: {
        ...identity,
        ok: false,
        database: "error",
        checkedAt,
      },
    };
  }
}
