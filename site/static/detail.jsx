/* 卡研所 — 二级页面：/cards/<slug> 银行卡详情 + /shop/<slug> 礼品卡详情。
   卡面用 img + SVG mock 作 fallback；若 data.js 里的卡有 officialArt 字段则用它。 */

const CARDS_BY_SLUG = Object.fromEntries(window.CARDS.map(c => [c.slug, c]));
const GIFTS_BY_SLUG = Object.fromEntries(window.GIFT_CARDS.map(g => [g.slug, g]));
const TUTORIALS = window.TUTORIALS;
const GIFT_DETAILS = window.GIFT_DETAILS;
const cardArt = window.cardArt;
const giftArt = window.giftArt;

// ── 详情页顶栏（共用） ──────────────────────────────────────
function DetailHeader({ back = "#/", backLabel = "全部产品" }) {
  return (
    <header className="hdr hdr--detail">
      <div className="hdr-inner">
        <a href="#/" className="brand">
          <span className="ca-brand-mark">卡</span>
          <span className="brand-word">
            <span className="brand-zh">卡研所</span>
            <span className="brand-en">CARD ATLAS</span>
          </span>
        </a>
        <nav className="hdr-nav">
          <a className="hdr-tab" href="#/">首页</a>
          <a className="hdr-tab" href="/#cards">银行卡</a>
          <a className="hdr-tab" href="/#gifts">礼品卡</a>
          <a className="hdr-tab" href="/#faq">常见问题</a>
        </nav>
        <div className="hdr-right">
          <a className="hdr-link" href={back}>返回{backLabel}</a>
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
  const others = window.CARDS.filter(c => c.slug !== slug).slice(0, 3);
  const applyUrl = card.applyUrl || "https://t.me/Whohaoe";
  const applyTarget = applyUrl.startsWith("http") ? "_blank" : undefined;

  return (
    <div className="detail">
      <DetailHeader back="/#cards" backLabel="银行卡" />

      {/* Hero */}
      <section className="d-hero">
        <div className="wrap d-hero-inner">
          <div className={window.cardArtFrameClass(card, "d-hero-art")} style={window.cardArtFrameStyle(card)}>
            <img src={cardArt(card)} alt={`${card.name} 卡面`} className="art" />
          </div>
          <div className="d-hero-text">
            <a href="/#cards" className="d-back">全部银行卡</a>
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
                 data-aff={slug}>立即申请</a>
              {card.youtubeId && <a className="ca-button ca-button--outline ca-button--lg" href="#video">看视频教程</a>}
            </div>
          </div>
        </div>
      </section>

      {/* 开卡教程 */}
      <section className="k-section" id="tutorial">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">开卡教程 · {steps.length} 步</h2>
            <span className="ca-meta">预计耗时 10–20 分钟</span>
          </div>
          <ol className="steps">
            {steps.map(s => (
              <li key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-body">
                  <h3 className="step-title">{s.t}</h3>
                  <p className="step-text">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

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

      {/* 视频 */}
      {card.youtubeId && (
        <section className="k-section" id="video">
          <div className="wrap">
            <div className="grid-head">
              <h2 className="ca-h2">视频教程</h2>
              <span className="ca-meta">YouTube · 实测</span>
            </div>
            <div className="d-video">
              <iframe
                src={`https://www.youtube.com/embed/${card.youtubeId}`}
                title={`${card.name} 视频教程`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* 同期推荐 */}
      <section className="k-section">
        <div className="wrap">
          <h2 className="ca-h2" style={{ marginBottom: 24 }}>看看其它卡</h2>
          <div className="cross">
            {others.map(c => (
              <a key={c.slug} href={`/#/cards/${c.slug}`} className="cross-item">
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

      <window.Footer />
    </div>
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
      <DetailHeader back="/#gifts" backLabel="礼品卡" />

      <section className="d-hero">
        <div className="wrap d-hero-inner">
          <div className={window.giftArtFrameClass(g, "d-hero-art")} style={window.giftArtFrameStyle(g)}>
            <img src={giftArt(g)} alt={`${d.name} 礼品卡`} className="art" />
          </div>
          <div className="d-hero-text">
            <a href="/#gifts" className="d-back">全部礼品卡</a>
            <div className="ca-kicker">{d.sub}</div>
            <h1 className="d-h1">{d.name}</h1>
            <p className="d-lead">{d.desc}</p>
            <div className="d-cta">
              <a className="ca-button ca-button--primary ca-button--lg" href="https://t.me/Whohaoe" target="_blank" rel="noopener" data-aff={slug}>立即购买</a>
              <a className="ca-button ca-button--outline ca-button--lg" href="#use">使用说明</a>
            </div>
          </div>
        </div>
      </section>

      {/* 区码 + 面额表 */}
      <section className="k-section">
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
                <a className="region-buy" href="https://t.me/Whohaoe" target="_blank" rel="noopener" data-aff={`${slug}-${r.code}`}>购买 {r.code} 区码</a>
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
              <a key={x.slug} href={`/#/shop/${x.slug}`} className="cross-item">
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
            <a className="link-jade" href="#/">返回首页</a>
          </p>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { CardDetail, GiftDetail, NotFound, Dot });
