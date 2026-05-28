import assert from "node:assert/strict";
import test from "node:test";
import { fivesim, fivesimHttpError } from "../src/lib/fivesim.js";

test("5sim http errors do not expose upstream details", () => {
  const reply = {
    statusCode: 200,
    code(value) {
      this.statusCode = value;
      return this;
    },
  };

  const body = fivesimHttpError(reply, {
    status: 400,
    error: "5sim 返回失败。",
    data: { token: "secret", debug: "raw upstream body" },
  });

  assert.equal(reply.statusCode, 502);
  assert.deepEqual(body, { error: "上游服务暂时不可用，请稍后重试。" });
  assert.equal(JSON.stringify(body).includes("5sim"), false);
  assert.equal(JSON.stringify(body).includes("secret"), false);
  assert.equal(JSON.stringify(body).includes("raw upstream body"), false);
});

test("5sim requests include an abort signal timeout", async () => {
  const originalFetch = globalThis.fetch;
  const signals = [];

  globalThis.fetch = async (url, init = {}) => {
    signals.push(init.signal);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await fivesim("/guest/products/usa/any", "");

    assert.equal(result.ok, true);
    assert.equal(signals.length, 1);
    assert.equal(signals[0] instanceof AbortSignal, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
