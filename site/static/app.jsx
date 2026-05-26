/* 花开SHOP — 商品型首页
   设计语言：China Atlas 编辑克制（纸 / 墨 / 玉 / 琥珀，无渐变、无 emoji、无暗底荧光）。
   信息结构：电商导购（产品网格 + 卡面 visual + 申请 CTA + 礼品卡分类）。   */

const { useState } = React;

const CARDS = window.CARDS;
const GIFT_CARDS = window.GIFT_CARDS;
const FAQS = window.FAQS;
const MAIL_SERVICES = [
  { name: "域名企业邮箱", scope: "自有域名", desc: "Cloudflare Email Routing、Gmail 发信身份、MX / SPF / DKIM 记录检查。", tag: "推荐" },
  { name: "Google Workspace", scope: "官方订阅", desc: "绑定域名、创建邮箱用户、配置 Gmail 收发和基础安全设置。", tag: "Google" },
  { name: "Microsoft 365", scope: "官方订阅", desc: "Outlook 企业邮箱、Exchange Online、域名解析和客户端登录配置。", tag: "Outlook" },
  { name: "邮箱迁移配置", scope: "收发迁移", desc: "旧邮箱迁移、新邮箱别名、转发、发信身份和常用客户端设置。", tag: "配置" },
];

const ACCOUNT_ITEMS = [
  {
    slug: "gmail",
    name: "Gmail 账号",
    icon: "G",
    tag: "热销",
    scope: "Google 全系服务",
    price: "询价",
    desc: "手工注册真实 Gmail，可绑 YouTube、Google Play、Google Workspace，支持海外平台注册。",
    note: "独立 IP 注册，交付后请立即修改密码和绑定手机。",
  },
  {
    slug: "outlook",
    name: "Outlook 账号",
    icon: "O",
    tag: "微软",
    scope: "Microsoft 全系服务",
    price: "询价",
    desc: "微软 Outlook 邮箱，可绑 Office 365、Azure、Xbox、GitHub，适合海外平台注册备用。",
    note: "交付后请立即修改密码，可选绑定手机号加固。",
  },
  {
    slug: "telegram",
    name: "Telegram 账号",
    icon: "T",
    tag: "海外手机号",
    scope: "TG 正常使用",
    price: "询价",
    desc: "海外真实手机号注册，TG 账号可正常收发消息、加群、建频道，无封号风险。",
    note: "交付后建议绑定邮箱和两步验证，提升账号安全性。",
  },
];

const homeHref = (section = "") => {
  if (!section) return "/";
  if (section === "cards") return "/cards";
  if (section === "gifts") return "/shop";
  if (section === "mail") return "/mail";
  if (section === "accounts") return "/accounts";
  if (section === "faq") return "/faq";
  if (section === "contact") return "/contact";
  if (section === "wechat") return "/contact";
  return "/";
};
const cardHref = slug => `/cards/${slug}`;
const giftHref = slug => `/shop/${slug}`;

// ── 原子组件 ─────────────────────────────────────────────

const Kicker = ({ children, tone, className = "" }) => {
  const t = tone === "brand" ? "ca-kicker--brand"
          : tone === "warn"  ? "ca-kicker--warn"  : "";
  return <div className={`ca-kicker ${t} ${className}`}>{children}</div>;
};

const StatusDot = ({ s }) => {
  if (s === "ok")   return <span className="sd sd-ok"   title="支持" />;
  if (s === "warn") return <span className="sd sd-warn" title="受限" />;
  return                   <span className="sd sd-no"   title="不支持" />;
};

// ── 卡面（产品级 visual） ─────────────────────────────────
// 实卡比例，单色背景，磨砂芯片，右下网络徽标。无虚假卡号——电商页面用不上。
function NetworkMark({ network }) {
  if (network && network.includes("Visa") && network.includes("Master")) {
    return (
      <text x="298" y="178" fill="#fff" fontSize="11" fontWeight="700"
            fontFamily="Inter, sans-serif" letterSpacing="1.2"
            textAnchor="end">VISA / MC</text>
    );
  }
  if (network && network.includes("Visa")) {
    return <text x="298" y="178" fill="#fff" fontSize="15" fontWeight="800"
                 fontFamily="Inter, sans-serif" letterSpacing="2.5"
                 textAnchor="end">VISA</text>;
  }
  // Mastercard — 两个互锁圆，右对齐
  return (
    <g>
      <circle cx="262" cy="172" r="12" fill="#eb001b" />
      <circle cx="278" cy="172" r="12" fill="#f79e1b" opacity=".92" />
    </g>
  );
}

