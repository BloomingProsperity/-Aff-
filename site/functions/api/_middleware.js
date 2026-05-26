const DEFAULT_API_ORIGIN = "https://api.hkai.shop";

export async function onRequest(context) {
  const origin = context.env.API_ORIGIN || DEFAULT_API_ORIGIN;
  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, origin);
  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(context.request.method.toUpperCase())) {
    init.body = context.request.body;
    init.duplex = "half";
  }

  return fetch(new Request(targetUrl, init));
}
