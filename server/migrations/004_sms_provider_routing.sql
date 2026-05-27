ALTER TABLE sms_orders
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT '5sim';

UPDATE sms_orders
   SET provider = '5sim'
 WHERE provider IS NULL OR provider = '';

CREATE INDEX IF NOT EXISTS idx_sms_orders_provider ON sms_orders(provider);