function CardFace({ card, large = false }) {
  const { color, name, network, no } = card;
  return (
    <div className={`cardface ${large ? "cardface--lg" : ""}`}>
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${name} 卡面`}>
        <rect x="0" y="0" width="320" height="200" rx="14" fill={color} />
        {/* 极弱对角高光（替代金属反光，没有真渐变） */}
        <path d="M0 70 L320 0 L320 26 L0 96 Z" fill="#ffffff" opacity=".08" />
        {/* chip */}
        <rect x="22" y="34" width="38" height="28" rx="4" fill="#e6d28a" opacity=".92" />
        <rect x="26" y="38" width="30" height="20" rx="2"
              fill="none" stroke="#b58c2f" strokeOpacity=".75" />
        <line x1="41" y1="38" x2="41" y2="58" stroke="#b58c2f" strokeOpacity=".55" />
        <line x1="26" y1="48" x2="56" y2="48" stroke="#b58c2f" strokeOpacity=".55" />
        {/* 卡名 */}
        <text x="22" y="150" fill="#fff" fontSize="9" fontWeight="700"
              fontFamily="Inter, sans-serif" letterSpacing="1.8" opacity=".7">CARDHOLDER</text>
        <text x="22" y="170" fill="#fff" fontSize="14" fontWeight="700"
              fontFamily="Inter, sans-serif" letterSpacing=".5">
          {name.toUpperCase()}
        </text>
        {/* 网络徽标 */}
        <NetworkMark network={network} />
      </svg>
    </div>
  );
}

// ── 顶部小公告 ───────────────────────────────────────────
function PromoBar() {
  return (
    <div className="promo">
      <div className="wrap promo-inner">
        <span className="promo-tag">本周</span>
        <span>Bybit 欧洲卡新户体验金调整为 <strong>10 USDC</strong>，活动至 06-30。</span>
        <a href="/cards/bybit-eu-card" className="promo-link">查看</a>
      </div>
    </div>
  );
}

// ── 顶栏 ────────────────────────────────────────────────
function Header({ section, setSection }) {
  const tabs = [
    { id: "cards",    label: "银行卡" },
    { id: "gifts",    label: "礼品卡" },
    { id: "sms",      label: "接码",   href: "/sms" },
    { id: "mail",     label: "邮箱",   href: "/mail" },
    { id: "accounts", label: "账号",   href: "/accounts" },
    { id: "faq",      label: "常见问题" },
  ];
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <a href="/" className="brand">
          <span className="ca-brand-mark">花</span>
          <span className="brand-word">
            <span className="brand-zh">花开SHOP</span>
            <span className="brand-en">HKAI SHOP</span>
          </span>
        </a>
        <nav className="hdr-nav" aria-label="主导航">
          {tabs.map(t => (
            <a key={t.id} href={t.href || homeHref(t.id)}
              className={`hdr-tab ${section === t.id ? "is-active" : ""}`}
              onClick={() => setSection(t.id)}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="hdr-right">
          <a className="hdr-link" href="/contact">加入社群</a>
          <a className="ca-button ca-button--primary" href="/cards">立即开卡</a>
        </div>
      </div>
    </header>
  );
}

// ── Hero：价值主张 ────────────────────────────────────────
function Hero({ featured }) {
  const featuredCards = CARDS.slice(0, 3);
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-text">
          <h1 className="hero-h1">
            <span className="hero-h1-line"><span className="hero-h1-jade">海外银行卡</span>，一站买齐。</span>
          </h1>
          <div className="hero-cta">
            <a className="ca-button ca-button--primary ca-button--lg" href="/cards">浏览银行卡</a>
            <a className="ca-button ca-button--outline ca-button--lg" href="/shop">礼品卡商店</a>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-product-frame">
            <div className="mini-head">
              <h2 className="mini-title">本期主打</h2>
              <a href={cardHref(featured.slug)} className="mini-link">查看攻略</a>
            </div>
            <div className="hero-reco-list">
              {featuredCards.map(card => (
                <a key={card.slug} href={cardHref(card.slug)} className="hero-reco">
                  <span className={window.cardArtFrameClass(card, "hero-reco-art")} style={window.cardArtFrameStyle(card)}>
                    <img src={window.cardArt(card)} alt="" className="art" />
                  </span>
                  <span className="hero-reco-body">
                    <strong>{card.name}</strong>
                    <span>{card.lead}</span>
                    <em>{card.fee}</em>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeBoard({ cards }) {
  return (
    <main className="home-main">
      <div className="wrap home-board">
        <div className="home-panel home-panel--cards">
          <ProductGrid cards={cards} />
        </div>
        <div className="home-panel home-panel--gifts">
          <GiftCardStrip />
        </div>
        <div className="home-panel home-panel--mail">
          <MailServiceStrip />
        </div>
        <div className="home-panel home-panel--accounts">
          <AccountStrip />
        </div>
        <div className="home-panel home-panel--faq">
          <FAQ />
        </div>
        <div className="home-panel home-panel--contact">
          <Contact />
        </div>
      </div>
    </main>
  );
}

// ── 产品卡 ──────────────────────────────────────────────
function ProductCard({ card }) {
  const applyUrl = card.applyUrl || "https://t.me/Whohaoe";
  const applyTarget = applyUrl.startsWith("http") ? "_blank" : undefined;

  return (
    <article className="pc" id={`card-${card.slug}`}>
      <a href={cardHref(card.slug)} className="pc-cardface-link" aria-label={`${card.name} 详情`}>
        <span className={window.cardArtFrameClass(card)} style={window.cardArtFrameStyle(card)}>
          <img src={window.cardArt(card)} alt="" className="art" />
        </span>
      </a>
      <div className="pc-body">
        <header className="pc-head">
          <Kicker>{card.issuer}</Kicker>
          <h3 className="pc-name">{card.name}</h3>
        </header>
        <p className="pc-lead">{card.lead}</p>

        <dl className="pc-specs">
          <div><dt>费用</dt><dd>{card.fee}</dd></div>
          <div><dt>返现</dt><dd>{card.cashback}</dd></div>
          <div><dt>开卡身份</dt><dd>{card.idType}</dd></div>
          <div><dt>发卡地</dt><dd>{card.bin}</dd></div>
        </dl>

        <div className="pc-ai">
          <span className="pc-ai-label">适用服务</span>
          <div className="pc-ai-rows">
            <span className="pc-ai-row">
              <span className="pc-ai-item"><StatusDot s={card.ai.chatgpt}/> ChatGPT</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.claude}/> Claude</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.midjourney}/> MJ</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.cursor}/> Cursor</span>
            </span>
            <span className="pc-ai-row">
              <span className="pc-ai-item"><StatusDot s={card.ai.netflix}/> Netflix</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.steam}/> Steam</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.appstore}/> App Store</span>
            </span>
            <span className="pc-ai-row">
              <span className="pc-ai-item"><StatusDot s={card.ai.aws}/> AWS</span>
              <span className="pc-ai-item"><StatusDot s={card.ai.gcp}/> GCP</span>
            </span>
            <span className="pc-ai-legend"><span className="sd sd-ok"/>支持 &nbsp;<span className="sd sd-warn"/>受限 &nbsp;<span className="sd sd-no"/>不支持</span>
          </div>
        </div>

        <div className="pc-foot">
          <a className="ca-button ca-button--primary pc-apply"
             href={applyUrl}
             target={applyTarget}
             rel={applyTarget ? "noopener" : undefined}
             data-card={card.slug}>查看攻略</a>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({ cards }) {
  return (
    <section className="k-section" id="cards">
      <div className="wrap">
        <div className="grid-head">
          <h2 className="ca-h2">银行卡</h2>
          <div className="grid-filters">
            <button className="ca-tab is-active">全部</button>
          </div>
        </div>
        <div className="pgrid">
          {cards.map(c => <ProductCard key={c.slug} card={c} />)}
        </div>
      </div>
    </section>
  );
}

// ── 礼品卡分类 ───────────────────────────────────────────
function GiftCardStrip() {
  return (
    <section className="k-section gifts-section" id="gifts">
      <div className="wrap">
        <div className="grid-head">
          <h2 className="ca-h2">礼品卡</h2>
          <a href="/shop" className="ca-button ca-button--outline">进入商店</a>
        </div>
        <div className="ggrid">
          {GIFT_CARDS.map(g => (
            <a key={g.slug} href={giftHref(g.slug)} className="gc">
              <div className="gc-face">
                <span className={window.giftArtFrameClass(g)} style={window.giftArtFrameStyle(g)}>
                  <img src={window.giftArt(g)} alt="" className="art" />
                </span>
              </div>
              <div className="gc-body">
                <div className="gc-head">
                  <strong className="gc-name">{g.name}</strong>
                  {g.tag && <span className="ca-pill ca-pill--warn gc-tag">{g.tag}</span>}
                </div>
                <div className="gc-scope">{g.scope}</div>
                <div className="gc-price">{g.price}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function MailServiceStrip() {
  return (
    <section className="k-section mail-section" id="mail">
      <div className="wrap">
        <div className="grid-head">
          <h2 className="ca-h2">邮箱服务</h2>
          <a href="/mail" className="ca-button ca-button--outline">进入邮箱</a>
        </div>
        <div className="mail-grid">
          {MAIL_SERVICES.map(item => (
            <a key={item.name} href="/mail" className="mail-card">
              <span className="mail-icon">{item.name.slice(0, 1)}</span>
              <span className="mail-copy">
                <strong>{item.name}</strong>
                <span>{item.scope}</span>
                <em>{item.tag}</em>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function MailStore() {
  return (
    <React.Fragment>
      <section className="gift-store-hero mail-hero">
        <div className="wrap gift-store-hero-inner">
          <div>
            <Kicker tone="brand">邮箱服务</Kicker>
            <h1 className="gift-store-title">企业邮箱和收发配置</h1>
            <p className="gift-store-lead">按官方渠道开通 Google Workspace / Microsoft 365，或使用自有域名配置 Cloudflare Email Routing、Gmail 发信身份和常用客户端收发。</p>
          </div>
          <a className="ca-button ca-button--primary ca-button--lg" href="/contact">联系配置</a>
        </div>
      </section>

      <section className="k-section mail-store-section">
        <div className="wrap">
          <div className="mail-store-grid">
            {MAIL_SERVICES.map(item => (
              <article key={item.name} className="mail-store-card">
                <div className="mail-store-head">
                  <span className="mail-icon">{item.name.slice(0, 1)}</span>
                  <span className="ca-pill ca-pill--brand">{item.tag}</span>
                </div>
                <h2>{item.name}</h2>
                <p>{item.desc}</p>
                <div className="mail-store-foot">
                  <span>{item.scope}</span>
                  <a href="/contact">联系配置</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}

function AccountStrip() {
  return (
    <section className="k-section mail-section" id="accounts">
      <div className="wrap">
        <div className="grid-head">
          <h2 className="ca-h2">账号出售</h2>
          <a href="/accounts" className="ca-button ca-button--outline">进入商店</a>
        </div>
        <div className="mail-grid">
          {ACCOUNT_ITEMS.map(item => (
            <a key={item.slug} href="/accounts" className="mail-card">
              <span className="mail-icon">{item.icon}</span>
              <span className="mail-copy">
                <strong>{item.name}</strong>
                <span>{item.scope}</span>
                <em>{item.tag}</em>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountStore() {
  return (
    <React.Fragment>
      <section className="gift-store-hero mail-hero">
        <div className="wrap gift-store-hero-inner">
          <div>
            <Kicker tone="brand">账号出售</Kicker>
            <h1 className="gift-store-title">Gmail · Outlook · Telegram 账号</h1>
            <p className="gift-store-lead">手工注册真实账号，海外手机号/独立 IP，交付后请立即修改密码。支持 USDT / 微信付款，TG 私信下单。</p>
          </div>
          <a className="ca-button ca-button--primary ca-button--lg" href="https://t.me/Whohaoe" target="_blank" rel="noopener">TG 下单</a>
        </div>
      </section>

      <section className="k-section mail-store-section">
        <div className="wrap">
          <div className="mail-store-grid">
            {ACCOUNT_ITEMS.map(item => (
              <article key={item.slug} className="mail-store-card">
                <div className="mail-store-head">
                  <span className="mail-icon">{item.icon}</span>
                  <span className="ca-pill ca-pill--brand">{item.tag}</span>
                </div>
                <h2>{item.name}</h2>
                <p>{item.desc}</p>
                <div className="mail-store-foot">
                  <span>{item.price}</span>
                  <a href="https://t.me/Whohaoe" target="_blank" rel="noopener">TG 询价</a>
                </div>
                <div className="acct-note">{item.note}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}

function GiftStore() {
  return (
    <React.Fragment>
      <section className="gift-store-hero">
        <div className="wrap gift-store-hero-inner">
          <div>
            <Kicker tone="brand">礼品卡商店</Kicker>
            <h1 className="gift-store-title">选择商品，再选国家和币种</h1>
            <p className="gift-store-lead">Apple、Steam、Netflix、Google Play、PlayStation、Battle.net 都按对应国家/地区下单，付款前先确认账号地区和本地币种。</p>
          </div>
          <a className="ca-button ca-button--primary ca-button--lg" href="/contact">联系下单</a>
        </div>
      </section>

      <section className="k-section gift-store-section">
        <div className="wrap">
          <div className="gift-store-grid">
            {GIFT_CARDS.map(g => {
              const detail = window.GIFT_DETAILS?.[g.slug] || {};
              const regions = detail.regions || [];
              return (
                <article key={g.slug} className="gift-store-card">
                  <a href={giftHref(g.slug)} className={window.giftArtFrameClass(g, "gift-store-art")} style={window.giftArtFrameStyle(g)}>
                    <img src={window.giftArt(g)} alt={`${g.name} 礼品卡`} className="art" />
                  </a>
                  <div className="gift-store-body">
                    <div className="gift-store-meta">
                      <span>{g.scope}</span>
                      <span>{regions.length ? `${regions.length} 个地区` : g.price}</span>
                    </div>
                    <h2>{g.name}</h2>
                    <p>{detail.desc || "按账号国家、兑换币种和官方面额选择。"}</p>
                    <div className="gift-store-regions">
                      {regions.slice(0, 8).map(r => (
                        <a key={r.code} href={`/shop/${g.slug}/buy/${r.code}`}>{r.code} · {r.currency}</a>
                      ))}
                    </div>
                  </div>
                  <div className="gift-store-actions">
                    <a className="ca-button ca-button--outline" href={giftHref(g.slug)}>查看区码</a>
                    {regions[0] && <a className="ca-button ca-button--primary" href={`/shop/${g.slug}/buy/${regions[0].code}`}>填写金额</a>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}

// ── FAQ ────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="k-section" id="faq">
      <div className="wrap faq-wrap">
        <h2 className="ca-h2">常见问题</h2>
        <ul className="faq-list">
          {FAQS.map((f, i) => (
            <li key={i} className={`faq-item ${open === i ? "is-open" : ""}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="faq-toggle" aria-hidden="true">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="faq-a">{f.a}</div>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── 联系弹窗 ─────────────────────────────────────────────
function ContactModal() {
  const [open, setOpen] = React.useState(() => {
    const path = window.location.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
    return path === "contact" || path === "wechat";
  });
  React.useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('openContactModal', show);
    return () => window.removeEventListener('openContactModal', show);
  }, []);
  if (!open) return null;
  return (
    <div className="cmodal-overlay" onClick={() => setOpen(false)}>
      <div className="cmodal" onClick={e => e.stopPropagation()}>
        <div className="cmodal-header">
          <div>
            <div className="cmodal-title">联系我</div>
            <div className="cmodal-sub">开卡 · 入金 · 选卡，随时可问</div>
          </div>
          <button className="cmodal-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="cmodal-list">
          <a className="cmodal-item" href="https://t.me/whohaoe" target="_blank" rel="noopener">
            <span className="cmodal-badge cmodal-badge--tg">TG</span>
            <div className="cmodal-info">
              <div className="cmodal-platform">Telegram</div>
              <div className="cmodal-id">@whohaoe</div>
            </div>
            <span className="cmodal-action">打开</span>
          </a>
          <div className="cmodal-item">
            <span className="cmodal-badge cmodal-badge--wx">微</span>
            <div className="cmodal-info">
              <div className="cmodal-platform">微信</div>
              <div className="cmodal-id">HKFG0512</div>
            </div>
            <span className="cmodal-action">长按复制</span>
          </div>
          <div className="cmodal-item">
            <span className="cmodal-badge cmodal-badge--qq">QQ</span>
            <div className="cmodal-info">
              <div className="cmodal-platform">QQ</div>
              <div className="cmodal-id">2393155725</div>
            </div>
            <span className="cmodal-action">长按复制</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 有疑问触发块 ──────────────────────────────────────────
function ContactTrigger() {
  return (
    <section className="k-section ctrigger-section" id="contact">
      <div className="wrap">
        <div className="ctrigger" onClick={() => window.dispatchEvent(new CustomEvent('openContactModal'))}>
          <span className="ctrigger-q">?</span>
          <div className="ctrigger-text">
            <div className="ctrigger-title">有疑问？</div>
            <div className="ctrigger-sub">TG · 微信 · QQ 均可，开卡 / 入金 / 选卡都能问</div>
          </div>
          <span className="ctrigger-cta">联系我</span>
        </div>
      </div>
    </section>
  );
}

// Keep Contact as alias so any remaining references don't break
const Contact = ContactTrigger;

// ── 页脚 ────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="ftr" id="disclosure">
      <div className="wrap ftr-inner">
        <div className="ftr-brand">
          <span className="ca-brand-mark ftr-mark">花</span>
          <strong>花开SHOP</strong>
        </div>
        <div className="ftr-cols">
          <div>
            <h4>银行卡</h4>
            {CARDS.slice(0, 4).map(c => <a key={c.slug} href={`/cards/${c.slug}`}>{c.name}</a>)}
            <a href="/cards">查看全部</a>
          </div>
          <div>
            <h4>礼品卡</h4>
            <a href="/shop">应用商店</a>
            <a href="/shop">流媒体</a>
            <a href="/shop">游戏</a>
            <a href="/shop">订阅</a>
          </div>
          <div>
            <h4>联系</h4>
            <a href="https://t.me/whohaoe" target="_blank" rel="noopener">TG @whohaoe</a>
            <a href="/contact">微信 HKFG0512</a>
            <a href="/contact">QQ 2393155725</a>
          </div>
        </div>
      </div>
      <div className="wrap ftr-bottom">
        <span>© 2026 花开SHOP</span>
        <span>部分链接为推广链接</span>
      </div>
    </footer>
  );
}

