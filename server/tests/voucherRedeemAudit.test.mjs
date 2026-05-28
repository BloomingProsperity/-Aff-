import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

function activeUser() {
  return {
    id: 7,
    email: "buyer@gmail.com",
    role: "user",
    status: "active",
    balance_cents: 1000,
  };
}

function rateLimitedVoucherDb(calls) {
  return {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) return { rows: [activeUser()] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 9, reset_at: 1_800_000_600 }] };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("UPDATE balance_vouchers")) throw new Error("rate limited redeem reached voucher mutation");
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
}

test("rate-limited voucher redemption is audited before returning", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedVoucherDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/vouchers/redeem",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { code: "HKAI-TEST-8888" },
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE balance_vouchers")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 7);
    assert.equal(audit.params[2], "voucher.redeem");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});
