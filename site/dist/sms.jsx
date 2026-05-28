const SMS_DEFAULT_OPERATORS = [{ code: "any", name: "任意运营商" }];

const SMS_COUNTRY_FALLBACK = [
  { code: "usa", name: "美国", dial: "+1" },
  { code: "england", name: "英国", dial: "+44" },
  { code: "france", name: "法国", dial: "+33" },
  { code: "germany", name: "德国", dial: "+49" },
  { code: "netherlands", name: "荷兰", dial: "+31" },
  { code: "canada", name: "加拿大", dial: "+1" },
  { code: "australia", name: "澳大利亚", dial: "+61" },
  { code: "japan", name: "日本", dial: "+81" },
  { code: "thailand", name: "泰国", dial: "+66" },
  { code: "philippines", name: "菲律宾", dial: "+63" },
  { code: "malaysia", name: "马来西亚", dial: "+60" },
  { code: "indonesia", name: "印度尼西亚", dial: "+62" },
].map(item => ({ ...item, operators: SMS_DEFAULT_OPERATORS }));

const SMS_PRODUCT_FALLBACK = [
  "telegram", "whatsapp", "google", "microsoft", "apple", "facebook",
  "instagram", "twitter", "discord", "tiktok", "amazon", "paypal",
  "steam", "uber", "openai", "wechat",
];

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
  wechat: "WeChat",
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
  free: "Free",
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
  const rows = Object.entries(info || {})
    .filter(([key, value]) => !SMS_COUNTRY_META_KEYS.has(key) && value && typeof value === "object")
    .map(([code]) => ({ code, name: operatorLabel(code) }));
  const hasAny = rows.some(item => item.code === "any");
  return hasAny ? rows : [...SMS_DEFAULT_OPERATORS, ...rows];
}

function smsApiBase() {
  return String(window.HKAI_SMS_API_BASE || window.localStorage?.getItem("HKAI_SMS_API_BASE") || "").replace(/\/+$/, "");
}

function smsApiUrl(path) {
  return `${smsApiBase()}${path}`;
}

function SmsPriceBox({ currentProduct }) {
  return (
    <div className="sms-price-box sms-price-box--single">
      <div>
        <span>价格</span>
        <strong>{currentProduct ? yuan(currentProduct.charge) : "-"}</strong>
      </div>
    </div>
  );
}

function SmsServiceBoard({ products, product, setProduct, serviceQuery, setServiceQuery }) {
  const visibleProducts = products
    .filter(item => {
      const q = serviceQuery.trim().toLowerCase();
      if (!q) return true;
      return item.code.toLowerCase().includes(q) || productLabel(item.code).toLowerCase().includes(q);
    })
    .slice(0, 96);

  return (
    <div className="sms-service-board">
      <div className="sms-service-head">
        <div>
          <h3>可接软件</h3>
          <span>当前可选 {products.length} 个服务</span>
        </div>
        <input value={serviceQuery} onChange={e => setServiceQuery(e.target.value)} placeholder="搜索软件名" />
      </div>
      <div className="sms-service-grid">
        {visibleProducts.length ? visibleProducts.map(item => (
          <button
            key={item.code}
            className={`sms-service-card ${item.code === product ? "is-active" : ""}`}
            onClick={() => setProduct(item.code)}
            type="button">
            <strong>{productLabel(item.code)}</strong>
            <span>{item.code}</span>
            <em>库存 {item.count ?? "-"} · {yuan(item.charge)}</em>
          </button>
        )) : (
          <div className="sms-service-empty">当前筛选没有服务。</div>
        )}
      </div>
    </div>
  );
}

// ── 三栏选择器组件 ──────────────────────────────────────────

