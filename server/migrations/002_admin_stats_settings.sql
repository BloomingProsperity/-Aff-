CREATE TABLE IF NOT EXISTS page_views (
  page TEXT NOT NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (page, view_date)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date);
