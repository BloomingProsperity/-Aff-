// admin.jsx — Blooming 后台管理面板
// 路由 /admin → window.AdminDesk

(function () {
  const { useState, useEffect } = React;

  /* ─── utils ─────────────────────────────────────────────── */
  function fmt(v) {
    return Number(v || 0).toLocaleString("zh-Hans");
  }
  function fmtCny(v) {
    return "¥ " + Number(v || 0).toFixed(2);
  }
  function fmtDate(s) {
    if (!s) return "—";
    try {
      return new Date(s).toLocaleString("zh-Hans", { hour12: false });
    } catch (_) {
      return s;
    }
  }
  function admApi(path, opts) {
    const init = { credentials: "include", ...opts };
    if (opts && opts.body) {
      init.headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    }
    return fetch("/api" + path, init).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ─── AdmBadge ───────────────────────────────────────────── */
  const BADGE_MAP = {
    completed: ["adm-badge--ok",    "已完成"],
    pending:   ["adm-badge--warn",  "待处理"],
    failed:    ["adm-badge--err",   "失败"],
    cancelled: ["adm-badge--muted", "已取消"],
    topup:     ["adm-badge--ok",    "充值"],
    deduct:    ["adm-badge--err",   "扣除"],
    refund:    ["adm-badge--warn",  "退款"],
    order:     ["adm-badge--muted", "下单扣费"],
    voucher:   ["adm-badge--ok",    "充值券"],
    referral:  ["adm-badge--ok",    "邀请奖励"],
    active:    ["adm-badge--ok",    "可用"],
    redeemed:  ["adm-badge--muted", "已兑换"],
    void:      ["adm-badge--err",   "已作废"],
    ok:        ["adm-badge--ok",    "正常"],
    low:       ["adm-badge--warn",  "低余额"],
    empty:     ["adm-badge--err",   "已空"],
    error:     ["adm-badge--err",   "异常"],
    disabled:  ["adm-badge--muted", "未配置"],
  };
  function AdmBadge({ s }) {
    const [cls, label] = BADGE_MAP[s] || ["adm-badge--muted", s || "—"];
    return <span className={`adm-badge ${cls}`}>{label}</span>;
  }

  /* ─── AdmStatCard ────────────────────────────────────────── */
  function AdmStatCard({ label, value, sub, accent }) {
    return (
      <div className={`adm-stat${accent ? " adm-stat--accent" : ""}`}>
        <div className="adm-stat-val">{value}</div>
        <div className="adm-stat-label">{label}</div>
        {sub && <div className="adm-stat-sub">{sub}</div>}
      </div>
    );
  }

  /* ─── AdmPager ───────────────────────────────────────────── */
  function AdmPager({ page, hasMore, onPrev, onNext }) {
    return (
      <div className="adm-pagination">
        <button className="adm-btn adm-btn--sm adm-btn--outline"
          disabled={page <= 1} onClick={onPrev}>← 上一页</button>
        <span>第 {page} 页</span>
        <button className="adm-btn adm-btn--sm adm-btn--outline"
          disabled={!hasMore} onClick={onNext}>下一页 →</button>
      </div>
    );
  }

  /* ─── Overview ───────────────────────────────────────────── */
  const PAGE_LABELS = {
    home: "首页", cards: "银行卡", gifts: "礼品卡",
    sms: "接码", accounts: "账号", login: "登录",
  };

  function AdminOverview() {
    const [data, setData] = useState(null);
    const [providers, setProviders] = useState([]);
    const [err,  setErr]  = useState(null);

    useEffect(() => {
      admApi("/admin/stats")
        .then(setData)
        .catch(() => setErr("加载失败，请检查网络或稍后重试"));
      admApi("/admin/provider-health")
        .then(d => setProviders(d.providers || []))
        .catch(() => setProviders([]));
    }, []);

    if (err)   return <div className="adm-err adm-err--block">{err}</div>;
    if (!data) return <div className="adm-loading">加载中…</div>;

    const { users = {}, orders = {}, revenue = {}, pageviews = [], risk = {} } = data;
    const page_views = pageviews;
    const maxPv = Math.max(...page_views.map(x => Number(x.total) || 0), 1);

    return (
      <div className="adm-content-inner">
        <h2 className="adm-page-title">概览</h2>

        <div className="adm-stat-grid">
          <AdmStatCard label="注册用户" value={fmt(users.total)}
            sub={users.new_today ? `今日新增 ${users.new_today}` : null} accent />
          <AdmStatCard label="全部订单" value={fmt(orders.total)} />
          <AdmStatCard label="已完成订单" value={fmt(orders.completed)} />
          <AdmStatCard label="累计收入" value={fmtCny(Number(revenue.total_cents || 0) / 100)} accent />
        </div>

        <div className="adm-row">
          {/* 订单状态 */}
          <div className="adm-card adm-row-cell">
            <div className="adm-card-head">订单状态</div>
            <div className="adm-stat-grid adm-stat-grid--inner">
              <AdmStatCard label="待处理" value={fmt(orders.pending || 0)} />
              <AdmStatCard label="已完成" value={fmt(orders.completed || 0)} />
              <AdmStatCard label="失败" value={fmt(orders.failed || 0)} />
              <AdmStatCard label="已取消" value={fmt(orders.cancelled || 0)} />
            </div>
          </div>

          {/* 模块浏览量 */}
          <div className="adm-card adm-row-cell adm-row-cell--wide">
            <div className="adm-card-head">各模块浏览量</div>
            {page_views.length === 0
              ? <div className="adm-empty">暂无浏览数据</div>
              : (
                <div className="adm-views-list">
                  {page_views.map(pv => {
                    const pct = Math.max(Math.round((Number(pv.total) / maxPv) * 100), 2);
                    return (
                      <div className="adm-view-row" key={pv.page}>
                        <div className="adm-view-name">{PAGE_LABELS[pv.page] || pv.page}</div>
                        <div className="adm-view-bar-wrap">
                          <div className="adm-view-bar" style={{ width: pct + "%" }} />
                        </div>
                        <div className="adm-view-count">{fmt(pv.total)}</div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">运营风险</div>
          <div className="adm-stat-grid adm-stat-grid--inner">
            <AdmStatCard label="24h 失败动作" value={fmt(risk.failedActions24h || 0)} />
            <AdmStatCard label="24h 登录失败" value={fmt(risk.failedLogins24h || 0)} />
            <AdmStatCard label="24h 购买失败" value={fmt(risk.failedPurchases24h || 0)} />
            <AdmStatCard label="未完成号码" value={fmt(risk.activeSmsOrders || 0)}
              sub={`涉及用户 ${fmt(risk.activeSmsUsers || 0)} 个`} />
            <AdmStatCard label="高频失败 IP" value={fmt(risk.riskyIps24h || 0)}
              sub={`失败来源 ${fmt(risk.uniqueFailedIps24h || 0)} 个`} accent />
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">供应商余额</div>
          {providers.length === 0
            ? <div className="adm-empty">暂无供应商状态</div>
            : (
              <div className="adm-provider-list">
                {providers.map(item => (
                  <div className="adm-provider-row" key={item.provider}>
                    <div>
                      <strong>{item.providerName || item.provider}</strong>
                      <span>{item.configured ? "已配置" : "未配置"}</span>
                    </div>
                    <div className="adm-provider-balance">
                      {item.balance === null ? "—" : `$${Number(item.balance || 0).toFixed(4)}`}
                    </div>
                    <AdmBadge s={item.status} />
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    );
  }

  /* ─── TopupModal ─────────────────────────────────────────── */
  function TopupModal({ user, onClose, onDone }) {
    const [amount,     setAmount]     = useState("");
    const [note,       setNote]       = useState("手动充值");
    const [submitting, setSubmitting] = useState(false);
    const [err,        setErr]        = useState(null);

    function submit(e) {
      e.preventDefault();
      const n = Number(amount);
      if (!amount || isNaN(n) || n === 0) return setErr("请输入有效金额（正数充值 / 负数扣除）");
      setSubmitting(true);
      setErr(null);
      admApi("/admin/credit", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, amount: n, note }),
      })
        .then(() => onDone())
        .catch(e => setErr("操作失败：" + e.message))
        .finally(() => {
          setSubmitting(false);
        });
    }

    return (
      <div className="adm-overlay" onClick={onClose}>
        <div className="adm-modal" onClick={e => e.stopPropagation()}>
          <div className="adm-modal-head">
            <span className="adm-modal-title">余额调整</span>
            <button className="adm-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="adm-modal-body">
            <div className="adm-modal-meta">
              {user.email}&nbsp;·&nbsp;当前余额 {fmtCny(user.balance)}
            </div>
            <form onSubmit={submit}>
              <div className="adm-field">
                <label>调整金额（元，正数充值 / 负数扣除）</label>
                <input className="adm-input" type="number" step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="如：50 或 -20" autoFocus />
              </div>
              <div className="adm-field">
                <label>备注</label>
                <input className="adm-input" value={note}
                  onChange={e => setNote(e.target.value)} />
              </div>
              {err && <div className="adm-err" style={{ marginBottom: 10 }}>{err}</div>}
              <div className="adm-modal-foot">
                <button type="button" className="adm-btn adm-btn--outline" onClick={onClose}>取消</button>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={submitting}>
                  {submitting ? "处理中…" : "确认"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Users ──────────────────────────────────────────────── */
  function AdminUsers() {
    const [users,     setUsers]     = useState([]);
    const [total,     setTotal]     = useState(0);
    const [page,      setPage]      = useState(1);
    const [q,         setQ]         = useState("");
    const [loading,   setLoading]   = useState(false);
    const [topupUser, setTopupUser] = useState(null);

    function load(p, query) {
      setLoading(true);
      admApi(`/admin/users?page=${p}&q=${encodeURIComponent(query || "")}`)
        .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    useEffect(() => { load(1, ""); }, []);

    return (
      <div className="adm-content-inner">
        <div className="adm-page-head">
          <h2 className="adm-page-title">用户管理</h2>
          <span className="adm-count">共 {fmt(total)} 人</span>
        </div>

        <form className="adm-search-row"
          onSubmit={e => { e.preventDefault(); setPage(1); load(1, q); }}>
          <input className="adm-input" value={q}
            onChange={e => setQ(e.target.value)} placeholder="搜索邮箱…" />
          <button className="adm-btn adm-btn--primary" type="submit">搜索</button>
        </form>

        <div className="adm-card adm-card--table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>邮箱</th><th>余额</th>
                <th>注册时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="adm-empty">加载中…</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={5} className="adm-empty">暂无数据</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id}>
                  <td className="adm-td--mono">{u.id}</td>
                  <td className="adm-td--email">{u.email}</td>
                  <td>{fmtCny(u.balance)}</td>
                  <td className="adm-td--date">{fmtDate(u.created_at)}</td>
                  <td>
                    <button className="adm-btn adm-btn--sm adm-btn--outline"
                      onClick={() => setTopupUser(u)}>调整余额</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdmPager page={page} hasMore={users.length >= 20}
            onPrev={() => { const p = page - 1; setPage(p); load(p, q); }}
            onNext={() => { const p = page + 1; setPage(p); load(p, q); }} />
        </div>

        {topupUser && (
          <TopupModal user={topupUser}
            onClose={() => setTopupUser(null)}
            onDone={() => { setTopupUser(null); load(page, q); }} />
        )}
      </div>
    );
  }

  /* ─── Orders ─────────────────────────────────────────────── */
  const ORDER_FILTERS = [
    ["", "全部"], ["pending", "待处理"], ["completed", "已完成"],
    ["failed", "失败"], ["cancelled", "已取消"],
  ];

  function AdminOrders() {
    const [orders,  setOrders]  = useState([]);
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);
    const [status,  setStatus]  = useState("");
    const [loading, setLoading] = useState(false);

    function load(p, s) {
      setLoading(true);
      const qs = s ? `&status=${s}` : "";
      admApi(`/admin/orders?page=${p}${qs}`)
        .then(d => { setOrders(d.orders || []); setTotal(d.total || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    useEffect(() => { load(1, ""); }, []);

    return (
      <div className="adm-content-inner">
        <div className="adm-page-head">
          <h2 className="adm-page-title">订单管理</h2>
          <span className="adm-count">共 {fmt(total)} 条</span>
        </div>

        <div className="adm-filter-row">
          {ORDER_FILTERS.map(([s, label]) => (
            <button key={s}
              className={`adm-filter-btn${status === s ? " is-active" : ""}`}
              onClick={() => { setStatus(s); setPage(1); load(1, s); }}>
              {label}
            </button>
          ))}
        </div>

        <div className="adm-card adm-card--table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>用户</th><th>服务</th><th>国家</th>
                <th>号码</th><th>金额</th><th>状态</th><th>时间</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="adm-empty">加载中…</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={8} className="adm-empty">暂无数据</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="adm-td--mono">#{o.id}</td>
                  <td className="adm-td--email">{o.user_email || o.email || "—"}</td>
                  <td>{o.product || "—"}</td>
                  <td>{o.country || "—"}</td>
                  <td className="adm-td--mono">{o.phone || "—"}</td>
                  <td>{fmtCny(Number(o.price_cents || 0) / 100)}</td>
                  <td><AdmBadge s={o.status} /></td>
                  <td className="adm-td--date">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdmPager page={page} hasMore={orders.length >= 20}
            onPrev={() => { const p = page - 1; setPage(p); load(p, status); }}
            onNext={() => { const p = page + 1; setPage(p); load(p, status); }} />
        </div>
      </div>
    );
  }

  /* ─── Logs ───────────────────────────────────────────────── */
  function AdminLogs() {
    const [logs,    setLogs]    = useState([]);
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);
    const [loading, setLoading] = useState(false);

    function load(p) {
      setLoading(true);
      admApi(`/admin/logs?page=${p}`)
        .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    useEffect(() => { load(1); }, []);

    return (
      <div className="adm-content-inner">
        <div className="adm-page-head">
          <h2 className="adm-page-title">余额流水</h2>
          <span className="adm-count">共 {fmt(total)} 条</span>
        </div>

        <div className="adm-card adm-card--table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>用户</th><th>金额</th>
                <th>类型</th><th>备注</th><th>时间</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="adm-empty">加载中…</td></tr>
              )}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="adm-empty">暂无数据</td></tr>
              )}
              {logs.map(l => {
                const amountCny = Number(l.delta_cents || 0) / 100;
                const pos = amountCny >= 0;
                return (
                  <tr key={l.id}>
                    <td className="adm-td--mono">#{l.id}</td>
                    <td className="adm-td--email">{l.user_email || l.email || "—"}</td>
                    <td className={`adm-td--amount${pos ? " adm-td--pos" : " adm-td--neg"}`}>
                      {pos ? "+" : ""}{fmtCny(amountCny)}
                    </td>
                    <td><AdmBadge s={l.type} /></td>
                    <td>{l.note || "—"}</td>
                    <td className="adm-td--date">{fmtDate(l.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <AdmPager page={page} hasMore={logs.length >= 20}
            onPrev={() => { const p = page - 1; setPage(p); load(p); }}
            onNext={() => { const p = page + 1; setPage(p); load(p); }} />
        </div>
      </div>
    );
  }

  /* ─── Vouchers ───────────────────────────────────────────── */
  const VOUCHER_FILTERS = [
    ["", "全部"], ["active", "可用"], ["redeemed", "已兑换"], ["void", "已作废"],
  ];

  const AUDIT_STATUS_FILTERS = [
    ["", "全部"], ["success", "成功"], ["failed", "失败"],
  ];

  function auditStatusLabel(status) {
    if (status === "success") return "成功";
    if (status === "failed") return "失败";
    return status || "—";
  }

  function auditMetaText(meta) {
    if (!meta || Object.keys(meta).length === 0) return "—";
    try { return JSON.stringify(meta); } catch { return "—"; }
  }

  function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    function load(p, s = status, q = query) {
      setLoading(true);
      setMsg("");
      const qs = new URLSearchParams({ page: String(p), limit: "20" });
      if (s) qs.set("status", s);
      if (q.trim()) qs.set("q", q.trim());
      admApi(`/admin/audit-logs?${qs.toString()}`)
        .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); })
        .catch(() => setMsg("加载失败，请稍后重试"))
        .finally(() => setLoading(false));
    }

    useEffect(() => { load(1, "", ""); }, []);

    function search(e) {
      e.preventDefault();
      setPage(1);
      load(1, status, query);
    }

    return (
      <div className="adm-content-inner">
        <div className="adm-page-head">
          <h2 className="adm-page-title">审计日志</h2>
          <span className="adm-count">共 {fmt(total)} 条</span>
        </div>

        <form className="adm-search-row" onSubmit={search}>
          <input className="adm-input" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索 IP、邮箱、动作、路径..." />
          <button className="adm-btn adm-btn--primary" type="submit">搜索</button>
        </form>

        <div className="adm-filter-row">
          {AUDIT_STATUS_FILTERS.map(([s, label]) => (
            <button key={s}
              className={`adm-filter-btn${status === s ? " is-active" : ""}`}
              onClick={() => { setStatus(s); setPage(1); load(1, s, query); }}>
              {label}
            </button>
          ))}
        </div>
        {msg && <div className="adm-field-hint">{msg}</div>}

        <div className="adm-card adm-card--table">
          <table className="adm-table adm-table--audit">
            <thead>
              <tr>
                <th>ID</th><th>动作</th><th>状态</th><th>操作者</th>
                <th>目标用户</th><th>IP</th><th>路径</th><th>详情</th><th>时间</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="adm-empty">加载中…</td></tr>}
              {!loading && logs.length === 0 && <tr><td colSpan={9} className="adm-empty">暂无数据</td></tr>}
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="adm-td--mono">#{l.id}</td>
                  <td className="adm-td--mono">{l.action}</td>
                  <td>
                    <span className={`adm-badge ${l.status === "success" ? "adm-badge--ok" : "adm-badge--err"}`}>
                      {auditStatusLabel(l.status)}
                    </span>
                  </td>
                  <td className="adm-td--email">{l.actorEmail || "—"}</td>
                  <td className="adm-td--email">{l.targetEmail || "—"}</td>
                  <td className="adm-td--mono">{l.ip || "—"}</td>
                  <td className="adm-audit-path">{l.method ? `${l.method} ` : ""}{l.path || "—"}</td>
                  <td><code className="adm-audit-meta">{auditMetaText(l.metadata)}</code></td>
                  <td className="adm-td--date">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdmPager page={page} hasMore={logs.length >= 20}
            onPrev={() => { const p = page - 1; setPage(p); load(p, status, query); }}
            onNext={() => { const p = page + 1; setPage(p); load(p, status, query); }} />
        </div>
      </div>
    );
  }

  function AdminVouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("50");
    const [count, setCount] = useState("10");
    const [expiresAt, setExpiresAt] = useState("");
    const [note, setNote] = useState("");
    const [generated, setGenerated] = useState(null);
    const [msg, setMsg] = useState("");

    function load(p, s) {
      setLoading(true);
      const qs = s ? `&status=${encodeURIComponent(s)}` : "";
      admApi(`/admin/vouchers?page=${p}${qs}`)
        .then(d => { setVouchers(d.vouchers || []); setTotal(d.total || 0); })
        .catch(() => setMsg("加载失败，请稍后重试"))
        .finally(() => setLoading(false));
    }

    useEffect(() => { load(1, ""); }, []);

    function createBatch(e) {
      e.preventDefault();
      setMsg("");
      setGenerated(null);
      admApi("/admin/voucher-batches", {
        method: "POST",
        body: JSON.stringify({ amount, count, expiresAt, note }),
      })
        .then(d => {
          setGenerated(d);
          setMsg(`已生成 ${d.count} 张充值券。`);
          setPage(1);
          load(1, status);
        })
        .catch(() => setMsg("生成失败，请检查金额和数量"));
    }

    function voidVoucher(voucher) {
      admApi(`/admin/vouchers/${voucher.id}/void`, { method: "POST" })
        .then(() => {
          setMsg("已作废。");
          load(page, status);
        })
        .catch(() => setMsg("作废失败"));
    }

    async function copyGenerated() {
      if (!generated?.codes?.length) return;
      await navigator.clipboard.writeText(generated.codes.join("\n"));
      setMsg("兑换码已复制。");
    }

    return (
      <div className="adm-content-inner">
        <div className="adm-page-head">
          <h2 className="adm-page-title">充值券</h2>
          <span className="adm-count">共 {fmt(total)} 张</span>
        </div>

        <form className="adm-card adm-voucher-form" onSubmit={createBatch}>
          <div className="adm-card-head">生成充值券</div>
          <div className="adm-settings-grid">
            <div className="adm-field">
              <label>单张金额（元）</label>
              <input className="adm-input" type="number" step="0.01" min="0.01"
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="adm-field">
              <label>数量</label>
              <input className="adm-input" type="number" min="1" max="200"
                value={count} onChange={e => setCount(e.target.value)} />
            </div>
            <div className="adm-field">
              <label>过期时间</label>
              <input className="adm-input" type="datetime-local"
                value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
            <div className="adm-field">
              <label>备注</label>
              <input className="adm-input" value={note}
                onChange={e => setNote(e.target.value)} placeholder="例如：老客户补贴" />
            </div>
          </div>
          <div className="adm-settings-actions">
            <button className="adm-btn adm-btn--primary" type="submit">生成兑换码</button>
          </div>
          {generated?.codes?.length ? (
            <div className="adm-generated">
              <div className="adm-generated-head">
                <strong>{generated.batchId}</strong>
                <button className="adm-btn adm-btn--sm adm-btn--outline" type="button" onClick={copyGenerated}>复制全部</button>
              </div>
              <textarea className="adm-input adm-generated-codes" readOnly value={generated.codes.join("\n")} />
            </div>
          ) : null}
          {msg && <div className="adm-field-hint">{msg}</div>}
        </form>

        <div className="adm-filter-row">
          {VOUCHER_FILTERS.map(([s, label]) => (
            <button key={s}
              className={`adm-filter-btn${status === s ? " is-active" : ""}`}
              onClick={() => { setStatus(s); setPage(1); load(1, s); }}>
              {label}
            </button>
          ))}
        </div>

        <div className="adm-card adm-card--table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>批次</th><th>尾号</th><th>金额</th>
                <th>状态</th><th>兑换用户</th><th>过期时间</th><th>创建时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="adm-empty">加载中…</td></tr>}
              {!loading && vouchers.length === 0 && <tr><td colSpan={9} className="adm-empty">暂无数据</td></tr>}
              {vouchers.map(v => (
                <tr key={v.id}>
                  <td className="adm-td--mono">#{v.id}</td>
                  <td className="adm-td--mono">{v.batchId}</td>
                  <td className="adm-td--mono">••••{v.codeSuffix}</td>
                  <td>{fmtCny(v.amount)}</td>
                  <td><AdmBadge s={v.status} /></td>
                  <td className="adm-td--email">{v.redeemedBy || "—"}</td>
                  <td className="adm-td--date">{fmtDate(v.expiresAt)}</td>
                  <td className="adm-td--date">{fmtDate(v.createdAt)}</td>
                  <td>
                    {v.status === "active"
                      ? <button className="adm-btn adm-btn--sm adm-btn--outline" onClick={() => voidVoucher(v)}>作废</button>
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdmPager page={page} hasMore={vouchers.length >= 30}
            onPrev={() => { const p = page - 1; setPage(p); load(p, status); }}
            onNext={() => { const p = page + 1; setPage(p); load(p, status); }} />
        </div>
      </div>
    );
  }

  /* ─── Settings ───────────────────────────────────────────── */
  function AdminSettings() {
    const [cfg,     setCfg]     = useState({
      SMS_USD_CNY_RATE: "",
      SMS_MARGIN_CNY: "",
      SMS_ACTIVE_ORDER_LIMIT: "",
      SMS_BUY_COOLDOWN_SECONDS: "",
      TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      FIVESIM_API_KEY: "",
      SMSPOOL_API_KEY: "",
      BEESMS_API_TOKEN: "",
    });
    const [secrets, setSecrets] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [msg,     setMsg]     = useState(null);

    useEffect(() => {
      admApi("/admin/settings")
        .then(d => {
          setCfg(c => ({ ...c, ...(d.settings || {}) }));
          setSecrets(d.secrets || {});
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    function save(e) {
      e.preventDefault();
      setSaving(true);
      setMsg(null);
      admApi("/admin/settings", {
        method: "POST",
        body: JSON.stringify({ settings: cfg }),
      })
        .then(d => {
          setCfg(c => ({
            ...c,
            ...(d.settings || {}),
            FIVESIM_API_KEY: "",
            SMSPOOL_API_KEY: "",
            BEESMS_API_TOKEN: "",
            TURNSTILE_SECRET_KEY: "",
          }));
          setSecrets(d.secrets || {});
          setMsg({ ok: true, text: "设置已保存" });
        })
        .catch(() => setMsg({ ok: false, text: "保存失败，请重试" }))
        .finally(() => {
          setSaving(false);
        });
    }

    if (loading) return <div className="adm-loading">加载中…</div>;

    return (
      <div className="adm-content-inner">
        <h2 className="adm-page-title">系统设置</h2>

        <form onSubmit={save} className="adm-settings-form">
          <div className="adm-settings-grid">
            <div className="adm-card">
              <div className="adm-card-head">接码定价</div>
              <div className="adm-field">
                <label>美元汇率（1 USD = ? 元）</label>
                <input className="adm-input" type="number" step="0.01"
                  value={cfg.SMS_USD_CNY_RATE || ""}
                  onChange={e => setCfg(c => ({ ...c, SMS_USD_CNY_RATE: e.target.value }))}
                  placeholder="7.2" />
              </div>
              <div className="adm-field">
                <label>固定加价（元/单）</label>
                <input className="adm-input" type="number" step="0.01"
                  value={cfg.SMS_MARGIN_CNY || ""}
                  onChange={e => setCfg(c => ({ ...c, SMS_MARGIN_CNY: e.target.value }))}
                  placeholder="10" />
              </div>
              <div className="adm-field">
                <label>单用户未完成号码上限</label>
                <input className="adm-input" type="number" min="1" step="1"
                  value={cfg.SMS_ACTIVE_ORDER_LIMIT || ""}
                  onChange={e => setCfg(c => ({ ...c, SMS_ACTIVE_ORDER_LIMIT: e.target.value }))}
                  placeholder="3" />
              </div>
              <div className="adm-field">
                <label>同用户下单间隔（秒）</label>
                <input className="adm-input" type="number" min="0" step="1"
                  value={cfg.SMS_BUY_COOLDOWN_SECONDS || ""}
                  onChange={e => setCfg(c => ({ ...c, SMS_BUY_COOLDOWN_SECONDS: e.target.value }))}
                  placeholder="10" />
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card-head">密钥配置</div>
              <div className="adm-field">
                <label>5sim API 密钥</label>
                <input className="adm-input" type="password"
                  value={cfg.FIVESIM_API_KEY || ""}
                  onChange={e => setCfg(c => ({ ...c, FIVESIM_API_KEY: e.target.value }))}
                  placeholder={secrets.FIVESIM_API_KEY?.configured ? "已设置，填新密钥后替换" : "未设置"} />
                <div className="adm-field-hint">
                  {secrets.FIVESIM_API_KEY?.configured
                    ? `当前 ${secrets.FIVESIM_API_KEY.masked}`
                    : "当前未设置"}
                </div>
              </div>
              <div className="adm-field">
                <label>SMSPool API 密钥</label>
                <input className="adm-input" type="password"
                  value={cfg.SMSPOOL_API_KEY || ""}
                  onChange={e => setCfg(c => ({ ...c, SMSPOOL_API_KEY: e.target.value }))}
                  placeholder={secrets.SMSPOOL_API_KEY?.configured ? "已设置，填新密钥后替换" : "未设置"} />
                <div className="adm-field-hint">
                  {secrets.SMSPOOL_API_KEY?.configured
                    ? `当前 ${secrets.SMSPOOL_API_KEY.masked}`
                    : "当前未设置"}
                </div>
              </div>
              <div className="adm-field">
                <label>Bee-SMS API Token</label>
                <input className="adm-input" type="password"
                  value={cfg.BEESMS_API_TOKEN || ""}
                  onChange={e => setCfg(c => ({ ...c, BEESMS_API_TOKEN: e.target.value }))}
                  placeholder={secrets.BEESMS_API_TOKEN?.configured ? "已设置，填新 Token 后替换" : "未设置"} />
                <div className="adm-field-hint">
                  {secrets.BEESMS_API_TOKEN?.configured
                    ? `当前 ${secrets.BEESMS_API_TOKEN.masked}`
                    : "当前未设置"}
                </div>
              </div>
              <div className="adm-field">
                <label>Turnstile 站点密钥</label>
                <input className="adm-input"
                  value={cfg.TURNSTILE_SITE_KEY || ""}
                  onChange={e => setCfg(c => ({ ...c, TURNSTILE_SITE_KEY: e.target.value }))}
                  placeholder="0x4AAAA..." />
              </div>
              <div className="adm-field">
                <label>Turnstile 私钥</label>
                <input className="adm-input" type="password"
                  value={cfg.TURNSTILE_SECRET_KEY || ""}
                  onChange={e => setCfg(c => ({ ...c, TURNSTILE_SECRET_KEY: e.target.value }))}
                  placeholder={secrets.TURNSTILE_SECRET_KEY?.configured ? "已设置，填新私钥后替换" : "未设置"} />
                <div className="adm-field-hint">
                  {secrets.TURNSTILE_SECRET_KEY?.configured
                    ? `当前 ${secrets.TURNSTILE_SECRET_KEY.masked}`
                    : "当前未设置"}
                </div>
              </div>
            </div>
          </div>

          {msg && (
            <div className={msg.ok ? "adm-msg-ok" : "adm-err"} style={{ marginTop: 12, marginBottom: 12 }}>
              {msg.text}
            </div>
          )}
          <div className="adm-settings-actions">
            <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
              {saving ? "保存中…" : "保存设置"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ─── AdminDesk shell ────────────────────────────────────── */
  const ADM_NAV = [
    { id: "overview", label: "概览" },
    { id: "users",    label: "用户管理" },
    { id: "orders",   label: "订单管理" },
    { id: "logs",     label: "余额流水" },
    { id: "audit",    label: "审计日志" },
    { id: "vouchers", label: "充值券" },
    { id: "settings", label: "系统设置" },
  ];

  function AdminDesk() {
    const [user,     setUser]     = useState(null);
    const [checking, setChecking] = useState(true);
    const [tab,      setTab]      = useState("overview");

    useEffect(() => {
      fetch("/api/auth/me", { credentials: "include" })
        .then(r => r.json())
        .then(d => {
          if (!d.user || d.user.role !== "admin") {
            window.location.href = "/login?next=" + encodeURIComponent("/admin");
          } else {
            setUser(d.user);
            setChecking(false);
          }
        })
        .catch(() => {
          window.location.href = "/login?next=/admin";
        });
    }, []);

    if (checking) {
      return (
        <div className="adm-gate">
          <div className="adm-gate-inner">正在验证管理员权限…</div>
        </div>
      );
    }

    function logout() {
      fetch("/api/auth/logout", { method: "POST", credentials: "include" })
        .finally(() => { window.location.href = "/"; });
    }

    return (
      <div className="adm-shell">
        {/* ── 侧边栏 ── */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-brand">
            <span className="adm-brand-mark"><img src="/images/brand/blue-cat.svg" alt="" aria-hidden="true" /></span>
            <div>
              <div className="adm-brand-name">Blooming</div>
              <div className="adm-brand-sub">后台管理</div>
            </div>
          </div>

          <nav className="adm-nav">
            {ADM_NAV.map(item => (
              <button key={item.id}
                className={`adm-nav-item${tab === item.id ? " is-active" : ""}`}
                onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="adm-sidebar-foot">
            <div className="adm-sidebar-user">{user.email}</div>
            <a href="/" className="adm-sidebar-link">← 返回主站</a>
            <button className="adm-sidebar-logout" onClick={logout}>退出登录</button>
          </div>
        </aside>

        {/* ── 内容区 ── */}
        <main className="adm-main">
          {tab === "overview"  && <AdminOverview />}
          {tab === "users"     && <AdminUsers />}
          {tab === "orders"    && <AdminOrders />}
          {tab === "logs"      && <AdminLogs />}
          {tab === "audit"     && <AdminAuditLogs />}
          {tab === "vouchers"  && <AdminVouchers />}
          {tab === "settings"  && <AdminSettings />}
        </main>
      </div>
    );
  }

  window.AdminDesk = AdminDesk;
})();
