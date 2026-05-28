ALTER TABLE users
  VALIDATE CONSTRAINT users_balance_cents_nonnegative;

ALTER TABLE balance_logs
  VALIDATE CONSTRAINT balance_logs_balance_after_cents_nonnegative;

ALTER TABLE sms_orders
  VALIDATE CONSTRAINT sms_orders_price_cents_nonnegative;

ALTER TABLE sms_orders
  VALIDATE CONSTRAINT sms_orders_refund_cents_nonnegative;

ALTER TABLE balance_vouchers
  VALIDATE CONSTRAINT balance_vouchers_amount_cents_positive;

ALTER TABLE referral_rewards
  VALIDATE CONSTRAINT referral_rewards_reward_cents_positive;
