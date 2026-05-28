import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeProviderHealth,
  normalizeProviderStatus,
  providerOrderKey,
  rawProviderOrderId,
  publicSmsProviderError,
  selectBestSmsQuote,
  sortBuyableQuotes,
} from "../src/lib/smsProviders.js";

test("sms provider router keeps only stocked quotes with enough supplier balance", () => {
  const quotes = sortBuyableQuotes([
    { provider: "5sim", cost: 0.9, count: 12, balance: 2 },
    { provider: "bee-sms", cost: 0.5, count: 0, balance: 10 },
    { provider: "smspool", cost: 0.7, count: 4, balance: 0.2 },
    { provider: "bee-sms", cost: 0.6, count: 8, balance: 8 },
  ]);

  assert.deepEqual(quotes.map(q => q.provider), ["bee-sms", "5sim"]);
  assert.deepEqual(quotes.map(q => q.cost), [0.6, 0.9]);
});

test("sms provider router chooses the cheapest buyable supplier automatically", () => {
  const best = selectBestSmsQuote([
    { provider: "5sim", cost: 0.9, count: 12, balance: 2 },
    { provider: "bee-sms", cost: 0.4, count: 0, balance: 10 },
    { provider: "smspool", cost: 0.5, count: 4, balance: 0.2 },
    { provider: "bee-sms", cost: 0.6, count: 8, balance: 8 },
  ]);

  assert.equal(best.provider, "bee-sms");
  assert.equal(best.cost, 0.6);
  assert.equal(selectBestSmsQuote([]), null);
});

test("non-5sim upstream ids are namespaced locally", () => {
  assert.equal(providerOrderKey("5sim", "123"), "123");
  assert.equal(providerOrderKey("bee-sms", "123"), "bee-sms:123");
  assert.equal(rawProviderOrderId({ provider: "bee-sms", fivesim_id: "bee-sms:123" }), "123");
});

test("provider statuses follow upstream API semantics", () => {
  assert.equal(normalizeProviderStatus("5sim", "CANCELED"), "cancelled");
  assert.equal(normalizeProviderStatus("5sim", "FINISHED"), "completed");
  assert.equal(normalizeProviderStatus("5sim", "RECEIVED"), "received");
  assert.equal(normalizeProviderStatus("smspool", 1), "pending");
  assert.equal(normalizeProviderStatus("smspool", 2), "expired");
  assert.equal(normalizeProviderStatus("smspool", 3), "completed");
  assert.equal(normalizeProviderStatus("smspool", 5), "cancelled");
  assert.equal(normalizeProviderStatus("smspool", 6), "refunded");
  assert.equal(normalizeProviderStatus("smspool", 8), "activating");
  assert.equal(normalizeProviderStatus("bee-sms", "pending"), "pending");
});

test("provider errors are converted to standard public messages", () => {
  assert.equal(publicSmsProviderError({ publicCode: "no_stock", error: "raw upstream no numbers" }), "当前服务暂时没有可用号码，请稍后再试。");
  assert.equal(publicSmsProviderError({ publicCode: "insufficient_provider_balance", error: "Balance not enough" }), "服务暂时不可用，请稍后再试。");
  assert.equal(publicSmsProviderError({ status: 429, error: "provider rate limit raw text" }), "请求过于频繁，请稍后再试。");
  assert.equal(publicSmsProviderError({ status: 502, error: "raw token rejected" }), "上游服务暂时不可用，请稍后再试。");
});

test("provider health summary never exposes tokens and flags low balances", () => {
  const ok = normalizeProviderHealth({
    provider: "5sim",
    configured: true,
    balance: 12.34567,
    token: "secret-token",
  }, { lowBalanceUsd: 1 });
  const low = normalizeProviderHealth({
    provider: "smspool",
    configured: true,
    balance: 0.5,
  }, { lowBalanceUsd: 1 });
  const disabled = normalizeProviderHealth({
    provider: "bee-sms",
    configured: false,
    balance: 20,
  }, { lowBalanceUsd: 1 });
  const error = normalizeProviderHealth({
    provider: "smspool",
    configured: true,
    balance: 0,
    error: "raw upstream token rejected",
  }, { lowBalanceUsd: 1 });

  assert.equal(ok.status, "ok");
  assert.equal(ok.balance, 12.3457);
  assert.equal(JSON.stringify(ok).includes("secret-token"), false);
  assert.equal(low.status, "low");
  assert.equal(disabled.status, "disabled");
  assert.equal(disabled.balance, null);
  assert.equal(error.status, "error");
  assert.equal(error.error, "余额读取失败");
  assert.equal(JSON.stringify(error).includes("token rejected"), false);
});
