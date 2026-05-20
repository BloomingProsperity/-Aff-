import { json } from "../_lib/common.js";
import { turnstileEnabled, turnstileSiteKey } from "../_lib/security.js";

export function onRequestGet({ env }) {
  const siteKey = turnstileSiteKey(env);
  return json({
    turnstileSiteKey: siteKey,
    turnstileEnabled: Boolean(siteKey && turnstileEnabled(env)),
  });
}
