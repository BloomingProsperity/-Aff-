import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSmsOrderEvent, sanitizeSmsEventMetadata } from "../src/lib/smsEvents.js";

test("sms order event metadata redacts secrets but keeps operational context", () => {
  const safe = sanitizeSmsEventMetadata({
    provider: "smspool",
    apiCode: 50111,
    publicCode: "no_stock",
    token: "secret-token",
    nested: { api_key: "secret-key", status: "failed" },
  });

  assert.equal(safe.provider, "smspool");
  assert.equal(safe.apiCode, 50111);
  assert.equal(safe.publicCode, "no_stock");
  assert.equal(safe.token, "[redacted]");
  assert.equal(safe.nested.api_key, "[redacted]");
  assert.equal(safe.nested.status, "failed");
});

test("sms order event rows normalize safely for admin views", () => {
  const event = normalizeSmsOrderEvent({
    id: "9",
    order_id: "12",
    user_id: "3",
    actor_user_id: "1",
    user_email: "user@example.com",
    actor_email: "admin@example.com",
    event_type: "provider.buy_failed",
    status: "failed",
    provider: "bee-sms",
    public_code: "no_stock",
    message: "no number",
    metadata_json: "{\"token\":\"secret\",\"attempt\":1}",
    created_at: "2026-05-28T00:00:00Z",
  });

  assert.equal(event.id, 9);
  assert.equal(event.orderId, 12);
  assert.equal(event.userId, 3);
  assert.equal(event.actorUserId, 1);
  assert.equal(event.userEmail, "user@example.com");
  assert.equal(event.actorEmail, "admin@example.com");
  assert.equal(event.type, "provider.buy_failed");
  assert.equal(event.provider, "bee-sms");
  assert.equal(event.metadata.token, "[redacted]");
  assert.equal(event.metadata.attempt, 1);
  assert.equal(Object.hasOwn(event, "metadata_json"), false);
});
