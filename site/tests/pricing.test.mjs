import assert from "node:assert/strict";
import { quoteCharge } from "../../server/src/lib/pricing.js";

const defaultQuote = quoteCharge({}, 0.74);
assert.equal(defaultQuote.cost, 0.74);
assert.equal(defaultQuote.costCurrency, "USD");
assert.equal(defaultQuote.costCny, 5.33);
assert.equal(defaultQuote.charge, 19.9);
assert.equal(defaultQuote.chargeCents, 1990);
assert.equal(defaultQuote.currency, "CNY");

const liveRateQuote = quoteCharge({ smsUsdCnyRate: "6.8", smsMarginCny: "10" }, 3.99);
assert.equal(liveRateQuote.costCny, 27.14);
assert.equal(liveRateQuote.charge, 19.9);
assert.equal(liveRateQuote.chargeCents, 1990);

const customMarginQuote = quoteCharge({ smsUsdCnyRate: "7.25", smsMarginCny: "12" }, 0.15);
assert.equal(customMarginQuote.costCny, 1.09);
assert.equal(customMarginQuote.charge, 19.9);

console.log("pricing tests passed");
