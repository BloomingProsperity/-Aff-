/* 花开SHOP — 详情视图：/cards/<slug> 银行卡 + /shop/<slug> 礼品卡。
   卡面用 img + SVG mock 作 fallback；若 data.js 里的卡有 officialArt 字段则用它。 */

const CARDS_BY_SLUG = Object.fromEntries(window.CARDS.map(c => [c.slug, c]));
const GIFTS_BY_SLUG = Object.fromEntries(window.GIFT_CARDS.map(g => [g.slug, g]));
const TUTORIALS = window.TUTORIALS;
const FUNDING_GUIDES = window.FUNDING_GUIDES || {};
const GIFT_DETAILS = window.GIFT_DETAILS;
const cardArt = window.cardArt;
const giftArt = window.giftArt;

const dHomeHref = (section = "") => {
  if (!section) return "/";
  if (section === "faq") return "/faq";
  if (section === "cards") return "/cards";
  if (section === "gifts") return "/shop";
  if (section === "mail") return "/mail";
  return "/";
};
const dCardHref = slug => `/cards/${slug}`;
const dGiftHref = slug => `/shop/${slug}`;
const dGiftBuyHref = (slug, region) => region ? `/shop/${slug}/buy/${region}` : `/shop/${slug}/buy`;
const scrollToAnchor = id => {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};
const asArray = value => Array.isArray(value) ? value : (value ? [value] : []);
const tutorialAnchor = step => `tutorial-step-${step.n}`;
const fundingAnchor = index => `funding-item-${String(index + 1).padStart(2, "0")}`;

const CURRENCY_SYMBOLS = {
  USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", EUR: "€", GBP: "£", JPY: "¥",
  HKD: "HK$", SGD: "S$", TWD: "NT$", KRW: "₩", CNY: "¥", INR: "₹", BRL: "R$",
  MXN: "$", CHF: "CHF", PLN: "zł", NOK: "kr", SEK: "kr", DKK: "kr", THB: "฿",
  VND: "₫", PHP: "₱", IDR: "Rp", MYR: "RM", ZAR: "R", AED: "AED", SAR: "SAR",
  QAR: "QAR", KWD: "KWD", ILS: "₪", UAH: "₴", KZT: "₸", COP: "COP", CLP: "CLP",
  PEN: "S/", TRY: "TRY", ARS: "ARS", CRC: "CRC", UYU: "UYU", RSD: "RSD", IQD: "IQD",
};
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "IDR", "CLP", "COP", "IQD"]);
const GIFT_AMOUNT_MODELS = {
  apple: {
    mode: "custom",
    presets: [25, 50, 100],
    min: 10,
    max: 500,
    hint: "先选国家/地区，再按该区币种填写需要的金额。"
  },
  steam: {
    mode: "fixed",
    presets: [5, 10, 25, 50, 100],
    min: 5,
    max: 100,
    hint: "Steam 数字礼品卡按固定档位选择。"
  },
  netflix: {
    mode: "custom",
    presets: [25, 50, 100],
    min: 15,
    max: 200,
    hint: "Netflix 礼品卡按所选国家/账单币种下单。"
  },
  google: {
    mode: "mixed",
    presets: [10, 15, 25, 50, 100],
    min: 5,
    max: 500,
    hint: "Google Play 以该国家官方面额和范围为准。"
  },
  psn: {
    mode: "mixed",
    presets: [10, 25, 50, 75, 100],
    min: 10,
    max: 250,
    hint: "PlayStation 礼品卡按账号地区选择对应币种。"
  },
  battlenet: {
    mode: "custom",
    presets: [1, 10, 20, 50, 100],
    min: 1,
    max: 500,
    hint: "Battle.net Balance 是余额金额输入，不同币种有不同最低金额。"
  },
};
const GIFT_REGION_AMOUNT_OVERRIDES = {
  battlenet: {
    MX: { min: 60, presets: [60, 120, 250, 500, 1000] },
    AR: { min: 20, presets: [20, 100, 500, 1000, 2000] },
    CL: { min: 2400, presets: [2400, 5000, 10000, 25000, 50000] },
  },
};

function currencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || "";
}

function amountModelFor(slug, region) {
  const base = GIFT_AMOUNT_MODELS[slug] || GIFT_AMOUNT_MODELS.apple;
  const regionPatch = (GIFT_REGION_AMOUNT_OVERRIDES[slug] || {})[region.code] || {};
  return { ...base, ...regionPatch };
}

function amountStep(currency) {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 1;
}

function formatGiftAmount(value, currency) {
  const number = Number(value);
  if (!Number.isFinite(number)) return `${currencySymbol(currency)}0`;
  try {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    }).format(number);
  } catch (error) {
    return `${currencySymbol(currency)}${number.toLocaleString("zh-CN")}`;
  }
}

function defaultGiftAmount(slug, region) {
  const model = amountModelFor(slug, region);
  return String(model.presets[0] || model.min || 10);
}

function giftAmountStatus(slug, region, amount) {
  const model = amountModelFor(slug, region);
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "请输入购买金额。";
  if (model.min && value < model.min) return `最低从 ${formatGiftAmount(model.min, region.currency)} 起。`;
  if (model.max && value > model.max) return `最高先按 ${formatGiftAmount(model.max, region.currency)} 内填写。`;
  if (model.mode === "fixed" && !model.presets.includes(value)) return "这个产品按固定官方档位下单，直接点上面的面额按钮。";
  return model.hint;
}

function buildGiftOrderText(d, region, amount) {
  return `${d.name} / ${region.name} ${region.currency} / ${formatGiftAmount(amount, region.currency)}`;
}

