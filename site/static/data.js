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
window.cardArtFrameClass = function(card, extra = "") {
  const layout = card && card.artLayout ? `card-art-frame--${card.artLayout}` : "";
  return ["card-art-frame", layout, extra].filter(Boolean).join(" ");
};
window.cardArtFrameStyle = function(card) {
  return card && card.artRatio ? { "--card-art-ratio": card.artRatio } : undefined;
};
window.giftArtFrameClass = function(g, extra = "") {
  const layout = g && g.artLayout ? `gift-art-frame--${g.artLayout}` : "";
  return ["gift-art-frame", layout, extra].filter(Boolean).join(" ");
};
window.giftArtFrameStyle = function(g) {
  return g && g.artRatio ? { "--gift-art-ratio": g.artRatio } : undefined;
};
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
    lead: "面向多币种线上消费和订阅的港 BIN 卡。官方流程是注册、充值、申请、KYC、激活。",
    rating: 4.5,
    tag: "先审资格",
    idType: "证件 KYC",
    regions: "多地区（需资格审查）",
    fee: "0 月费",
    cashback: "—",
    network: "Visa / Mastercard",
    bin: "香港",
    officialArt: "/images/cards/official/pokepay-card.png",
    artLayout: "portrait",
    artRatio: "287 / 414",
    applyUrl: "https://t.me/Whohaoe",
    youtubeId: "CUfqusNgyVU",
    pros: [
      "支持线上消费 / 订阅",
      "支持 3DS 和自助锁卡",
      "Visa + MC 双网络",
      "0 月费、0 年费（以官方为准）",
    ],
    cons: [
      "申请前需先充值",
      "KYC 与服务地区以官方审核为准",
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
      "支持支付宝 / 钱包绑定",
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
    lead: "Krak / Kraken 出品，英国与 EEA 用户可申请。虚拟卡可即时启用，最高 2% cashback 取决于资产等级。",
    rating: 4.2,
    tag: null,
    idType: "护照",
    regions: "英国 + EEA",
    fee: "免费",
    cashback: "最高 2%",
    network: "Mastercard",
    bin: "英国 / 欧盟",
    officialArt: "/images/cards/official/kraken-card.png",
    applyUrl: "https://t.me/Whohaoe",
    youtubeId: "mKqiHKqy2k8",
    pros: [
      "0 月费 / 年费 / 外汇费",
      "支持现金和 400+ 加密资产消费",
      "虚拟卡可即时启用",
      "最高 2% crypto cashback",
    ],
    cons: [
      "仅限英国 / EEA",
      "最高返现和 Metal Card 需 £ / €50,000 平均资产",
      "加密资产消费存在兑换价差",
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
  {
    slug: "apple",
    name: "Apple Gift Card",
    scope: "App Store / iTunes",
    tag: "热销",
    price: "$10 起",
    color: "#1d1d1f",
    officialArt: "/images/gifts/official/apple-gift-card.jpg",
    artRatio: "2982 / 1176",
  },
  {
    slug: "steam",
    name: "Steam 钱包卡",
    scope: "美 / 欧 / 英区",
    tag: "热销",
    price: "$5 起",
    color: "#1b2838",
    officialArt: "/images/gifts/official/steam-gift-card.jpg",
    artRatio: "460 / 216",
  },
  {
    slug: "netflix",
    name: "Netflix 礼品卡",
    scope: "美 / 英区",
    tag: null,
    price: "$15 起",
    color: "#a51722",
    officialArt: "/images/gifts/official/netflix-gift-card.jpg",
    artRatio: "2000 / 1125",
  },
  {
    slug: "google",
    name: "Google Play",
    scope: "美 / 日 / 英区",
    tag: null,
    price: "$10 起",
    color: "#1f60c4",
    officialArt: "/images/gifts/official/google-play-gift-card.webp",
    artRatio: "1652 / 1044",
  },
  {
    slug: "psn",
    name: "PlayStation Store",
    scope: "港 / 美 / 日区",
    tag: null,
    price: "$10 起",
    color: "#0a2c7a",
    officialArt: "/images/gifts/official/playstation-store-gift-card.jpg",
    artRatio: "440 / 220",
  },
  {
    slug: "battlenet",
    name: "Battle.net 点卡",
    scope: "美 / 欧区",
    tag: "国服停运",
    price: "$20 起",
    color: "#0e6cd1",
    officialArt: "/images/gifts/official/battlenet-gift-card.jpg",
    artRatio: "1080 / 608",
  },
];

// ── 首页常见问题 ──────────────────────────────────────────
window.FAQS = [
  { q: "大陆身份证能开哪几张？", a: "Bybit 虚拟卡、Pokepay、Roogoo。其它卡需要护照或欧洲居住地址。" },
  { q: "开通后多久能用？", a: "Bybit / Roogoo / Pokepay 即时发卡，几分钟内可用；SafePal 需要链上铸造 NFT，约 10–20 分钟；Kraken 申请后即时发放。" },
  { q: "可以付 ChatGPT、Claude 吗？", a: "Roogoo 通过率最高（美 MSB + 美 BIN）。Bybit、SafePal 配美国住宅 IP + Apple Pay 也可，但成功率不稳定。Pokepay 港 BIN 已被屏蔽。" },
  { q: "返现是怎么算的？", a: "返现门槛挂钩平台币持仓 / 交易量。Bybit 10% 与 Kraken 2% 都需要持仓达到一定额度，否则按基础档执行。" },
];

// ── 银行卡开卡教程（每张卡 8–9 步）────────────────────────
window.TUTORIALS = {
  "bybit-card": [
    { n: "01", t: "准备账户和安全验证",     b: "使用 Bybit App 或网页注册主账户，先完成邮箱、手机号和 Google 2FA。博主实测提醒：App 下载、注册 IP、选择地区要尽量一致，受限 IP 会直接挡在注册或 Card 入口前。" },
    { n: "02", t: "进入卡片申请入口",       b: "路径是 Finance、Card、Apply Now。选择 Country of Residence 后进入 Eligibility Check。即使主账户已经 KYC，卡片也可能要求重新核验身份和地址。" },
    { n: "03", t: "补齐身份和地址材料",     b: "按页面上传身份证或护照；地址资料需来自 AIFC eligible country，可用含全名和完整住址的证件、utility bill 等。博主教程反复提到：地址要真实可查，且最好能和后续账单地址、手机号、IP 解释得通。" },
    { n: "04", t: "填写用途和收入信息",     b: "继续填写真实居住地址、预计用卡用途、就业状态、收入来源和年收入。后续如果收到补件邮件，按邮件要求上传 PNG、PDF、JPG 或 JPEG 文件。" },
    { n: "05", t: "确认联系方式并提交",     b: "确认或绑定注册邮箱和手机号，阅读 Bybit 条款及持卡人条款，获取验证码后提交。手机号不符合该卡项目时，需要换支持号码或关闭申请。" },
    { n: "06", t: "等待虚拟卡审核",         b: "提交后通常几分钟出结果，个别情况最多 7 个工作日。有些账号会收到补充问卷或声明，按真实情况填写后再提交；通过后虚拟卡无需额外激活，可立即用于线上支付。" },
    { n: "07", t: "准备 Funding Account",   b: "Bybit Card 没有独立卡钱包，消费直接从 Funding Account 扣款。国内用户通常先在交易所买币，再把 USDT / USDC 转入 Bybit；微信或支付宝一般不能直接给 Bybit 充值。法币不足时会按规则自动卖出加密资产，并收 0.9% crypto conversion fee。" },
    { n: "08", t: "查看卡号并小额试刷",     b: "在 Card Dashboard 查看卡号、有效期、CVV 和账单地址。先用低金额线上订单测试 3DS、OTP 和扣款；跨境或非卡片币种交易会产生 FX 费用，AIFC 卡在哈萨克斯坦以外消费也可能有跨境费用。" },
    { n: "09", t: "实体卡可选申请",         b: "只有拿到虚拟卡后才能申请实体卡。显示名最多 21 个拉丁字符，收货地址需要与虚拟卡地址验证一致；若当前未开放实体卡，先加入 waitlist。" },
  ],
  "bybit-eu-card": [
    { n: "01", t: "使用独立 Bybit EU 账户", b: "Bybit EU 和 bybit.com 是两个账户体系，不共享 KYC、奖励和卡片。EEA 居民应在 bybit.eu 注册，并先完成身份验证。" },
    { n: "02", t: "确认服务区和材料",       b: "Bybit EU Card 主要面向部分 EEA 国家，另含瑞士、列支敦士登和挪威；部分国家支持有限。准备身份证、护照、EEA 居留许可或驾照，地址证明建议使用近 3 个月内文件。" },
    { n: "03", t: "进入虚拟卡入口",         b: "登录后进入 Finance、Card，点击 Get Your Card。选择国家，如果该国家暂不支持，系统会登记兴趣并等待通知。" },
    { n: "04", t: "上传身份和地址证明",     b: "按页面要求上传政府签发证件；地址证明需从支持国家签发并显示完整姓名和地址。有些申请可能需要两种身份证明；Bybit Card Lite 可能不要求地址验证，但额度会更低。" },
    { n: "05", t: "绑定邮箱和 2FA",         b: "确认注册邮箱，开启 Google 2FA；如填写推荐码，确认后通常不能再改。建议把 notification@bybit.eu 和 compliance@bybit.eu 加入联系人，避免审核邮件进垃圾箱。" },
    { n: "06", t: "等待审核并启用",         b: "提交后通常几分钟审核，最长可能 7 个工作日。审核通过后虚拟卡可直接线上支付，海外交易不需要额外激活，但会按规则收取外汇费用。" },
    { n: "07", t: "给 Funding Account 留余额", b: "Bybit EU Card 优先扣 Funding Account 里的法币；不足时会按设置顺序自动卖出 USDC、BTC、ETH、MNT、TON、XRP、EURC 等资产，并收 0.9% crypto conversion fee。" },
    { n: "08", t: "支付时完成 App 验证",    b: "线上支付时从卡片面板复制卡号、CVV、有效期，在商户页面输入。遇到 3DS 时回 Bybit App 完成生物识别或 OTP；成功授权的金额可能冻结到商户完成结算。" },
    { n: "09", t: "实体卡和钱包绑定",       b: "拿到虚拟卡后可再申请实体卡，显示名最多 21 个拉丁字符，收货地址需匹配地址验证。Apple Pay、Google Pay、Samsung Pay 可用性取决于具体卡项目和地区。" },
  ],
  "safepal-card": [
    { n: "01", t: "安装 App 并创建钱包",     b: "安装 SafePal App，版本建议 V4.5.0 或以上。创建或导入软件钱包，妥善备份助记词；普通钱包不强制 KYC，但银行网关和 Mastercard 需要 Fiat24 独立 KYC。博主实测里，iPhone + NFC 通常比安卓验证更顺。" },
    { n: "02", t: "准备 Arbitrum 资产",      b: "进入 Bank 前，钱包里至少准备 0.0001 ETH on Arbitrum 用于验证；激活 Mastercard 还需要 10 USDC on Arbitrum 和少量 ETH 支付 gas。个人博客常见路线有 Fiat24 官网直开、SafePal 内开、Bitget Wallet 内开，费用和验证体验不同。" },
    { n: "03", t: "创建 Fiat24 银行账户",    b: "在 SafePal App 底部进入 Wallet，再进入 Bank，点击 Get Started。阅读 Fiat24 Bank Account 条款并勾选，等待账户创建成功。" },
    { n: "04", t: "完成 Fiat24 注册",        b: "点击 Register on Fiat24，完成签名，确认自己是 sole beneficial owner。填写并验证邮箱、手机号，然后授权位置用于地址验证。" },
    { n: "05", t: "处理地址和证件验证",      b: "Android 需要选择 precise location。填写的居住地址与当前定位距离需小于 2km，否则地址验证无效；随后按页面要求用 ReadID Ready、身份见证或系统 NFC 读证件。若走 SafePal 通道遇到护照要求，就按 SafePal / Fiat24 当页要求处理。" },
    { n: "06", t: "等待账户上线邮件",        b: "提交后会收到 under review 邮件。审核通过后，Fiat24 会发邮件确认账户 online；SafePal 仅作为网关，不保存你的 Fiat24 KYC 原始信息。" },
    { n: "07", t: "激活 Mastercard",         b: "账户上线后进入 Bank 的 Card 页面，完成签名并点击 Activate Card。选择要启用的币种账户；如使用 10 USDC 激活，选择 USDC 和接收法币，确认并签名，等待链上完成。" },
    { n: "08", t: "查看卡号并充值使用",      b: "SafePal 自身不能读取完整卡号。点击卡号旁图标进入银行网页，签名后查看完整卡号、有效期和 CVV。再用 Deposit 给银行账户充值，系统会把 crypto 转成账户法币后供 Mastercard 消费。" },
    { n: "09", t: "绑定钱包和注意限额",      b: "可按官方教程绑定 PayPal、Apple Pay、Google Pay、Samsung Pay。关闭 Internet Purchase 后无法网购，关闭 Contactless 后钱包支付不可用；普通卡片当前月限约 20,000 USD、日限约 10,000 USD。" },
  ],
  "pokepay": [
    { n: "01", t: "只走官方入口注册",       b: "使用 pokepay.com、pokepay.cc 或官方 App Store / Google Play 应用注册，不从陌生链接输入助记词或卡密。注册后先验证邮箱，设置强密码。" },
    { n: "02", t: "先充值再申请卡",         b: "PokePay 官方 FAQ 的流程是 Register、Recharge、Card Apply。博主实测多建议先充够 20 到 25 USDT，优先 USDT TRC20 或其他低费网络；到账一般约 15 分钟，超过 30 分钟还未到账再带 TXID 找客服。" },
    { n: "03", t: "进入 Card 申请",         b: "在 App 或网页进入 Card，选择申请 virtual card 或 physical card。虚拟卡用于线上支付、订阅、广告投放和国际交易；实体卡适合线下刷卡或取现。" },
    { n: "04", t: "完成 KYC 认证",          b: "KYC 信息必须和上传证件完全一致。官方建议姓名按证件填写，护照姓名通常用英文；使用 Google Chrome，并提前给浏览器开启摄像头权限。" },
    { n: "05", t: "激活卡并检查卡信息",     b: "KYC 通过后按页面激活卡片，查看卡号、有效期、CVV 和持卡人名。TopVCC 等测评提醒：一个账户通常只适合维护一张主卡，卡号要珍惜使用，避免连续输错 CVV 或有效期导致锁卡。" },
    { n: "06", t: "小额线上试刷",           b: "先用 1 到 5 美元等低金额做线上测试，观察是否触发 3DS 或风控。PokePay 支持绑定 PayPal、Apple Store 等平台，也可用于海外购物和订阅场景。" },
    { n: "07", t: "了解额度和费用",         b: "官方 FAQ 显示 PokeCard 当前日限 100,000 HKD，单笔最低 0.1 HKD；博主测评常见口径是虚拟卡约 5 USD 开卡、无月费，但非港币消费会叠加换汇、消费或跨境成本，使用前按 App 费率表复核。" },
    { n: "08", t: "处理退款和锁卡",         b: "普通商户退款常见 3 到 7 个工作日，线上平台退款可能 3 到 10 个工作日，跨境退款可能 7 到 30 个工作日。多次输错 CVV、有效期或实体卡 PIN 会锁卡，需要客服核验后处理。" },
    { n: "09", t: "先确认服务资格",         b: "PokePay 条款保留 AML/KYC 审查权，并列出受限司法辖区。申请前先确认当前账户、证件和所在地是否被允许，不要多账户、代认证或使用不一致资料。" },
  ],
  "roogoo": [
    { n: "01", t: "通过邀请链接注册",       b: "用官方 h5.roogoo.com / h5.roogoo.store 注册并保留邀请码。官方开卡流程提醒：删除邀请码可能失去开卡费优惠和返现资格，注册后会进入 dashboard。" },
    { n: "02", t: "熟悉资金和卡片入口",     b: "Dashboard 里先看资产估值、充币、提币、功能菜单和客服入口。Roogoo 目前主要是 PWA 形态，可添加到手机主屏幕使用。" },
    { n: "03", t: "充值稳定币到资金账户",   b: "新用户申请卡前需要先充值 USDT。可让 Roogoo 站内用户转账，也可从钱包或交易所链上充币；博主实测常用 TRON / TRC20 和 Solana 网络。首次建议准备至少 100 USDT，覆盖开卡费、首充和链上手续费。" },
    { n: "04", t: "完成 Sumsub KYC",        b: "开卡需要真实个人信息和实名认证，Roogoo 接入 Sumsub，审核结果不由 Roogoo 人工控制。年龄需 18 到 65 岁，一人只能一个认证账户，必须本人证件和真人扫脸。" },
    { n: "05", t: "按标准拍摄证件",         b: "使用原件实时拍照，不要用复印件、截图、修图、滤镜或美颜。文字和头像要清楚无反光；Android 建议关闭美颜和滤镜，浏览器提前打开相机和相册权限。" },
    { n: "06", t: "提交开卡并管理卡片",     b: "准备开卡费和首次卡片充值金额后提交申请。开通后在卡片管理里可做余额充值和转出、设置日限额、卡片名称、余额预警、停用启用，并查看卡号、CVV、有效期和持卡人英文名。" },
    { n: "07", t: "从资金账户转入卡片",     b: "Roogoo 是 Card Top-up Model，卡片余额与资金账户隔离。进入 Card、Top-up，把 Asset Account 里的 USDT 转成卡片 USD，通常 1 到 5 分钟同步；当前卡片充值和换汇费为 0。" },
    { n: "08", t: "绑定第三方支付",         b: "绑定支付宝、PayPal、Apple Pay 或 Google Pay 前，先在卡片详情页复制卡号、CVV、有效期和持卡人英文名。微信支持会随卡段和当前支持列表变化，有博主页面已提示暂不支持微信，绑卡前先看 Roogoo App 当页列表。" },
    { n: "09", t: "避免订阅和扣款风控",     b: "消费前让余额比订单金额高 3% 到 5%，消费后保留 2 到 5 USD。订阅服务要提前 24 小时留足余额，不要用清空余额来停止订阅；非美元区消费可能有跨境费，反复失败扣款会触发冻结或销卡。" },
  ],
  "kraken-card": [
    { n: "01", t: "确认地区和 App",         b: "Kraken 的新卡片入口是 Krak Card。当前面向英国和 EEA 的个人用户，必须拥有已完成 KYC 的 Krak / Kraken 账户，并使用最新版 Krak App。" },
    { n: "02", t: "进入 Everyday 账户",     b: "打开 Krak App，点击首页中间的 Everyday account，再点右上角卡片图标。只有符合资格的用户才会看到开卡弹窗。" },
    { n: "03", t: "创建虚拟卡",             b: "选择 Krak Coral 或 Krak Black 卡面颜色，阅读 Krak Card terms of service，确认后点 Continue。虚拟卡创建后即可使用。" },
    { n: "04", t: "添加 Apple / Google Wallet", b: "虚拟卡 ready to use 后，点击 Add to Apple / Google Wallet，选择添加到手机或手表，按系统提示接受设备服务条款即可完成。" },
    { n: "05", t: "设置消费资金顺序",       b: "Krak Card 从 Everyday account 消费。可设置现金和加密资产的扣款优先级；第一种资产不足时，系统会按顺序组合其他资产完成付款。" },
    { n: "06", t: "申请实体卡",             b: "如果需要实体卡，先完成虚拟卡流程，再点 Yes, get the physical card。选择显示姓名，确认住宅或其他收货地址；实体卡通常 14 个工作日内送达，收到后再激活。" },
    { n: "07", t: "管理安全控制",           b: "在 App 内可管理 PIN、冻结或解冻卡片、阻止某些资产被用于消费，并接收实时交易通知。虚拟卡不是一次性卡，30 天滚动周期内最多 3 张。" },
    { n: "08", t: "理解费用和返现",         b: "Krak Card 无月费，消费侧宣传为无交易费、FX fee 和 ATM withdrawal fee，但跨资产消费会有 variable spread，第三方 ATM 仍可能收费；cashback 最高 2%，按 30 天平均资产分档，并在商户 finalizes transaction 后结算，期间会显示 pending。" },
    { n: "09", t: "大额和税务注意",         b: "最高返现和 Metal Card 需要 £ / € 50,000 平均资产。用加密资产消费会产生法币转换，可能触发资本利得或亏损税务事件，使用前按所在地税务规则处理。" },
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
