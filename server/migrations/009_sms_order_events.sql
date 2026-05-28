CREATE TABLE IF NOT EXISTS sms_order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES sms_orders(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  provider TEXT,
  public_code TEXT,
  message TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_order_events_order_id_created_at ON sms_order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_order_events_user_id_created_at ON sms_order_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_order_events_type_created_at ON sms_order_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_order_events_status_created_at ON sms_order_events(status, created_at DESC);
