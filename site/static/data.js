// ── SVG 卡面 → data URL（image-slot 的 src 默认值；用户拖入官方图后覆盖） ─
window.cardFaceToDataUrl = function(card) {
  const { color, name, network } = card;
  let netMark;
  if (network && network.includes("Visa") && network.includes("Master"))
    netMark = `<text x="298" y="178" fill="#fff" font-size="11" font-weight="700" font-family="sans-serif" letter-spacing="1.2" text-anchor="end">VISA / MC</text>`;
  else if (network && network.includes("Visa"))
    netMark = `<text x="298" y="178" fill="#fff" font-size="15" font-weight="800" font-family="sans-serif" letter-spacing="2.5" text-anchor="end">VISA</text>`;
  else
    netMark = `<circle cx="262" cy="172" r="12" fill="#eb001b"/><circle cx="278" cy="172" r="12" fill="#f79e1b" opacity=".92"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
    <rect x="0" y="0" width="320" height="200" rx="14" fill="${color}"/>
    <path d="M0 70 L320 0 L320 26 L0 96 Z" fill="#ffffff" opacity=".08"/>
    <rect x="22" y="34" width="38" height="28" rx="4" fill="#e6d28a" opacity=".92"/>
    <rect x="26" y="38" width="30" height="20" rx="2" fill="none" stroke="#b58c2f" stroke-opacity=".75"/>
    <line x1="41" y1="38" x2="41" y2="58" stroke="#b58c2f" stroke-opacity=".55"/>
    <line x1="26" y1="48" x2="56" y2="48" stroke="#b58c2f" stroke-opacity=".55"/>
    <text x="22" y="150" fill="#fff" font-size="9" font-weight="700" font-family="sans-serif" letter-spacing="1.8" opacity=".7">CARDHOLDER</text>
    <text x="22" y="170" fill="#fff" font-size="14" font-weight="700" font-family="sans-serif" letter-spacing=".5">${name.toUpperCase()}</text>
    ${netMark}
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
};

window.giftFaceToDataUrl = function(g) {
  const label = (g.name || g.slug).split(" ")[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
    <rect x="0" y="0" width="320" height="200" rx="14" fill="${g.color}"/>
    <text x="160" y="108" fill="#fff" font-size="22" font-weight="800" font-family="sans-serif" letter-spacing="2" text-anchor="middle">${label}</text>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
};

// 优先使用 officialArt 字段（指向官方卡面 URL）；否则用 SVG mock
window.cardArt = function(card) { return card.officialArt || window.cardFaceToDataUrl(card); };
window.giftArt = function(g)    { return g.officialArt    || window.giftFaceToDataUrl(g); };
window.CARDS = [
  {
    slug: "bybit-card",
    no: "01",
    name: "Bybit 虚拟卡",
    issuer: "Bybit · 万事达",
    color: "#f0a800",  // bybit gold
    lead: "0 开卡费、0 年费，发卡地哈萨克斯坦。绑定支付宝、微信均稳定。",
    rating: 4.8,
    tag: "推荐",
    idType: "身份证",
    regions: "全球（含亚太）",
    fee: "免费",
    cashback: "最高 10%",
    network: "Mastercard",
    bin: "哈萨克斯坦",
    officialArt: "/images/cards/official/bybit-card.png",
    applyUrl: "https://www.bybit.com/cards/?ref=RZDGOXK&source=applet_invite",
    youtubeId: "nRonDOI1Hho",
    pros: [
      "无开卡费、无年费",
      "大陆身份证即可开",
      "可绑支付宝 / 微信",
      "消费返现按持仓阶梯",
    ],
    cons: [
      "需先注册 Bybit 交易所账户",
      "返现需要一定持仓",
    ],
    ai: { chatgpt: "warn", claude: "warn", midjourney: "ok",
      note: "哈萨克斯坦卡段被 Stripe 标风险地区，需配美国住宅 IP；MJ 等宽松平台稳定。" },
  },
  {
    slug: "bybit-eu-card",
    no: "02",
    name: "Bybit 欧洲卡",
    issuer: "Bybit EU · 万事达",
    color: "#1f4ea8",  // eu cobalt
    lead: "欧洲华人专属，新户赠 10 USDC 体验金。BIN 来自欧盟，Stripe 信任度高。",
    rating: 4.7,
    tag: "欧洲专属",
    idType: "护照",
    regions: "欧洲 EEA",
    fee: "免费",
    cashback: "最高 10%",
    network: "Mastercard",
    bin: "欧盟 EEA",
    officialArt: "/images/cards/official/bybit-eu-card.png",
    applyUrl: "https://www.bybit.eu/cards/?ref=1NNDZ0W&source=applet_invite",
    youtubeId: "nRonDOI1Hho",
    pros: [
      "0 开卡费、0 年费",
      "欧洲护照 / 欧盟居民可开",
      "注册赠 10 USDC 体验金",
      "支持 USDT 直接消费",
    ],
    cons: [
      "需要欧洲居住地址",
      "仅限 EEA 地区用户",
    ],
    ai: { chatgpt: "warn", claude: "warn", midjourney: "ok",
      note: "欧盟 BIN 在 Stripe 通过率高于亚洲卡；订阅成功率因 IP 节点而异。" },
  },
  {
    slug: "safepal-card",
    no: "03",
    name: "SafePal 万事达卡",
    issuer: "SafePal · 万事达",
    color: "#1f6fcf",  // safepal blue
    lead: "瑞士银行背书，附赠 IBAN 账户。大陆护照可办，2026 年后不再受理身份证。",
    rating: 4.6,
    tag: "大陆可办",
    idType: "护照",
    regions: "全球（含大陆）",
    fee: "免费",
    cashback: "1%",
    network: "Mastercard",
    bin: "瑞士",
    officialArt: "/images/cards/official/safepal-card.png",
    applyUrl: "https://t.me/Whohaoe",
    youtubeId: "rSWtH_urn1Y",
    pros: [
      "完全免费",
      "附赠瑞士 IBAN",
      "可绑支付宝 / 微信",
      "大陆护照可开",
    ],
    cons: [
      "2026 起需护照（不再支持身份证）",
      "需链上 ETH 铸造 NFT 才能开卡",
    ],
    ai: { chatgpt: "warn", claude: "warn", midjourney: "ok",
      note: "直刷成功率偏低；走美区 Apple Pay 绑定后可显著提升。" },
  },
  {
    slug: "pokepay",
    no: "04",
    name: "Pokepay 虚拟卡",
    issuer: "Pokepay · Visa / 万事达",
    color: "#6840c7",  // pokepay violet
    lead: "面向华人发行的港 BIN 卡。0 月费，可绑支付宝、微信、PayPal。",
    rating: 4.5,
    tag: "身份证可办",
    idType: "身份证",
    regions: "全球（含大陆 / 香港）",
    fee: "0 月费",
    cashback: "—",
    network: "Visa / Mastercard",
    bin: "香港",
    officialArt: "/images/cards/official/pokepay-card.png",
    applyUrl: "https://t.me/Whohaoe",
    youtubeId: "CUfqusNgyVU",
    pros: [
      "大陆身份证可开",
      "可绑微信 / 支付宝 / PayPal",
      "Visa + MC 双网络",
      "0 月费、0 年费",
    ],
    cons: [
      "开卡需 5–20 USDT",
      "Steam、暴雪等平台不通过",
    ],
    ai: { chatgpt: "no", claude: "no", midjourney: "ok",
      note: "港 BIN 已被 OpenAI / Anthropic 屏蔽，直付 ChatGPT、Claude 失败。" },
  },
  {
    slug: "roogoo",
    no: "05",
    name: "Roogoo 卡",
    issuer: "Roogoo · Visa / 万事达",
    color: "#0f7a4b",  // roogoo green
    lead: "美国 MSB 牌照，美区 BIN。持平台币 ROOG 可终身 0 费率。",
    rating: 4.4,
    tag: "0 费率",
    idType: "身份证",
    regions: "全球华人（美 MSB）",
    fee: "免费",
    cashback: "—",
    network: "Visa / Mastercard",
    bin: "美国",
    officialArt: "/images/cards/official/roogoo-card.svg",
    applyUrl: "https://wap.roogoo.cloud/register?inviteCode=0eq357",
    youtubeId: "t9dhdeERN7g",
    pros: [
      "持币可终身 0 费率",
      "7 天试用期 0 费率",
      "支持支付宝 / 微信绑定",
      "官方提供 AI 订阅教程",
    ],
    cons: [
      "仅支持 USDT 充值",
      "高费率套餐需持仓代币",
    ],
    ai: { chatgpt: "ok", claude: "ok", midjourney: "ok",
      note: "美 MSB + 美 BIN，官方对接 ChatGPT、Claude 订阅，配美国 IP 即可。" },
  },
  {
    slug: "kraken-card",
    no: "06",
    name: "Kraken 海妖卡",
    issuer: "Kraken · 万事达",
    color: "#2d2a6b",  // kraken indigo
    lead: "Kraken 出品，新户 30 天内消费 2% 返现。仅限英国与欧洲用户。",
    rating: 4.2,
    tag: null,
    idType: "护照",
    regions: "英国 + EEA",
    fee: "免费",
    cashback: "0.5%–2%",
    network: "Mastercard",
    bin: "英国 / 欧盟",
    officialArt: "/images/cards/official/kraken-card.png",
    applyUrl: "https://t.me/Whohaoe",
    youtubeId: "mKqiHKqy2k8",
    pros: [
      "0 外汇手续费",
      "新户 30 天 2% 返现",
      "支持 400+ 加密货币消费",
      "即时发放虚拟卡",
    ],
    cons: [
      "仅限英国 / 欧洲",
      "2% 返现需持仓 £50,000+",
    ],
    ai: { chatgpt: "warn", claude: "warn", midjourney: "ok",
      note: "英国 / 欧盟 BIN，理论可用；仅限欧洲用户申请。" },
  },
];

// Practical pitfalls — facts the reader should know BEFORE picking a card.
window.PITFALLS = [
  {
    title: "ChatGPT、Claude 不接受亚洲 BIN",
    body: "哈萨克斯坦、香港、印尼等亚洲发卡地的 BIN，多数被 OpenAI 与 Anthropic 的风控直接拒付。需要美区 / 欧区 BIN 才稳定。",
  },
  {
    title: "美国住宅 IP 是隐性门槛",
    body: "即使卡段通过，付款时 IP、时区、语言、Apple ID 地区都会被一并校验。数据中心 IP 普遍不通过。",
  },
  {
    title: "返现门槛多数挂钩持仓",
    body: "Bybit 10% 返现、Kraken 2% 返现、Roogoo 0 费率都要求持仓平台币或法币达到一定额度，否则按基础档执行。",
  },
  {
    title: "可绑支付宝 / 微信 ≠ 国内商户可刷",
    body: "万事达、Visa 网络在国内只能用于扫境外二维码、海外商户结算，不能直接消费人民币商户。",
  },
];

// ── 礼品卡商店（首页轮播 6 张热门）─────────────────────────
window.GIFT_CARDS = [
  { slug: "apple",    name: "Apple Gift Card",  scope: "App Store / iTunes",      tag: "热销", price: "$10 起", color: "#1d1d1f" },
  { slug: "steam",    name: "Steam 钱包卡",      scope: "美 / 欧 / 英区",           tag: "热销", price: "$5 起",  color: "#1b2838" },
  { slug: "netflix",  name: "Netflix 礼品卡",    scope: "美 / 英区",                tag: null,   price: "$15 起", color: "#a51722" },
  { slug: "google",   name: "Google Play",       scope: "美 / 日 / 英区",           tag: null,   price: "$10 起", color: "#1f60c4" },
  { slug: "psn",      name: "PlayStation Store", scope: "港 / 美 / 日区",           tag: null,   price: "$10 起", color: "#0a2c7a" },
  { slug: "battlenet",name: "Battle.net 点卡",   scope: "美 / 欧区",                tag: "国服停运", price: "$20 起", color: "#0e6cd1" },
];

// ── 首页常见问题 ──────────────────────────────────────────
window.FAQS = [
  { q: "大陆身份证能开哪几张？", a: "Bybit 虚拟卡、Pokepay、Roogoo。其它卡需要护照或欧洲居住地址。" },
  { q: "开通后多久能用？", a: "Bybit / Roogoo / Pokepay 即时发卡，几分钟内可用；SafePal 需要链上铸造 NFT，约 10–20 分钟；Kraken 申请后即时发放。" },
  { q: "可以付 ChatGPT、Claude 吗？", a: "Roogoo 通过率最高（美 MSB + 美 BIN）。Bybit、SafePal 配美国住宅 IP + Apple Pay 也可，但成功率不稳定。Pokepay 港 BIN 已被屏蔽。" },
  { q: "返现是怎么算的？", a: "返现门槛挂钩平台币持仓 / 交易量。Bybit 10% 与 Kraken 2% 都需要持仓达到一定额度，否则按基础档执行。" },
];

// ── 银行卡开卡教程（每张卡 5–6 步）────────────────────────
window.TUTORIALS = {
  "bybit-card": [
    { n: "01", t: "注册 Bybit 主账户",     b: "邮箱 + 手机号同时验证。开户地区建议选择哈萨克斯坦等非受限地区，大陆身份证可完成 KYC。" },
    { n: "02", t: "KYC L1 身份认证",        b: "大陆身份证正反面 + 人脸识别。通过后获得 USDT 充提权限。全程 3–5 分钟。" },
    { n: "03", t: "充值 USDT 到资金账户",   b: "从 OKX、Binance、钱包转账，仅 TRC20 网络免费。建议首次转入 100 USDT 以上以触发卡申请门槛。" },
    { n: "04", t: "申请虚拟卡",             b: "侧边栏「Bybit Card」→「虚拟卡」→「立即申请」。几秒钟发卡。" },
    { n: "05", t: "绑定支付宝 / 微信",      b: "支付宝 App > 我的 > 银行卡 > 添加卡。输入卡号 + 有效期 + CVV。验证短信到 Bybit App 的消息中心。" },
    { n: "06", t: "小额测试消费",           b: "推荐先扫一个 7-Eleven 二维码或便利店付 5–10 元。成功扣账后返现 1–3 天到账。" },
  ],
  "bybit-eu-card": [
    { n: "01", t: "注册 Bybit.eu 账户",     b: "需要欧洲居住地址 + 邮箱手机。bybit.eu 与 bybit.com 是不同实体，账户不共享。" },
    { n: "02", t: "KYC 验证",               b: "上传欧盟护照或居留卡 + 居住地址证明（电费单 / 银行账单）。1 个工作日内审核完成。" },
    { n: "03", t: "充值 USDC",              b: "建议充值 100 USDC 以触发新户 10 USDC 体验金。EEA 用户也可法币入金。" },
    { n: "04", t: "申请欧洲卡",             b: "Card 页面 → 申请虚拟卡 → 同意 EEA 条款。即时发卡。" },
    { n: "05", t: "Apple Pay / Google Pay", b: "推荐绑 Apple Pay，欧洲 BIN 在 Stripe 通过率更高，可用于 ChatGPT、Claude 订阅。" },
  ],
  "safepal-card": [
    { n: "01", t: "下载 SafePal App",       b: "iOS / Android 商店搜索 SafePal。注册时支持邮箱或手机号，不强制 KYC。" },
    { n: "02", t: "完成卡片 KYC",           b: "卡片申请入口需独立 KYC：护照 + 人脸 + 自拍持证。2026 年起不再受理身份证。" },
    { n: "03", t: "链上铸造 NFT 开卡",      b: "需 ETH 主网 Gas 费（约 $3–8）。点击「Mint Card NFT」，等待区块确认（10–20 分钟）。" },
    { n: "04", t: "激活并充值",             b: "Card 页面 → 激活 → 充值 USDT / USDC。SafePal 内置 IBAN 账户可用于法币转入。" },
    { n: "05", t: "绑定支付宝",             b: "支付宝添加卡，验证短信发送到 SafePal App 内消息。直刷不稳，建议改走 Apple Pay。" },
  ],
  "pokepay": [
    { n: "01", t: "Pokepay 官方注册",       b: "访问 pokepay.io，邮箱或手机号注册。支持中文界面。" },
    { n: "02", t: "身份证 KYC",             b: "上传大陆身份证 + 人脸识别。无需护照，无需居住证明。" },
    { n: "03", t: "购买卡（5–20 USDT）",    b: "选择 Visa 或 Mastercard 卡段。开卡费 5 USDT 起，按卡段不同浮动。" },
    { n: "04", t: "充值并绑定",             b: "支持 USDT、TRX、ETH 链上充值。可绑微信、支付宝、PayPal。" },
    { n: "05", t: "可用场景测试",           b: "可用：日常海外消费、订阅 Midjourney、亚马逊。不可用：ChatGPT、Claude、Steam、暴雪。" },
  ],
  "roogoo": [
    { n: "01", t: "Roogoo App 注册",        b: "访问 wap.roogoo.cloud，邀请码自动填入。手机号 / 邮箱注册。" },
    { n: "02", t: "身份证 KYC",             b: "大陆身份证 + 人脸。10–15 分钟内审核完成。" },
    { n: "03", t: "充值 USDT",              b: "TRC20 链充值最快。建议首次 50 USDT 以上。" },
    { n: "04", t: "申请虚拟卡 + 选费率档",  b: "免费版（7 天 0 费率试用）/ 持仓 ROOG 终身 0 费率 / 默认 1.5% 费率。" },
    { n: "05", t: "AI 订阅实操",            b: "美区 BIN，配美国住宅 IP + Apple Pay 美区账号。官方提供 ChatGPT Plus、Claude Pro 订阅教程。" },
    { n: "06", t: "绑定支付宝",             b: "支付宝添加卡，使用美区 BIN 注意：单笔大额可能触发风控，建议先小额跑通。" },
  ],
  "kraken-card": [
    { n: "01", t: "Kraken 主账户开通",      b: "欧洲护照 + 居住地址。Kraken Pro 账户与卡共用 KYC。" },
    { n: "02", t: "升级到 Pro Tier",        b: "卡片申请要求账户级别达到 Intermediate 或以上。需上传地址证明。" },
    { n: "03", t: "申请实体 / 虚拟卡",      b: "Card 页面申请。虚拟卡即时发放，实体卡 5–7 个工作日邮寄。" },
    { n: "04", t: "充值加密资产",           b: "支持 400+ 资产消费。下单时自动按汇率换算扣账。0 外汇手续费。" },
    { n: "05", t: "新户 2% 返现激活",       b: "前 30 天内消费按 2% 返现，需账户持仓 £50,000+ 或交易量达标。" },
  ],
};

// ── 礼品卡详情数据 ────────────────────────────────────────
window.GIFT_DETAILS = {
  apple: {
    name: "Apple Gift Card",
    sub: "App Store · iTunes · Apple Music",
    color: "#1d1d1f",
    desc: "Apple 官方礼品卡，可用于 App Store 内购、iTunes 充值、Apple Music 与 iCloud 订阅。区码即美区 / 港区 / 日区 / 英区，按区出码。",
    regions: [
      { code: "US", name: "美区", currency: "USD", denom: "$10 / $25 / $50 / $100" },
      { code: "HK", name: "港区", currency: "HKD", denom: "$100 / $300 / $500" },
      { code: "JP", name: "日区", currency: "JPY", denom: "¥1500 / ¥3000 / ¥5000 / ¥10000" },
      { code: "GB", name: "英区", currency: "GBP", denom: "£15 / £25 / £50" },
    ],
    use: ["国区下架的 App 用港 / 美区账号购买", "iCloud 200GB / 2TB 续费", "Apple Music / Apple TV+ 订阅", "App 内购通用"],
  },
  steam: {
    name: "Steam 钱包卡",
    sub: "Steam 钱包充值码",
    color: "#1b2838",
    desc: "Valve 官方钱包充值码，国区可直接使用美元 / 欧元区码。游戏价差通常 30–50%。",
    regions: [
      { code: "US", name: "美元区", currency: "USD", denom: "$5 / $20 / $50 / $100" },
      { code: "EU", name: "欧元区", currency: "EUR", denom: "€10 / €25 / €50" },
      { code: "GB", name: "英镑区", currency: "GBP", denom: "£5 / £20 / £50" },
    ],
    use: ["买区域差价游戏（DLC / 季票）", "Steam 工坊订阅", "礼物给好友"],
  },
  netflix: {
    name: "Netflix 礼品卡",
    sub: "Netflix 账户充值",
    color: "#a51722",
    desc: "Netflix 官方礼品卡，可绑定海外账户，按月扣账。",
    regions: [
      { code: "US", name: "美区", currency: "USD", denom: "$30 / $60 / $100" },
      { code: "GB", name: "英区", currency: "GBP", denom: "£25 / £50" },
    ],
    use: ["美区 / 英区 Netflix 账户充值", "升级 4K 订阅档"],
  },
  google: {
    name: "Google Play",
    sub: "Google Play 应用市场充值",
    color: "#1f60c4",
    desc: "Google Play 官方充值卡，用于 Android 应用 / 游戏内购、YouTube Premium 订阅。",
    regions: [
      { code: "US", name: "美区", currency: "USD", denom: "$10 / $25 / $50" },
      { code: "JP", name: "日区", currency: "JPY", denom: "¥1500 / ¥3000 / ¥5000" },
      { code: "GB", name: "英区", currency: "GBP", denom: "£10 / £25 / £50" },
    ],
    use: ["YouTube Premium 订阅", "Android 应用购买", "游戏内购"],
  },
  psn: {
    name: "PlayStation Store",
    sub: "PSN 钱包充值",
    color: "#0a2c7a",
    desc: "Sony 官方 PSN 钱包充值卡。港区账号大陆直连最快，日区游戏价格优势明显。",
    regions: [
      { code: "HK", name: "港区", currency: "HKD", denom: "$100 / $300 / $500" },
      { code: "US", name: "美区", currency: "USD", denom: "$10 / $20 / $50" },
      { code: "JP", name: "日区", currency: "JPY", denom: "¥1000 / ¥3000 / ¥5000" },
    ],
    use: ["PS5 / PS4 游戏下载", "PS+ 订阅会员", "DLC 与游戏内购"],
  },
  battlenet: {
    name: "Battle.net 点卡",
    sub: "暴雪国际服充值",
    color: "#0e6cd1",
    desc: "暴雪国服停运后必备，魔兽 / 炉石 / 守望先锋 / 暗黑 4 国际服点卡充值。",
    regions: [
      { code: "US", name: "美区", currency: "USD", denom: "$20 / $50 / $100" },
      { code: "EU", name: "欧区", currency: "EUR", denom: "€20 / €50 / €100" },
    ],
    use: ["《魔兽世界》订阅", "《炉石传说》卡包", "《守望先锋 2》皮肤", "《暗黑破坏神 4》DLC"],
  },
};
