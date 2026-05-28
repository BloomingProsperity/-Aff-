ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_note TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

UPDATE users SET status = 'active' WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
