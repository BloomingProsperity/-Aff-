CREATE TABLE IF NOT EXISTS operation_locks (
  lock_key TEXT PRIMARY KEY,
  owner_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operation_locks_expires_at ON operation_locks(expires_at);
