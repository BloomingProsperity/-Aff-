/* 卡研所 — 商品型首页
   设计语言：China Atlas 编辑克制（纸 / 墨 / 玉 / 琥珀，无渐变、无 emoji、无暗底荧光）。
   信息结构：电商导购（产品网格 + 卡面 visual + 申请 CTA + 礼品卡分类）。   */

const { useState } = React;

const CARDS = window.CARDS;
const GIFT_CARDS = window.GIFT_CARDS;
const FAQS = window.FAQS;

const homeHref = (section = "") => section ? `/#${section}` : "/";
const cardHref = slug => `/cards/${slug}`;
const giftHref = slug => `/shop/${slug}`;

// ── 原子组件 ─────────────────────────────────────────────

const Kicker = ({ children, tone, className = "" }) => {
  const t = tone === "brand" ? "ca-kicker--brand"
          : tone === "warn"  ? "ca-kicker--warn"  : "";
  return <div className={`ca-kicker ${t} ${className}`}>{children}</div>;
};

const StatusDot = ({ s }) => {
  if (s === "ok")   return <span className="dot dot-ok"   title="通过">●</span>;
  if (s === "warn") return <span className="dot dot-warn" title="受限">◐</span>;
  return                   <span className="dot dot-no"   title="不通过">○</span>;
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
        <a href="/#card-bybit-eu-card" className="promo-link">查看</a>
      </div>
    </div>
  );
}

