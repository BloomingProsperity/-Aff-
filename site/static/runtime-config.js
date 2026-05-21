window.HKAI_SMS_API_BASE = window.HKAI_SMS_API_BASE || (
  ["hkai.shop", "www.hkai.shop"].includes(window.location.hostname)
    ? "https://api.hkai.shop"
    : ""
);
