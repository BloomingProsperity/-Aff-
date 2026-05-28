(() => {
(function () {
  const {
    useState,
    useEffect
  } = React;
  function fmt(v) {
    return Number(v || 0).toLocaleString("zh-Hans");
  }
  function fmtCny(v) {
    return "¥ " + Number(v || 0).toFixed(2);
  }
  function fmtDate(s) {
    if (!s) return "—";
    try {
      return new Date(s).toLocaleString("zh-Hans", {
        hour12: false
      });
    } catch (_) {
      return s;
    }
  }
  function toDateTimeLocal(s) {
    if (!s) return "";
    const date = new Date(s);
    if (!Number.isFinite(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
  function fromDateTimeLocal(s) {
    const value = String(s || "").trim();
    if (!value) return "";
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : "";
  }
  function admApi(path, opts) {
    const init = {
      credentials: "include",
      ...opts
    };
    if (opts && opts.body) {
      init.headers = {
        "Content-Type": "application/json",
        ...(opts.headers || {})
      };
    }
    return fetch("/api" + path, init).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }
  const BADGE_MAP = {
    completed: ["adm-badge--ok", "已完成"],
    pending: ["adm-badge--warn", "待处理"],
    failed: ["adm-badge--err", "失败"],
    cancelled: ["adm-badge--muted", "已取消"],
    expired: ["adm-badge--muted", "已超时"],
    admin_closed: ["adm-badge--muted", "已关闭"],
    topup: ["adm-badge--ok", "充值"],
    deduct: ["adm-badge--err", "扣除"],
    refund: ["adm-badge--warn", "退款"],
    order: ["adm-badge--muted", "下单扣费"],
    voucher: ["adm-badge--ok", "充值券"],
    referral: ["adm-badge--ok", "邀请奖励"],
    active: ["adm-badge--ok", "可用"],
    redeemed: ["adm-badge--muted", "已兑换"],
    void: ["adm-badge--err", "已作废"],
    ok: ["adm-badge--ok", "正常"],
    low: ["adm-badge--warn", "低余额"],
    empty: ["adm-badge--err", "已空"],
    error: ["adm-badge--err", "异常"],
    disabled: ["adm-badge--muted", "未配置"],
    suspended: ["adm-badge--err", "已暂停"]
  };
  function AdmBadge({
    s
  }) {
    const [cls, label] = BADGE_MAP[s] || ["adm-badge--muted", s || "—"];
    return React.createElement("span", {
      className: `adm-badge ${cls}`
    }, label);
  }
  function AdmStatCard({
    label,
    value,
    sub,
    accent
  }) {
    return React.createElement("div", {
      className: `adm-stat${accent ? " adm-stat--accent" : ""}`
    }, React.createElement("div", {
      className: "adm-stat-val"
    }, value), React.createElement("div", {
      className: "adm-stat-label"
    }, label), sub && React.createElement("div", {
      className: "adm-stat-sub"
    }, sub));
  }
  function AdmPager({
    page,
    hasMore,
    onPrev,
    onNext
  }) {
    return React.createElement("div", {
      className: "adm-pagination"
    }, React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: page <= 1,
      onClick: onPrev
    }, "\u2190 \u4E0A\u4E00\u9875"), React.createElement("span", null, "\u7B2C ", page, " \u9875"), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: !hasMore,
      onClick: onNext
    }, "\u4E0B\u4E00\u9875 \u2192"));
  }
  const PAGE_LABELS = {
    home: "首页",
    cards: "银行卡",
    gifts: "礼品卡",
    sms: "接码",
    accounts: "账号",
    login: "登录"
  };
  function AdminOverview() {
    const [data, setData] = useState(null);
    const [providers, setProviders] = useState([]);
    const [err, setErr] = useState(null);
    const [maintaining, setMaintaining] = useState(false);
    const [cleaningLogs, setCleaningLogs] = useState(false);
    const [cleaningHousekeeping, setCleaningHousekeeping] = useState(false);
    const [maintenanceMsg, setMaintenanceMsg] = useState(null);
    function loadOverview() {
      admApi("/admin/stats").then(setData).catch(() => setErr("加载失败，请检查网络或稍后重试"));
      admApi("/admin/provider-health").then(d => setProviders(d.providers || [])).catch(() => setProviders([]));
    }
    useEffect(() => {
      loadOverview();
    }, []);
    function expireStaleOrders() {
      setMaintaining(true);
      setMaintenanceMsg(null);
      admApi("/admin/orders/expire-stale", {
        method: "POST",
        body: JSON.stringify({})
      }).then(d => {
        setMaintenanceMsg(`已处理 ${fmt(d.expired || 0)} 单，退款 ${fmtCny(d.refundAmount || 0)}`);
        loadOverview();
      }).catch(() => setMaintenanceMsg("处理失败，请稍后重试")).finally(() => setMaintaining(false));
    }
    function cleanOldLogs() {
      setCleaningLogs(true);
      setMaintenanceMsg(null);
      admApi("/admin/log-retention/run", {
        method: "POST",
        body: JSON.stringify({})
      }).then(d => {
        const s = d.summary || {};
        setMaintenanceMsg(`日志已清理：审计 ${fmt(s.auditLogs || 0)} 条，订单事件 ${fmt(s.smsOrderEvents || 0)} 条`);
        loadOverview();
      }).catch(() => setMaintenanceMsg("日志清理失败，请稍后重试")).finally(() => setCleaningLogs(false));
    }
    function cleanHousekeeping() {
      setCleaningHousekeeping(true);
      setMaintenanceMsg(null);
      admApi("/admin/housekeeping/run", {
        method: "POST",
        body: JSON.stringify({})
      }).then(d => {
        const s = d.summary || {};
        setMaintenanceMsg(`临时数据已清理：登录 ${fmt(s.sessions || 0)} 条，访问记录 ${fmt(s.pageViews || 0)} 条`);
        loadOverview();
      }).catch(() => setMaintenanceMsg("临时数据清理失败，请稍后重试")).finally(() => setCleaningHousekeeping(false));
    }
    if (err) return React.createElement("div", {
      className: "adm-err adm-err--block"
    }, err);
    if (!data) return React.createElement("div", {
      className: "adm-loading"
    }, "\u52A0\u8F7D\u4E2D\u2026");
    const {
      users = {},
      orders = {},
      revenue = {},
      pageviews = [],
      risk = {},
      logRetention = {},
      housekeeping = {}
    } = data;
    const page_views = pageviews;
    const maxPv = Math.max(...page_views.map(x => Number(x.total) || 0), 1);
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u6982\u89C8"), React.createElement("div", {
      className: "adm-stat-grid"
    }, React.createElement(AdmStatCard, {
      label: "\u6CE8\u518C\u7528\u6237",
      value: fmt(users.total),
      sub: users.new_today ? `今日新增 ${users.new_today}` : null,
      accent: true
    }), React.createElement(AdmStatCard, {
      label: "\u5168\u90E8\u8BA2\u5355",
      value: fmt(orders.total)
    }), React.createElement(AdmStatCard, {
      label: "\u5DF2\u5B8C\u6210\u8BA2\u5355",
      value: fmt(orders.completed)
    }), React.createElement(AdmStatCard, {
      label: "\u7D2F\u8BA1\u6536\u5165",
      value: fmtCny(Number(revenue.total_cents || 0) / 100),
      accent: true
    })), React.createElement("div", {
      className: "adm-row"
    }, React.createElement("div", {
      className: "adm-card adm-row-cell"
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u8BA2\u5355\u72B6\u6001"), React.createElement("div", {
      className: "adm-stat-grid adm-stat-grid--inner"
    }, React.createElement(AdmStatCard, {
      label: "\u5F85\u5904\u7406",
      value: fmt(orders.pending || 0)
    }), React.createElement(AdmStatCard, {
      label: "\u5DF2\u5B8C\u6210",
      value: fmt(orders.completed || 0)
    }), React.createElement(AdmStatCard, {
      label: "\u5931\u8D25",
      value: fmt(orders.failed || 0)
    }), React.createElement(AdmStatCard, {
      label: "\u5DF2\u53D6\u6D88",
      value: fmt(orders.cancelled || 0)
    }))), React.createElement("div", {
      className: "adm-card adm-row-cell adm-row-cell--wide"
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u5404\u6A21\u5757\u6D4F\u89C8\u91CF"), page_views.length === 0 ? React.createElement("div", {
      className: "adm-empty"
    }, "\u6682\u65E0\u6D4F\u89C8\u6570\u636E") : React.createElement("div", {
      className: "adm-views-list"
    }, page_views.map(pv => {
      const pct = Math.max(Math.round(Number(pv.total) / maxPv * 100), 2);
      return React.createElement("div", {
        className: "adm-view-row",
        key: pv.page
      }, React.createElement("div", {
        className: "adm-view-name"
      }, PAGE_LABELS[pv.page] || pv.page), React.createElement("div", {
        className: "adm-view-bar-wrap"
      }, React.createElement("div", {
        className: "adm-view-bar",
        style: {
          width: pct + "%"
        }
      })), React.createElement("div", {
        className: "adm-view-count"
      }, fmt(pv.total)));
    })))), React.createElement("div", {
      className: "adm-card"
    }, React.createElement("div", {
      className: "adm-card-head adm-card-head--split"
    }, React.createElement("span", null, "\u8FD0\u8425\u98CE\u9669"), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: cleaningLogs,
      onClick: cleanOldLogs
    }, cleaningLogs ? "清理中" : "清理日志"), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: cleaningHousekeeping,
      onClick: cleanHousekeeping
    }, cleaningHousekeeping ? "清理中" : "清理临时数据"), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: maintaining,
      onClick: expireStaleOrders
    }, maintaining ? "处理中" : "清理超时订单")), React.createElement("div", {
      className: "adm-stat-grid adm-stat-grid--inner"
    }, React.createElement(AdmStatCard, {
      label: "24h \u5931\u8D25\u52A8\u4F5C",
      value: fmt(risk.failedActions24h || 0)
    }), React.createElement(AdmStatCard, {
      label: "24h \u767B\u5F55\u5931\u8D25",
      value: fmt(risk.failedLogins24h || 0)
    }), React.createElement(AdmStatCard, {
      label: "24h \u8D2D\u4E70\u5931\u8D25",
      value: fmt(risk.failedPurchases24h || 0)
    }), React.createElement(AdmStatCard, {
      label: "\u672A\u5B8C\u6210\u53F7\u7801",
      value: fmt(risk.activeSmsOrders || 0),
      sub: `涉及用户 ${fmt(risk.activeSmsUsers || 0)} 个`
    }), React.createElement(AdmStatCard, {
      label: "\u9AD8\u9891\u5931\u8D25 IP",
      value: fmt(risk.riskyIps24h || 0),
      sub: `失败来源 ${fmt(risk.uniqueFailedIps24h || 0)} 个`,
      accent: true
    }), React.createElement(AdmStatCard, {
      label: "\u65E5\u5FD7\u4FDD\u7559",
      value: logRetention.enabled ? `${fmt(logRetention.days || 30)} 天` : "未启用",
      sub: logRetention.lastRunAt ? `上次清理 ${fmtDate(logRetention.lastRunAt)}` : "每天自动检查"
    }), React.createElement(AdmStatCard, {
      label: "\u4E34\u65F6\u6570\u636E\u6E05\u7406",
      value: housekeeping.enabled ? `${fmt(housekeeping.pageViewRetentionDays || 90)} 天` : "未启用",
      sub: housekeeping.lastRunAt ? `上次清理 ${fmtDate(housekeeping.lastRunAt)}` : "每小时自动检查"
    })), maintenanceMsg && React.createElement("div", {
      className: "adm-maintenance-msg"
    }, maintenanceMsg)), React.createElement("div", {
      className: "adm-card"
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u4F9B\u5E94\u5546\u4F59\u989D"), providers.length === 0 ? React.createElement("div", {
      className: "adm-empty"
    }, "\u6682\u65E0\u4F9B\u5E94\u5546\u72B6\u6001") : React.createElement("div", {
      className: "adm-provider-list"
    }, providers.map(item => React.createElement("div", {
      className: "adm-provider-row",
      key: item.provider
    }, React.createElement("div", null, React.createElement("strong", null, item.providerName || item.provider), React.createElement("span", null, item.configured ? "已配置" : "未配置")), React.createElement("div", {
      className: "adm-provider-balance"
    }, item.balance === null ? "—" : `$${Number(item.balance || 0).toFixed(4)}`), React.createElement(AdmBadge, {
      s: item.status
    }))))));
  }
  function TopupModal({
    user,
    onClose,
    onDone
  }) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("手动充值");
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);
    function submit(e) {
      e.preventDefault();
      const n = Number(amount);
      if (!amount || isNaN(n) || n === 0) return setErr("请输入有效金额（正数充值 / 负数扣除）");
      setSubmitting(true);
      setErr(null);
      admApi("/admin/credit", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          amount: n,
          note
        })
      }).then(() => onDone()).catch(e => setErr("操作失败：" + e.message)).finally(() => {
        setSubmitting(false);
      });
    }
    return React.createElement("div", {
      className: "adm-overlay",
      onClick: onClose
    }, React.createElement("div", {
      className: "adm-modal",
      onClick: e => e.stopPropagation()
    }, React.createElement("div", {
      className: "adm-modal-head"
    }, React.createElement("span", {
      className: "adm-modal-title"
    }, "\u4F59\u989D\u8C03\u6574"), React.createElement("button", {
      className: "adm-modal-close",
      onClick: onClose
    }, "\xD7")), React.createElement("div", {
      className: "adm-modal-body"
    }, React.createElement("div", {
      className: "adm-modal-meta"
    }, user.email, "\xA0\xB7\xA0\u5F53\u524D\u4F59\u989D ", fmtCny(user.balance)), React.createElement("form", {
      onSubmit: submit
    }, React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u8C03\u6574\u91D1\u989D\uFF08\u5143\uFF0C\u6B63\u6570\u5145\u503C / \u8D1F\u6570\u6263\u9664\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      step: "0.01",
      value: amount,
      onChange: e => setAmount(e.target.value),
      placeholder: "\u5982\uFF1A50 \u6216 -20",
      autoFocus: true
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5907\u6CE8"), React.createElement("input", {
      className: "adm-input",
      value: note,
      onChange: e => setNote(e.target.value)
    })), err && React.createElement("div", {
      className: "adm-err",
      style: {
        marginBottom: 10
      }
    }, err), React.createElement("div", {
      className: "adm-modal-foot"
    }, React.createElement("button", {
      type: "button",
      className: "adm-btn adm-btn--outline",
      onClick: onClose
    }, "\u53D6\u6D88"), React.createElement("button", {
      type: "submit",
      className: "adm-btn adm-btn--primary",
      disabled: submitting
    }, submitting ? "处理中…" : "确认"))))));
  }
  function eventMetaText(meta) {
    if (!meta || Object.keys(meta).length === 0) return "—";
    try {
      return JSON.stringify(meta, null, 2);
    } catch {
      return "—";
    }
  }
  function OrderEventsModal({
    order,
    onClose
  }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    useEffect(() => {
      if (!order?.id) return;
      setLoading(true);
      setErr(null);
      admApi(`/admin/orders/${order.id}/events`).then(d => setEvents(d.events || [])).catch(() => setErr("加载失败，请稍后重试")).finally(() => setLoading(false));
    }, [order?.id]);
    return React.createElement("div", {
      className: "adm-overlay",
      onClick: onClose
    }, React.createElement("div", {
      className: "adm-modal adm-modal--wide",
      onClick: e => e.stopPropagation()
    }, React.createElement("div", {
      className: "adm-modal-head"
    }, React.createElement("span", {
      className: "adm-modal-title"
    }, "\u8BA2\u5355\u4E8B\u4EF6 #", order?.id), React.createElement("button", {
      className: "adm-modal-close",
      onClick: onClose
    }, "\xD7")), React.createElement("div", {
      className: "adm-modal-body"
    }, React.createElement("div", {
      className: "adm-modal-meta"
    }, order?.user_email || order?.email || "—", " \xB7 ", order?.country || "—", " / ", order?.product || "—"), loading && React.createElement("div", {
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026"), err && React.createElement("div", {
      className: "adm-err"
    }, err), !loading && !err && events.length === 0 && React.createElement("div", {
      className: "adm-empty"
    }, "\u6682\u65E0\u4E8B\u4EF6"), !loading && !err && events.length > 0 && React.createElement("div", {
      className: "adm-event-list"
    }, events.map(ev => React.createElement("div", {
      className: "adm-event-item",
      key: ev.id
    }, React.createElement("div", {
      className: "adm-event-top"
    }, React.createElement("strong", null, ev.type), React.createElement(AdmBadge, {
      s: ev.status
    }), React.createElement("span", null, fmtDate(ev.createdAt))), React.createElement("div", {
      className: "adm-event-sub"
    }, ev.provider || "内部", ev.publicCode ? ` · ${ev.publicCode}` : "", ev.message ? ` · ${ev.message}` : ""), React.createElement("code", {
      className: "adm-audit-meta adm-event-meta"
    }, eventMetaText(ev.metadata))))))));
  }
  function AdminUsers({
    currentUser
  }) {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [topupUser, setTopupUser] = useState(null);
    const [busyUserId, setBusyUserId] = useState(null);
    const [msg, setMsg] = useState(null);
    function load(p, query) {
      setLoading(true);
      admApi(`/admin/users?page=${p}&q=${encodeURIComponent(query || "")}`).then(d => {
        setUsers(d.users || []);
        setTotal(d.total || 0);
      }).catch(() => {}).finally(() => setLoading(false));
    }
    useEffect(() => {
      load(1, "");
    }, []);
    function setUserStatus(user, status) {
      const note = status === "suspended" ? "后台手动暂停" : "后台手动恢复";
      setBusyUserId(user.id);
      setMsg(null);
      admApi(`/admin/users/${user.id}/status`, {
        method: "POST",
        body: JSON.stringify({
          status,
          note
        })
      }).then(d => {
        const revoked = Number(d.sessionsRevoked || 0);
        setMsg(status === "suspended" ? `已暂停，清理会话 ${fmt(revoked)} 个` : "已恢复");
        load(page, q);
      }).catch(() => setMsg("操作失败，请稍后重试")).finally(() => setBusyUserId(null));
    }
    function revokeSessions(user) {
      if (!window.confirm(`确认让 ${user.email} 的所有登录态失效？`)) return;
      setBusyUserId(user.id);
      setMsg(null);
      admApi(`/admin/users/${user.id}/sessions/revoke`, {
        method: "POST",
        body: JSON.stringify({})
      }).then(d => setMsg(`已清理会话 ${fmt(d.sessionsRevoked || 0)} 个`)).catch(() => setMsg("操作失败，请稍后重试")).finally(() => setBusyUserId(null));
    }
    const currentAdminId = Number(currentUser?.id || 0);
    const currentAdminEmail = String(currentUser?.email || "").toLowerCase();
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u7528\u6237\u7BA1\u7406"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(total), " \u4EBA")), React.createElement("form", {
      className: "adm-search-row",
      onSubmit: e => {
        e.preventDefault();
        setPage(1);
        load(1, q);
      }
    }, React.createElement("input", {
      className: "adm-input",
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "\u641C\u7D22\u90AE\u7BB1\u2026"
    }), React.createElement("button", {
      className: "adm-btn adm-btn--primary",
      type: "submit"
    }, "\u641C\u7D22")), msg && React.createElement("div", {
      className: "adm-maintenance-msg"
    }, msg), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u90AE\u7BB1"), React.createElement("th", null, "\u72B6\u6001"), React.createElement("th", null, "\u4F59\u989D"), React.createElement("th", null, "\u6CE8\u518C\u65F6\u95F4"), React.createElement("th", null, "\u64CD\u4F5C"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 6,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026")), !loading && users.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 6,
      className: "adm-empty"
    }, "\u6682\u65E0\u6570\u636E")), users.map(u => {
      const isCurrentAdminUser = Number(u.id) === currentAdminId || String(u.email || "").toLowerCase() === currentAdminEmail;
      return React.createElement("tr", {
        key: u.id
      }, React.createElement("td", {
        className: "adm-td--mono"
      }, u.id), React.createElement("td", {
        className: "adm-td--email"
      }, u.email), React.createElement("td", null, React.createElement(AdmBadge, {
        s: u.status || "active"
      })), React.createElement("td", null, fmtCny(u.balance)), React.createElement("td", {
        className: "adm-td--date"
      }, fmtDate(u.created_at)), React.createElement("td", {
        className: "adm-actions-cell"
      }, React.createElement("button", {
        className: "adm-btn adm-btn--sm adm-btn--outline",
        onClick: () => setTopupUser(u)
      }, "\u8C03\u6574\u4F59\u989D"), isCurrentAdminUser ? React.createElement("span", {
        className: "adm-badge adm-badge--muted"
      }, "\u5F53\u524D\u7BA1\u7406\u5458") : React.createElement(React.Fragment, null, u.status === "suspended" ? React.createElement("button", {
        className: "adm-btn adm-btn--sm adm-btn--outline",
        disabled: busyUserId === u.id,
        onClick: () => setUserStatus(u, "active")
      }, "\u6062\u590D") : React.createElement("button", {
        className: "adm-btn adm-btn--sm adm-btn--outline",
        disabled: busyUserId === u.id,
        onClick: () => setUserStatus(u, "suspended")
      }, "\u6682\u505C"), React.createElement("button", {
        className: "adm-btn adm-btn--sm adm-btn--outline",
        disabled: busyUserId === u.id,
        onClick: () => revokeSessions(u)
      }, "\u6E05\u4F1A\u8BDD"))));
    }))), React.createElement(AdmPager, {
      page: page,
      hasMore: users.length >= 20,
      onPrev: () => {
        const p = page - 1;
        setPage(p);
        load(p, q);
      },
      onNext: () => {
        const p = page + 1;
        setPage(p);
        load(p, q);
      }
    })), topupUser && React.createElement(TopupModal, {
      user: topupUser,
      onClose: () => setTopupUser(null),
      onDone: () => {
        setTopupUser(null);
        load(page, q);
      }
    }));
  }
  const ORDER_FILTERS = [["", "全部"], ["pending", "待处理"], ["completed", "已完成"], ["failed", "失败"], ["cancelled", "已取消"], ["expired", "已超时"]];
  function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [busyOrderId, setBusyOrderId] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [eventOrder, setEventOrder] = useState(null);
    function load(p, s) {
      setLoading(true);
      const qs = s ? `&status=${s}` : "";
      admApi(`/admin/orders?page=${p}${qs}`).then(d => {
        setOrders(d.orders || []);
        setTotal(d.total || 0);
      }).catch(() => {}).finally(() => setLoading(false));
    }
    useEffect(() => {
      load(1, "");
    }, []);
    function canCloseOrder(order) {
      const s = String(order?.status || "").toLowerCase();
      return Boolean(s) && !["complete", "completed", "finish", "finished"].includes(s);
    }
    function closeOrder(order) {
      if (!order || !canCloseOrder(order)) return;
      if (!window.confirm(`确认关闭订单 #${order.id} 并按订单金额退款？`)) return;
      setBusyOrderId(order.id);
      setActionErr(null);
      admApi(`/admin/orders/${order.id}/close`, {
        method: "POST",
        body: JSON.stringify({
          note: "后台手动关闭"
        })
      }).then(() => load(page, status)).catch(() => setActionErr("操作失败，请稍后重试")).finally(() => setBusyOrderId(null));
    }
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u8BA2\u5355\u7BA1\u7406"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(total), " \u6761")), React.createElement("div", {
      className: "adm-filter-row"
    }, ORDER_FILTERS.map(([s, label]) => React.createElement("button", {
      key: s,
      className: `adm-filter-btn${status === s ? " is-active" : ""}`,
      onClick: () => {
        setStatus(s);
        setPage(1);
        load(1, s);
      }
    }, label))), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u7528\u6237"), React.createElement("th", null, "\u670D\u52A1"), React.createElement("th", null, "\u56FD\u5BB6"), React.createElement("th", null, "\u53F7\u7801"), React.createElement("th", null, "\u91D1\u989D"), React.createElement("th", null, "\u9000\u6B3E"), React.createElement("th", null, "\u72B6\u6001"), React.createElement("th", null, "\u65F6\u95F4"), React.createElement("th", null, "\u64CD\u4F5C"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 10,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026")), !loading && orders.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 10,
      className: "adm-empty"
    }, "\u6682\u65E0\u6570\u636E")), orders.map(o => React.createElement("tr", {
      key: o.id
    }, React.createElement("td", {
      className: "adm-td--mono"
    }, "#", o.id), React.createElement("td", {
      className: "adm-td--email"
    }, o.user_email || o.email || "—"), React.createElement("td", null, o.product || "—"), React.createElement("td", null, o.country || "—"), React.createElement("td", {
      className: "adm-td--mono"
    }, o.phone || "—"), React.createElement("td", null, fmtCny(Number(o.price_cents || 0) / 100)), React.createElement("td", null, Number(o.refund_cents || 0) > 0 ? fmtCny(Number(o.refund_cents || 0) / 100) : "—"), React.createElement("td", null, React.createElement(AdmBadge, {
      s: o.status
    })), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(o.created_at)), React.createElement("td", {
      className: "adm-actions-cell"
    }, React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      onClick: () => setEventOrder(o)
    }, "\u4E8B\u4EF6"), canCloseOrder(o) && Number(o.refund_cents || 0) <= 0 ? React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      disabled: busyOrderId === o.id,
      onClick: () => closeOrder(o)
    }, busyOrderId === o.id ? "处理中" : "关闭并退款") : Number(o.refund_cents || 0) > 0 ? "已退款" : "—"))))), actionErr && React.createElement("div", {
      className: "adm-err",
      style: {
        margin: "10px 16px"
      }
    }, actionErr), React.createElement(AdmPager, {
      page: page,
      hasMore: orders.length >= 20,
      onPrev: () => {
        const p = page - 1;
        setPage(p);
        load(p, status);
      },
      onNext: () => {
        const p = page + 1;
        setPage(p);
        load(p, status);
      }
    })), eventOrder && React.createElement(OrderEventsModal, {
      order: eventOrder,
      onClose: () => setEventOrder(null)
    }));
  }
  function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    function load(p) {
      setLoading(true);
      admApi(`/admin/logs?page=${p}`).then(d => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
      }).catch(() => {}).finally(() => setLoading(false));
    }
    useEffect(() => {
      load(1);
    }, []);
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u4F59\u989D\u6D41\u6C34"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(total), " \u6761")), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u7528\u6237"), React.createElement("th", null, "\u91D1\u989D"), React.createElement("th", null, "\u7C7B\u578B"), React.createElement("th", null, "\u5907\u6CE8"), React.createElement("th", null, "\u65F6\u95F4"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 6,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026")), !loading && logs.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 6,
      className: "adm-empty"
    }, "\u6682\u65E0\u6570\u636E")), logs.map(l => {
      const amountCny = Number(l.delta_cents || 0) / 100;
      const pos = amountCny >= 0;
      return React.createElement("tr", {
        key: l.id
      }, React.createElement("td", {
        className: "adm-td--mono"
      }, "#", l.id), React.createElement("td", {
        className: "adm-td--email"
      }, l.user_email || l.email || "—"), React.createElement("td", {
        className: `adm-td--amount${pos ? " adm-td--pos" : " adm-td--neg"}`
      }, pos ? "+" : "", fmtCny(amountCny)), React.createElement("td", null, React.createElement(AdmBadge, {
        s: l.type
      })), React.createElement("td", null, l.note || "—"), React.createElement("td", {
        className: "adm-td--date"
      }, fmtDate(l.created_at)));
    }))), React.createElement(AdmPager, {
      page: page,
      hasMore: logs.length >= 20,
      onPrev: () => {
        const p = page - 1;
        setPage(p);
        load(p);
      },
      onNext: () => {
        const p = page + 1;
        setPage(p);
        load(p);
      }
    })));
  }
  const VOUCHER_FILTERS = [["", "全部"], ["active", "可用"], ["redeemed", "已兑换"], ["void", "已作废"]];
  const AUDIT_STATUS_FILTERS = [["", "全部"], ["success", "成功"], ["failed", "失败"]];
  function auditStatusLabel(status) {
    if (status === "success") return "成功";
    if (status === "failed") return "失败";
    return status || "—";
  }
  function auditMetaText(meta) {
    if (!meta || Object.keys(meta).length === 0) return "—";
    try {
      return JSON.stringify(meta);
    } catch {
      return "—";
    }
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
      const qs = new URLSearchParams({
        page: String(p),
        limit: "20"
      });
      if (s) qs.set("status", s);
      if (q.trim()) qs.set("q", q.trim());
      admApi(`/admin/audit-logs?${qs.toString()}`).then(d => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
      }).catch(() => setMsg("加载失败，请稍后重试")).finally(() => setLoading(false));
    }
    useEffect(() => {
      load(1, "", "");
    }, []);
    function search(e) {
      e.preventDefault();
      setPage(1);
      load(1, status, query);
    }
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u5BA1\u8BA1\u65E5\u5FD7"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(total), " \u6761")), React.createElement("form", {
      className: "adm-search-row",
      onSubmit: search
    }, React.createElement("input", {
      className: "adm-input",
      value: query,
      onChange: e => setQuery(e.target.value),
      placeholder: "\u641C\u7D22 IP\u3001\u90AE\u7BB1\u3001\u52A8\u4F5C\u3001\u8DEF\u5F84..."
    }), React.createElement("button", {
      className: "adm-btn adm-btn--primary",
      type: "submit"
    }, "\u641C\u7D22")), React.createElement("div", {
      className: "adm-filter-row"
    }, AUDIT_STATUS_FILTERS.map(([s, label]) => React.createElement("button", {
      key: s,
      className: `adm-filter-btn${status === s ? " is-active" : ""}`,
      onClick: () => {
        setStatus(s);
        setPage(1);
        load(1, s, query);
      }
    }, label))), msg && React.createElement("div", {
      className: "adm-field-hint"
    }, msg), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table adm-table--audit"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u52A8\u4F5C"), React.createElement("th", null, "\u72B6\u6001"), React.createElement("th", null, "\u64CD\u4F5C\u8005"), React.createElement("th", null, "\u76EE\u6807\u7528\u6237"), React.createElement("th", null, "IP"), React.createElement("th", null, "\u8DEF\u5F84"), React.createElement("th", null, "\u8BE6\u60C5"), React.createElement("th", null, "\u65F6\u95F4"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 9,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026")), !loading && logs.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 9,
      className: "adm-empty"
    }, "\u6682\u65E0\u6570\u636E")), logs.map(l => React.createElement("tr", {
      key: l.id
    }, React.createElement("td", {
      className: "adm-td--mono"
    }, "#", l.id), React.createElement("td", {
      className: "adm-td--mono"
    }, l.action), React.createElement("td", null, React.createElement("span", {
      className: `adm-badge ${l.status === "success" ? "adm-badge--ok" : "adm-badge--err"}`
    }, auditStatusLabel(l.status))), React.createElement("td", {
      className: "adm-td--email"
    }, l.actorEmail || "—"), React.createElement("td", {
      className: "adm-td--email"
    }, l.targetEmail || "—"), React.createElement("td", {
      className: "adm-td--mono"
    }, l.ip || "—"), React.createElement("td", {
      className: "adm-audit-path"
    }, l.method ? `${l.method} ` : "", l.path || "—"), React.createElement("td", null, React.createElement("code", {
      className: "adm-audit-meta"
    }, auditMetaText(l.metadata))), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(l.createdAt)))))), React.createElement(AdmPager, {
      page: page,
      hasMore: logs.length >= 20,
      onPrev: () => {
        const p = page - 1;
        setPage(p);
        load(p, status, query);
      },
      onNext: () => {
        const p = page + 1;
        setPage(p);
        load(p, status, query);
      }
    })));
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
      admApi(`/admin/vouchers?page=${p}${qs}`).then(d => {
        setVouchers(d.vouchers || []);
        setTotal(d.total || 0);
      }).catch(() => setMsg("加载失败，请稍后重试")).finally(() => setLoading(false));
    }
    useEffect(() => {
      load(1, "");
    }, []);
    function createBatch(e) {
      e.preventDefault();
      setMsg("");
      setGenerated(null);
      admApi("/admin/voucher-batches", {
        method: "POST",
        body: JSON.stringify({
          amount,
          count,
          expiresAt,
          note
        })
      }).then(d => {
        setGenerated(d);
        setMsg(`已生成 ${d.count} 张充值券。`);
        setPage(1);
        load(1, status);
      }).catch(() => setMsg("生成失败，请检查金额和数量"));
    }
    function voidVoucher(voucher) {
      admApi(`/admin/vouchers/${voucher.id}/void`, {
        method: "POST"
      }).then(() => {
        setMsg("已作废。");
        load(page, status);
      }).catch(() => setMsg("作废失败"));
    }
    async function copyGenerated() {
      if (!generated?.codes?.length) return;
      await navigator.clipboard.writeText(generated.codes.join("\n"));
      setMsg("兑换码已复制。");
    }
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u5145\u503C\u5238"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(total), " \u5F20")), React.createElement("form", {
      className: "adm-card adm-voucher-form",
      onSubmit: createBatch
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u751F\u6210\u5145\u503C\u5238"), React.createElement("div", {
      className: "adm-settings-grid"
    }, React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5355\u5F20\u91D1\u989D\uFF08\u5143\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      step: "0.01",
      min: "0.01",
      value: amount,
      onChange: e => setAmount(e.target.value)
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u6570\u91CF"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "1",
      max: "200",
      value: count,
      onChange: e => setCount(e.target.value)
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u8FC7\u671F\u65F6\u95F4"), React.createElement("input", {
      className: "adm-input",
      type: "datetime-local",
      value: expiresAt,
      onChange: e => setExpiresAt(e.target.value)
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5907\u6CE8"), React.createElement("input", {
      className: "adm-input",
      value: note,
      onChange: e => setNote(e.target.value),
      placeholder: "\u4F8B\u5982\uFF1A\u8001\u5BA2\u6237\u8865\u8D34"
    }))), React.createElement("div", {
      className: "adm-settings-actions"
    }, React.createElement("button", {
      className: "adm-btn adm-btn--primary",
      type: "submit"
    }, "\u751F\u6210\u5151\u6362\u7801")), generated?.codes?.length ? React.createElement("div", {
      className: "adm-generated"
    }, React.createElement("div", {
      className: "adm-generated-head"
    }, React.createElement("strong", null, generated.batchId), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      type: "button",
      onClick: copyGenerated
    }, "\u590D\u5236\u5168\u90E8")), React.createElement("textarea", {
      className: "adm-input adm-generated-codes",
      readOnly: true,
      value: generated.codes.join("\n")
    })) : null, msg && React.createElement("div", {
      className: "adm-field-hint"
    }, msg)), React.createElement("div", {
      className: "adm-filter-row"
    }, VOUCHER_FILTERS.map(([s, label]) => React.createElement("button", {
      key: s,
      className: `adm-filter-btn${status === s ? " is-active" : ""}`,
      onClick: () => {
        setStatus(s);
        setPage(1);
        load(1, s);
      }
    }, label))), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u6279\u6B21"), React.createElement("th", null, "\u5C3E\u53F7"), React.createElement("th", null, "\u91D1\u989D"), React.createElement("th", null, "\u72B6\u6001"), React.createElement("th", null, "\u5151\u6362\u7528\u6237"), React.createElement("th", null, "\u8FC7\u671F\u65F6\u95F4"), React.createElement("th", null, "\u521B\u5EFA\u65F6\u95F4"), React.createElement("th", null, "\u64CD\u4F5C"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 9,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D\u2026")), !loading && vouchers.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 9,
      className: "adm-empty"
    }, "\u6682\u65E0\u6570\u636E")), vouchers.map(v => React.createElement("tr", {
      key: v.id
    }, React.createElement("td", {
      className: "adm-td--mono"
    }, "#", v.id), React.createElement("td", {
      className: "adm-td--mono"
    }, v.batchId), React.createElement("td", {
      className: "adm-td--mono"
    }, "\u2022\u2022\u2022\u2022", v.codeSuffix), React.createElement("td", null, fmtCny(v.amount)), React.createElement("td", null, React.createElement(AdmBadge, {
      s: v.status
    })), React.createElement("td", {
      className: "adm-td--email"
    }, v.redeemedBy || "—"), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(v.expiresAt)), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(v.createdAt)), React.createElement("td", null, v.status === "active" ? React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      onClick: () => voidVoucher(v)
    }, "\u4F5C\u5E9F") : "—"))))), React.createElement(AdmPager, {
      page: page,
      hasMore: vouchers.length >= 30,
      onPrev: () => {
        const p = page - 1;
        setPage(p);
        load(p, status);
      },
      onNext: () => {
        const p = page + 1;
        setPage(p);
        load(p, status);
      }
    })));
  }
  function AdminAnnouncements() {
    const emptyForm = {
      title: "",
      body: "",
      linkLabel: "",
      linkUrl: "",
      priority: "0",
      status: "active",
      startsAt: "",
      endsAt: ""
    };
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    function load() {
      setLoading(true);
      admApi("/admin/announcements").then(d => setItems(d.announcements || [])).catch(() => setMsg("公告加载失败，请稍后重试")).finally(() => setLoading(false));
    }
    useEffect(() => {
      load();
    }, []);
    function updateField(key, value) {
      setForm(prev => ({
        ...prev,
        [key]: value
      }));
    }
    function resetForm() {
      setForm(emptyForm);
      setEditingId(null);
    }
    function edit(item) {
      setEditingId(item.id);
      setForm({
        title: item.title || "",
        body: item.body || "",
        linkLabel: item.linkLabel || "",
        linkUrl: item.linkUrl || "",
        priority: String(item.priority || 0),
        status: item.status || "active",
        startsAt: toDateTimeLocal(item.startsAt),
        endsAt: toDateTimeLocal(item.endsAt)
      });
      setMsg("");
    }
    function save(e) {
      e.preventDefault();
      const path = editingId ? `/admin/announcements/${editingId}` : "/admin/announcements";
      const method = editingId ? "PATCH" : "POST";
      const payload = {
        ...form,
        startsAt: fromDateTimeLocal(form.startsAt),
        endsAt: fromDateTimeLocal(form.endsAt)
      };
      setMsg("");
      admApi(path, {
        method,
        body: JSON.stringify(payload)
      }).then(() => {
        setMsg(editingId ? "公告已更新" : "公告已发布");
        resetForm();
        load();
      }).catch(() => setMsg("保存失败，请检查标题、内容和链接"));
    }
    function pause(item) {
      admApi(`/admin/announcements/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          linkLabel: item.linkLabel,
          linkUrl: item.linkUrl,
          priority: item.priority,
          status: "paused",
          startsAt: item.startsAt,
          endsAt: item.endsAt
        })
      }).then(() => {
        setMsg("公告已下线");
        load();
      }).catch(() => setMsg("下线失败，请稍后重试"));
    }
    function remove(item) {
      if (!window.confirm(`删除公告：${item.title}？`)) return;
      admApi(`/admin/announcements/${item.id}`, {
        method: "DELETE"
      }).then(() => {
        setMsg("公告已删除");
        if (editingId === item.id) resetForm();
        load();
      }).catch(() => setMsg("删除失败，请稍后重试"));
    }
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("div", {
      className: "adm-page-head"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u516C\u544A\u7BA1\u7406"), React.createElement("span", {
      className: "adm-count"
    }, "\u5171 ", fmt(items.length), " \u6761")), React.createElement("form", {
      className: "adm-card adm-voucher-form",
      onSubmit: save
    }, React.createElement("div", {
      className: "adm-card-head"
    }, editingId ? "编辑公告" : "发布公告"), React.createElement("div", {
      className: "adm-settings-grid"
    }, React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u6807\u9898"), React.createElement("input", {
      className: "adm-input",
      value: form.title,
      onChange: e => updateField("title", e.target.value),
      placeholder: "\u4F8B\u5982\uFF1A\u63A5\u7801\u670D\u52A1\u7EF4\u62A4\u901A\u77E5"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u72B6\u6001"), React.createElement("select", {
      className: "adm-input",
      value: form.status,
      onChange: e => updateField("status", e.target.value)
    }, React.createElement("option", {
      value: "active"
    }, "\u542F\u7528"), React.createElement("option", {
      value: "paused"
    }, "\u6682\u505C"), React.createElement("option", {
      value: "draft"
    }, "\u8349\u7A3F"))), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u4F18\u5148\u7EA7"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "0",
      max: "100",
      value: form.priority,
      onChange: e => updateField("priority", e.target.value)
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u6309\u94AE\u6587\u5B57"), React.createElement("input", {
      className: "adm-input",
      value: form.linkLabel,
      onChange: e => updateField("linkLabel", e.target.value),
      placeholder: "\u53EF\u4E0D\u586B"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u6309\u94AE\u94FE\u63A5"), React.createElement("input", {
      className: "adm-input",
      value: form.linkUrl,
      onChange: e => updateField("linkUrl", e.target.value),
      placeholder: "/sms \u6216 https://hkai.shop/sms"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5F00\u59CB\u663E\u793A"), React.createElement("input", {
      className: "adm-input",
      type: "datetime-local",
      value: form.startsAt,
      onChange: e => updateField("startsAt", e.target.value)
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u7ED3\u675F\u663E\u793A"), React.createElement("input", {
      className: "adm-input",
      type: "datetime-local",
      value: form.endsAt,
      onChange: e => updateField("endsAt", e.target.value)
    })), React.createElement("div", {
      className: "adm-field adm-field--wide"
    }, React.createElement("label", null, "\u5185\u5BB9"), React.createElement("textarea", {
      className: "adm-input",
      rows: "4",
      value: form.body,
      onChange: e => updateField("body", e.target.value),
      placeholder: "\u5199\u7ED9\u7528\u6237\u770B\u7684\u516C\u544A\u5185\u5BB9"
    }))), React.createElement("div", {
      className: "adm-settings-actions"
    }, React.createElement("button", {
      className: "adm-btn adm-btn--primary",
      type: "submit"
    }, editingId ? "保存公告" : "发布公告"), editingId && React.createElement("button", {
      className: "adm-btn adm-btn--outline",
      type: "button",
      onClick: resetForm
    }, "\u53D6\u6D88\u7F16\u8F91")), msg && React.createElement("div", {
      className: "adm-field-hint"
    }, msg)), React.createElement("div", {
      className: "adm-card adm-card--table"
    }, React.createElement("table", {
      className: "adm-table"
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "ID"), React.createElement("th", null, "\u6807\u9898"), React.createElement("th", null, "\u72B6\u6001"), React.createElement("th", null, "\u4F18\u5148\u7EA7"), React.createElement("th", null, "\u5C55\u793A\u65F6\u95F4"), React.createElement("th", null, "\u94FE\u63A5"), React.createElement("th", null, "\u66F4\u65B0\u65F6\u95F4"), React.createElement("th", null, "\u64CD\u4F5C"))), React.createElement("tbody", null, loading && React.createElement("tr", null, React.createElement("td", {
      colSpan: 8,
      className: "adm-empty"
    }, "\u52A0\u8F7D\u4E2D...")), !loading && items.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 8,
      className: "adm-empty"
    }, "\u6682\u65E0\u516C\u544A")), items.map(item => React.createElement("tr", {
      key: item.id
    }, React.createElement("td", {
      className: "adm-td--mono"
    }, "#", item.id), React.createElement("td", null, item.title), React.createElement("td", null, React.createElement(AdmBadge, {
      s: item.status
    })), React.createElement("td", null, item.priority), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(item.startsAt), " \u81F3 ", fmtDate(item.endsAt)), React.createElement("td", null, item.linkUrl || "—"), React.createElement("td", {
      className: "adm-td--date"
    }, fmtDate(item.updatedAt || item.createdAt)), React.createElement("td", null, React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      type: "button",
      onClick: () => edit(item)
    }, "\u7F16\u8F91"), item.status === "active" && React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      type: "button",
      onClick: () => pause(item)
    }, "\u4E0B\u7EBF"), React.createElement("button", {
      className: "adm-btn adm-btn--sm adm-btn--outline",
      type: "button",
      onClick: () => remove(item)
    }, "\u5220\u9664"))))))));
  }
  function AdminSettings() {
    const [cfg, setCfg] = useState({
      SMS_USD_CNY_RATE: "",
      SMS_MARGIN_CNY: "",
      SMS_ACTIVE_ORDER_LIMIT: "",
      SMS_BUY_COOLDOWN_SECONDS: "",
      SMS_ORDER_TIMEOUT_MINUTES: "",
      SMS_MAINTENANCE_INTERVAL_SECONDS: "",
      SMS_MAINTENANCE_BATCH_LIMIT: "",
      TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      FIVESIM_API_KEY: "",
      SMSPOOL_API_KEY: "",
      BEESMS_API_TOKEN: ""
    });
    const [secrets, setSecrets] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    useEffect(() => {
      admApi("/admin/settings").then(d => {
        setCfg(c => ({
          ...c,
          ...(d.settings || {})
        }));
        setSecrets(d.secrets || {});
        setLoading(false);
      }).catch(() => setLoading(false));
    }, []);
    function save(e) {
      e.preventDefault();
      setSaving(true);
      setMsg(null);
      admApi("/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          settings: cfg
        })
      }).then(d => {
        setCfg(c => ({
          ...c,
          ...(d.settings || {}),
          FIVESIM_API_KEY: "",
          SMSPOOL_API_KEY: "",
          BEESMS_API_TOKEN: "",
          TURNSTILE_SECRET_KEY: ""
        }));
        setSecrets(d.secrets || {});
        setMsg({
          ok: true,
          text: "设置已保存"
        });
      }).catch(() => setMsg({
        ok: false,
        text: "保存失败，请重试"
      })).finally(() => {
        setSaving(false);
      });
    }
    if (loading) return React.createElement("div", {
      className: "adm-loading"
    }, "\u52A0\u8F7D\u4E2D\u2026");
    return React.createElement("div", {
      className: "adm-content-inner"
    }, React.createElement("h2", {
      className: "adm-page-title"
    }, "\u7CFB\u7EDF\u8BBE\u7F6E"), React.createElement("form", {
      onSubmit: save,
      className: "adm-settings-form"
    }, React.createElement("div", {
      className: "adm-settings-grid"
    }, React.createElement("div", {
      className: "adm-card"
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u63A5\u7801\u5B9A\u4EF7"), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u7F8E\u5143\u6C47\u7387\uFF081 USD = ? \u5143\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "1",
      max: "20",
      step: "0.01",
      value: cfg.SMS_USD_CNY_RATE || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_USD_CNY_RATE: e.target.value
      })),
      placeholder: "7.2"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u56FA\u5B9A\u52A0\u4EF7\uFF08\u5143/\u5355\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "0.01",
      max: "500",
      step: "0.01",
      value: cfg.SMS_MARGIN_CNY || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_MARGIN_CNY: e.target.value
      })),
      placeholder: "10"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5355\u7528\u6237\u672A\u5B8C\u6210\u53F7\u7801\u4E0A\u9650"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "1",
      max: "20",
      step: "1",
      value: cfg.SMS_ACTIVE_ORDER_LIMIT || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_ACTIVE_ORDER_LIMIT: e.target.value
      })),
      placeholder: "3"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u540C\u7528\u6237\u4E0B\u5355\u95F4\u9694\uFF08\u79D2\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "0",
      max: "3600",
      step: "1",
      value: cfg.SMS_BUY_COOLDOWN_SECONDS || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_BUY_COOLDOWN_SECONDS: e.target.value
      })),
      placeholder: "10"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u8BA2\u5355\u8D85\u65F6\u5173\u95ED\uFF08\u5206\u949F\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "5",
      max: "180",
      step: "1",
      value: cfg.SMS_ORDER_TIMEOUT_MINUTES || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_ORDER_TIMEOUT_MINUTES: e.target.value
      })),
      placeholder: "30"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u81EA\u52A8\u6E05\u7406\u95F4\u9694\uFF08\u79D2\uFF09"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "10",
      max: "3600",
      step: "1",
      value: cfg.SMS_MAINTENANCE_INTERVAL_SECONDS || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_MAINTENANCE_INTERVAL_SECONDS: e.target.value
      })),
      placeholder: "60"
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "\u5355\u6B21\u6E05\u7406\u4E0A\u9650"), React.createElement("input", {
      className: "adm-input",
      type: "number",
      min: "1",
      max: "500",
      step: "1",
      value: cfg.SMS_MAINTENANCE_BATCH_LIMIT || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMS_MAINTENANCE_BATCH_LIMIT: e.target.value
      })),
      placeholder: "100"
    }))), React.createElement("div", {
      className: "adm-card"
    }, React.createElement("div", {
      className: "adm-card-head"
    }, "\u5BC6\u94A5\u914D\u7F6E"), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "5sim API \u5BC6\u94A5"), React.createElement("input", {
      className: "adm-input",
      type: "password",
      maxLength: "4096",
      value: cfg.FIVESIM_API_KEY || "",
      onChange: e => setCfg(c => ({
        ...c,
        FIVESIM_API_KEY: e.target.value
      })),
      placeholder: secrets.FIVESIM_API_KEY?.configured ? "已设置，填新密钥后替换" : "未设置"
    }), React.createElement("div", {
      className: "adm-field-hint"
    }, secrets.FIVESIM_API_KEY?.configured ? `当前 ${secrets.FIVESIM_API_KEY.masked}` : "当前未设置")), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "SMSPool API \u5BC6\u94A5"), React.createElement("input", {
      className: "adm-input",
      type: "password",
      maxLength: "4096",
      value: cfg.SMSPOOL_API_KEY || "",
      onChange: e => setCfg(c => ({
        ...c,
        SMSPOOL_API_KEY: e.target.value
      })),
      placeholder: secrets.SMSPOOL_API_KEY?.configured ? "已设置，填新密钥后替换" : "未设置"
    }), React.createElement("div", {
      className: "adm-field-hint"
    }, secrets.SMSPOOL_API_KEY?.configured ? `当前 ${secrets.SMSPOOL_API_KEY.masked}` : "当前未设置")), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "Bee-SMS API Token"), React.createElement("input", {
      className: "adm-input",
      type: "password",
      maxLength: "4096",
      value: cfg.BEESMS_API_TOKEN || "",
      onChange: e => setCfg(c => ({
        ...c,
        BEESMS_API_TOKEN: e.target.value
      })),
      placeholder: secrets.BEESMS_API_TOKEN?.configured ? "已设置，填新 Token 后替换" : "未设置"
    }), React.createElement("div", {
      className: "adm-field-hint"
    }, secrets.BEESMS_API_TOKEN?.configured ? `当前 ${secrets.BEESMS_API_TOKEN.masked}` : "当前未设置")), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "Turnstile \u7AD9\u70B9\u5BC6\u94A5"), React.createElement("input", {
      className: "adm-input",
      maxLength: "200",
      value: cfg.TURNSTILE_SITE_KEY || "",
      onChange: e => setCfg(c => ({
        ...c,
        TURNSTILE_SITE_KEY: e.target.value
      })),
      placeholder: "0x4AAAA..."
    })), React.createElement("div", {
      className: "adm-field"
    }, React.createElement("label", null, "Turnstile \u79C1\u94A5"), React.createElement("input", {
      className: "adm-input",
      type: "password",
      maxLength: "4096",
      value: cfg.TURNSTILE_SECRET_KEY || "",
      onChange: e => setCfg(c => ({
        ...c,
        TURNSTILE_SECRET_KEY: e.target.value
      })),
      placeholder: secrets.TURNSTILE_SECRET_KEY?.configured ? "已设置，填新私钥后替换" : "未设置"
    }), React.createElement("div", {
      className: "adm-field-hint"
    }, secrets.TURNSTILE_SECRET_KEY?.configured ? `当前 ${secrets.TURNSTILE_SECRET_KEY.masked}` : "当前未设置")))), msg && React.createElement("div", {
      className: msg.ok ? "adm-msg-ok" : "adm-err",
      style: {
        marginTop: 12,
        marginBottom: 12
      }
    }, msg.text), React.createElement("div", {
      className: "adm-settings-actions"
    }, React.createElement("button", {
      type: "submit",
      className: "adm-btn adm-btn--primary",
      disabled: saving
    }, saving ? "保存中…" : "保存设置"))));
  }
  const ADM_NAV = [{
    id: "announcements",
    label: "公告管理"
  }, {
    id: "overview",
    label: "概览"
  }, {
    id: "users",
    label: "用户管理"
  }, {
    id: "orders",
    label: "订单管理"
  }, {
    id: "logs",
    label: "余额流水"
  }, {
    id: "audit",
    label: "审计日志"
  }, {
    id: "vouchers",
    label: "充值券"
  }, {
    id: "settings",
    label: "系统设置"
  }];
  function AdminDesk() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState("overview");
    useEffect(() => {
      fetch("/api/auth/me", {
        credentials: "include"
      }).then(r => r.json()).then(d => {
        if (!d.user || d.user.role !== "admin") {
          window.location.href = "/login?next=" + encodeURIComponent("/admin");
        } else {
          setUser(d.user);
          setChecking(false);
        }
      }).catch(() => {
        window.location.href = "/login?next=/admin";
      });
    }, []);
    if (checking) {
      return React.createElement("div", {
        className: "adm-gate"
      }, React.createElement("div", {
        className: "adm-gate-inner"
      }, "\u6B63\u5728\u9A8C\u8BC1\u7BA1\u7406\u5458\u6743\u9650\u2026"));
    }
    function logout() {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      }).finally(() => {
        window.location.href = "/";
      });
    }
    return React.createElement("div", {
      className: "adm-shell"
    }, React.createElement("aside", {
      className: "adm-sidebar"
    }, React.createElement("div", {
      className: "adm-sidebar-brand"
    }, React.createElement("span", {
      className: "adm-brand-mark"
    }, React.createElement("img", {
      src: "/images/brand/blue-cat.svg",
      alt: "",
      "aria-hidden": "true"
    })), React.createElement("div", null, React.createElement("div", {
      className: "adm-brand-name"
    }, "Blooming"), React.createElement("div", {
      className: "adm-brand-sub"
    }, "\u540E\u53F0\u7BA1\u7406"))), React.createElement("nav", {
      className: "adm-nav"
    }, ADM_NAV.map(item => React.createElement("button", {
      key: item.id,
      className: `adm-nav-item${tab === item.id ? " is-active" : ""}`,
      onClick: () => setTab(item.id)
    }, item.label))), React.createElement("div", {
      className: "adm-sidebar-foot"
    }, React.createElement("div", {
      className: "adm-sidebar-user"
    }, user.email), React.createElement("a", {
      href: "/",
      className: "adm-sidebar-link"
    }, "\u2190 \u8FD4\u56DE\u4E3B\u7AD9"), React.createElement("button", {
      className: "adm-sidebar-logout",
      onClick: logout
    }, "\u9000\u51FA\u767B\u5F55"))), React.createElement("main", {
      className: "adm-main"
    }, tab === "announcements" && React.createElement(AdminAnnouncements, null), tab === "overview" && React.createElement(AdminOverview, null), tab === "users" && React.createElement(AdminUsers, {
      currentUser: user
    }), tab === "orders" && React.createElement(AdminOrders, null), tab === "logs" && React.createElement(AdminLogs, null), tab === "audit" && React.createElement(AdminAuditLogs, null), tab === "vouchers" && React.createElement(AdminVouchers, null), tab === "settings" && React.createElement(AdminSettings, null)));
  }
  window.AdminDesk = AdminDesk;
})();
})();
