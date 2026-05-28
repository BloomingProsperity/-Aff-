import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const smsSource = await readFile(new URL("../static/sms.jsx", import.meta.url), "utf8");

assert.match(smsSource, /function smsPriceLabel\(/);
assert.match(smsSource, /return "缺货"/);
assert.match(smsSource, /smsPriceLabel\(currentProduct\)/);
assert.match(smsSource, /smsPriceLabel\(item\)/);

