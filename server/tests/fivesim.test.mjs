import assert from "node:assert/strict";
import test from "node:test";
import { fivesimHttpError } from "../src/lib/fivesim.js";

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
