import assert from "node:assert/strict";
import test from "node:test";
import { quoteCharge } from "../src/lib/pricing.js";

test("quotes 5sim USD cost as CNY price with fixed margin", () => {
  const quote = quoteCharge({ smsUsdCnyRate: 7.2, smsMarginCny: 10 }, 0.74);

  assert.equal(quote.cost, 0.74);
  assert.equal(quote.costCurrency, "USD");
  assert.equal(quote.costCny, 5.33);
  assert.equal(quote.charge, 15.33);
  assert.equal(quote.chargeCents, 1533);
  assert.equal(quote.currency, "CNY");
});

test("keeps margin non-negative and rate sane", () => {
  const quote = quoteCharge({ smsUsdCnyRate: -1, smsMarginCny: -5 }, 1);

  assert.equal(quote.rate, 7.2);
  assert.equal(quote.margin, 10);
  assert.equal(quote.charge, 17.2);
});
