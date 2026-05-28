import assert from "node:assert/strict";
import test from "node:test";
import { publicChargeQuote, quoteCharge, supplierCostAllowed } from "../src/lib/pricing.js";

test("quotes every sms order at the fixed customer price", () => {
  const quote = quoteCharge({ smsUsdCnyRate: 7.2, smsMarginCny: 19.9 }, 0.74);

  assert.equal(quote.cost, 0.74);
  assert.equal(quote.costCurrency, "USD");
  assert.equal(quote.costCny, 5.33);
  assert.equal(quote.charge, 19.9);
  assert.equal(quote.chargeCents, 1990);
  assert.equal(quote.currency, "CNY");
});

test("keeps fixed customer price and rate sane", () => {
  const quote = quoteCharge({ smsUsdCnyRate: -1, smsMarginCny: -5 }, 1);

  assert.equal(quote.rate, 7.2);
  assert.equal(quote.fixed, 19.9);
  assert.equal(quote.charge, 19.9);
});

test("supplier cost over the customer price is not sellable", () => {
  assert.equal(supplierCostAllowed({ smsUsdCnyRate: 7.2, smsMarginCny: 19.9 }, 2.76), true);
  assert.equal(supplierCostAllowed({ smsUsdCnyRate: 7.2, smsMarginCny: 19.9 }, 2.77), false);
});

test("public price quotes expose only customer-facing price", () => {
  const quote = publicChargeQuote(quoteCharge({ smsUsdCnyRate: 7.2, smsMarginCny: 19.9 }, 0.74));

  assert.deepEqual(quote, { charge: 19.9, currency: "CNY" });
  assert.equal(Object.hasOwn(quote, "cost"), false);
  assert.equal(Object.hasOwn(quote, "margin"), false);
});
