DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_balance_cents_nonnegative'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_balance_cents_nonnegative
      CHECK (balance_cents >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'balance_logs_balance_after_cents_nonnegative'
  ) THEN
    ALTER TABLE balance_logs
      ADD CONSTRAINT balance_logs_balance_after_cents_nonnegative
      CHECK (balance_after_cents >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_orders_price_cents_nonnegative'
  ) THEN
    ALTER TABLE sms_orders
      ADD CONSTRAINT sms_orders_price_cents_nonnegative
      CHECK (price_cents >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_orders_refund_cents_nonnegative'
  ) THEN
    ALTER TABLE sms_orders
      ADD CONSTRAINT sms_orders_refund_cents_nonnegative
      CHECK (refund_cents >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'balance_vouchers_amount_cents_positive'
  ) THEN
    ALTER TABLE balance_vouchers
      ADD CONSTRAINT balance_vouchers_amount_cents_positive
      CHECK (amount_cents > 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referral_rewards_reward_cents_positive'
  ) THEN
    ALTER TABLE referral_rewards
      ADD CONSTRAINT referral_rewards_reward_cents_positive
      CHECK (reward_cents > 0) NOT VALID;
  END IF;
END $$;