// ── 路由 ────────────────────────────────────────────────
function readRoute() {

  const clean = window.location.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "cards" && !parts[1]) return { scene: "home", section: "cards" };
  if (parts[0] === "cards" && parts[1]) return { scene: "card", slug: parts[1] };
  if (parts[0] === "shop" && !parts[1]) return { scene: "giftStore", section: "gifts" };
  if (parts[0] === "shop" && parts[1] && parts[2] === "buy") {
    return { scene: "giftBuy", slug: parts[1], region: parts[3] || null };
  }
  if (parts[0] === "shop" && parts[1]) return { scene: "gift", slug: parts[1] };
  if (parts[0] === "mail" && !parts[1]) return { scene: "mail", section: "mail" };
  if (parts[0] === "accounts" && !parts[1]) return { scene: "accounts", section: "accounts" };
  if (parts[0] === "faq" && !parts[1]) return { scene: "home", section: "faq" };
  if (parts[0] === "contact" && !parts[1]) return { scene: "home", section: "contact" };
  if (parts[0] === "wechat" && !parts[1]) return { scene: "home", section: "contact" };
  if (parts[0] === "sms") return { scene: "sms" };
  return { scene: "home" };
}

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  React.useEffect(() => {
    const handler = () => setRoute(readRoute());
    handler();
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
    };
  }, []);
  return route;
}