function TutorialStep({ step, anchorId }) {
  const actions = asArray(step.actions);
  const checks = asArray(step.checks);
  const warnings = asArray(step.warnings || step.warn);

  return (
    <li className="step" id={anchorId}>
      <div className="step-num">{step.n}</div>
      <div className="step-body">
        <div className="step-copy">
          <h3 className="step-title">{step.t}</h3>
          <p className="step-text">{step.b}</p>
          {actions.length > 0 && (
            <ol className="step-actions">
              {actions.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          )}
          {checks.length > 0 && (
            <div className="step-callout step-callout--ok">
              <strong>检查点</strong>
              <ul>
                {checks.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="step-callout step-callout--warn">
              <strong>细节补充</strong>
              <ul>
                {warnings.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function FundingBlock({ item, anchorId }) {
  const actions = asArray(item.actions);
  const checks = asArray(item.checks);
  const warnings = asArray(item.warnings || item.warn);

  return (
    <article className="funding-card" id={anchorId}>
      <div className="funding-copy">
        <h3 className="funding-title">{item.t}</h3>
        <p className="funding-text">{item.b}</p>
        {actions.length > 0 && (
          <ul className="funding-actions">
            {actions.map((action, i) => <li key={i}>{action}</li>)}
          </ul>
        )}
        {checks.length > 0 && (
          <div className="funding-note">
            <strong>确认</strong>
            <ul>{checks.map((check, i) => <li key={i}>{check}</li>)}</ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="funding-note funding-note--warn">
            <strong>注意</strong>
            <ul>{warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
          </div>
        )}
      </div>
    </article>
  );
}

function DetailToc({ steps, funding }) {
  return (
    <section className="toc-section" aria-label="目录">
      <div className="wrap">
        <div className="toc-box">
          <div className="toc-head">
            <div>
              <div className="ca-kicker">目录</div>
              <h2 className="toc-title">本页内容</h2>
            </div>
            <span className="ca-meta">{steps.length} 章开卡教程{funding.length ? ` / ${funding.length} 条入金方式` : ""}</span>
          </div>
          <div className="toc-grid">
            <div className="toc-group">
              <h3 className="toc-group-title">开卡教程</h3>
              <ol className="toc-list">
                {steps.map(step => (
                <li key={step.n}>
                  <button
                    className="toc-link"
                    type="button"
                    onClick={() => scrollToAnchor(tutorialAnchor(step))}
                  >
                    <span className="toc-num">{step.n}</span>
                    <span>{step.t}</span>
                  </button>
                </li>
                ))}
              </ol>
            </div>
            {funding.length > 0 && (
              <div className="toc-group">
                <h3 className="toc-group-title">入金方式</h3>
                <ol className="toc-list">
                  {funding.map((item, i) => (
                    <li key={item.t || i}>
                      <button
                        className="toc-link"
                        type="button"
                        onClick={() => scrollToAnchor(fundingAnchor(i))}
                      >
                        <span className="toc-num">{String(i + 1).padStart(2, "0")}</span>
                        <span>{item.t}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 顶栏（共用） ──────────────────────────────────────────
function DetailHeader({ back = "/", backLabel = "全部产品" }) {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setUser(d.user || null))
      .catch(() => {});
  }, []);
  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      .finally(() => setUser(null));
  };
  return (
    <header className="hdr hdr--detail">
      <div className="hdr-inner">
        <a href="/" className="brand">
          <span className="ca-brand-mark">花</span>
          <span className="brand-word">
            <span className="brand-zh">花开SHOP</span>
            <span className="brand-en">HKAI SHOP</span>
          </span>
        </a>
        <nav className="hdr-nav">
          <a className="hdr-tab" href="/">首页</a>
          <a className="hdr-tab" href={dHomeHref("cards")}>银行卡</a>
          <a className="hdr-tab" href={dHomeHref("gifts")}>礼品卡</a>
          <a className="hdr-tab" href="/sms">接码</a>
          <a className="hdr-tab" href="/accounts">账号</a>
          <a className="hdr-tab" href={dHomeHref("faq")}>常见问题</a>
        </nav>
        <div className="hdr-right">
          <a className="hdr-link" href={back}>返回{backLabel}</a>
          {user ? (
            <div className="hdr-user">
              <span className="hdr-user-email">{user.email}</span>
              <button className="ca-button ca-button--outline hdr-logout" onClick={handleLogout}>退出</button>
            </div>
          ) : (
            <a className="ca-button ca-button--outline" href={"/login?next=" + encodeURIComponent(window.location.pathname)}>登录</a>
          )}
          <a className="ca-button ca-button--primary" href="https://t.me/Whohaoe" target="_blank" rel="noopener">加入社群</a>
        </div>
      </div>
    </header>
  );
}

// ── 银行卡详情 ────────────────────────────────────────────
function CardDetail({ slug }) {
  const card = CARDS_BY_SLUG[slug];
  if (!card) return <NotFound />;
  const steps = TUTORIALS[slug] || [];
  const funding = FUNDING_GUIDES[slug] || [];
  const actionCount = steps.reduce((sum, s) => sum + asArray(s.actions).length, 0);
  const others = window.CARDS.filter(c => c.slug !== slug).slice(0, 3);
  const applyUrl = card.applyUrl || "https://t.me/Whohaoe";
  const applyTarget = applyUrl.startsWith("http") ? "_blank" : undefined;

  return (
    <div className="detail">
      <DetailHeader back={dHomeHref("cards")} backLabel="银行卡" />

      {/* Hero */}
      <section className="d-hero">
        <div className="wrap d-hero-inner">
          <div className={window.cardArtFrameClass(card, "d-hero-art")} style={window.cardArtFrameStyle(card)}>
            <img src={cardArt(card)} alt={`${card.name} 卡面`} className="art" />
          </div>
          <div className="d-hero-text">
            <a href={dHomeHref("cards")} className="d-back">全部银行卡</a>
            <div className="ca-kicker">{card.issuer}</div>
            <h1 className="d-h1">{card.name}</h1>
            <p className="d-lead">{card.lead}</p>

            <dl className="d-spec-row">
              <div><dt>费用</dt><dd>{card.fee}</dd></div>
              <div><dt>返现</dt><dd>{card.cashback}</dd></div>
              <div><dt>身份</dt><dd>{card.idType}</dd></div>
              <div><dt>发卡地</dt><dd>{card.bin}</dd></div>
            </dl>

            <div className="d-cta">
              <a className="ca-button ca-button--primary ca-button--lg"
                 href={applyUrl}
                 target={applyTarget}
                 rel={applyTarget ? "noopener" : undefined}
                 data-aff={slug}>查看攻略</a>
            </div>
          </div>
        </div>
      </section>

      <DetailToc steps={steps} funding={funding} />

      {/* 开卡教程 */}
      <section className="k-section" id="tutorial">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">开卡教程 · {steps.length} 章</h2>
            <span className="ca-meta">含 {actionCount || steps.length} 个实操动作</span>
          </div>
          <div className="tutorial-warning">⚠ 禁止存放大量资金，即用即充</div>
          <ol className="steps">
            {steps.map(s => <TutorialStep key={s.n} step={s} anchorId={tutorialAnchor(s)} />)}
          </ol>
          {card.promoNote && (
            <div className="tutorial-promo-note">
              <span className="promo-note-icon">💬</span>
              <span>{card.promoNote}</span>
            </div>
          )}
        </div>
      </section>

      {funding.length > 0 && (
        <section className="k-section funding-section" id="funding">
          <div className="wrap">
            <div className="grid-head">
              <h2 className="ca-h2">入金方式</h2>
              <span className="ca-meta">不计入开卡步骤</span>
            </div>
            <div className="funding-list">
              {funding.map((item, i) => <FundingBlock key={item.t || i} item={item} anchorId={fundingAnchor(i)} />)}
            </div>
          </div>
        </section>
      )}

      {/* 优势 / 注意 */}
      <section className="k-section d-procon-section">
        <div className="wrap">
          <div className="d-procon">
            <div className="d-procon-col">
              <div className="ca-kicker ca-kicker--brand">优势</div>
              <ul className="d-list d-list--pros">
                {card.pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div className="d-procon-col">
              <div className="ca-kicker ca-kicker--warn">注意</div>
              <ul className="d-list d-list--cons">
                {card.cons.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI 通过率 */}
      <section className="k-section">
        <div className="wrap">
          <div className="ai-block">
            <div className="ai-block-head">
              <div>
                <div className="ca-kicker">AI 订阅通过率</div>
                <h3 className="ca-h3" style={{ margin: "4px 0 0" }}>这张卡能不能付 AI 服务</h3>
              </div>
              <div className="ai-block-dots">
                <span className="ai-dot"><Dot s={card.ai.chatgpt}/> ChatGPT</span>
                <span className="ai-dot"><Dot s={card.ai.claude}/> Claude</span>
                <span className="ai-dot"><Dot s={card.ai.midjourney}/> Midjourney</span>
              </div>
            </div>
            <p className="ai-block-note">{card.ai.note}</p>
          </div>
        </div>
      </section>

      {/* 同期推荐 */}
      <section className="k-section">
        <div className="wrap">
          <h2 className="ca-h2" style={{ marginBottom: 24 }}>看看其它卡</h2>
          <div className="cross">
            {others.map(c => (
              <a key={c.slug} href={dCardHref(c.slug)} className="cross-item">
                <div className="cross-face">
                  <span className={window.cardArtFrameClass(c)} style={window.cardArtFrameStyle(c)}>
                    <img src={cardArt(c)} alt="" className="art" />
                  </span>
                </div>
                <div className="cross-body">
                  <div className="ca-kicker">{c.issuer}</div>
                  <strong>{c.name}</strong>
                  <span className="cross-cta">查看详情</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <window.ContactTrigger />
      <window.Footer />
    </div>
  );
}

function GiftDirectory({ slug, detail }) {
  const primaryRegions = detail.regions.slice(0, 8);
  const firstRegion = detail.regions[0];

  return (
    <section className="k-section gift-directory">
      <div className="wrap">
        <div className="gift-directory-card">
          <div className="gift-directory-head">
            <div>
              <div className="ca-kicker">礼品卡目录</div>
              <h2 className="ca-h2">先选区码，再填金额</h2>
            </div>
            <span className="ca-meta">区码 / 金额 / 下单</span>
          </div>
          <div className="gift-directory-nav">
            <button type="button" className="gift-route-card" onClick={() => scrollToAnchor("regions")}>
              <span>01</span>
              <strong>区码与币种</strong>
              <em>国家、货币、官方面额</em>
            </button>
            {firstRegion ? (
              <a href={dGiftBuyHref(slug, firstRegion.code)} className="gift-route-card">
                <span>02</span>
                <strong>金额填写</strong>
                <em>输入需要多少本地币</em>
              </a>
            ) : (
              <button type="button" className="gift-route-card" onClick={() => scrollToAnchor("regions")}>
                <span>02</span>
                <strong>金额填写</strong>
                <em>输入需要多少本地币</em>
              </button>
            )}
            <button type="button" className="gift-route-card" onClick={() => scrollToAnchor("use")}>
              <span>03</span>
              <strong>使用说明</strong>
              <em>兑换用途和注意点</em>
            </button>
          </div>
          <div className="gift-route-pills" aria-label="热门区码">
            {primaryRegions.map(r => (
              <a key={r.code} href={dGiftBuyHref(slug, r.code)}>{r.code} · {r.currency}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GiftOrderForm({ slug, detail, selected, regions }) {
  const [amount, setAmount] = React.useState(() => defaultGiftAmount(slug, selected));
  const model = amountModelFor(slug, selected);
  const status = giftAmountStatus(slug, selected, amount);
  const orderText = buildGiftOrderText(detail, selected, amount);

  React.useEffect(() => {
    setAmount(defaultGiftAmount(slug, selected));
  }, [slug, selected.code]);

  const goRegion = code => {
    window.location.assign(dGiftBuyHref(slug, code));
  };

  return (
    <section className="k-section gift-order" id="amount">
      <div className="wrap gift-order-grid">
        <div className="gift-order-panel">
          <div className="gift-order-head">
            <div>
              <div className="ca-kicker">购买信息</div>
              <h2 className="ca-h2">填写购买信息</h2>
            </div>
            <span className="ca-meta">{selected.code} / {selected.currency}</span>
          </div>

          <div className="gift-buy-steps" aria-label="购买步骤">
            <span className="is-active">1 选区码</span>
            <span className="is-active">2 填金额</span>
            <span>3 联系下单</span>
          </div>

          <label className="order-field">
            <span>国家/地区</span>
            <select value={selected.code} onChange={event => goRegion(event.target.value)}>
              {regions.map(r => (
                <option key={r.code} value={r.code}>{r.name} · {r.currency}</option>
              ))}
            </select>
          </label>

          <label className="order-field">
            <span>需要金额</span>
            <div className="amount-control">
              <strong>{currencySymbol(selected.currency)}</strong>
              <input
                type="number"
                min={model.min || 1}
                max={model.max || undefined}
                step={amountStep(selected.currency)}
                value={amount}
                placeholder={`输入需要多少 ${selected.currency}`}
                onChange={event => setAmount(event.target.value)}
              />
              <em>{selected.currency}</em>
            </div>
          </label>

          <div className="amount-presets" aria-label="官方面额快捷选择">
            {model.presets.map(value => (
              <button
                key={value}
                type="button"
                className={Number(amount) === value ? "is-active" : ""}
                onClick={() => setAmount(String(value))}
              >
                {formatGiftAmount(value, selected.currency)}
              </button>
            ))}
          </div>

          <div className="official-denom">
            <strong>该区面额</strong>
            <span>{selected.denom}</span>
          </div>
          <p className="order-status">{status}</p>

          <div className="d-cta">
            <a
              className="ca-button ca-button--primary ca-button--lg"
              href="https://t.me/Whohaoe"
              target="_blank"
              rel="noopener"
              data-order={orderText}
            >
              联系下单
            </a>
            <button
              className="ca-button ca-button--outline ca-button--lg"
              type="button"
              onClick={() => scrollToAnchor("regions")}
            >
              换区码
            </button>
          </div>
        </div>

        <aside className="order-receipt" aria-label="订单摘要">
          <div className={window.giftArtFrameClass(GIFTS_BY_SLUG[slug])} style={window.giftArtFrameStyle(GIFTS_BY_SLUG[slug])}>
            <img src={giftArt(GIFTS_BY_SLUG[slug])} alt="" className="art" />
          </div>
          <div className="receipt-row">
            <span>产品</span>
            <strong>{detail.name}</strong>
          </div>
          <div className="receipt-row">
            <span>区码</span>
            <strong>{selected.name} · {selected.code}</strong>
          </div>
          <div className="receipt-row">
            <span>币种</span>
            <strong>{selected.currency}</strong>
          </div>
          <div className="receipt-total">
            <span>需要金额</span>
            <strong>{formatGiftAmount(amount, selected.currency)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── 礼品卡详情 ────────────────────────────────────────────
function GiftDetail({ slug }) {
  const g = GIFTS_BY_SLUG[slug];
  const d = GIFT_DETAILS[slug];
  if (!g || !d) return <NotFound />;
  const others = window.GIFT_CARDS.filter(x => x.slug !== slug).slice(0, 3);

  return (
    <div className="detail">
      <DetailHeader back={dHomeHref("gifts")} backLabel="礼品卡" />

      <section className="d-hero">
        <div className="wrap d-hero-inner">
          <div className={window.giftArtFrameClass(g, "d-hero-art")} style={window.giftArtFrameStyle(g)}>
            <img src={giftArt(g)} alt={`${d.name} 礼品卡`} className="art" />
          </div>
          <div className="d-hero-text">
            <a href={dHomeHref("gifts")} className="d-back">全部礼品卡</a>
            <div className="ca-kicker">{d.sub}</div>
            <h1 className="d-h1">{d.name}</h1>
            <p className="d-lead">{d.desc}</p>
            <div className="d-cta">
              <button
                className="ca-button ca-button--primary ca-button--lg"
                type="button"
                onClick={() => scrollToAnchor("regions")}
                data-aff={slug}
              >
                选择区码
              </button>
              <button
                className="ca-button ca-button--outline ca-button--lg"
                type="button"
                onClick={() => scrollToAnchor("use")}
              >
                使用说明
              </button>
            </div>
          </div>
        </div>
      </section>

      <GiftDirectory slug={slug} detail={d} />

      {/* 区码 + 面额表 */}
      <section className="k-section" id="regions">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">区码与面额</h2>
            <span className="ca-meta">共 {d.regions.length} 个区</span>
          </div>
          <div className="region-grid">
            {d.regions.map(r => (
              <article key={r.code} className="region-card">
                <div className="region-head">
                  <span className="region-code">{r.code}</span>
                  <strong>{r.name}</strong>
                  <span className="region-cur">{r.currency}</span>
                </div>
                <div className="region-denom">{r.denom}</div>
                {r.note && <p className="region-note">{r.note}</p>}
                <a className="region-buy" href={dGiftBuyHref(slug, r.code)} data-aff={`${slug}-${r.code}`}>选择金额</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 使用场景 */}
      <section className="k-section" id="use">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">能用来做什么</h2>
          </div>
          <ul className="use-list">
            {d.use.map((u, i) => (
              <li key={i} className="use-item">
                <span className="use-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 同期推荐 */}
      <section className="k-section">
        <div className="wrap">
          <h2 className="ca-h2" style={{ marginBottom: 24 }}>看看其它礼品卡</h2>
          <div className="cross">
            {others.map(x => (
              <a key={x.slug} href={dGiftHref(x.slug)} className="cross-item">
                <div className="cross-face">
                  <span className={window.giftArtFrameClass(x)} style={window.giftArtFrameStyle(x)}>
                    <img src={giftArt(x)} alt="" className="art" />
                  </span>
                </div>
                <div className="cross-body">
                  <div className="ca-kicker">{x.scope}</div>
                  <strong>{x.name}</strong>
                  <span className="cross-cta">查看详情</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <window.Footer />
    </div>
  );
}

function GiftBuy({ slug, region }) {
  const g = GIFTS_BY_SLUG[slug];
  const d = GIFT_DETAILS[slug];
  if (!g || !d) return <NotFound />;

  const selected = d.regions.find(r => r.code.toLowerCase() === String(region || "").toLowerCase()) || d.regions[0];
  const regions = [selected, ...d.regions.filter(r => r.code !== selected.code)];
  const starterAmount = defaultGiftAmount(slug, selected);

  return (
    <div className="detail">
      <DetailHeader back={dGiftHref(slug)} backLabel={`${d.name} 详情`} />

      <section className="d-hero buy-hero">
        <div className="wrap d-hero-inner">
          <div className={window.giftArtFrameClass(g, "d-hero-art")} style={window.giftArtFrameStyle(g)}>
            <img src={giftArt(g)} alt={`${d.name} 礼品卡`} className="art" />
          </div>
          <div className="d-hero-text">
            <a href={dGiftHref(slug)} className="d-back">返回礼品卡详情</a>
            <div className="ca-kicker">{selected.name} · {selected.currency}</div>
            <h1 className="d-h1">购买 {d.name}</h1>
            <p className="d-lead">
              当前选择 {selected.name}，金额按 {selected.currency} 填写。先确认区码，再输入需要多少金额。
            </p>
            <div className="buy-summary">
              <div><span>产品</span><strong>{d.name}</strong></div>
              <div><span>区码</span><strong>{selected.code}</strong></div>
              <div><span>起选金额</span><strong>{formatGiftAmount(starterAmount, selected.currency)}</strong></div>
            </div>
            <div className="d-cta">
              <button
                className="ca-button ca-button--primary ca-button--lg"
                type="button"
                onClick={() => scrollToAnchor("amount")}
                data-aff={`${slug}-${selected.code}`}
              >
                填写金额
              </button>
              <button
                className="ca-button ca-button--outline ca-button--lg"
                type="button"
                onClick={() => scrollToAnchor("regions")}
              >
                换区码
              </button>
            </div>
          </div>
        </div>
      </section>

      <GiftOrderForm slug={slug} detail={d} selected={selected} regions={d.regions} />

      <section className="k-section" id="regions">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">切换区码</h2>
            <span className="ca-meta">当前区码：{selected.code} / {selected.currency}</span>
          </div>
          <div className="region-grid">
            {regions.map(r => (
              <article key={r.code} className={`region-card ${selected && r.code === selected.code ? "is-selected" : ""}`}>
                <div className="region-head">
                  <span className="region-code">{r.code}</span>
                  <strong>{r.name}</strong>
                  <span className="region-cur">{r.currency}</span>
                </div>
                <div className="region-denom">{r.denom}</div>
                {r.note && <p className="region-note">{r.note}</p>}
                <a className="region-buy" href={dGiftBuyHref(slug, r.code)} data-aff={`${slug}-${r.code}`}>选择 {r.code} 区码</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="k-section">
        <div className="wrap">
          <div className="buy-note">
            <div className="ca-kicker ca-kicker--brand">下单前确认</div>
            <h2 className="ca-h2">区码必须和账号地区一致</h2>
            <p>Apple、Steam、Google Play 这类礼品卡通常不支持跨区兑换。下单前先确认账号地区，再选对应区码和面额。</p>
          </div>
        </div>
      </section>

      <window.Footer />
    </div>
  );
}

// ── 小组件 ────────────────────────────────────────────────
function Dot({ s }) {
  if (s === "ok")   return <span className="dot dot-ok">●</span>;
  if (s === "warn") return <span className="dot dot-warn">◐</span>;
  return                   <span className="dot dot-no">○</span>;
}

function NotFound() {
  return (
    <div className="detail">
      <DetailHeader />
      <section className="k-section">
        <div className="wrap" style={{ textAlign: "center", padding: "80px 0" }}>
          <h1 className="ca-h2">未找到该产品</h1>
          <p style={{ marginTop: 14 }}>
            <a className="link-jade" href="/">返回首页</a>
          </p>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { CardDetail, GiftDetail, GiftBuy, NotFound, Dot });
