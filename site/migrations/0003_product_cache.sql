CREATE TABLE IF NOT EXISTS product_cache (
  cache_key TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_cache_expires_at
  ON product_cache(expires_at);
