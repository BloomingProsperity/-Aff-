const API_BASE = "https://5sim.net/v1";

export async function fivesim(path, token, init = {}) {
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body,
  });

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
  reply.code(result.status || 502);
  return { error: result.error, details: result.data };
}
