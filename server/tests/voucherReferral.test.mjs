import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateReferralRewardCents,
  generateReferralCode,
  normalizeReferralCode,
} from "../src/lib/referrals.js";
import {
  generateVoucherCode,
  hashVoucherCode,
  normalizeVoucherCode,
  voucherSuffix,
} from "../src/lib/vouchers.js";

test("voucher codes normalize user input and hash without exposing the raw code", () => {
  const normalized = normalizeVoucherCode(" hkai-abcd 1234 ");

  assert.equal(normalized, "HKAIABCD1234");
  assert.equal(voucherSuffix(normalized), "1234");
  assert.equal(hashVoucherCode(normalized), hashVoucherCode("hkai abcd-1234"));
  assert.equal(hashVoucherCode(normalized).includes(normalized), false);
  assert.match(hashVoucherCode(normalized), /^[a-f0-9]{64}$/);
});

test("generated voucher codes are uppercase, readable and unique enough for batch creation", () => {
  const codes = new Set(Array.from({ length: 50 }, () => generateVoucherCode()));

  assert.equal(codes.size, 50);
  for (const code of codes) {
    assert.match(code, /^HKAI-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  }
});

test("referral codes normalize safely and generate URL-friendly codes", () => {
  assert.equal(normalizeReferralCode(" ab-cd_12 "), "ABCD12");
  assert.equal(normalizeReferralCode("中文@@"), "");
  assert.match(generateReferralCode(), /^[A-Z2-9]{8}$/);
});

test("referral reward is 10 percent floored to cents and skips sub-cent rewards", () => {
  assert.equal(calculateReferralRewardCents(2000), 200);
  assert.equal(calculateReferralRewardCents(1999), 199);
  assert.equal(calculateReferralRewardCents(9), 0);
  assert.equal(calculateReferralRewardCents(10), 1);
});
