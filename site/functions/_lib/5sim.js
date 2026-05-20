import { json } from "./common.js";

const API_BASE = "https://5sim.net/v1";

export function fivesimToken(env) {
  return env.FIVESIM_API_KEY || env.FIVESIM_TOKEN || "";
}

export async function fivesim(path, token, init = {}) {
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const error = data?.error || data?.message || "5sim 返回失败。";
    return { ok: false, status: res.status, data, error };
  }
  return { ok: true, status: res.status, data };
}

export function fivesimError(result) {
  return json({ error: result.error, details: result.data }, { status: result.status || 502 });
}
