import { randomUUID } from "node:crypto";

function cleanPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function operationLockKey(...parts) {
  const key = parts.map(cleanPart).filter(Boolean).join(":");
  return (key || "operation").slice(0, 160);
}

export async function acquireOperationLock(db, { key, ttlSeconds = 60, ownerToken = randomUUID() } = {}) {
  const lockKey = operationLockKey(key);
  const ttl = Math.min(300, Math.max(5, Math.trunc(Number(ttlSeconds || 60))));
  const result = await db.query(
    `INSERT INTO operation_locks (lock_key, owner_token, expires_at, created_at, updated_at)
     VALUES ($1, $2, now() + ($3::int * INTERVAL '1 second'), now(), now())
     ON CONFLICT (lock_key) DO UPDATE SET
       owner_token = EXCLUDED.owner_token,
       expires_at = EXCLUDED.expires_at,
       updated_at = now()
     WHERE operation_locks.expires_at <= now()
     RETURNING lock_key, owner_token, expires_at`,
    [lockKey, ownerToken, ttl],
  );
  const row = result.rows?.[0];
  if (!row) return { acquired: false, key: lockKey };
  return {
    acquired: true,
    key: row.lock_key,
    ownerToken: row.owner_token,
    expiresAt: row.expires_at,
  };
}

export async function releaseOperationLock(db, lock = {}) {
  if (!lock.key || !lock.ownerToken) return false;
  const result = await db.query(
    "DELETE FROM operation_locks WHERE lock_key = $1 AND owner_token = $2",
    [lock.key, lock.ownerToken],
  );
  return Number(result.rowCount || 0) > 0;
}
