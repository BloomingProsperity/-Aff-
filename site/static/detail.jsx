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
const dCardTutorialHref = slug => `${dCardHref(slug)}#tutorial`;
const dCardApplyHref = card => card.applyUrl || card.officialUrl || dCardHref(card.slug);
const externalTargetFor = href => href && href.startsWith("http") ? "_blank" : undefined;
const dGiftHref = slug => `/shop/${slug}`;
const dGiftBuyHref = (slug, region) => region ? `/shop/${slug}/buy/${region}` : `/shop/${slug}/buy`;
const scrollToAnchor = id => {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};
const asArray = value => Array.isArray(value) ? value : (value ? [value] : []);
const tutorialAnchor = step => `tutorial-step-${step.n}`;
const fundingAnchor = index => `funding-item-${String(index + 1).padStart(2, "0")}`;
const CARD_CLICK_FLOWS = {
  "bybit-card": ["打开 Bybit App", "首页点 More / 更多", "Finance / 金融", "Card", "Activate / Apply Now", "选择哈萨克斯坦", "填写地址和用途", "绑定手机号", "提交审核", "查看虚拟卡"],
  "bybit-eu-card": ["打开 Bybit EU", "Finance / 金融", "Card", "Apply", "选择德国 / 法国等 EU 地区", "上传身份材料", "提交地址证明", "设置安全项", "提交申请", "启用虚拟卡"],
  "safepal-card": ["打开 SafePal", "底部 Bank", "Get Started", "Next", "Mint My Account NFT", "Register", "填写资料", "打开 ReadID", "扫护照和 NFC", "等待审核", "Activate Card"],
  "pokepay": ["打开 Pokepay", "注册 / 登录", "填写邀请码", "Account / KYC", "上传证件和自拍", "Wallet / Deposit", "USDT TRC20 充值", "Cards / PokeCard", "Apply", "支付开卡费", "View Card"],
  "roogoo": ["打开 Roogoo Dashboard", "Assets", "Deposit USDT", "选择 TRC20", "Account / Verification", "完成 Sumsub KYC", "Cards", "Apply Card", "选择卡片", "Transfer to Card", "View Details"],
  "kraken-card": ["打开 Krak App", "Profile / KYC", "上传证件", "上传地址证明", "Everyday Account", "Card", "Apply", "确认条款", "View Virtual Card", "Add to Apple Pay / Google Pay"],
};
const requiresPassport = card => [
  card.idType,
  card.lead,
  card.regions,
  ...(card.pros || []),
  ...(card.cons || []),
].filter(Boolean).join(" ").includes("护照");

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
  const pathFor = item => {
    if (typeof item !== "string" || !item.includes("→")) return [];
    return item.split("→").map(part => part.trim()).filter(Boolean);
  };

  return (
    <li className="step" id={anchorId}>
      <div className="step-num">{step.n}</div>
      <div className="step-body">
        <div className="step-copy">
          <h3 className="step-title">{step.t}</h3>
          <p className="step-text">{step.b}</p>
          {actions.length > 0 && (
            <div className="step-actions-wrap">
              <div className="step-actions-title">照着点</div>
              <ol className="step-actions">
                {actions.map((item, i) => {
                  const path = pathFor(item);
                  return (
                    <li key={i}>
                      <span className="step-action-index">第 {String(i + 1).padStart(2, "0")} 步</span>
                      <span className="step-action-text">{item}</span>
                      {path.length > 1 && (
                        <span className="step-click-path" aria-label="点击路径">
                          <b>点击路径</b>
                          {path.map((part, pi) => (
                            <React.Fragment key={`${part}-${pi}`}>
                              {pi > 0 && <em>-</em>}
                              <span>{part}</span>
                            </React.Fragment>
                          ))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
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

function PassportGuideSidebar() {
  return (
    <aside className="passport-guide" aria-label="护照办理教程">
      <div className="passport-guide-head">
        <div className="ca-kicker">护照办理教程</div>
        <h3>普通护照保姆级办理流程</h3>
        <p>按第一次办理来写，换发、补发也能照着准备。重点是预约、照片、现场排队、回执和取证。</p>
        <div className="passport-facts">
          <span>工本费 120 元/本</span>
          <span>户籍地 7 个工作日左右</span>
          <span>跨省异地约 20 日</span>
          <span>成人护照有效期 10 年</span>
        </div>
      </div>
      <ol className="passport-steps">
        <li>
          <strong>1. 先确定在哪办</strong>
          <span>优先选离你最近的公安出入境大厅。内地居民普通护照可全国通办，但每个城市的预约入口、放号时间、周六是否办公不一样，先在地图搜“出入境接待大厅”，再去官方入口预约。</span>
        </li>
        <li>
          <strong>2. 打开预约入口</strong>
          <span>微信/支付宝搜“移民局 12367”，进入后点“中国公民服务”或“出入境证件预约”。有些城市也能用本地公安出入境公众号、粤省事、随申办、政务服务小程序预约。</span>
        </li>
        <li>
          <strong>3. 选择办证事项</strong>
          <span>第一次办选“普通护照首次申请”；快到期、签证页快用完选“换发”；遗失、被盗、损毁选“补发”；姓名等记载事项变化才选“加注”。事项选错，到窗口可能会让你重新取号。</span>
        </li>
        <li>
          <strong>4. 填预约信息</strong>
          <span>按页面填户籍地、现居地、预约大厅、预约日期、预约时段、前往国家/地区、申请事由、手机号和领证方式。信息提交前核对身份证号、姓名拼音和手机号，手机号后面会收进度短信。</span>
        </li>
        <li>
          <strong>5. 准备身份证</strong>
          <span>成年人带居民身份证原件。身份证正在换领、补领的，带临时居民身份证。多数普通成年人首次办理不用再带户口簿，但当地窗口另有要求时按当地要求来。</span>
        </li>
        <li>
          <strong>6. 照片和回执这样处理</strong>
          <span>照片是最容易返工的地方。最稳的是到办证大厅现场拍；想节省排队时间，可以提前去官方认可照相点拍，拿“出入境证件数字相片采集回执”。不要美颜、滤镜、翻拍、镜面照、浓妆、帽子、有色镜片，头发不要挡眉眼。</span>
        </li>
        <li>
          <strong>7. 分情况补材料</strong>
          <span>换发带旧护照；补发准备遗失、被盗或损毁情况说明；未满 16 周岁由监护人陪同，并带出生证明或户口簿等监护关系证明、监护人身份证明；登记备案人员和现役军人提前准备单位或主管部门同意意见。</span>
        </li>
        <li>
          <strong>8. 到场前检查一遍</strong>
          <span>出门前确认身份证、预约记录、照片回执、旧护照或补充材料都在。建议提前 15-30 分钟到，节假日前后人多；没拍照的先去拍照机或照相窗口，拍完再取号。</span>
        </li>
        <li>
          <strong>9. 进大厅后的顺序</strong>
          <span>常见顺序是：拍照或取照片回执 → 自助填表/打印申请表 → 取号 → 等叫号 → 窗口交材料。大厅布局不同，但看“照相、填表、取号、受理”这几个牌子走就行。</span>
        </li>
        <li>
          <strong>10. 窗口核验</strong>
          <span>窗口会核对身份证、照片、申请表和补充材料，并确认本人办理。被问申请事由时，按真实用途说，比如旅游、探亲、留学、商务、工作等，和预约里填写的内容保持一致。</span>
        </li>
        <li>
          <strong>11. 录指纹和签名</strong>
          <span>窗口受理时会采集人像、指纹和签名。签名写在指定框内，不要压线、连到边框；指纹按工作人员提示录入。如果手指受伤、脱皮或录不上，现场说明即可。</span>
        </li>
        <li>
          <strong>12. 缴费和拿回执</strong>
          <span>普通护照工本费 120 元/本，现场一般支持扫码或刷卡。缴费后拿好受理回执，上面有受理编号、预计取证日期、查询方式、取证方式，后面查进度和取证都靠它。</span>
        </li>
        <li>
          <strong>13. 选择自取或邮寄</strong>
          <span>不急可以选邮寄到家，省得再跑一趟；急用就看当地窗口自取速度。邮寄另付邮费，地址要写能签收的地址，别写临时住处或收不到电话的地方。</span>
        </li>
        <li>
          <strong>14. 等待和查进度</strong>
          <span>户籍地一般 7 个工作日左右，跨省异地一般 20 日左右。可以用“移民局 12367”或当地出入境入口查进度。节假日、补材料、函查、邮寄时间可能让实际拿证更晚。</span>
        </li>
        <li>
          <strong>15. 加急怎么处理</strong>
          <span>加急不是想加就加，通常要有紧急出境理由，比如奔丧、探望危重病人、签证或入境许可即将到期、紧急会议谈判、留学报到临近等，并按窗口要求提交证明材料。</span>
        </li>
        <li>
          <strong>16. 拿到护照后检查</strong>
          <span>当场核对姓名、拼音、性别、出生日期、出生地、签发地、有效期。银行卡或海外平台 KYC 填英文名时，按护照拼音来，大小写无所谓，拼写不要差一个字母。</span>
        </li>
        <li>
          <strong>17. 后续保管</strong>
          <span>护照信息页拍照备份一份，原件单独放好。不要把护照照片、证件号、出生日期随便发群里；做 KYC 上传时确认是官网吗，别发给陌生客服。</span>
        </li>
      </ol>
      <div className="passport-guide-foot">
        <a href="https://www.nia.gov.cn/n741440/n741587/n1316094/n1355872/c1614514/content.html" target="_blank" rel="noopener">国家移民管理局</a>
        <span>具体材料以当地出入境窗口为准</span>
      </div>
    </aside>
  );
}

function CardClickFlow({ slug }) {
  const flow = CARD_CLICK_FLOWS[slug];
  if (!flow || flow.length === 0) return null;
  return (
    <div className="card-click-flow" aria-label="开卡点击路线">
      <div className="card-click-flow-head">
        <span>先看整条点击路线</span>
        <strong>{flow.length} 步</strong>
      </div>
      <div className="card-click-flow-list">
        {flow.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && <span className="card-click-flow-dash">-</span>}
            <span className="card-click-flow-item">{item}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DetailToc({ steps, funding, passport = false }) {
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
          <div className={`toc-grid ${passport ? "toc-grid--passport" : ""}`}>
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
            {passport && <PassportGuideSidebar />}
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
  const applyUrl = dCardApplyHref(card);
  const applyTarget = externalTargetFor(applyUrl);
  const passportRequired = requiresPassport(card);

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
                 href={dCardTutorialHref(slug)}
                 data-aff={slug}>查看攻略</a>
              <a className="ca-button ca-button--outline ca-button--lg"
                 href={applyUrl}
                 target={applyTarget}
                 rel={applyTarget ? "noopener" : undefined}
                 data-aff={slug}>立即开卡</a>
            </div>
          </div>
        </div>
      </section>

      <DetailToc steps={steps} funding={funding} passport={passportRequired} />

      {/* 开卡教程 */}
      <section className="k-section" id="tutorial">
        <div className="wrap">
          <div className="grid-head">
            <h2 className="ca-h2">开卡教程 · {steps.length} 章</h2>
            <span className="ca-meta">{actionCount || steps.length} 步照着点</span>
          </div>
          <CardClickFlow slug={slug} />
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