// ── 顶栏 ────────────────────────────────────────────────
function Header({ section, setSection }) {
  const tabs = [
    { id: "cards",    label: "银行卡" },
    { id: "gifts",    label: "礼品卡" },
    { id: "tutorial", label: "开卡教程" },
    { id: "faq",      label: "常见问题" },
  ];
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <a href="/" className="brand">
          <span className="ca-brand-mark">卡</span>
          <span className="brand-word">
            <span className="brand-zh">卡研所</span>
            <span className="brand-en">CARD ATLAS</span>
          </span>
        </a>
        <nav className="hdr-nav" aria-label="主导航">
          {tabs.map(t => (
            <a key={t.id} href={homeHref(t.id)}
              className={`hdr-tab ${section === t.id ? "is-active" : ""}`}
              onClick={() => setSection(t.id)}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="hdr-right">
          <a className="hdr-link" href="/#contact">加入社群</a>
          <a className="ca-button ca-button--primary" href="/#cards">立即开卡</a>
        </div>
      </div>
    </header>
  );
}

// ── Hero：价值主张 + 主打卡 ─────────────────────────────
function Hero({ featured }) {
  const applyUrl = featured.applyUrl || "https://t.me/Whohaoe";
  const applyTarget = applyUrl.startsWith("http") ? "_blank" : undefined;

  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-text">
          <h1 className="hero-h1">
            <span className="hero-h1-line"><span className="hero-h1-jade">海外银行卡</span>，一站买齐。</span>
          </h1>
          <div className="hero-cta">
            <a className="ca-button ca-button--primary ca-button--lg" href="/#cards">浏览银行卡</a>
            <a className="ca-button ca-button--outline ca-button--lg" href="/#gifts">礼品卡商店</a>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-product-frame">
            <Kicker tone="brand">本期主打</Kicker>
            <div className="hero-feature-card">
              <a
                href={cardHref(featured.slug)}
                className={window.cardArtFrameClass(featured, "hero-feature-art")}
                style={window.cardArtFrameStyle(featured)}
              >
                <img src={window.cardArt(featured)} alt="" className="art" />
              </a>
              <div className="hero-feature-text">
                <div className="hero-feature-name">{featured.name}</div>
                <dl className="hero-feature-specs">
                  <div><dt>费用</dt><dd>{featured.fee}</dd></div>
                  <div><dt>返现</dt><dd>{featured.cashback}</dd></div>
                  <div><dt>身份</dt><dd>{featured.idType}</dd></div>
                </dl>
                <a className="ca-button ca-button--primary hero-feature-cta"
                   href={applyUrl}
                   target={applyTarget}
                   rel={applyTarget ? "noopener" : undefined}>立即申请</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
        {card.tag && <span className="pc-badge">{card.tag}</span>}
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
          <span className="pc-ai-label">AI 订阅</span>
          <span className="pc-ai-row">
            <span className="pc-ai-item"><StatusDot s={card.ai.chatgpt}/> ChatGPT</span>
            <span className="pc-ai-item"><StatusDot s={card.ai.claude}/> Claude</span>
            <span className="pc-ai-item"><StatusDot s={card.ai.midjourney}/> MJ</span>
          </span>
        </div>

        <div className="pc-foot">
          <a className="pc-tutorial" href={cardHref(card.slug)}>开卡教程</a>
          <a className="ca-button ca-button--primary pc-apply"
             href={applyUrl}
             target={applyTarget}
             rel={applyTarget ? "noopener" : undefined}
             data-card={card.slug}>立即申请</a>
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
            <button className="ca-tab">大陆可办</button>
            <button className="ca-tab">护照办</button>
            <button className="ca-tab">欧洲</button>
            <button className="ca-tab">AI 订阅友好</button>
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
          <a href="/#gifts" className="ca-button ca-button--outline">进入商店</a>
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

// ── 社群 CTA ────────────────────────────────────────────
function Contact() {
  return (
    <section className="k-section k-section--ink" id="contact">
      <div className="wrap contact-wrap">
        <h2 className="ca-h2 contact-h2">加入社群</h2>
        <div className="contact-cta">
          <a className="ca-button ca-button--primary contact-btn" href="https://t.me/Whohaoe" target="_blank" rel="noopener">
            Telegram 群
          </a>
          <a className="ca-button ca-button--outline contact-btn" href="/#wechat">
            微信扫码
          </a>
        </div>
      </div>
    </section>
  );
}

// ── 页脚 ────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="ftr" id="disclosure">
      <div className="wrap ftr-inner">
        <div className="ftr-brand">
          <span className="ca-brand-mark ftr-mark">卡</span>
          <strong>卡研所 · CARD ATLAS</strong>
        </div>
        <div className="ftr-cols">
          <div>
            <h4>银行卡</h4>
            {CARDS.slice(0, 4).map(c => <a key={c.slug} href={`/#card-${c.slug}`}>{c.name}</a>)}
            <a href="/#cards">查看全部</a>
          </div>
          <div>
            <h4>礼品卡</h4>
            <a href="/#gifts">应用商店</a>
            <a href="/#gifts">流媒体</a>
            <a href="/#gifts">游戏</a>
            <a href="/#gifts">订阅</a>
          </div>
          <div>
            <h4>联系</h4>
            <a href="https://t.me/Whohaoe">Telegram</a>
            <a href="/#wechat">微信</a>
            <a href="mailto:hi@kayanso.com">hi@kayanso.com</a>
          </div>
        </div>
      </div>
      <div className="wrap ftr-bottom">
        <span>© 2026 卡研所</span>
        <span>部分链接为推广链接</span>
      </div>
    </footer>
  );
}

// ── 路由 ────────────────────────────────────────────────
function normalizeLegacyHashRoute() {
  const legacy = window.location.hash.match(/^#\/(.+)/);
  if (!legacy) return false;

  const cleanPath = `/${legacy[1].replace(/^\/+/, "")}`;
  window.history.replaceState(null, "", cleanPath);
  return true;
}

function readRoute() {
  normalizeLegacyHashRoute();

  const clean = window.location.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "cards" && parts[1]) return { scene: "card", slug: parts[1] };
  if (parts[0] === "shop" && parts[1] && parts[2] === "buy") {
    return { scene: "giftBuy", slug: parts[1], region: parts[3] || null };
  }
  if (parts[0] === "shop" && parts[1]) return { scene: "gift", slug: parts[1] };
  return { scene: "home" };
}

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  React.useEffect(() => {
    const handler = () => setRoute(readRoute());
    handler();
    window.addEventListener("popstate", handler);
    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("hashchange", handler);
    };
  }, []);
  return route;
}

// ── App ────────────────────────────────────────────────
function App() {
  const route = useRoute();
  const [section, setSection] = useState("cards");

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
    jade:   { jade: "#176f62", soft: "rgba(23,112,97,0.08)" },
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
  } else {
    scene = (
      <React.Fragment>
        {tweaks.showPromo && <PromoBar />}
        <Header section={section} setSection={setSection} />
        <Hero featured={featured} />
        <ProductGrid cards={CARDS} />
        <GiftCardStrip />
        <FAQ />
        <Contact />
        <Footer />
      </React.Fragment>
    );
  }

  return (
    <div className={`shell cols-${tweaks.gridCols}`} id="top"
         style={{ "--color-jade": acc.jade, "--bg-brand-soft": acc.soft, "--fg-brand": acc.jade }}>
      {scene}

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
Object.assign(window, { Footer, Contact, Header });