function SmsServicePanel({ products, product, setProduct, serviceQuery, setServiceQuery }) {
  const filtered = products.filter(item => {
    const q = serviceQuery.trim().toLowerCase();
    return !q || item.code.toLowerCase().includes(q) || productLabel(item.code).toLowerCase().includes(q);
  });
  return (
    <div className="sms-tp sms-tp--service">
      <div className="sms-tp-head">
        <h3>选择服务</h3>
        <input value={serviceQuery} onChange={e => setServiceQuery(e.target.value)} placeholder="搜索服务..." className="sms-tp-search" />
      </div>
      <div className="sms-tp-list">
        {filtered.map(item => (
          <button key={item.code} type="button"
            className={`sms-tp-row ${item.code === product ? 'is-active' : ''}`}
            onClick={() => setProduct(item.code)}>
            <span className="sms-tp-name">{productLabel(item.code)}</span>
            <span className="sms-tp-meta">库存 {item.count ?? '—'}</span>
            <span className="sms-tp-price">{yuan(item.charge)}</span>
          </button>
        ))}
        {!filtered.length && <div className="sms-tp-empty">没有匹配的服务</div>}
      </div>
    </div>
  );
}

function SmsOperatorPanel({ operators, operator, setOperator }) {
  const list = operators?.length ? operators : SMS_DEFAULT_OPERATORS;
  return (
    <div className="sms-tp sms-tp--operator">
      <div className="sms-tp-head">
        <h3>选择运营商</h3>
      </div>
      <div className="sms-tp-list">
        {list.map(item => (
          <button key={item.code} type="button"
            className={`sms-tp-row ${item.code === operator ? 'is-active' : ''}`}
            onClick={() => setOperator(item.code)}>
            <span className="sms-tp-name">{item.name || operatorLabel(item.code)}</span>
            <span className="sms-tp-meta">{item.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SmsCountryPanel({ countries, country, setCountry }) {
  const [q, setQ] = React.useState('');
  const query = q.trim().toLowerCase();
  const filtered = countries.filter(c => !query
    || c.name.toLowerCase().includes(query)
    || c.code.toLowerCase().includes(query)
    || String(c.dial || "").includes(query));
  return (
    <div className="sms-tp">
      <div className="sms-tp-head">
        <h3>选择国家</h3>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索国家..." className="sms-tp-search" />
      </div>
      <div className="sms-tp-list">
        {filtered.map(c => (
          <button key={c.code} type="button"
            className={`sms-tp-row ${c.code === country ? 'is-active' : ''}`}
            onClick={() => setCountry(c.code)}>
            <span className="sms-tp-name">{c.name}</span>
            <span className="sms-tp-meta">{c.dial}</span>
          </button>
        ))}
      </div>
    </div>
  );
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
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile-load-failed")), { once: true });
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

function SmsOrderPanel({ user, product, country, operator, countries, currentProduct, busy, onBuy, onLoadOrders, message }) {
  const countryLabel = countries.find(x => x.code === country);
  const productAvailable = Boolean(currentProduct && Number(currentProduct.charge || 0) > 0 && Number(currentProduct.count || 0) > 0);
  return (
    <div className="sms-tp sms-tp--order">
      <div className="sms-tp-head">
        <h3>{user ? '下单' : '登录购买'}</h3>
      </div>
      <div className="sms-order-summary">
        <div className="sms-order-row">
          <span>服务</span>
          <strong>{productLabel(product)}</strong>
        </div>
        <div className="sms-order-row">
          <span>国家</span>
          <strong>{countryLabel?.name || country}</strong>
        </div>
        <div className="sms-order-row">
          <span>运营商</span>
          <strong>{operatorLabel(operator)}</strong>
        </div>
        <div className="sms-order-row">
          <span>库存</span>
          <strong>{currentProduct ? (currentProduct.count ?? "—") : "—"}</strong>
        </div>
        <div className="sms-order-row">
          <span>价格</span>
          <strong>{currentProduct ? yuan(currentProduct.charge) : '—'}</strong>
        </div>
        {user && (
          <div className="sms-order-row">
            <span>余额</span>
            <strong>{yuan(user.balance)}</strong>
          </div>
        )}
      </div>
      {user ? (
        <div className="sms-tp-actions">
          <button className="ca-button ca-button--primary ca-button--lg sms-buy-btn"
            onClick={onBuy}
            disabled={busy || !productAvailable || Number(user.balance || 0) <= 0}>
            {busy ? '处理中…' : productAvailable ? '购买号码' : '当前不可买'}
          </button>
          <button className="ca-button ca-button--outline" onClick={onLoadOrders} disabled={busy}>刷新订单</button>
          {message && <p className="sms-message">{message}</p>}
        </div>
      ) : (
        <div className="sms-tp-actions">
          <a className="ca-button ca-button--primary ca-button--lg sms-buy-btn" href="/login?next=/sms">登录下单</a>
          <a className="ca-button ca-button--outline ca-button--lg" href="https://t.me/Whohaoe" target="_blank" rel="noopener">TG 游客购买</a>
        </div>
      )}
    </div>
  );
}

function TurnstileBox({ siteKey, onToken, resetKey, onStatus }) {
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
        },
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
        try { window.turnstile.remove(widgetRef.current); } catch {}
      }
      widgetRef.current = null;
    };
  }, [siteKey]);

  React.useEffect(() => {
    if (!widgetRef.current || !window.turnstile?.reset) return;
    onToken("");
    tokenReadyRef.current = false;
    onStatus?.("loading");
    try { window.turnstile.reset(widgetRef.current); } catch {}
    armPendingTimer();
  }, [resetKey]);

  if (!siteKey) return null;
  return <div className="sms-turnstile" ref={boxRef} />;
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
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
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
    refreshMe()
      .then(found => { if (found) setMessage("已登录，可以下单。"); })
      .catch(() => {});

    api("/api/sms/countries")
      .then(data => {
        const list = Object.entries(data || {}).map(([code, info]) => ({
          code,
          name: info?.text_en || info?.name || code,
          dial: info?.prefix && typeof info.prefix === "object"
            ? Object.keys(info.prefix)[0]
            : (info?.prefix ? `+${String(info.prefix).replace(/^\+/, "")}` : ""),
          operators: countryOperators(info),
        })).sort((a, b) => a.name.localeCompare(b.name));
        if (list.length) setCountries(list);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const selected = countries.find(x => x.code === country);
    const list = selected?.operators?.length ? selected.operators : SMS_DEFAULT_OPERATORS;
    if (!list.some(item => item.code === operator)) setOperator(list[0]?.code || "any");
  }, [country, countries, operator]);

  React.useEffect(() => {
    setSelectedQuote(null);
    api(`/api/sms/products?country=${encodeURIComponent(country)}&operator=${encodeURIComponent(operator)}`)
      .then(data => {
        const list = Object.entries(data || {}).map(([code, info]) => ({
          code,
          count: info?.count ?? info?.Qty ?? info?.qty,
          charge: info?.charge,
          currency: info?.currency,
        })).filter(x => x.code).sort((a, b) => {
          const pa = SMS_PRODUCT_PRIORITY.has(a.code) ? SMS_PRODUCT_PRIORITY.get(a.code) : 9999;
          const pb = SMS_PRODUCT_PRIORITY.has(b.code) ? SMS_PRODUCT_PRIORITY.get(b.code) : 9999;
          if (pa !== pb) return pa - pb;
          return a.code.localeCompare(b.code);
        });
        setProducts(list);
        if (list.length && !list.some(x => x.code === product)) setProduct(list[0].code);
      })
      .catch(() => setProducts([]));
  }, [country, operator]);

  React.useEffect(() => {
    if (!product) {
      setSelectedQuote(null);
      return undefined;
    }
    let cancelled = false;
    setSelectedQuote(null);
    api(`/api/sms/quote?country=${encodeURIComponent(country)}&operator=${encodeURIComponent(operator)}&product=${encodeURIComponent(product)}`)
      .then(data => {
        if (cancelled) return;
        const quote = {
          code: product,
          available: Boolean(data?.available),
          count: data?.count ?? 0,
          charge: data?.charge ?? 0,
          currency: data?.currency || "CNY",
        };
        setSelectedQuote(quote);
        setProducts(prev => prev.map(item => (
          item.code === product
            ? { ...item, count: quote.count, charge: quote.charge, currency: quote.currency, available: quote.available }
            : item
        )));
      })
      .catch(() => {});
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
      await api("/api/auth/logout", { method: "POST" });
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
        body: JSON.stringify({ country, operator, product }),
      });
      setOrder(data.order);
      setUser(prev => prev ? { ...prev, balance: data.balance } : prev);
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
        body: JSON.stringify({ code: voucherCode }),
      });
      setUser(prev => prev ? { ...prev, balance: data.balance } : prev);
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
      if (typeof data.balance === "number") setUser(prev => prev ? { ...prev, balance: data.balance } : prev);
      setMessage(data.order.refundedAt ? `订单已关闭，余额已退回 ${yuan(data.order.refund)}。` : (data.order.sms || []).length ? "已收到验证码。" : "暂未收到验证码，可以稍后刷新。");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setOrderState = async (action) => {
    if (!order?.id) return;
    setBusy(true);
    try {
      const data = await api(`/api/sms/${action}`, {
        method: "POST",
        body: JSON.stringify({ id: order.id }),
      });
      setOrder(data.order);
      setOrders(prev => prev.map(x => x.id === data.order.id ? data.order : x));
      if (typeof data.balance === "number") setUser(prev => prev ? { ...prev, balance: data.balance } : prev);
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
        body: JSON.stringify({ userId: creditUserId, amount: creditAmount, note: creditNote }),
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
  const currentProduct = selectedQuote?.code === product
    ? { ...(listedProduct || { code: product }), ...selectedQuote }
    : listedProduct;
  const countryLabel = countries.find(x => x.code === country);
  const operators = countryLabel?.operators?.length ? countryLabel.operators : SMS_DEFAULT_OPERATORS;
  const smsList = order?.sms || [];
  const orderStatus = String(order?.status || "").toLowerCase();
  const orderClosed = Boolean(order?.refundedAt) || [
    "finish", "finished", "completed", "cancelled", "canceled", "ban", "banned", "failed", "expired", "timeout",
  ].includes(orderStatus);
  const guestBuyUrl = "https://t.me/Whohaoe";

  return (
    <div className="detail sms-page">
      <DetailHeader back="/" backLabel="首页" />
      <section className="sms-hero">
        <div className="wrap sms-hero-inner">
          <div>
            <div className="ca-kicker">接码</div>
            <h1 className="d-h1">短信验证码系统</h1>
            <p className="d-lead">用户注册后需要充值余额。管理员手动加余额，用户用余额购买号码并查询自己的验证码订单。</p>
          </div>
          <div className="sms-balance">
            <span>{user ? user.email : "未登录"}</span>
            <strong>{user ? yuan(user.balance) : "—"}</strong>
            {user && (
              <button className="ca-button ca-button--outline" onClick={logout} disabled={busy}>退出登录</button>
            )}
          </div>
        </div>
      </section>


      {/* 三栏选择器：始终可见 */}
      <section className="k-section sms-three-section">
        <div className="wrap sms-three-grid">
          <SmsCountryPanel countries={countries} country={country} setCountry={setCountry} />
          <SmsOperatorPanel operators={operators} operator={operator} setOperator={setOperator} />
          <SmsServicePanel
            products={products} product={product} setProduct={setProduct}
            serviceQuery={serviceQuery} setServiceQuery={setServiceQuery}
          />
          <SmsOrderPanel
            user={user} product={product} country={country} operator={operator} countries={countries}
            currentProduct={currentProduct} busy={busy}
            onBuy={buyNumber} onLoadOrders={loadOrders} message={message}
          />
        </div>
      </section>

      {user && (
        <React.Fragment>
          <section className="k-section">
            <div className="wrap sms-summary-grid">
              <div className="sms-summary-card">
                <span>账户余额</span>
                <strong>{yuan(user.balance)}</strong>
                <em>{user.email}</em>
              </div>
              <div className="sms-summary-card">
                <span>当前选择</span>
                <strong>{productLabel(product)}</strong>
                <em>{countryLabel?.name || country}</em>
              </div>
              <div className="sms-summary-card">
                <span>订单记录</span>
                <strong>{orders.length} 单</strong>
                <em>只显示当前用户自己的订单</em>
              </div>
            </div>
          </section>

          <section className="k-section">
            <div className="wrap sms-account-grid">
              <div className="sms-panel sms-panel--compact">
                <div className="grid-head">
                  <h2 className="ca-h2">余额充值</h2>
                  <span className="ca-meta">兑换码充值</span>
                </div>
                <label className="sms-field">
                  <span>兑换码</span>
                  <input value={voucherCode} onChange={e => setVoucherCode(e.target.value)}
                    placeholder="输入充值兑换码" />
                </label>
                <button className="ca-button ca-button--primary ca-button--lg sms-buy-btn"
                  onClick={redeemVoucher}
                  disabled={busy || !voucherCode.trim()}>
                  立即兑换
                </button>
              </div>
              <div className="sms-panel sms-panel--compact">
                <div className="grid-head">
                  <h2 className="ca-h2">邀请好友</h2>
                  <span className="ca-meta">首单返佣 10%</span>
                </div>
                <div className="sms-referral-stats">
                  <div><span>邀请码</span><strong>{referral?.referralCode || user.referralCode || "—"}</strong></div>
                  <div><span>已邀请</span><strong>{referral ? `${referral.invitedCount} 人` : "—"}</strong></div>
                  <div><span>奖励余额</span><strong>{referral ? yuan(referral.rewardTotal) : "—"}</strong></div>
                </div>
                <div className="sms-referral-link">
                  <span>{referral?.referralLink || "加载中…"}</span>
                  <button className="ca-button ca-button--outline" onClick={copyReferral} disabled={!referral?.referralLink}>复制链接</button>
                </div>
              </div>
            </div>
          </section>

          {/* 当前号码详情（购买成功后显示） */}
          {order && (
            <section className="k-section">
              <div className="wrap">
                <div className="sms-panel">
                  <div className="grid-head">
                    <h2 className="ca-h2">当前号码</h2>
                    <span className="ca-meta">{order?.status || "未下单"}</span>
                  </div>
                  <div className="sms-number">
                    <span>{order.country || country} · {order.product || product} · {yuan(order.price)}</span>
                    <strong>{order.phone || order.number || "-"}</strong>
                    <button className="ca-button ca-button--outline" onClick={copyNumber}>复制号码</button>
                  </div>
                  {order.refundedAt && (
                    <div className="sms-refund-note">
                      <span>已退回余额</span>
                      <strong>{yuan(order.refund)}</strong>
                    </div>
                  )}
                  <div className="sms-code-list">
                    <h3>验证码</h3>
                    {smsList.length ? smsList.map((sms, i) => (
                      <div className="sms-code" key={sms.id || i}>
                        <strong>{sms.code || sms.text || sms.sender || "已收到"}</strong>
                        <span>{sms.text || sms.date || ""}</span>
                      </div>
                    )) : <p>还没有收到短信。</p>}
                  </div>
                  <div className="sms-actions sms-actions--tight">
                    <button className="ca-button ca-button--primary" onClick={() => checkOrder()} disabled={busy || orderClosed}>刷新验证码</button>
                    <button className="ca-button ca-button--outline" onClick={() => setOrderState("finish")} disabled={busy || orderClosed}>完成订单</button>
                    <button className="ca-button ca-button--outline" onClick={() => setOrderState("cancel")} disabled={busy || orderClosed}>取消订单</button>
                    <button className="ca-button ca-button--outline" onClick={() => setOrderState("ban")} disabled={busy || orderClosed}>拉黑号码</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="k-section">
            <div className="wrap">
              <div className="sms-panel">
                <div className="grid-head">
                  <h2 className="ca-h2">我的订单</h2>
                  <span className="ca-meta">{orders.length ? `${orders.length} 条` : "空"}</span>
                </div>
                <div className="sms-history">
                  {orders.length ? orders.map(item => (
                    <button key={item.id} className="sms-history-row" onClick={() => setOrder(item)}>
                      <span>#{item.id}</span>
                      <strong>{item.phone || item.product || "-"}</strong>
                      <em>{item.status || "-"}</em>
                    </button>
                  )) : <p>还没有订单。</p>}
                </div>
              </div>
            </div>
          </section>

          {user.role === "admin" && (
            <section className="k-section">
              <div className="wrap">
                <div className="sms-panel">
                  <div className="grid-head">
                    <h2 className="ca-h2">用户余额</h2>
                    <span className="ca-meta">管理员手动充值</span>
                  </div>
                  <div className="sms-admin-grid">
                    <label className="sms-field">
                      <span>用户</span>
                      <select value={creditUserId} onChange={e => setCreditUserId(e.target.value)}>
                        {adminUsers.map(x => <option key={x.id} value={x.id}>{x.email} · {money(x.balance)}</option>)}
                      </select>
                    </label>
                    <label className="sms-field">
                      <span>加减金额</span>
                      <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="例如 100 或 -20" />
                    </label>
                    <label className="sms-field">
                      <span>充值记录</span>
                      <input value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="支付宝或微信转账记录" />
                    </label>
                    <div className="sms-admin-action">
                      <button className="ca-button ca-button--primary ca-button--lg" onClick={addCredit} disabled={busy || !creditUserId || !creditAmount}>
                        确认调整
                      </button>
                    </div>
                  </div>
                  <div className="sms-user-list">
                    {adminUsers.map(x => (
                      <div className="sms-user-row" key={x.id}>
                        <span>{x.id}</span>
                        <strong>{x.email}</strong>
                        <em>{x.role}</em>
                        <b>{money(x.balance)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

// ── 独立登录页 ──────────────────────────────────────────
function LoginDesk() {
  const initialRefCode = new URLSearchParams(window.location.search).get("ref") || "";
  const [authMode, setAuthMode] = useState(initialRefCode ? "register" : "login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode]   = useState(initialRefCode);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstileToken, setTurnstileToken]     = useState("");
  const [turnstileStatus, setTurnstileStatus]   = useState("idle");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const nextPath = new URLSearchParams(window.location.search).get("next") || "/sms";

  const api = async (path, options = {}) => {
    const res = await fetch(smsApiUrl(path), {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) throw new Error(data.error || text.slice(0, 80) || `请求失败（${res.status}）。`);
    return data;
  };

  React.useEffect(() => {
    api("/api/config")
      .then(d => setTurnstileSiteKey(d.turnstileEnabled ? d.turnstileSiteKey : ""))
      .catch(() => {});
    // 已登录则直接跳回
    api("/api/auth/me")
      .then(d => {
        if (d.user) {
          window.history.replaceState({}, "", nextPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      })
      .catch(() => {});
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
        body: JSON.stringify({ email, password, ref: authMode === "register" ? refCode : "", turnstileToken }),
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

  return (
    <div className="detail login-page">
      <DetailHeader back="/" backLabel="首页" />
      <section className="login-hero">
        <div className="wrap login-wrap">
          <div className="login-card">
            <div className="login-card-head">
              <h1>{authMode === "login" ? "登录" : "注册"}</h1>
              <span className="ca-meta">接码系统账户</span>
            </div>
            <label className="sms-field">
              <span>邮箱</span>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="QQ / 163 / Gmail 邮箱" autoFocus />
            </label>
            <label className="sms-field">
              <span>密码</span>
              <div className="sms-password-wrap">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="至少 8 位"
                  onKeyDown={e => e.key === "Enter" && !busy && submit()} />
                <button type="button" className="sms-password-toggle"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? "隐藏" : "查看"}
                </button>
              </div>
            </label>
            {authMode === "register" && refCode && (
              <label className="sms-field">
                <span>邀请码</span>
                <input value={refCode} onChange={e => setRefCode(e.target.value)}
                  placeholder="邀请码" />
              </label>
            )}
            <TurnstileBox siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileResetKey} onStatus={setTurnstileStatus} />
            {needTurnstile && (
              <div className="sms-turnstile-help">
                <p className="sms-turnstile-hint">{hint}</p>
                {shouldShowTurnstileRetry(turnstileStatus) && (
                  <button type="button" className="sms-turnstile-retry" onClick={resetTurnstile}>重新验证</button>
                )}
              </div>
            )}
            <div className="sms-actions">
              <button className="ca-button ca-button--primary ca-button--lg"
                onClick={submit} disabled={busy || needTurnstile}>
                {authMode === "login" ? "登录" : "注册"}
              </button>
              <button className="ca-button ca-button--outline ca-button--lg"
                onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setMessage(""); }}
                disabled={busy}>
                {authMode === "login" ? "我要注册" : "已有账户"}
              </button>
            </div>
            {message && <p className="sms-message">{message}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { SmsDesk, LoginDesk });
