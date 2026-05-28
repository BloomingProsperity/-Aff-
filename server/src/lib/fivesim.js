const API_BASE = "https://5sim.net/v1";
const FIVE_SIM_TIMEOUT_MS = 15_000;

export async function fivesim(path, token, init = {}) {
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIVE_SIM_TIMEOUT_MS);
  timeout.unref?.();

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method || "GET",
      headers,
      body: init.body,
      signal: init.signal || controller.signal,
    });
  } catch {
    return {
      ok: false,
      status: 502,
      data: null,
      error: "5sim 返回失败。",
    };
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data,
      error: data?.error || data?.message || "5sim 返回失败。",
    };
  }

  return { ok: true, status: response.status, data };
}

export function fivesimHttpError(reply, result) {
  reply.code(Number(result?.status) === 429 ? 429 : 502);
  return { error: "上游服务暂时不可用，请稍后重试。" };
}
