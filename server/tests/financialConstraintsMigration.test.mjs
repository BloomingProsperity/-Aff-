import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";

const migrationsDir = new URL("../migrations/", import.meta.url);
const migrationFiles = (await readdir(migrationsDir)).filter(name => name.endsWith(".sql")).sort();
const migrationText = (await Promise.all(
  migrationFiles.map(async file => readFile(new URL(file, migrationsDir), "utf8")),
)).join("\n");

test("database migrations enforce non-negative balances and order money fields", () => {
  assert.match(migrationText, /users_balance_cents_nonnegative/);
  assert.match(migrationText, /CHECK\s*\(\s*balance_cents\s*>=\s*0\s*\)/i);
  assert.match(migrationText, /balance_logs_balance_after_cents_nonnegative/);
  assert.match(migrationText, /CHECK\s*\(\s*balance_after_cents\s*>=\s*0\s*\)/i);
  assert.match(migrationText, /sms_orders_price_cents_nonnegative/);
  assert.match(migrationText, /CHECK\s*\(\s*price_cents\s*>=\s*0\s*\)/i);
  assert.match(migrationText, /sms_orders_refund_cents_nonnegative/);
  assert.match(migrationText, /CHECK\s*\(\s*refund_cents\s*>=\s*0\s*\)/i);
});

test("database migrations enforce positive voucher and referral amounts", () => {
  assert.match(migrationText, /balance_vouchers_amount_cents_positive/);
  assert.match(migrationText, /CHECK\s*\(\s*amount_cents\s*>\s*0\s*\)/i);
  assert.match(migrationText, /referral_rewards_reward_cents_positive/);
  assert.match(migrationText, /CHECK\s*\(\s*reward_cents\s*>\s*0\s*\)/i);
});
