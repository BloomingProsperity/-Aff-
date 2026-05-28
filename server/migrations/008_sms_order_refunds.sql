ALTER TABLE sms_orders
  ADD COLUMN IF NOT EXISTS refund_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sms_orders_refunded_at ON sms_orders(refunded_at);
