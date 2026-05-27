ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;

UPDATE users
   SET referral_code = upper(substr(md5(id::text || email || random()::text), 1, 8))
 WHERE referral_code IS NULL OR referral_code = '';

ALTER TABLE users
  ALTER COLUMN referral_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_not_self_referred'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_not_self_referred
      CHECK (referred_by_user_id IS NULL OR referred_by_user_id <> id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_referred_by_user_id ON users(referred_by_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

CREATE TABLE IF NOT EXISTS balance_vouchers (
  id BIGSERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  code_suffix TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'void')),
  note TEXT,
  created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_balance_vouchers_batch_id ON balance_vouchers(batch_id);
CREATE INDEX IF NOT EXISTS idx_balance_vouchers_status ON balance_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_balance_vouchers_redeemed_by ON balance_vouchers(redeemed_by_user_id);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES sms_orders(id) ON DELETE CASCADE,
  reward_cents BIGINT NOT NULL CHECK (reward_cents > 0),
  rate_bps INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_user_id);
