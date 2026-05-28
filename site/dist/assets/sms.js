(() => {
const { useState } = React;
const { DetailHeader } = window;
const SMS_DEFAULT_OPERATORS = [{
  code: "any",
  name: "任意运营商"
}];
const SMS_COUNTRY_FALLBACK = [{
  code: "usa",
  name: "美国",
  dial: "+1"
}, {
  code: "england",
  name: "英国",
  dial: "+44"
}, {
  code: "france",
  name: "法国",
  dial: "+33"
}, {
  code: "germany",
  name: "德国",
  dial: "+49"
}, {
  code: "netherlands",
  name: "荷兰",
  dial: "+31"
}, {
  code: "canada",
  name: "加拿大",
  dial: "+1"
}, {
  code: "australia",
  name: "澳大利亚",
  dial: "+61"
}, {
  code: "japan",
  name: "日本",
  dial: "+81"
}, {
  code: "thailand",
  name: "泰国",
  dial: "+66"
}, {
  code: "philippines",
  name: "菲律宾",
  dial: "+63"
}, {
  code: "malaysia",
  name: "马来西亚",
  dial: "+60"
}, {
  code: "indonesia",
  name: "印度尼西亚",
  dial: "+62"
}].map(item => ({
  ...item,
  operators: SMS_DEFAULT_OPERATORS
}));
const SMS_PRODUCT_FALLBACK = ["telegram", "whatsapp", "google", "microsoft", "apple", "facebook", "instagram", "twitter", "discord", "tiktok", "amazon", "paypal", "steam", "uber", "openai", "wechat"];
const SMS_PRODUCT_LABELS = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  google: "Google",
  microsoft: "Microsoft",
  apple: "Apple",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  discord: "Discord",
  tiktok: "TikTok",
  amazon: "Amazon",
  paypal: "PayPal",
  steam: "Steam",
  uber: "Uber",
  openai: "OpenAI",
  wechat: "WeChat"
};
const SMS_PRODUCT_PRIORITY = new Map(SMS_PRODUCT_FALLBACK.map((code, index) => [code, index]));
const SMS_COUNTRY_META_KEYS = new Set(["iso", "prefix", "text_en", "text_ru", "text_zh", "name", "virtual"]);
const SMS_OPERATOR_LABELS = {
  any: "任意运营商",
  virtual: "虚拟运营商",
  ee: "EE",
  o2: "O2",
  vodafone: "Vodafone",
  tmobile: "T-Mobile",
  verizon: "Verizon",
  att: "AT&T",
  orange: "Orange",
  bouygues: "Bouygues",
  free: "Free"
};
function money(value) {
  return Number(value || 0).toFixed(2);
}
function yuan(value) {
  return `${money(value)} 元`;
}
function productLabel(code) {
  return SMS_PRODUCT_LABELS[code] || code.replace(/[-_]/g, " ").replace(/\b\w/g, x => x.toUpperCase());
}
function operatorLabel(code) {
  const value = String(code || "any");
  return SMS_OPERATOR_LABELS[value] || value.replace(/[-_]/g, " ").replace(/\b\w/g, x => x.toUpperCase());
}
function countryOperators(info) {
  const rows = Object.entries(info || {}).filter(([key, value]) => !SMS_COUNTRY_META_KEYS.has(key) && value && typeof value === "object").map(([code]) => ({
    code,
    name: operatorLabel(code)
  }));
  const hasAny = rows.some(item => item.code === "any");
  return hasAny ? rows : [...SMS_DEFAULT_OPERATORS, ...rows];
}
function smsApiBase() {
  return String(window.HKAI_SMS_API_BASE || window.localStorage?.getItem("HKAI_SMS_API_BASE") || "").replace(/\/+$/, "");
}
function smsApiUrl(path) {
  return `${smsApiBase()}${path}`;
}
function SmsPriceBox({
  currentProduct
}) {
  return React.createElement("div", {
    className: "sms-price-box sms-price-box--single"
  }, React.createElement("div", null, React.createElement("span", null, "\u4EF7\u683C"), React.createElement("strong", null, currentProduct ? yuan(currentProduct.charge) : "-")));
}
function SmsAnnouncements({
  announcements
}) {
  const items = Array.isArray(announcements) ? announcements.slice(0, 3) : [];
  if (!items.length) return null;
  return React.createElement("section", {
    className: "k-section sms-announcements"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "sms-panel sms-announcements-card"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u7CFB\u7EDF\u516C\u544A"), React.createElement("span", {
    className: "ca-meta"
  }, "\u6700\u65B0\u901A\u77E5")), React.createElement("div", {
    className: "sms-announcements-list"
  }, items.map(item => React.createElement("div", {
    className: "sms-announcement-item",
    key: item.id || `${item.title}-${item.priority}`
  }, React.createElement("div", null, React.createElement("strong", null, item.title), React.createElement("p", null, item.body)), item.linkUrl && React.createElement("a", {
    className: "ca-button ca-button--outline",
    href: item.linkUrl
  }, item.linkLabel || "查看")))))));
}
function SmsServiceBoard({
  products,
  product,
  setProduct,
  serviceQuery,
  setServiceQuery
}) {
  const visibleProducts = products.filter(item => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return true;
    return item.code.toLowerCase().includes(q) || productLabel(item.code).toLowerCase().includes(q);
  }).slice(0, 96);
  return React.createElement("div", {
    className: "sms-service-board"
  }, React.createElement("div", {
    className: "sms-service-head"
  }, React.createElement("div", null, React.createElement("h3", null, "\u53EF\u63A5\u8F6F\u4EF6"), React.createElement("span", null, "\u5F53\u524D\u53EF\u9009 ", products.length, " \u4E2A\u670D\u52A1")), React.createElement("input", {
    value: serviceQuery,
    onChange: e => setServiceQuery(e.target.value),
    placeholder: "\u641C\u7D22\u8F6F\u4EF6\u540D"
  })), React.createElement("div", {
    className: "sms-service-grid"
  }, visibleProducts.length ? visibleProducts.map(item => React.createElement("button", {
    key: item.code,
    className: `sms-service-card ${item.code === product ? "is-active" : ""}`,
    onClick: () => setProduct(item.code),
    type: "button"
  }, React.createElement("strong", null, productLabel(item.code)), React.createElement("span", null, item.code), React.createElement("em", null, "\u5E93\u5B58 ", item.count ?? "-", " \xB7 ", yuan(item.charge)))) : React.createElement("div", {
    className: "sms-service-empty"
  }, "\u5F53\u524D\u7B5B\u9009\u6CA1\u6709\u670D\u52A1\u3002")));
}
function SmsServicePanel({
  products,
  product,
  setProduct,
  serviceQuery,
  setServiceQuery
}) {
  const filtered = products.filter(item => {
    const q = serviceQuery.trim().toLowerCase();
    return !q || item.code.toLowerCase().includes(q) || productLabel(item.code).toLowerCase().includes(q);
  });
  return React.createElement("div", {
    className: "sms-tp sms-tp--service"
  }, React.createElement("div", {
    className: "sms-tp-head"
  }, React.createElement("h3", null, "\u9009\u62E9\u670D\u52A1"), React.createElement("input", {
    value: serviceQuery,
    onChange: e => setServiceQuery(e.target.value),
    placeholder: "\u641C\u7D22\u670D\u52A1...",
    className: "sms-tp-search"
  })), React.createElement("div", {
    className: "sms-tp-list"
  }, filtered.map(item => React.createElement("button", {
    key: item.code,
    type: "button",
    className: `sms-tp-row ${item.code === product ? 'is-active' : ''}`,
    onClick: () => setProduct(item.code)
  }, React.createElement("span", {
    className: "sms-tp-name"
  }, productLabel(item.code)), React.createElement("span", {
    className: "sms-tp-meta"
  }, "\u5E93\u5B58 ", item.count ?? '—'), React.createElement("span", {
    className: "sms-tp-price"
  }, yuan(item.charge)))), !filtered.length && React.createElement("div", {
    className: "sms-tp-empty"
  }, "\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1")));
}
function SmsOperatorPanel({
  operators,
  operator,
  setOperator
}) {
  const list = operators?.length ? operators : SMS_DEFAULT_OPERATORS;
  return React.createElement("div", {
    className: "sms-tp sms-tp--operator"
  }, React.createElement("div", {
    className: "sms-tp-head"
  }, React.createElement("h3", null, "\u9009\u62E9\u8FD0\u8425\u5546")), React.createElement("div", {
    className: "sms-tp-list"
  }, list.map(item => React.createElement("button", {
    key: item.code,
    type: "button",
    className: `sms-tp-row ${item.code === operator ? 'is-active' : ''}`,
    onClick: () => setOperator(item.code)
  }, React.createElement("span", {
    className: "sms-tp-name"
  }, item.name || operatorLabel(item.code)), React.createElement("span", {
    className: "sms-tp-meta"
  }, item.code)))));
}
function SmsCountryPanel({
  countries,
  country,
  setCountry
}) {
  const [q, setQ] = React.useState('');
  const query = q.trim().toLowerCase();
  const filtered = countries.filter(c => !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query) || String(c.dial || "").includes(query));
  return React.createElement("div", {
    className: "sms-tp"
  }, React.createElement("div", {
    className: "sms-tp-head"
  }, React.createElement("h3", null, "\u9009\u62E9\u56FD\u5BB6"), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u641C\u7D22\u56FD\u5BB6...",
    className: "sms-tp-search"
  })), React.createElement("div", {
    className: "sms-tp-list"
  }, filtered.map(c => React.createElement("button", {
    key: c.code,
    type: "button",
    className: `sms-tp-row ${c.code === country ? 'is-active' : ''}`,
    onClick: () => setCountry(c.code)
  }, React.createElement("span", {
    className: "sms-tp-name"
  }, c.name), React.createElement("span", {
    className: "sms-tp-meta"
  }, c.dial)))));
}
function turnstileHint(status, hasToken, actionText = "提交") {
  if (hasToken) return "";
  if (status === "error") return "验证没有通过，请重新验证。";
  if (status === "expired") return "验证已过期，请重新验证。";
  if (status === "timeout") return "验证时间过长，请重新验证。";
  if (status === "unsupported") return "当前浏览器不支持验证，请换个浏览器。";
  if (status === "script-error") return "验证加载失败，请刷新页面或关闭拦截插件。";
  return `人机验证通过后可${actionText}。`;
}
function shouldShowTurnstileRetry(status) {
  return ["error", "expired", "timeout", "unsupported", "script-error"].includes(status);
}
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let turnstileLoadPromise = null;
function ensureTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoadPromise) return turnstileLoadPromise;
  turnstileLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hkai-turnstile="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), {
        once: true
      });
      existing.addEventListener("error", () => reject(new Error("turnstile-load-failed")), {
        once: true
      });
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.hkaiTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile-load-failed"));
    document.head.appendChild(script);
  });
  return turnstileLoadPromise;
}
function SmsOrderPanel({
  user,
  product,
  country,
  operator,
  countries,
  currentProduct,
  busy,
  onBuy,
  onLoadOrders,
  message
}) {
  const countryLabel = countries.find(x => x.code === country);
  const productAvailable = Boolean(currentProduct && Number(currentProduct.charge || 0) > 0 && Number(currentProduct.count || 0) > 0);
  return React.createElement("div", {
    className: "sms-tp sms-tp--order"
  }, React.createElement("div", {
    className: "sms-tp-head"
  }, React.createElement("h3", null, user ? '下单' : '登录购买')), React.createElement("div", {
    className: "sms-order-summary"
  }, React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u670D\u52A1"), React.createElement("strong", null, productLabel(product))), React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u56FD\u5BB6"), React.createElement("strong", null, countryLabel?.name || country)), React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u8FD0\u8425\u5546"), React.createElement("strong", null, operatorLabel(operator))), React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u5E93\u5B58"), React.createElement("strong", null, currentProduct ? currentProduct.count ?? "—" : "—")), React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u4EF7\u683C"), React.createElement("strong", null, currentProduct ? yuan(currentProduct.charge) : '—')), user && React.createElement("div", {
    className: "sms-order-row"
  }, React.createElement("span", null, "\u4F59\u989D"), React.createElement("strong", null, yuan(user.balance)))), user ? React.createElement("div", {
    className: "sms-tp-actions"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg sms-buy-btn",
    onClick: onBuy,
    disabled: busy || !productAvailable || Number(user.balance || 0) <= 0
  }, busy ? '处理中…' : productAvailable ? '购买号码' : '当前不可买'), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: onLoadOrders,
    disabled: busy
  }, "\u5237\u65B0\u8BA2\u5355"), message && React.createElement("p", {
    className: "sms-message"
  }, message)) : React.createElement("div", {
    className: "sms-tp-actions"
  }, React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg sms-buy-btn",
    href: "/login?next=/sms"
  }, "\u767B\u5F55\u4E0B\u5355"), React.createElement("a", {
    className: "ca-button ca-button--outline ca-button--lg",
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "TG \u6E38\u5BA2\u8D2D\u4E70")));
}
function TurnstileBox({
  siteKey,
  onToken,
  resetKey,
  onStatus
}) {
  const boxRef = React.useRef(null);
  const widgetRef = React.useRef(null);
  const pendingTimerRef = React.useRef(null);
  const tokenReadyRef = React.useRef(false);
  const clearPendingTimer = () => {
    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  };
  const armPendingTimer = () => {
    clearPendingTimer();
    pendingTimerRef.current = window.setTimeout(() => {
      if (!tokenReadyRef.current) onStatus?.("timeout");
    }, 18000);
  };
  React.useEffect(() => {
    if (!siteKey || !boxRef.current) return undefined;
    let cancelled = false;
    tokenReadyRef.current = false;
    onStatus?.("loading");
    const render = () => {
      if (cancelled || widgetRef.current || !window.turnstile || !boxRef.current) return;
      widgetRef.current = window.turnstile.render(boxRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "normal",
        appearance: "always",
        language: "zh-cn",
        retry: "never",
        "refresh-expired": "auto",
        "refresh-timeout": "manual",
        callback: token => {
          const value = String(token || "").trim();
          if (!value) {
            tokenReadyRef.current = false;
            clearPendingTimer();
            onToken("");
            onStatus?.("error");
            return;
          }
          tokenReadyRef.current = true;
          clearPendingTimer();
          onToken(value);
          onStatus?.("ready");
        },
        "expired-callback": () => {
          tokenReadyRef.current = false;
          clearPendingTimer();
          onToken("");
          onStatus?.("expired");
        },
        "timeout-callback": () => {
          tokenReadyRef.current = false;
          clearPendingTimer();
          onToken("");
          onStatus?.("timeout");
        },
        "error-callback": () => {
          tokenReadyRef.current = false;
          clearPendingTimer();
          onToken("");
          onStatus?.("error");
          return true;
        },
        "unsupported-callback": () => {
          tokenReadyRef.current = false;
          clearPendingTimer();
          onToken("");
          onStatus?.("unsupported");
        }
      });
      onStatus?.("rendered");
      armPendingTimer();
    };
    ensureTurnstileScript().then(render).catch(() => {
      if (!cancelled) onStatus?.("script-error");
    });
    const timer = window.setInterval(render, 250);
    const failTimer = window.setTimeout(() => {
      if (!cancelled && !widgetRef.current) onStatus?.("script-error");
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(failTimer);
      clearPendingTimer();
      if (widgetRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {}
      }
      widgetRef.current = null;
    };
  }, [siteKey]);
  React.useEffect(() => {
    if (!widgetRef.current || !window.turnstile?.reset) return;
    onToken("");
    tokenReadyRef.current = false;
    onStatus?.("loading");
    try {
      window.turnstile.reset(widgetRef.current);
    } catch {}
    armPendingTimer();
  }, [resetKey]);
  if (!siteKey) return null;
  return React.createElement("div", {
    className: "sms-turnstile",
    ref: boxRef
  });
}
function SmsDesk() {
  const [user, setUser] = useState(null);
  const [countries, setCountries] = useState(SMS_COUNTRY_FALLBACK);
  const [products, setProducts] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [country, setCountry] = useState("usa");
  const [operator, setOperator] = useState("any");
  const [product, setProduct] = useState("telegram");
  const [serviceQuery, setServiceQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [referral, setReferral] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("注册或登录后开始接码。");
  const api = async (path, options = {}) => {
    const res = await fetch(smsApiUrl(path), {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? {
          "content-type": "application/json"
        } : {}),
        ...(options.headers || {})
      }
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) throw new Error(data.error || text.slice(0, 80) || `请求失败（${res.status}）。`);
    return data;
  };
  const refreshMe = async () => {
    const data = await api("/api/auth/me");
    setUser(data.user || null);
    return data.user || null;
  };
  const loadOrders = async () => {
    if (!user) return;
    const data = await api("/api/sms/orders");
    setOrders(data.orders || []);
  };
  const loadReferral = async () => {
    if (!user) return;
    const data = await api("/api/referrals/me");
    setReferral(data);
  };
  const loadAdminUsers = async () => {
    if (user?.role !== "admin") return;
    const data = await api("/api/admin/users");
    setAdminUsers(data.users || []);
    if (!creditUserId && data.users?.[0]) setCreditUserId(String(data.users[0].id));
  };
  React.useEffect(() => {
    refreshMe().then(found => {
      if (found) setMessage("已登录，可以下单。");
    }).catch(() => {});
    api("/api/sms/countries").then(data => {
      const list = Object.entries(data || {}).map(([code, info]) => ({
        code,
        name: info?.text_en || info?.name || code,
        dial: info?.prefix && typeof info.prefix === "object" ? Object.keys(info.prefix)[0] : info?.prefix ? `+${String(info.prefix).replace(/^\+/, "")}` : "",
        operators: countryOperators(info)
      })).sort((a, b) => a.name.localeCompare(b.name));
      if (list.length) setCountries(list);
    }).catch(() => {});
    api("/api/announcements").then(data => setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : [])).catch(() => setAnnouncements([]));
  }, []);
  React.useEffect(() => {
    const selected = countries.find(x => x.code === country);
    const list = selected?.operators?.length ? selected.operators : SMS_DEFAULT_OPERATORS;
    if (!list.some(item => item.code === operator)) setOperator(list[0]?.code || "any");
  }, [country, countries, operator]);
  React.useEffect(() => {
    setSelectedQuote(null);
    api(`/api/sms/products?country=${encodeURIComponent(country)}&operator=${encodeURIComponent(operator)}`).then(data => {
      const list = Object.entries(data || {}).map(([code, info]) => ({
        code,
        count: info?.count ?? info?.Qty ?? info?.qty,
        charge: info?.charge,
        currency: info?.currency
      })).filter(x => x.code).sort((a, b) => {
        const pa = SMS_PRODUCT_PRIORITY.has(a.code) ? SMS_PRODUCT_PRIORITY.get(a.code) : 9999;
        const pb = SMS_PRODUCT_PRIORITY.has(b.code) ? SMS_PRODUCT_PRIORITY.get(b.code) : 9999;
        if (pa !== pb) return pa - pb;
        return a.code.localeCompare(b.code);
      });
      setProducts(list);
      if (list.length && !list.some(x => x.code === product)) setProduct(list[0].code);
    }).catch(() => setProducts([]));
  }, [country, operator]);
  React.useEffect(() => {
    if (!product) {
      setSelectedQuote(null);
      return undefined;
    }
    let cancelled = false;
    setSelectedQuote(null);
    api(`/api/sms/quote?country=${encodeURIComponent(country)}&operator=${encodeURIComponent(operator)}&product=${encodeURIComponent(product)}`).then(data => {
      if (cancelled) return;
      const quote = {
        code: product,
        available: Boolean(data?.available),
        count: data?.count ?? 0,
        charge: data?.charge ?? 0,
        currency: data?.currency || "CNY"
      };
      setSelectedQuote(quote);
      setProducts(prev => prev.map(item => item.code === product ? {
        ...item,
        count: quote.count,
        charge: quote.charge,
        currency: quote.currency,
        available: quote.available
      } : item));
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [country, operator, product]);
  React.useEffect(() => {
    if (!user) return;
    loadOrders().catch(() => {});
    loadReferral().catch(() => {});
    loadAdminUsers().catch(() => {});
  }, [user?.id, user?.role]);
  const logout = async () => {
    setBusy(true);
    try {
      await api("/api/auth/logout", {
        method: "POST"
      });
      setUser(null);
      setOrder(null);
      setOrders([]);
      setAdminUsers([]);
      setMessage("已退出。");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const buyNumber = async () => {
    setBusy(true);
    try {
      const data = await api("/api/sms/buy", {
        method: "POST",
        body: JSON.stringify({
          country,
          operator,
          product
        })
      });
      setOrder(data.order);
      setUser(prev => prev ? {
        ...prev,
        balance: data.balance
      } : prev);
      setMessage("号码已生成，等待验证码。");
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const redeemVoucher = async () => {
    if (!voucherCode.trim()) {
      setMessage("请输入兑换码。");
      return;
    }
    setBusy(true);
    try {
      const data = await api("/api/vouchers/redeem", {
        method: "POST",
        body: JSON.stringify({
          code: voucherCode
        })
      });
      setUser(prev => prev ? {
        ...prev,
        balance: data.balance
      } : prev);
      setVoucherCode("");
      setMessage(`兑换成功，余额增加 ${yuan(data.amount)}。`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const copyReferral = async () => {
    if (!referral?.referralLink) return;
    await navigator.clipboard.writeText(referral.referralLink);
    setMessage("邀请链接已复制。");
  };
  const checkOrder = async (target = order) => {
    if (!target?.id) return;
    setBusy(true);
    try {
      const data = await api(`/api/sms/check/${target.id}`);
      setOrder(data.order);
      setOrders(prev => prev.map(x => x.id === data.order.id ? data.order : x));
      if (typeof data.balance === "number") setUser(prev => prev ? {
        ...prev,
        balance: data.balance
      } : prev);
      setMessage(data.order.refundedAt ? `订单已关闭，余额已退回 ${yuan(data.order.refund)}。` : (data.order.sms || []).length ? "已收到验证码。" : "暂未收到验证码，可以稍后刷新。");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const setOrderState = async action => {
    if (!order?.id) return;
    setBusy(true);
    try {
      const data = await api(`/api/sms/${action}`, {
        method: "POST",
        body: JSON.stringify({
          id: order.id
        })
      });
      setOrder(data.order);
      setOrders(prev => prev.map(x => x.id === data.order.id ? data.order : x));
      if (typeof data.balance === "number") setUser(prev => prev ? {
        ...prev,
        balance: data.balance
      } : prev);
      const refundText = data.order.refundedAt ? `，余额已退回 ${yuan(data.order.refund)}` : "";
      setMessage(action === "finish" ? "订单已完成。" : action === "cancel" ? `订单已取消${refundText}。` : `号码已拉黑${refundText}。`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const addCredit = async () => {
    setBusy(true);
    try {
      const data = await api("/api/admin/credit", {
        method: "POST",
        body: JSON.stringify({
          userId: creditUserId,
          amount: creditAmount,
          note: creditNote
        })
      });
      setAdminUsers(prev => prev.map(x => x.id === data.user.id ? data.user : x));
      if (user?.id === data.user.id) setUser(data.user);
      setCreditAmount("");
      setCreditNote("");
      setMessage(`已给 ${data.user.email} 调整 ${yuan(data.amount)}。`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const copyNumber = async () => {
    const value = order?.phone || order?.number;
    if (!value) return;
    await navigator.clipboard.writeText(String(value));
    setMessage("号码已复制。");
  };
  const listedProduct = products.find(x => x.code === product);
  const currentProduct = selectedQuote?.code === product ? {
    ...(listedProduct || {
      code: product
    }),
    ...selectedQuote
  } : listedProduct;
  const countryLabel = countries.find(x => x.code === country);
  const operators = countryLabel?.operators?.length ? countryLabel.operators : SMS_DEFAULT_OPERATORS;
  const smsList = order?.sms || [];
  const orderStatus = String(order?.status || "").toLowerCase();
  const orderClosed = Boolean(order?.refundedAt) || ["finish", "finished", "completed", "cancelled", "canceled", "ban", "banned", "failed", "expired", "timeout"].includes(orderStatus);
  const guestBuyUrl = "https://t.me/Whohaoe";
  return React.createElement("div", {
    className: "detail sms-page"
  }, React.createElement(DetailHeader, {
    back: "/",
    backLabel: "\u9996\u9875"
  }), React.createElement("section", {
    className: "sms-hero"
  }, React.createElement("div", {
    className: "wrap sms-hero-inner"
  }, React.createElement("div", null, React.createElement("div", {
    className: "ca-kicker"
  }, "\u63A5\u7801"), React.createElement("h1", {
    className: "d-h1"
  }, "\u77ED\u4FE1\u9A8C\u8BC1\u7801\u7CFB\u7EDF"), React.createElement("p", {
    className: "d-lead"
  }, "\u7528\u6237\u6CE8\u518C\u540E\u9700\u8981\u5145\u503C\u4F59\u989D\u3002\u7BA1\u7406\u5458\u624B\u52A8\u52A0\u4F59\u989D\uFF0C\u7528\u6237\u7528\u4F59\u989D\u8D2D\u4E70\u53F7\u7801\u5E76\u67E5\u8BE2\u81EA\u5DF1\u7684\u9A8C\u8BC1\u7801\u8BA2\u5355\u3002")), React.createElement("div", {
    className: "sms-balance"
  }, React.createElement("span", null, user ? user.email : "未登录"), React.createElement("strong", null, user ? yuan(user.balance) : "—"), user && React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: logout,
    disabled: busy
  }, "\u9000\u51FA\u767B\u5F55")))), React.createElement(SmsAnnouncements, {
    announcements: announcements
  }), React.createElement("section", {
    className: "k-section sms-three-section"
  }, React.createElement("div", {
    className: "wrap sms-three-grid"
  }, React.createElement(SmsCountryPanel, {
    countries: countries,
    country: country,
    setCountry: setCountry
  }), React.createElement(SmsOperatorPanel, {
    operators: operators,
    operator: operator,
    setOperator: setOperator
  }), React.createElement(SmsServicePanel, {
    products: products,
    product: product,
    setProduct: setProduct,
    serviceQuery: serviceQuery,
    setServiceQuery: setServiceQuery
  }), React.createElement(SmsOrderPanel, {
    user: user,
    product: product,
    country: country,
    operator: operator,
    countries: countries,
    currentProduct: currentProduct,
    busy: busy,
    onBuy: buyNumber,
    onLoadOrders: loadOrders,
    message: message
  }))), user && React.createElement(React.Fragment, null, React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap sms-summary-grid"
  }, React.createElement("div", {
    className: "sms-summary-card"
  }, React.createElement("span", null, "\u8D26\u6237\u4F59\u989D"), React.createElement("strong", null, yuan(user.balance)), React.createElement("em", null, user.email)), React.createElement("div", {
    className: "sms-summary-card"
  }, React.createElement("span", null, "\u5F53\u524D\u9009\u62E9"), React.createElement("strong", null, productLabel(product)), React.createElement("em", null, countryLabel?.name || country)), React.createElement("div", {
    className: "sms-summary-card"
  }, React.createElement("span", null, "\u8BA2\u5355\u8BB0\u5F55"), React.createElement("strong", null, orders.length, " \u5355"), React.createElement("em", null, "\u53EA\u663E\u793A\u5F53\u524D\u7528\u6237\u81EA\u5DF1\u7684\u8BA2\u5355")))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap sms-account-grid"
  }, React.createElement("div", {
    className: "sms-panel sms-panel--compact"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u4F59\u989D\u5145\u503C"), React.createElement("span", {
    className: "ca-meta"
  }, "\u5151\u6362\u7801\u5145\u503C")), React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u5151\u6362\u7801"), React.createElement("input", {
    value: voucherCode,
    onChange: e => setVoucherCode(e.target.value),
    placeholder: "\u8F93\u5165\u5145\u503C\u5151\u6362\u7801"
  })), React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg sms-buy-btn",
    onClick: redeemVoucher,
    disabled: busy || !voucherCode.trim()
  }, "\u7ACB\u5373\u5151\u6362")), React.createElement("div", {
    className: "sms-panel sms-panel--compact"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u9080\u8BF7\u597D\u53CB"), React.createElement("span", {
    className: "ca-meta"
  }, "\u9996\u5355\u8FD4\u4F63 10%")), React.createElement("div", {
    className: "sms-referral-stats"
  }, React.createElement("div", null, React.createElement("span", null, "\u9080\u8BF7\u7801"), React.createElement("strong", null, referral?.referralCode || user.referralCode || "—")), React.createElement("div", null, React.createElement("span", null, "\u5DF2\u9080\u8BF7"), React.createElement("strong", null, referral ? `${referral.invitedCount} 人` : "—")), React.createElement("div", null, React.createElement("span", null, "\u5956\u52B1\u4F59\u989D"), React.createElement("strong", null, referral ? yuan(referral.rewardTotal) : "—"))), React.createElement("div", {
    className: "sms-referral-link"
  }, React.createElement("span", null, referral?.referralLink || "加载中…"), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: copyReferral,
    disabled: !referral?.referralLink
  }, "\u590D\u5236\u94FE\u63A5"))))), order && React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "sms-panel"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u5F53\u524D\u53F7\u7801"), React.createElement("span", {
    className: "ca-meta"
  }, order?.status || "未下单")), React.createElement("div", {
    className: "sms-number"
  }, React.createElement("span", null, order.country || country, " \xB7 ", order.product || product, " \xB7 ", yuan(order.price)), React.createElement("strong", null, order.phone || order.number || "-"), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: copyNumber
  }, "\u590D\u5236\u53F7\u7801")), order.refundedAt && React.createElement("div", {
    className: "sms-refund-note"
  }, React.createElement("span", null, "\u5DF2\u9000\u56DE\u4F59\u989D"), React.createElement("strong", null, yuan(order.refund))), React.createElement("div", {
    className: "sms-code-list"
  }, React.createElement("h3", null, "\u9A8C\u8BC1\u7801"), smsList.length ? smsList.map((sms, i) => React.createElement("div", {
    className: "sms-code",
    key: sms.id || i
  }, React.createElement("strong", null, sms.code || sms.text || sms.sender || "已收到"), React.createElement("span", null, sms.text || sms.date || ""))) : React.createElement("p", null, "\u8FD8\u6CA1\u6709\u6536\u5230\u77ED\u4FE1\u3002")), React.createElement("div", {
    className: "sms-actions sms-actions--tight"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary",
    onClick: () => checkOrder(),
    disabled: busy || orderClosed
  }, "\u5237\u65B0\u9A8C\u8BC1\u7801"), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: () => setOrderState("finish"),
    disabled: busy || orderClosed
  }, "\u5B8C\u6210\u8BA2\u5355"), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: () => setOrderState("cancel"),
    disabled: busy || orderClosed
  }, "\u53D6\u6D88\u8BA2\u5355"), React.createElement("button", {
    className: "ca-button ca-button--outline",
    onClick: () => setOrderState("ban"),
    disabled: busy || orderClosed
  }, "\u62C9\u9ED1\u53F7\u7801"))))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "sms-panel"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u6211\u7684\u8BA2\u5355"), React.createElement("span", {
    className: "ca-meta"
  }, orders.length ? `${orders.length} 条` : "空")), React.createElement("div", {
    className: "sms-history"
  }, orders.length ? orders.map(item => React.createElement("button", {
    key: item.id,
    className: "sms-history-row",
    onClick: () => setOrder(item)
  }, React.createElement("span", null, "#", item.id), React.createElement("strong", null, item.phone || item.product || "-"), React.createElement("em", null, item.status || "-"))) : React.createElement("p", null, "\u8FD8\u6CA1\u6709\u8BA2\u5355\u3002"))))), user.role === "admin" && React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "sms-panel"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u7528\u6237\u4F59\u989D"), React.createElement("span", {
    className: "ca-meta"
  }, "\u7BA1\u7406\u5458\u624B\u52A8\u5145\u503C")), React.createElement("div", {
    className: "sms-admin-grid"
  }, React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u7528\u6237"), React.createElement("select", {
    value: creditUserId,
    onChange: e => setCreditUserId(e.target.value)
  }, adminUsers.map(x => React.createElement("option", {
    key: x.id,
    value: x.id
  }, x.email, " \xB7 ", money(x.balance))))), React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u52A0\u51CF\u91D1\u989D"), React.createElement("input", {
    value: creditAmount,
    onChange: e => setCreditAmount(e.target.value),
    placeholder: "\u4F8B\u5982 100 \u6216 -20"
  })), React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u5145\u503C\u8BB0\u5F55"), React.createElement("input", {
    value: creditNote,
    onChange: e => setCreditNote(e.target.value),
    placeholder: "\u652F\u4ED8\u5B9D\u6216\u5FAE\u4FE1\u8F6C\u8D26\u8BB0\u5F55"
  })), React.createElement("div", {
    className: "sms-admin-action"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg",
    onClick: addCredit,
    disabled: busy || !creditUserId || !creditAmount
  }, "\u786E\u8BA4\u8C03\u6574"))), React.createElement("div", {
    className: "sms-user-list"
  }, adminUsers.map(x => React.createElement("div", {
    className: "sms-user-row",
    key: x.id
  }, React.createElement("span", null, x.id), React.createElement("strong", null, x.email), React.createElement("em", null, x.role), React.createElement("b", null, money(x.balance))))))))));
}
function LoginDesk() {
  const initialRefCode = new URLSearchParams(window.location.search).get("ref") || "";
  const [authMode, setAuthMode] = useState(initialRefCode ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState(initialRefCode);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState("idle");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const nextPath = new URLSearchParams(window.location.search).get("next") || "/sms";
  const api = async (path, options = {}) => {
    const res = await fetch(smsApiUrl(path), {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? {
          "content-type": "application/json"
        } : {}),
        ...(options.headers || {})
      }
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) throw new Error(data.error || text.slice(0, 80) || `请求失败（${res.status}）。`);
    return data;
  };
  React.useEffect(() => {
    api("/api/config").then(d => setTurnstileSiteKey(d.turnstileEnabled ? d.turnstileSiteKey : "")).catch(() => {});
    api("/api/auth/me").then(d => {
      if (d.user) {
        window.history.replaceState({}, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }).catch(() => {});
  }, []);
  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileStatus("loading");
    setTurnstileResetKey(v => v + 1);
  };
  const submit = async () => {
    if (turnstileSiteKey && !turnstileToken) {
      setMessage("请先等人机验证完成。");
      return;
    }
    setBusy(true);
    try {
      const data = await api(`/api/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          ref: authMode === "register" ? refCode : "",
          turnstileToken
        })
      });
      if (data.user) {
        window.history.replaceState({}, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      resetTurnstile();
      setBusy(false);
    }
  };
  const needTurnstile = Boolean(turnstileSiteKey && !turnstileToken);
  const hint = turnstileHint(turnstileStatus, Boolean(turnstileToken));
  return React.createElement("div", {
    className: "detail login-page"
  }, React.createElement(DetailHeader, {
    back: "/",
    backLabel: "\u9996\u9875"
  }), React.createElement("section", {
    className: "login-hero"
  }, React.createElement("div", {
    className: "wrap login-wrap"
  }, React.createElement("div", {
    className: "login-card"
  }, React.createElement("div", {
    className: "login-card-head"
  }, React.createElement("h1", null, authMode === "login" ? "登录" : "注册"), React.createElement("span", {
    className: "ca-meta"
  }, "\u63A5\u7801\u7CFB\u7EDF\u8D26\u6237")), React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u90AE\u7BB1"), React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "QQ / 163 / Gmail \u90AE\u7BB1",
    autoFocus: true
  })), React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u5BC6\u7801"), React.createElement("div", {
    className: "sms-password-wrap"
  }, React.createElement("input", {
    type: showPassword ? "text" : "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    maxLength: 128,
    placeholder: "\u81F3\u5C11 8 \u4F4D",
    onKeyDown: e => e.key === "Enter" && !busy && submit()
  }), React.createElement("button", {
    type: "button",
    className: "sms-password-toggle",
    "aria-label": showPassword ? "隐藏密码" : "显示密码",
    onClick: () => setShowPassword(v => !v)
  }, showPassword ? "隐藏" : "查看"))), authMode === "register" && refCode && React.createElement("label", {
    className: "sms-field"
  }, React.createElement("span", null, "\u9080\u8BF7\u7801"), React.createElement("input", {
    value: refCode,
    onChange: e => setRefCode(e.target.value),
    placeholder: "\u9080\u8BF7\u7801"
  })), React.createElement(TurnstileBox, {
    siteKey: turnstileSiteKey,
    onToken: setTurnstileToken,
    resetKey: turnstileResetKey,
    onStatus: setTurnstileStatus
  }), needTurnstile && React.createElement("div", {
    className: "sms-turnstile-help"
  }, React.createElement("p", {
    className: "sms-turnstile-hint"
  }, hint), shouldShowTurnstileRetry(turnstileStatus) && React.createElement("button", {
    type: "button",
    className: "sms-turnstile-retry",
    onClick: resetTurnstile
  }, "\u91CD\u65B0\u9A8C\u8BC1")), React.createElement("div", {
    className: "sms-actions"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg",
    onClick: submit,
    disabled: busy || needTurnstile
  }, authMode === "login" ? "登录" : "注册"), React.createElement("button", {
    className: "ca-button ca-button--outline ca-button--lg",
    onClick: () => {
      setAuthMode(authMode === "login" ? "register" : "login");
      setMessage("");
    },
    disabled: busy
  }, authMode === "login" ? "我要注册" : "已有账户")), message && React.createElement("p", {
    className: "sms-message"
  }, message)))));
}
Object.assign(window, {
  SmsDesk,
  LoginDesk
});
})();