// ── App ────────────────────────────────────────────────
function App() {
  const route = useRoute();
  const [section, setSection] = useState("cards");

  React.useEffect(() => {
    if (route.scene !== "home" && route.scene !== "giftStore") return;

    if (!route.section) {
      setSection("cards");
      return;
    }

    const nextSection = route.section;
    setSection(nextSection);

    window.requestAnimationFrame(() => {
      if (nextSection === "contact") {
        window.dispatchEvent(new CustomEvent("openContactModal"));
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const targetId = nextSection === "gifts" ? "gifts" : nextSection;
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [route.scene, route.section]);

  // Tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "showPromo": true,
    "gridCols": "three",
    "featuredSlug": "bybit-card",
    "accentMode": "jade"
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const accents = {
    jade:   { jade: "#6aa9ff", soft: "rgba(106,169,255,0.10)" },
    cobalt: { jade: "#1f4ea8", soft: "rgba(31,78,168,0.08)" },
    rust:   { jade: "#a3491f", soft: "rgba(163,73,31,0.08)" },
  };
  const acc = accents[tweaks.accentMode] || accents.jade;

  const featured = CARDS.find(c => c.slug === tweaks.featuredSlug) || CARDS[0];

  let scene;
  if (route.scene === "card" && window.CardDetail) {
    scene = <window.CardDetail slug={route.slug} />;
  } else if (route.scene === "gift" && window.GiftDetail) {
    scene = <window.GiftDetail slug={route.slug} />;
  } else if (route.scene === "giftBuy" && window.GiftBuy) {
    scene = <window.GiftBuy slug={route.slug} region={route.region} />;
  } else if (route.scene === "giftStore") {
    scene = (
      <React.Fragment>
        {tweaks.showPromo && <PromoBar />}
        <Header section="gifts" setSection={setSection} />
        <GiftStore />
        <FAQ />
        <Contact />
        <Footer />
      </React.Fragment>
    );
  } else if (route.scene === "mail") {
    scene = (
      <React.Fragment>
        {tweaks.showPromo && <PromoBar />}
        <Header section="mail" setSection={setSection} />
        <MailStore />
        <FAQ />
        <Contact />
        <Footer />
      </React.Fragment>
    );
  } else if (route.scene === "accounts") {
    scene = (
      <React.Fragment>
        {tweaks.showPromo && <PromoBar />}
        <Header section="accounts" setSection={setSection} />
        <AccountStore />
        <FAQ />
        <Contact />
        <Footer />
      </React.Fragment>
    );
  } else if (route.scene === "sms" && window.SmsDesk) {
    scene = <window.SmsDesk />;
  } else {
    scene = (
      <React.Fragment>
        {tweaks.showPromo && <PromoBar />}
        <Header section={section} setSection={setSection} />
        <Hero featured={featured} />
        <HomeBoard cards={CARDS} />
        <Footer />
      </React.Fragment>
    );
  }

  return (
    <div className={`shell cols-${tweaks.gridCols}`} id="top"
         style={{ "--color-jade": acc.jade, "--bg-brand-soft": acc.soft, "--fg-brand": acc.jade }}>
      {scene}
      <ContactModal />

      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="布局">
            <window.TweakToggle label="顶部公告条"
              value={tweaks.showPromo}
              onChange={v => setTweak("showPromo", v)} />
            <window.TweakRadio label="产品网格" value={tweaks.gridCols}
              onChange={v => setTweak("gridCols", v)}
              options={[
                { value: "two",   label: "两列" },
                { value: "three", label: "三列" },
              ]} />
          </window.TweakSection>
          <window.TweakSection label="本期主打">
            <window.TweakSelect value={tweaks.featuredSlug}
              onChange={v => setTweak("featuredSlug", v)}
              options={CARDS.map(c => ({ value: c.slug, label: c.name }))} />
          </window.TweakSection>
          <window.TweakSection label="主色调">
            <window.TweakRadio value={tweaks.accentMode}
              onChange={v => setTweak("accentMode", v)}
              options={[
                { value: "jade",   label: "祖母绿" },
                { value: "cobalt", label: "钴蓝" },
                { value: "rust",   label: "赭红" },
              ]} />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// 把首页通用块暴露给 detail.jsx
Object.assign(window, { Footer, Contact, ContactTrigger, ContactModal, Header });
