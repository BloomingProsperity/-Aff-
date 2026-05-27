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
    inviteCode: "RZDGOXK",
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "ok", claude: "ok", midjourney: "ok", cursor: "ok",
      netflix: "ok", steam: "warn", appstore: "no",
      aws: "warn", gcp: "no",
      note: "官方促销合作 ChatGPT / Claude / Cursor / MJ 均支持；配台湾/澳洲 IP。Apple App Store 无法直接绑卡。GCP 明确拒绝预付卡。" },
  },
  {
    slug: "bybit-eu-card",
    no: "02",
    name: "Bybit 欧洲卡",
    issuer: "Bybit EU · 万事达",
    color: "#1f4ea8",  // eu cobalt
    lead: "德国、法国等欧盟用户路线，新户赠 10 USDC 体验金。BIN 来自欧盟，Stripe 信任度高。",
    rating: 4.7,
    tag: "欧洲专属",
    idType: "护照",
    regions: "德国 / 法国 / 欧盟",
    fee: "免费",
    cashback: "最高 10%",
    network: "Mastercard",
    bin: "欧盟 EEA",
    officialArt: "/images/cards/official/bybit-eu-card.png",
    applyUrl: "https://www.bybit.eu/cards/?ref=1NNDZ0W&source=applet_invite",
    inviteCode: "1NNDZ0W",
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "ok", claude: "warn", midjourney: "ok", cursor: "ok",
      netflix: "warn", steam: "ok", appstore: "ok",
      aws: "warn", gcp: "warn",
      note: "ChatGPT 实测可用；Netflix 需 Curve 中转；App Store 走 Apple Pay 路径。AWS/GCP 社区有成功记录，欧盟 BIN 通过率较高。" },
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
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "ok", claude: "ok", midjourney: "ok", cursor: "ok",
      netflix: "ok", steam: "ok", appstore: "ok",
      aws: "warn", gcp: "warn",
      note: "瑞士真实银行借记卡，AI 订阅 / 流媒体 / App Store 均实测可用；AWS/GCP 社区有正面信号，需配欧洲 IP。" },
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
    applyUrl: "https://app.pokepay.cc/pages/invitation/regist?r=447963",
    inviteCode: "447963",
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "no", claude: "no", midjourney: "ok", cursor: "ok",
      netflix: "ok", steam: "no", appstore: "ok",
      aws: "no", gcp: "no",
      note: "ChatGPT / Claude 不支持直付；Steam / Blizzard / EA 官方明确禁用；香港预付卡 BIN 被 AWS/GCP 拒绝。" },
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
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "ok", claude: "ok", midjourney: "ok", cursor: "ok",
      netflix: "ok", steam: "ok", appstore: "ok",
      aws: "warn", gcp: "no",
      note: "官方提供 ChatGPT / Claude 订阅攻略；Netflix / Steam / App Store 普通卡即可；美国 BIN 对 AWS 友好，GCP 不支持预付卡。" },
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
    promoNote: "不想折腾可找我购买成品卡，如需个人指导 89元/张。",
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
    ai: { chatgpt: "ok", claude: "ok", midjourney: "ok", cursor: "ok",
      netflix: "ok", steam: "ok", appstore: "ok",
      aws: "ok", gcp: "ok",
      note: "英国 / 欧盟真实借记卡 BIN，几乎全平台支持；仅限 UK/EEA 居民申请。" },
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
    scope: "多国 / 本地币",
    tag: "热销",
    price: "本地币面额",
    color: "#1d1d1f",
    officialArt: "/images/gifts/official/apple-gift-card.jpg",
    artRatio: "2982 / 1176",
  },
  {
    slug: "steam",
    name: "Steam 钱包卡",
    scope: "30+ 钱包币种",
    tag: "热销",
    price: "按钱包币种",
    color: "#1b2838",
    officialArt: "/images/gifts/official/steam-gift-card.jpg",
    artRatio: "460 / 216",
  },
  {
    slug: "netflix",
    name: "Netflix 礼品卡",
    scope: "同币种兑换",
    tag: null,
    price: "本地币面额",
    color: "#a51722",
    officialArt: "/images/gifts/official/netflix-gift-card.jpg",
    artRatio: "2000 / 1125",
  },
  {
    slug: "google",
    name: "Google Play",
    scope: "30+ 国家/地区",
    tag: null,
    price: "官方本地面额",
    color: "#1f60c4",
    officialArt: "/images/gifts/official/google-play-gift-card.webp",
    artRatio: "1652 / 1044",
  },
  {
    slug: "psn",
    name: "PlayStation Store",
    scope: "多区钱包充值",
    tag: null,
    price: "本地币面额",
    color: "#0a2c7a",
    officialArt: "/images/gifts/official/playstation-store-gift-card.jpg",
    artRatio: "440 / 220",
  },
  {
    slug: "battlenet",
    name: "Battle.net 点卡",
    scope: "多币种余额",
    tag: null,
    price: "$1 / €1 起",
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

// ── 银行卡开卡步骤（长步骤 + 截图）────────────────────────
window.TUTORIALS = {
  "bybit-card": [
    {
      n: "01",
      t: "准备 VPN 环境并安装 Bybit App",
      img: "/images/tutorials/bybit-card/step-01.jpg",
      caption: "开始前先确认 IP 地区——台湾或澳洲节点最稳，香港/美国/新加坡/欧洲节点可能被限制注册。",
      b: "Bybit 对注册 IP 有要求。大陆用户请切换 VPN 到台湾或澳洲节点再注册，不要用香港、美国、新加坡或欧洲节点。同一张身份证只能注册一个 Bybit 账户；如需第二个账户，可换用护照或驾照。",
      actions: [
        "切换 VPN 至台湾或澳洲节点，在浏览器搜索「我的 IP」，确认显示台湾或澳洲地址。",
        "不要使用香港、美国、新加坡、欧洲节点，这些地区注册后往往无法开卡。",
        "iPhone 用户在 App Store 搜索并下载 Bybit；如搜不到，切换 Apple ID 地区（如美区或台区）后再安装。",
        "Android 用户从 Google Play 或 Bybit 官方下载页安装。",
        "打开 App，确认图标和开发者信息与官网一致。",
        "提前准备好：海外邮箱（Gmail / Outlook）、境外手机号、身份证或护照。",
        "开启 App 相机权限、相册权限和通知权限，后面拍证件、做人脸、收交易通知都会用到。"
      ],
      checks: [
        "浏览器「我的 IP」显示台湾或澳洲。",
        "Bybit App 已安装并能正常打开。",
        "邮箱、手机号、证件都在手边。"
      ],
      warnings: [
        "香港 IP 注册后往往无法开卡，一定要换台湾或澳洲节点再操作。",
        "同一身份证只能注册一个 Bybit 账户，切勿重复注册。"
      ]
    },
    {
      n: "02",
      t: "注册账号：邮箱/手机号、居住地选海外、邀请码",
      img: "/images/tutorials/bybit-card/step-01.jpg",
      caption: "注册页截图：居住地选台湾或澳洲，邀请码填 RZDGOXK，再完成验证码和密码。",
      b: "通过本页邀请链接进入 Bybit，邀请码 RZDGOXK 已自动带入。注册时居住地（Country of Residence）选海外（台湾或澳洲），不要选中国大陆，否则后续开卡会受限。",
      actions: [
        "点击本页上方「立即申请」，使用邀请链接进入注册页（链接已带 ref=RZDGOXK）。",
        "Country/Region of Residence（居住地）选择台湾（Taiwan）或澳洲（Australia），不选中国大陆。",
        "选择邮箱注册或手机号注册均可。",
        "邀请码栏显示 RZDGOXK 时不要删除；空白时手动填写 RZDGOXK。",
        "输入邮箱验证码或短信验证码。",
        "设置登录密码，完成注册。",
        "如已有老账户，直接登录后跳到步骤 03。"
      ],
      checks: [
        "能进入 Bybit 首页。",
        "Profile 页面能看到 UID。",
        "邮箱或手机号至少有一个已验证。"
      ],
      warnings: [
        "居住地不要选中国大陆，否则后续开卡会受限。",
        "邀请码 RZDGOXK 已带入链接，注意不要手动删除。"
      ]
    },
    {
      n: "03",
      t: "先做账户安全：2FA、反钓鱼码、通知",
      img: "/images/tutorials/bybit-card/step-02.jpg",
      caption: "安全设置截图：2FA 和反钓鱼码会在查看卡号、提现、绑卡时反复用到。",
      b: "Bybit Card 查看卡号、修改限额、提现和部分交易确认都会触发安全验证。开卡前先把 2FA、反钓鱼码和通知打开，后面不会卡在验证环节。",
      actions: [
        "点击头像或 Profile，进入 Security / 安全。",
        "绑定 Google Authenticator 或平台推荐的 2FA 应用。",
        "保存 2FA 恢复码，截图备份妥善保管。",
        "设置 Anti-Phishing Code / 反钓鱼码。",
        "开启登录通知、交易通知、提现通知。",
        "确认登录设备列表里只有自己的设备。"
      ],
      checks: [
        "邮箱、手机号、2FA 至少两项可用。",
        "能收到 Bybit 安全邮件或 App 推送。",
        "安全设置页面没有红色警告。"
      ],
      warnings: [
        "后面查看卡号需要二次验证，提前设好会少卡很多。",
        "反钓鱼码能帮助识别真实 Bybit 邮件，审核和补件邮件看一眼就知道真假。"
      ]
    },
    {
      n: "04",
      t: "完成 KYC1：居住国家选海外、证件签发国选中国、人脸识别",
      img: "/images/tutorials/bybit-card/step-02.jpg",
      caption: "KYC 截图：居住国家（Country of Residence）选台湾/澳洲；证件签发国（Document Issuing Country）选中国，用大陆身份证没问题。",
      b: "KYC 时注意区分两个字段：居住国家（Country of Residence）选海外（台湾或澳洲）；证件签发国（Document Issuing Country）选中国——用大陆身份证完全可以通过。",
      actions: [
        "在 Profile / Account 里点 Identity Verification / 身份认证，选择个人认证。",
        "Country of Residence（居住国家）选台湾（Taiwan）或澳洲（Australia），不选中国大陆。",
        "Document Issuing Country（证件签发国）选 China / 中国——大陆身份证没问题。",
        "证件类型选择 ID Card / 身份证；用护照就选 Passport。",
        "拍摄身份证人像面，确保四角完整、姓名和证件号清晰。",
        "拍摄身份证国徽面，确保有效期和签发机关清晰。",
        "进入人脸识别，按页面要求保持正脸或按提示动作。",
        "提交后等待审核，通常 10 分钟到 24 小时内完成。"
      ],
      checks: [
        "KYC 页面显示 Approved / 已通过。",
        "居住国家显示台湾或澳洲，不是中国大陆。",
        "证件签发国显示 China，与证件一致。"
      ],
      warnings: [
        "居住国家和证件签发国是两个不同字段，不要混淆——居住国家选海外，证件签发国选中国。",
        "照片模糊、反光、边角缺失会导致返工，重拍一次比反复提交快。"
      ]
    },
    {
      n: "05",
      t: "找到 Card 入口：资产页激活或 More / Finance / Card",
      img: "/images/tutorials/bybit-card/step-03.jpg",
      caption: "Card 入口截图：先找资产页激活按钮，没有就去 More / Finance / Card。",
      b: "KYC 通过后回到 Bybit 首页，按以下两个入口找 Card：先看资产页有没有「激活 Bybit Card」，没有就去首页 More / Finance / Card。",
      actions: [
        "KYC 通过后回到 Bybit 首页。",
        "先点底部 Assets / 资产，看中间是否有 Activate my Bybit Card / 激活 Bybit Card。",
        "如果资产页没有，点首页 More / 更多。",
        "在 Finance / 金融分类里找到 Card。",
        "进入 Bybit Card 页面，点 Activate Bybit Card / Apply Now / Get Your Card。",
        "如果询问虚拟卡还是实体卡，先选 Virtual Card / 虚拟卡。",
        "如果显示 waitlist 或不可申请，先更新 App 并重新登录再看。"
      ],
      checks: [
        "能进入 Bybit Card 申请流程。",
        "页面显示 Mastercard / Bybit Card，不是普通资产活动页。",
        "虚拟卡入口优先出现。"
      ],
      warnings: [
        "Card 入口会随 KYC 状态、账号地区和卡段开放情况变化。",
        "旧版 App 菜单名字不同时，先用资产页激活按钮进入。"
      ]
    },
    {
      n: "06",
      t: "老用户换亚洲新卡：先处理旧卡再重新申请",
      img: "/images/tutorials/bybit-card/step-03.jpg",
      caption: "老用户流程截图：我的卡片 / 更多 / 注销旧卡 / 重新申请。",
      b: "老用户不能直接再开一张，先进入「我的卡片」处理旧卡，再重新申请哈萨克斯坦卡。新用户跳过此步，直接到步骤 07。",
      actions: [
        "进入 Bybit Card 页面，点 My Card / 我的卡片。",
        "查看旧卡地区和币种，例如 Australia、EU、Kazakhstan 等。",
        "确认旧卡没有未完成交易、退款或争议订单。",
        "进入旧卡详情，点 More / 更多，选择 Cancel / Close / 注销卡片。",
        "注销后回到 Card 首页，重新点击 Activate / Apply Now。",
        "重新进入地区选择页，准备选择 Kazakhstan。"
      ],
      checks: [
        "旧卡页面不再显示 Active。",
        "旧卡余额已回到 Bybit 账户。",
        "重新申请按钮已出现。"
      ],
      warnings: [
        "旧卡资金在 Bybit 账户里，注销卡片不会丢失余额。",
        "如有退款在路上，先等退款入账再注销更稳。"
      ]
    },
    {
      n: "07",
      t: "选择开卡地区：固定选 Kazakhstan / 哈萨克斯坦",
      img: "/images/tutorials/bybit-card/step-04.jpg",
      caption: "地区选择截图：大陆身份证用户固定选 Kazakhstan，不选其它地区。",
      b: "进入申请流程后，地区固定选 Kazakhstan / 哈萨克斯坦——这是大陆身份证用户目前可申请的亚洲卡路线。",
      actions: [
        "进入申请流程后查看 Country/Region of Residence 字段。",
        "如果默认不是 Kazakhstan，点 Change country/region / 切换国家地区。",
        "在国家列表里搜索并点选 Kazakhstan / 哈萨克斯坦。",
        "确认字段显示 Kazakhstan 后继续。",
        "如果页面出现 Eligibility Check / 资格检查，点 Start Now / 立即开始。",
        "资格检查通过后进入地址填写页。"
      ],
      checks: [
        "页面显示 eligible / 符合资格。",
        "地区字段显示 Kazakhstan。",
        "卡片类型显示 Virtual Card / Mastercard。"
      ],
      warnings: [
        "本教程只讲 Kazakhstan 路线，不要选其它地区。",
        "地区选完后再填地址，顺序不要搞反。"
      ]
    },
    {
      n: "08",
      t: "填写地址：用地址生成器 / Street / City / Postal Code",
      img: "/images/tutorials/bybit-card/step-04.jpg",
      caption: "地址页截图：国家锁定 Kazakhstan 后，谷歌搜「哈萨克斯坦地址生成器」生成一个随机地址逐字段填入。",
      b: "没有真实哈萨克斯坦地址？在谷歌搜索「哈萨克斯坦地址生成器」，复制生成的随机地址，按字段逐项填入即可。",
      actions: [
        "在谷歌搜索「哈萨克斯坦地址生成器」，打开第一个结果，生成一个随机地址并复制。",
        "确认 Country / 国家字段已显示 Kazakhstan。",
        "Street / Street Address 填街道名（从生成地址里复制）。",
        "Building Number 填楼号或门牌号。",
        "City 填城市名，例如 Almaty（阿拉木图）或 Astana（阿斯塔纳）。",
        "Province / State 按所属省州填写或留空（通常标 Optional）。",
        "Postal Code 填邮编（从生成地址里复制）。",
        "如果地址栏支持下拉搜索，优先点选下拉匹配结果。",
        "填完后点 Confirm / Continue。"
      ],
      checks: [
        "地址页没有红字报错。",
        "城市和邮编与 Kazakhstan 对应。",
        "提交后能进入 Additional Info 页面。"
      ],
      warnings: [
        "用地址生成器的随机地址即可，不需要准备真实的哈萨克斯坦地址。",
        "申请实体卡时收件地址会重新填写，这里的地址只用于虚拟卡申请。"
      ]
    },
    {
      n: "09",
      t: "填写 Additional Info：收入、用途、手机号、推荐码 RZDGOXK",
      img: "/images/tutorials/bybit-card/step-05.jpg",
      caption: "补充资料截图：收入来源、卡片用途、手机号补绑和推荐码在这里一起完成。",
      b: "Additional Info 页面填写收入来源、卡片用途，补绑手机号，最后填推荐码 RZDGOXK。每项都要完整填写，不要跳过。",
      actions: [
        "填写 Occupation / 职业（可选 Employee / 受雇 或 Self-Employed / 自雇）。",
        "填写 Source of Funds / 资金来源（可选 Salary / 薪资 或 Investment / 投资收益）。",
        "填写 Annual Income / 年收入范围。",
        "填写 Purpose of Card / 卡片用途（可选 Online Shopping / 网购 或 Daily Expenses / 日常消费）。",
        "如果用邮箱注册，这里补绑手机号并输入短信验证码完成绑定。",
        "Referral Code / 推荐码填 RZDGOXK。",
        "勾选 Card Terms / 发卡协议，点 Submit / 提交。"
      ],
      checks: [
        "所有必填字段已完成，没有红字提示。",
        "推荐码字段显示 RZDGOXK。",
        "提交后进入审核中状态。"
      ],
      warnings: [
        "推荐码 RZDGOXK 一定要填，不填就拿不到开卡奖励。",
        "手机号补绑后，后续查看卡号和 3DS 验证都会用到。"
      ]
    },
    {
      n: "10",
      t: "处理补充审核：问卷、I hereby 声明、邮件补件",
      img: "/images/tutorials/bybit-card/step-05.jpg",
      caption: "补充审核截图：提交后检查「需补充信息」提示，点进去完成背景问卷。",
      b: "提交后留意页面是否出现「需要补充信息」入口，里面是背景问卷和底部确认声明。不是每个账号都有，但出现时必须完成，否则申请一直卡在等待中。",
      actions: [
        "提交开卡申请后留在 Bybit Card 页面，不要马上退出。",
        "如果页面提示 Need additional information / 需补充信息，点 Go submit / 去提交。",
        "进入问卷，逐项回答（犯罪记录、制裁名单、政治公众人物、税务等），没有对应情况就选 No。",
        "滑到底部勾选 I hereby / 本人声明 类确认框。",
        "再次点击 Submit / 提交。",
        "如果 App 没有弹窗，去邮箱查看是否有 Bybit Card 补件邮件。",
        "等待审核，通常几分钟到 24 小时，最多 7 个工作日。"
      ],
      checks: [
        "问卷已提交，没有红字未完成项。",
        "Card 页面显示审核中或申请成功。",
        "邮箱没有未处理的补件邮件。"
      ],
      warnings: [
        "出现补充审核时不要跳过，否则申请一直卡在等待中。",
        "审核超过一天没通过，先查邮箱——补件邮件比反复提交更有用。"
      ]
    },
    {
      n: "11",
      t: "审核通过后查看虚拟卡：小眼睛、2FA、卡号、限额",
      img: "/images/tutorials/bybit-card/step-06.jpg",
      caption: "卡片页截图：审核通过后点小眼睛查看卡号、有效期和 CVV。",
      b: "审核通过即可在 App 里看到虚拟卡。点小眼睛查看卡号，顺手把卡片设置和限额检查一遍，再进行下一步报名返现活动。",
      actions: [
        "回到 Bybit Card 首页，确认状态为 Active / 已激活。",
        "点击小眼睛或 View Card Details。",
        "按页面要求完成二次验证（短信、邮箱或 Google 2FA）。",
        "记下卡号、有效期、CVV、卡片币种。",
        "进入 Card Settings / 卡片设置，确认 Online Payment / 网络支付 已开启。",
        "确认 International Payment、Transaction Notification、Spending Limit 都正常。",
        "找到 Freeze / Lock Card 入口，知道不用时在哪里冻结。"
      ],
      checks: [
        "卡号、有效期、CVV 能正常显示。",
        "在线支付开关已开启。",
        "限额和通知已确认。"
      ],
      warnings: [
        "卡号截图不要公开分享，包含卡号、有效期和 CVV 的截图足够被盗刷。",
        "如果显示审核中，先等结果，不要重复提交申请。"
      ]
    },
    {
      n: "12",
      t: "报名返现活动：首月消费 10% 返现、最高 $150",
      img: "/images/tutorials/bybit-card/step-06.jpg",
      caption: "返现活动截图：卡激活后先去 Card 活动页报名，否则首月返现拿不到。",
      b: "Bybit Card 开卡首月有 10% 消费返现（最高 $150）活动，但需主动报名且账户存入 ≥100 USDT 才能激活资格。激活卡后第一件事就是去活动页报名，再充值，顺序不要搞反。",
      actions: [
        "卡片激活后，在 Bybit Card 首页找到 Cashback / 返现活动 或 Promotions / 优惠活动入口。",
        "点击进入，找到首月 10% 返现活动，点 Join / 报名参加。",
        "活动页会显示需持有 ≥100 USDT 才能激活返现资格。",
        "先充值 ≥100 USDT 到 Bybit 账户（充值方法见下一步）。",
        "充值完成后回活动页确认资格已激活（状态变为 Active 或 Eligible）。",
        "首月消费越多返现越多，上限 $150（约消费 1500 USDT）。",
        "记下活动截止日期，在首月内完成消费。"
      ],
      checks: [
        "活动页面显示已报名或 Eligible。",
        "账户余额 ≥100 USDT。",
        "活动截止日期已记录。"
      ],
      warnings: [
        "不报名直接消费，首月返现不会自动发放，必须先报名。",
        "活动规则和时间以 Bybit App 内活动页显示为准，随时可能调整。"
      ]
    },
    {
      n: "13",
      t: "入金充值：币安 BEP20 零手续费转 USDT 到 Bybit",
      img: "/images/tutorials/bybit-card/step-06.jpg",
      caption: "入金截图：推荐从币安用 BEP20（BSC）网络提 USDT 到 Bybit，手续费接近零。",
      b: "推荐从币安提 USDT 到 Bybit，使用 BEP20（BSC）网络，手续费接近零。务必两端网络保持一致，先小额测试再转大额，至少充 100 USDT 以激活返现资格。",
      actions: [
        "在 Bybit Card 页面或 Assets / 资产页点 Deposit / 充值。",
        "币种选择 USDT。",
        "网络选择 BEP20（BSC）。",
        "复制 Bybit 充值地址。",
        "打开币安（Binance），进入 Withdraw / 提币。",
        "币种选 USDT，网络同样选 BEP20（BSC）——两端必须一致。",
        "粘贴 Bybit 地址，核对前后几位无误，填入金额后提交。",
        "等链上确认（BEP20 通常几分钟到账）。",
        "到账后如资产在 Spot Account，进入 Transfer 转到 Funding Account 或 Card 可用账户。",
        "回 Card 页确认余额 ≥100 USDT，再回活动页激活返现资格。"
      ],
      checks: [
        "Bybit 端和币安端网络均为 BEP20（BSC）。",
        "到账后 Card / Funding 余额显示 ≥100 USDT。",
        "交易记录里能看到入金记录。"
      ],
      warnings: [
        "两端网络必须一致，网络选错会导致资金丢失且难以找回。",
        "先用小额（如 10 USDT）测试到账，确认无误再转大额。"
      ]
    },
    {
      n: "14",
      t: "绑定微信/支付宝/Apple Pay/Google Pay 并小额试刷",
      img: "/images/tutorials/bybit-card/step-07.jpg",
      caption: "绑卡截图：在支付工具里添加 Bybit Card，输入卡号、有效期、CVV 后先小额消费测试。",
      b: "最后一步绑定支付工具并小额试刷。支持微信、支付宝、Apple Pay、Google Pay、美团等，先刷一笔小额确认扣款、3DS 和返现计入都正常，再用于正式消费。",
      actions: [
        "打开微信 / 支付宝 / Apple Pay / Google Pay，选择添加银行卡。",
        "输入 Bybit Card 卡号、有效期、CVV 和持卡人姓名。",
        "账单地址按开卡时填写的哈萨克斯坦地址填入，或按平台要求填写。",
        "如果触发 3DS / OTP，回 Bybit App、短信或邮箱完成验证。",
        "先做一笔 1–5 USD 小额消费，确认扣款正常。",
        "回 Bybit Card 交易记录确认商户名、扣款金额和手续费。",
        "回返现活动页确认这笔消费已被计入。",
        "支付稳定后再用于订阅、海外电商或日常消费。"
      ],
      checks: [
        "支付工具显示绑卡成功。",
        "Bybit Card 页面出现小额交易记录。",
        "交易通知能正常推送。"
      ],
      warnings: [
        "微信/支付宝绑定成功率以实际结果为准，不同账号有差异。",
        "不用时可在 Bybit App 里临时冻结卡，防止盗刷。"
      ]
    }
  ],
  "bybit-eu-card": [
    {
      n: "01",
      t: "注册 bybit.eu 账户（EEA 独立平台）",
      img: "/images/tutorials/bybit-card/step-01.jpg",
      caption: "bybit.eu 注册页：必须在 bybit.eu 注册，与 bybit.com 完全独立，账户和资产不互通。",
      b: "bybit.eu 和 bybit.com 是完全独立的平台。2026 年 1 月 1 日起，EEA 居民必须使用 bybit.eu。已有 bybit.com 账户的用户需手动提现后重新在 bybit.eu 注册，账户不能直接迁移。支持 30+ EEA 国家，包括德国、法国、西班牙、意大利、荷兰等。邀请码输入框填 1NNDZ0W（或点本页「立即申请」链接自动带入）。",
      actions: [
        "打开浏览器访问 https://www.bybit.eu，确认地址栏是 bybit.eu 不是 bybit.com。",
        "点击 Sign Up，输入欧盟邮箱地址和密码。",
        "验证邮箱（收取验证码邮件完成确认）。",
        "邀请码输入框填 1NNDZ0W；如点本页「立即申请」链接，邀请码已自动填入，不要删除。",
        "已有 bybit.com 账户的用户：先从 bybit.com 提出所有资产，再在 bybit.eu 全新注册。"
      ],
      checks: [
        "浏览器地址是 bybit.eu，已完成邮箱验证并能正常登录。",
        "邀请码显示 1NNDZ0W。",
        "确认访问的是 bybit.eu 而非 bybit.com。"
      ],
      warnings: [
        "bybit.eu 和 bybit.com 账户完全独立，资产不互通，请勿混淆。",
        "bybit.com 的 KYC 不等于 bybit.eu KYC，需要在 bybit.eu 重新完成 KYC。"
      ]
    },
    {
      n: "02",
      t: "绑定 Google Authenticator（2FA，所有操作必须）",
      img: "/images/tutorials/bybit-card/step-02.jpg",
      caption: "2FA 设置截图：Profile → Security → Google Auth → 扫码绑定，抄下恢复码。",
      b: "Bybit EU 的所有卡片操作（查看卡号、充值、修改设置）都需要 2FA 验证。Google Authenticator 是实际必须的，短信 2FA 在部分操作中不够用。绑定后抄下恢复码保存到安全位置，换手机时需要用到。",
      actions: [
        "手机下载 Google Authenticator（iOS/Android 均可）。",
        "登录 bybit.eu，进入 Profile → Security。",
        "找到 Two-Factor Authentication，选择 Google Auth。",
        "用手机 Google Auth 扫描页面上的二维码。",
        "输入 App 显示的 6 位动态码确认绑定成功。",
        "抄下恢复码并保存到安全位置（换手机时用）。",
        "打开登录通知和交易通知，方便及时发现异常。"
      ],
      checks: [
        "Google Auth 状态显示为 Enabled。",
        "输入动态码可以通过验证。",
        "恢复码已保存到安全位置。"
      ],
      warnings: [
        "丢失 2FA 且没有恢复码会导致账户无法访问，恢复码务必保存好。",
        "换手机前先迁移 Google Auth，或使用恢复码重置，不要直接删除 App。"
      ]
    },
    {
      n: "03",
      t: "完成 KYC 身份认证（证件 + 人脸）",
      img: "/images/tutorials/bybit-card/step-03.jpg",
      caption: "KYC 页面：上传护照或身份证正面，完成人脸识别，审核通常几分钟内完成。",
      b: "Standard KYC 是申请 Lite 虚拟卡（€150 终身限额）的最低要求，也是 Advanced KYC 的前提。上传护照或居住地政府颁发身份证，完成人脸识别。审核通常几分钟到几小时，通过后 KYC 状态变为 Verified。",
      actions: [
        "进入 Profile → Identity Verification / KYC。",
        "选择 Standard Verification。",
        "选择证件类型：护照（推荐）或政府颁发身份证。",
        "拍摄或上传证件正面（如有背面也需上传）。",
        "按提示完成人脸识别（需摄像头权限）。",
        "提交后等待审核，通常几分钟到几小时内完成。"
      ],
      checks: [
        "KYC 状态变为 Verified。",
        "证件上的姓名与注册邮箱一致，拼写无误。"
      ],
      warnings: [
        "证件照片模糊、被遮挡或四角不完整会被拒，重新提交时需拍新照片。",
        "KYC 使用的姓名将用于所有后续文件，必须保持完全一致。"
      ]
    },
    {
      n: "04",
      t: "准备地址证明（Advanced KYC，Standard 卡必须）",
      img: "/images/tutorials/bybit-card/step-04.jpg",
      caption: "地址证明要求：3 个月内文件，姓名和地址必须与 KYC 证件完全一致，手机账单不被接受。",
      b: "申请日限 €5000 的 Standard 虚拟卡需要 Advanced KYC，即额外上传地址证明。文件必须是 3 个月内签发的，且姓名和地址与 KYC 资料完全一致。Lite 卡（终身限额 €150）只需 Standard KYC，无需地址证明。",
      actions: [
        "确认目标卡类：Standard 卡（日限 €5000）需地址证明；Lite 卡（终身 €150 上限）只需 Standard KYC。",
        "准备以下任意一种文件（3 个月内签发）：",
        "✓ 水电气网费账单（Utility bill）。",
        "✓ 银行月结单（Bank statement）。",
        "✓ 政府信件（Government letter）。",
        "✓ 租房合同（Tenancy agreement，需含开始日期和双方签字）。",
        "✗ 以下不接受：手机账单（Mobile phone bill）、保险文件、银行转账凭证。",
        "确认文件上的姓名和地址与 KYC 证件完全一致，清晰无遮挡，四角完整。"
      ],
      checks: [
        "文件日期在 3 个月内。",
        "姓名和地址与 KYC 信息完全一致。",
        "文件清晰可读，无遮挡，非截图。"
      ],
      warnings: [
        "手机账单（Mobile phone bill）是最常见的错误选择，Bybit EU 不接受。",
        "租约必须包含起始日期和双方签字，空白租约模板会被拒。"
      ]
    },
    {
      n: "05",
      t: "申请虚拟卡并选择 Lite 或 Standard",
      img: "/images/tutorials/bybit-card/step-05.jpg",
      caption: "卡片申请：Finance → Card → Get Your Card，选择 Virtual，再选 Lite（Standard KYC）或 Standard（需地址证明）。",
      b: "Bybit EU 提供三种卡：Virtual Lite（仅 Standard KYC，终身消费上限 €150）、Virtual Standard（Advanced KYC + 地址证明，日限 €5000）、Physical（€10 费用）。绝大多数需求选 Virtual Standard。国家选择要准确：德国选 Germany，法国选 France，按居住国选。",
      actions: [
        "进入 Finance → Card，点击 Get Your Card。",
        "选择 Virtual Card。",
        "选择卡片级别：Standard（推荐，需 Advanced KYC）或 Lite（仅 Standard KYC，限额低）。",
        "Country of Residence：德国选 Germany / Deutschland；法国选 France；其他按实际居住国选。",
        "上传地址证明（Standard 卡必须，Lite 卡不需要）。",
        "填写账单地址，确认与地址证明完全一致。",
        "阅读持卡人协议后提交申请。"
      ],
      checks: [
        "国家字段与地址证明一致。",
        "Standard 卡：地址证明已上传。",
        "申请状态进入 Under Review 或 Pending。"
      ],
      warnings: [
        "Virtual Lite 终身消费上限 €150，额度用完不可续，不推荐用于长期订阅。",
        "2025 年 5 月 13 日后新用户，加密清算顺序最多设置 3 种（老用户 6 种）。"
      ]
    },
    {
      n: "06",
      t: "处理 EDD 加强尽职调查（部分用户）",
      img: "/images/tutorials/bybit-card/step-06.jpg",
      caption: "EDD 页面：如触发需提供资金来源证明 + 财富来源证明，2026 年有多起因材料不足被拒案例。",
      b: "部分用户申请后会收到 EDD（Enhanced Due Diligence）要求，需额外提供资金来源和财富来源文件。2026 年已有多起用户反映反复被拒或资金临时冻结，务必准备完整充分的材料。",
      actions: [
        "收到 EDD 通知后进入 Card 页面查看具体要求。",
        "准备资金来源证明：工资单、雇主证明信、加密交易记录（含盈亏截图）。",
        "准备财富来源证明：纳税申报表、投资账户截图、资产证明文件。",
        "按要求上传所有文件，文件必须清晰、完整、真实。",
        "提交后等待审核，可能需要数个工作日。",
        "如被拒，查看具体拒绝原因，补充对应材料，不要重复提交相同文件。"
      ],
      checks: [
        "所有要求的文件已按要求上传。",
        "材料与 KYC 信息一致，无矛盾。"
      ],
      warnings: [
        "2026 年报告显示 EDD 可能导致账户资金被临时冻结，提前准备充分材料再申请。",
        "提供虚假或伪造文件会导致永久封号且资金冻结。"
      ]
    },
    {
      n: "07",
      t: "等待审核并处理补件",
      img: "/images/tutorials/bybit-card/step-07.jpg",
      caption: "审核状态：Under Review（等待）/ Need More Information（补件）/ Active（通过）。邮箱和卡片页面都要看。",
      b: "提交申请后通常 1-5 个工作日完成审核。要同时查看 Card 页面状态和注册邮箱，出现 Need More Information 时按具体原因补件，不要重复提交相同文件。",
      actions: [
        "回到 Finance → Card 查看申请状态。",
        "同时检查注册邮箱是否有 Bybit EU 补件邮件。",
        "Under Review：耐心等待，不要重复提交材料。",
        "Need More Information：点击查看缺少什么内容，按具体原因重新上传。",
        "补件提交后确认状态已更新为待审核。",
        "审核通过后状态变为 Active，进入卡片页面激活使用。"
      ],
      checks: [
        "没有未处理的补件请求。",
        "邮箱没有未回复的 Bybit EU 邮件。",
        "卡片状态最终变为 Active。"
      ],
      warnings: [
        "重复上传同一张模糊文件不会改变审核结果，先按原因改善材料质量。",
        "审核期间不要修改个人资料，可能导致重新审核延误。"
      ]
    },
    {
      n: "08",
      t: "激活虚拟卡，查看卡号和账单地址",
      img: "/images/tutorials/bybit-card/step-08.jpg",
      caption: "卡片详情：Finance → Card → 点击卡片 → 输入 Google Auth 动态码 → 查看完整卡号。",
      b: "审核通过后在 Finance → Card 可见虚拟卡。点击卡片后输入 Google Auth 动态码解锁卡号。记录完整的 16 位卡号、有效期、CVV 和账单地址，用于线上支付和绑卡。",
      actions: [
        "进入 Finance → Card，找到已激活的虚拟卡。",
        "点击卡片图片或 View Card Details。",
        "输入 Google Authenticator 6 位动态码。",
        "记录 16 位卡号、有效期（MM/YY）、CVV（3 位）。",
        "记录账单地址（Billing Address），线上绑卡时需要填写。",
        "卡片状态确认为 Active，无 Frozen 或 Pending 标识。"
      ],
      checks: [
        "卡号、有效期、CVV 完整记录。",
        "账单地址已知，与申请时填写的地址一致。",
        "卡片状态为 Active。"
      ],
      warnings: [
        "卡号 + CVV 不要截图发给任何人，包括自称 Bybit EU 客服的账号。",
        "CVV 是静态的，泄露后需立即在 App 中冻结卡片并联系客服更换。"
      ]
    },
    {
      n: "09",
      t: "SEPA 充值并设置加密资产清算顺序",
      img: "/images/tutorials/bybit-card/step-09.jpg",
      caption: "Paying With 设置：Finance → Card → Paying With，拖拽设置清算顺序；SEPA 充值收款人姓名必须与 KYC 完全一致。",
      b: "Bybit EU 卡消费时自动将指定加密资产兑换成欧元付款。Finance → Card → Paying With 设置清算顺序，2025 年 5 月 13 日后新用户最多 3 种。SEPA 充值：收款人姓名必须与 KYC 姓名完全一致，否则被退款（2-5 工作日退回）。",
      actions: [
        "进入 Finance → Card → Paying With。",
        "拖拽排序：USDC 放最前（推荐），其次 USDT，再次 EUR。",
        "新用户（2025/05/13 后）最多添加 3 种资产，老用户最多 6 种。",
        "SEPA 充值：Finance → Deposit → EUR → SEPA Transfer，复制 IBAN。",
        "在欧盟银行发起 SEPA 转账，收款人姓名必须与 KYC 姓名完全一致。",
        "到账后余额显示在账户，消费时按 Paying With 顺序自动清算。"
      ],
      checks: [
        "Paying With 顺序已按需设置。",
        "账户有足够余额可以消费。",
        "SEPA 转账收款人姓名与 KYC 完全一致。"
      ],
      warnings: [
        "SEPA 收款人姓名不匹配会被银行退款，资金 2-5 工作日后才能退回，影响使用。",
        "加密资产兑换欧元有汇率差，消费前确保账户余额充足，留有缓冲。"
      ]
    },
    {
      n: "10",
      t: "申请实体卡（可选，€10 费用）",
      img: "/images/tutorials/bybit-card/step-10.jpg",
      caption: "实体卡申请：Finance → Card → Physical Card，费用 €10，邮寄最长 30 天，收到后先插芯片 + 输 PIN。",
      b: "需要线下消费或 ATM 取款时可申请实体卡，费用 €10，官方邮寄 14 工作日，实际可能 30 天。收到后必须先在 POS 机插卡 + 输 PIN 完成首次接触式支付，之后才能使用 NFC 非接触支付。",
      actions: [
        "进入 Finance → Card → Physical Card。",
        "支付 €10 卡片费用。",
        "填写欧盟邮寄地址，确认与 KYC/居住地一致。",
        "等待邮寄，官方说 14 工作日，实际可能 30 天。",
        "收到卡后：在支持芯片的 POS 机插卡，输入 PIN 完成一笔消费（任意金额）激活。",
        "完成插芯片消费后，NFC 非接触支付才能正常使用。"
      ],
      checks: [
        "邮寄地址正确，在 EEA 境内。",
        "收到卡后已完成首次插芯片 + PIN 激活。",
        "NFC 支付可以正常使用。"
      ],
      warnings: [
        "收到卡不先做插芯片 + PIN 操作，NFC 支付会被拒绝，务必先激活。",
        "实体卡邮寄地址必须在 EEA 境内，无法寄到中国大陆。"
      ]
    },
    {
      n: "11",
      t: "日常管理、限额和费用说明",
      img: "/images/tutorials/bybit-card/step-11.jpg",
      caption: "费用页：Finance → Card → Card Info，查看当前消费限额、ATM 限额和手续费率。",
      b: "Bybit EU Standard 虚拟卡月费 €0，消费手续费目前免费（2025 年），日限 €5000。ATM 每月 2 次免费（单次 €200 内），超出 €1.5/次。发现异常消费立即冻结卡片，联系客服。",
      actions: [
        "Finance → Card → Card Info 查看当前消费限额和手续费率。",
        "定期在交易记录中核查每笔消费，发现异常立即处理。",
        "发现异常：Card → Freeze 临时冻结卡片，再联系客服。",
        "修改 PIN：Card → More → Change PIN。",
        "注销卡片：联系客服，余额会退回账户。"
      ],
      checks: [
        "交易通知已开启，能实时收到消费提醒。",
        "PIN 码已记住并设置。"
      ],
      warnings: [
        "连续 3 次 PIN 错误会锁卡，需联系客服解锁，操作比较麻烦。",
        "EDD 审查可能随时触发，保持联系方式（邮箱/手机）有效可接收通知。"
      ]
    }
  ],
  "safepal-card": [
    {
      n: "01",
      t: "安装 SafePal、建钱包、找到 Bank 入口",
      img: "/images/tutorials/safepal-card/step-01.jpg",
      caption: "SafePal App 入口截图：钱包主页往下滑找 Bank 标签，整个流程强烈推荐用 iPhone。",
      b: "SafePal 的银行卡通过内置 Fiat24 Banking Gateway 开通，入口在钱包主页的 Bank 标签。后面 NFC 读证件那一步，iPhone 兼容性远比安卓稳定，强烈建议用 iPhone 操作整个流程。",
      actions: [
        "从 App Store 或 Google Play 下载 SafePal，不要点搜索广告结果，认准官方来源。",
        "打开 App 选 Software Wallet（软件钱包），创建新钱包，抄写助记词后离线纸质保存，不截图、不传云盘、不发任何人。",
        "钱包创建后进入主界面，往下滑找到 Bank 标签，或点底部导航 Discover → Banking Gateway。",
        "提前准备好：护照或二代身份证（原件）、常用邮箱、手机号、当前实际居住地址。",
        "检查手机权限：NFC 已开启、定位（GPS）已开启、相机已允许。",
        "手机提示需要安装 ReadID Ready 的话，提前在应用商店装好备用。"
      ],
      checks: [
        "SafePal 钱包可以正常打开，没有报错。",
        "助记词已纸质离线保存，不存在任何数字设备。",
        "Bank 入口能点进去，没有提示「暂不支持」。"
      ],
      warnings: [
        "强烈建议用 iPhone：后续 NFC 读芯片步骤在安卓上兼容性差，容易卡住。",
        "Fiat24 的 KYC 和 SafePal 钱包是两套独立审核，钱包建好不代表银行账户已开通。"
      ]
    },
    {
      n: "02",
      t: "准备 Arbitrum ETH 和 USDC",
      img: "/images/tutorials/safepal-card/step-02.jpg",
      caption: "资产准备截图：Arbitrum 链上至少要有验证 gas。",
      b: "SafePal / Fiat24 的很多动作需要链上签名。先准备 Arbitrum 资产，否则中途会卡在验证或激活环节。",
      actions: [
        "在 Arbitrum 网络准备至少 0.0001 ETH 用于开户验证。",
        "如果要激活 Mastercard，准备 10 USDC on Arbitrum。",
        "再额外留少量 ETH 作为 gas。",
        "确认资产在 SafePal 钱包地址里，不是在交易所账户里。",
        "第一次转账先小额测试，确认网络选择 Arbitrum。",
        "不要把 ETH 主网、BSC、Arbitrum 地址混着理解。"
      ],
      checks: [
        "SafePal 钱包内能看到 Arbitrum ETH。",
        "USDC 网络是 Arbitrum。",
        "签名时不会因为 gas 不足失败。"
      ],
      warnings: [
        "网络选错会导致资产找回困难。",
        "ReadID / Fiat24 流程中途退出可能需要重新进入。"
      ]
    },
    {
      n: "03",
      t: "进入 Bank、铸造 NFT 账户编号",
      img: "/images/tutorials/safepal-card/step-03.jpg",
      caption: "Bank 入口截图：Get Started 后系统分配 NFT 编号，用 Arbitrum ETH 支付 gas 完成铸造。",
      b: "Fiat24 用 NFT 作为银行账户的链上凭证。点击 Get Started 后，系统分配一个 NFT 账户编号，然后需要用钱包签名并支付少量 Arbitrum ETH 作为 gas 完成铸造。这一步是整个流程的起点，NFT 铸造成功才能进入 KYC。",
      actions: [
        "打开 SafePal App，在 Wallet 主页或 Discover 里找到 Bank / Banking Gateway，点击进入。",
        "点击 Get Started，页面展示 Fiat24 服务条款，通读后继续。",
        "系统自动分配一个 NFT 账户编号，记录下来。",
        "点击 Mint NFT 或 Create Account，钱包弹出签名确认窗口。",
        "确认签名内容只涉及账户创建，点击确认，等待 Arbitrum 链上确认（通常 15-30 秒）。",
        "铸造成功后页面跳转进入 Sign to continue 注册流程。"
      ],
      checks: [
        "页面显示你的 NFT 编号，不是空白或报错。",
        "链上交易已确认，Arbitrum ETH 余额有对应减少。",
        "出现 Sign to continue 按钮，可以进入下一步。"
      ],
      warnings: [
        "Arbitrum ETH 余额不足时铸造会失败，先回上一步补好 gas 再试。",
        "签名窗口只在 SafePal 内弹出，不要在任何外部网站签名说是 Fiat24 的。"
      ]
    },
    {
      n: "04",
      t: "签名并确认开户声明",
      img: "/images/tutorials/safepal-card/step-04.jpg",
      caption: "签名页截图：用钱包确认账户和 NFT 有效性。",
      b: "Fiat24 注册会要求签名确认账号有效性，并声明你是账户的实际受益人。",
      actions: [
        "点击 Sign to continue。",
        "输入 SafePal App 密码完成签名。",
        "确认自己是 sole beneficial owner。",
        "填写并验证邮箱。",
        "填写并验证手机号。",
        "继续进入定位和证件验证。"
      ],
      checks: [
        "签名成功后页面没有停留在 loading。",
        "邮箱验证码和手机验证码都能收到。",
        "注册姓名与护照姓名一致。"
      ],
      warnings: [
        "sole beneficial owner 勾选后会进入后续验证。",
        "验证码收不到时先检查邮箱垃圾箱和号码格式。"
      ]
    },
    {
      n: "05",
      t: "定位 + 地址 + NFC 读证件：全流程最易卡住的一步",
      img: "/images/tutorials/safepal-card/step-05.jpg",
      caption: "地址和 NFC 截图：GPS 要开精确定位，填写地址和定位位置匹配，iPhone 用 Safari 扫码读芯片。",
      b: "这是整个流程失败率最高的环节。三个核心要求同时满足才能通过：GPS 精确定位开启、填写地址和当前定位匹配、NFC 读取证件芯片成功。iPhone 用 Safari 打开读取页面，安卓建议换 iPhone 操作。",
      actions: [
        "页面出现三个勾选框，全部勾上：本人当前在家、手持本人证件、手机 GPS 已开启。",
        "iPhone：系统设置 → 隐私与安全性 → 定位服务，确认 Safari 或 SafePal 已设为使用期间，精确位置打开。",
        "Android：定位权限选精确位置（Precise Location），不要只开模糊定位。",
        "地址填写当前实际居住地，街道号、城市、邮编和定位位置一致，不能填虚假地址。",
        "点 Check 验证地址，通过后选证件类型：大陆用户可选二代身份证，也可选护照。",
        "iPhone 用户：页面提示扫描二维码时，用 Safari（不是微信扫一扫）扫描，进入 NFC 读取页面。",
        "把证件数据页贴近手机背面 NFC 区域（iPhone 在机身顶部），保持静止等进度条走完。",
        "NFC 读取成功后进入人脸识别，按提示点头或眨眼完成。"
      ],
      checks: [
        "地址验证通过，没有红色报错提示。",
        "NFC 进度条走到 100%，没有提示读取失败。",
        "人脸识别完成后页面跳回 Fiat24 注册流程，不是卡在加载中。"
      ],
      warnings: [
        "用微信扫一扫或其他浏览器扫 NFC 二维码大概率失败，必须用 Safari。",
        "手机和证件要贴合静止，轻微移动就会中断重来。",
        "安卓机 NFC 兼容性是已知问题，反复失败就借一台 iPhone 操作。"
      ]
    },
    {
      n: "06",
      t: "等待 Fiat24 审核并上线",
      img: "/images/tutorials/safepal-card/step-06.jpg",
      caption: "审核中截图：通过后会收到 online 确认。",
      b: "提交后会收到 under review 类邮件，审核通过后 Fiat24 会通知账户 online。",
      actions: [
        "提交全部 KYC 材料。",
        "检查邮箱是否收到 Fiat24 under review 邮件。",
        "等待审核结果，不要反复创建新账户。",
        "如果补件，按邮件要求补充清晰文件。",
        "收到 online 邮件后回到 SafePal Bank 页面。",
        "确认 EUR24 / USD24 / CHF24 等账户是否显示。"
      ],
      checks: [
        "邮箱收到审核状态。",
        "SafePal Bank 页面能进入账户。",
        "账户状态显示可用。"
      ],
      warnings: [
        "重复开户可能触发风控。",
        "补件邮件不要点可疑域名链接。"
      ]
    },
    {
      n: "07",
      t: "激活 Fiat24 卡：入金 10 USDC 解锁消费",
      img: "/images/tutorials/safepal-card/step-07.jpg",
      caption: "卡片激活截图：账户 online 后入金至少 10 USDC（Arbitrum 链），卡片从 inactive 变 active。",
      b: "Fiat24 账户审核通过（收到 online 邮件）之后，卡片还需要单独激活。激活门槛是入金至少 10 USDC（Arbitrum 链），系统把这笔 USDC 转换成法币余额并解锁消费。Arbitrum 的 gas 费最低，是入金首选。",
      actions: [
        "收到 Fiat24 账户 online 邮件后，回到 SafePal App → Bank → Card 标签。",
        "点击 Activate Card，确认卡片当前状态是 inactive。",
        "点 Deposit / 入金，选择 USDC，网络选 Arbitrum（gas 约 0.01 美元，最低）。",
        "从交易所或钱包转至少 10 USDC 到 Fiat24 的 Arbitrum USDC 地址。",
        "链上确认后（约 1-2 分钟），回 Card 页面，状态变为 active。",
        "选择启用的主币种账户：USD24、EUR24 或 CHF24，按使用需求选一个。",
        "激活成功后进入卡片详情，点击卡号区域（需钱包签名）查看完整卡号。"
      ],
      checks: [
        "Card 页面状态从 inactive 变为 active。",
        "Fiat24 对应币种账户（USD/EUR/CHF）余额显示入金金额。",
        "点卡号区域能通过签名查看完整卡号、有效期和 CVV。"
      ],
      warnings: [
        "USDC 必须在 Arbitrum 链，发到其他链地址（如 ERC20 主网）会丢失。",
        "状态没有变 active 就等 10 分钟再刷新，不要重复操作。"
      ]
    },
    {
      n: "08",
      t: "查看完整卡号和 CVV",
      img: "/images/tutorials/safepal-card/step-08.jpg",
      caption: "查看卡号截图：完整敏感信息需要跳转银行页面并签名。",
      b: "SafePal App 本身不会直接保存完整卡号。需要通过银行网页签名后查看卡号、有效期和 CVV。",
      actions: [
        "在 Card 页面点击卡号旁边的查看图标。",
        "跳转到 Fiat24 / 银行网页。",
        "用钱包签名确认身份。",
        "查看卡号、有效期、CVV 和持卡人信息。",
        "复制信息用于绑定钱包或线上支付。",
        "查看完成后关闭页面，不要截图外传。"
      ],
      checks: [
        "能看到完整卡号。",
        "CVV 和有效期清楚。",
        "账单地址可用于支付表单。"
      ],
      warnings: [
        "不要在远程协助、直播或公共设备查看卡号。",
        "泄露卡号、CVV 后应立即冻结或联系支持。"
      ]
    },
    {
      n: "09",
      t: "充值、消费和钱包绑定",
      img: "/images/tutorials/safepal-card/step-09.jpg",
      caption: "充值使用截图：crypto 会转成 Fiat24 法币余额。",
      b: "卡片消费依赖 Fiat24 账户余额。充值后系统会把 crypto 转成对应法币账户，再供 Mastercard 消费。",
      actions: [
        "点击 Deposit 进入充值。",
        "选择要充值的资产和目标币种账户。",
        "确认汇率、手续费和链上 gas。",
        "充值完成后查看 Fiat24 账户余额。",
        "绑定 PayPal、Apple Pay、Google Pay 或 Samsung Pay。",
        "先做小额线上测试，再用于长期订阅。"
      ],
      checks: [
        "法币账户有余额。",
        "Apple Pay / Google Pay 绑定成功。",
        "小额支付能通过。"
      ],
      warnings: [
        "关闭 Internet Purchase 后无法网购。",
        "关闭 Contactless 后钱包支付不可用。"
      ]
    },
    {
      n: "10",
      t: "限额、失败处理和日常安全",
      img: "/images/tutorials/safepal-card/step-10.jpg",
      caption: "限额和设置截图：开卡后要先看交易开关。",
      b: "最后一步不是消费，而是把限额、交易开关、失败处理路径搞清楚。",
      actions: [
        "查看每日、每月、单笔限额。",
        "确认网络支付、非接触支付、ATM 等开关。",
        "订阅扣款前留足余额。",
        "交易失败时先看余额、交易开关、商户 MCC、3DS。",
        "ReadID 或定位失败时换设备、重启 App、确认权限。",
        "不用时冻结卡片或关闭不需要的交易功能。"
      ],
      checks: [
        "知道在哪里冻结卡片。",
        "知道在哪里查看失败交易。",
        "知道当前卡片限额。"
      ],
      warnings: [
        "大额或频繁失败交易可能触发风控。",
        "用 crypto 消费可能涉及税务记录。"
      ]
    }
  ],
  "pokepay": [
    {
      n: "01",
      t: "下载 PokePay App 或使用网页版",
      img: "/images/tutorials/pokepay/step-01.jpg",
      caption: "App 下载入口截图：iOS 需要香港区 App Store，推荐用网页版 app.pokepay.cc 省去换区麻烦。",
      b: "iOS 用户需要香港区 Apple ID 才能在 App Store 搜到 PokePay（搜索 PokePay，或直链 apps.apple.com/hk/app/id6741506101）。没有港区账号直接用网页版 app.pokepay.cc，功能完整，KYC 摄像头兼容性也很好。Android 用户可从 Google Play 或官网 pokepay.cc/appdown.html 下载 APK。注册不需要开 VPN，国内网络可直接访问。",
      actions: [
        "iOS 用户：确认 App Store 已切换到香港区，搜索 PokePay 或直接访问 apps.apple.com/hk/app/id6741506101。",
        "没有港区 Apple ID 的 iOS 用户：用 Safari 或 Chrome 直接打开 app.pokepay.cc，功能与 App 相同，推荐此方式。",
        "Android 用户：打开 Google Play 搜索 PokePay，或访问 pokepay.cc/appdown.html 下载官方 APK。",
        "安装完成后打开 App 或网页，确认进入 PokePay 登录页，不是其他仿站。",
        "检查网页地址栏确认是 app.pokepay.cc，有 HTTPS 锁标志。",
        "不要从 Telegram 私聊或陌生短链接进入，仿站风险极高。",
        "国内网络无需 VPN 即可正常访问，注册和 KYC 全程不需要翻墙。"
      ],
      checks: [
        "确认访问地址是 app.pokepay.cc，有 HTTPS。",
        "页面能正常加载登录/注册界面。",
        "没有被要求输入助记词或钱包地址。"
      ],
      warnings: [
        "中国区 App Store 搜不到 PokePay，不要下载搜到的同名山寨 App。",
        "如果页面要求输入助记词或钱包私钥，立即关闭，那不是正版 PokePay。"
      ]
    },
    {
      n: "02",
      t: "注册账号",
      img: "/images/tutorials/pokepay/step-02.jpg",
      caption: "注册页截图：推荐用 Gmail 或 Outlook 邮箱，如有邀请码此步填入。",
      b: "访问 app.pokepay.cc 开始注册。推荐使用 Gmail 或 Outlook 邮箱，不推荐 QQ 邮箱或 163 邮箱（可能收不到验证邮件）。如果有邀请码，注册时务必填入，可获得开卡优惠券。浏览器推荐 Google Chrome，后续 KYC 摄像头兼容性最好。",
      actions: [
        "用 Chrome 浏览器打开 app.pokepay.cc，点击注册/Sign Up。",
        "输入 Gmail 或 Outlook 邮箱地址，避免使用 QQ、163 等国内邮箱。",
        "设置密码（建议 12 位以上，含大小写字母和数字）。",
        "如有邀请码，在邀请码栏填入（邀请码对应开卡折扣券）。",
        "点击发送验证码，查收邮件并填入 6 位验证码。",
        "完成注册后登录账户，进入主界面确认正常。",
        "进入安全中心，开启二步验证（Google Authenticator 或邮箱验证）。",
        "确认 Card 页面和 Wallet 页面都能正常访问。"
      ],
      checks: [
        "注册邮箱可正常收到 PokePay 验证邮件。",
        "邀请码已填入（如有）。",
        "能进入 Card 和 Wallet 页面。"
      ],
      warnings: [
        "QQ 邮箱和 163 邮箱可能将 PokePay 邮件识别为垃圾邮件，收不到验证码。",
        "邀请码只能在注册时填入，注册后无法补填。"
      ]
    },
    {
      n: "03",
      t: "完成 KYC 实名认证",
      img: "/images/tutorials/pokepay/step-03.jpg",
      caption: "KYC 入口截图：左上角菜单 → 会员 → KYC → Level 1，Country 选 China，证件选身份证。",
      b: "KYC 路径：左上角菜单 → 会员 → KYC → Level 1。Country 选 China，Document Type 选身份证（ID Card）。英文姓名顺序与国内习惯相反：Given Name 填名，Family Name 填姓。例如张三 → Given Name: SAN，Family Name: ZHANG。提交后通常 2-5 分钟自动审核，最长 24 小时。失败时看具体原因重新拍摄，不要重复提交同一张照片。",
      actions: [
        "登录后点击左上角菜单 → 会员（Member）→ KYC → Level 1。",
        "Country 选 China，Document Type 选 ID Card（身份证）。",
        "填写英文姓名：Given Name 填拼音名，Family Name 填拼音姓。例如张三 → Given: SAN，Family: ZHANG。",
        "上传身份证正面照：光线均匀，四角完整入镜，文字清晰，关闭美颜。",
        "上传身份证背面照：同样要求光线好、四角完整、无反光遮字。",
        "点击提交，等待状态更新，通常 2-5 分钟，最长 24 小时。",
        "失败时看提示原因：姓名问题重填，照片问题重拍对应面，不要用同一张照片反复提交。"
      ],
      checks: [
        "Given Name（名）在前，Family Name（姓）在后，和国内习惯相反。",
        "证件四角完整，无遮挡，文字可读，无反光。",
        "KYC 状态显示 Approved 或 Verified。"
      ],
      warnings: [
        "姓名顺序填反是被拒最常见原因，提交前再检查一遍 Given Name / Family Name。",
        "截图、翻拍、P 图处理的证件照片会直接被拒，必须用手机原相机拍实物证件。"
      ]
    },
    {
      n: "04",
      t: "人脸识别（活体检测）",
      img: "/images/tutorials/pokepay/step-04.jpg",
      caption: "人脸识别截图：上传证件后进行活体检测，需开启系统层面相机权限，光线充足，正对手机。",
      b: "KYC 上传证件后会进行人脸识别（活体检测，不是静态照片）。必须在系统层面开启相机权限才能正常工作：iOS 进设置→Safari/Chrome→相机→允许；Android 进设置→应用→Chrome→权限→相机→允许。拍摄时光线充足，正面朝向手机，距离约 30-50cm，不要背光，按页面提示做动作（点头、眨眼等）。",
      actions: [
        "iOS：进入手机设置 → Safari 浏览器（或 Chrome）→ 相机 → 选择「允许」。",
        "Android：进入手机设置 → 应用管理 → Chrome → 权限 → 相机 → 允许。",
        "回到 PokePay KYC 页面，点击开始人脸识别。",
        "浏览器弹出相机权限请求时点击「允许」。",
        "确保光线充足，不要背对窗户，距离手机约 30-50 厘米。",
        "脸部完整露出，无帽子、口罩、墨镜，按页面动作提示（点头/眨眼）配合。",
        "关闭手机美颜和滤镜，人脸识别系统对美颜处理后的图像识别率低。"
      ],
      checks: [
        "相机权限已在手机系统层面（不只是 App 层面）授权。",
        "人脸识别通过，KYC 页面显示 Approved。",
        "光线充足，无背光，距离适当。"
      ],
      warnings: [
        "相机权限必须在手机系统设置里授权，只在 App 内授权可能不够。",
        "背光环境、开启美颜、相机权限未授权是人脸识别失败的三大原因。"
      ]
    },
    {
      n: "05",
      t: "选择卡片类型",
      img: "/images/tutorials/pokepay/step-05.jpg",
      caption: "选卡页截图：KYC 通过后进入 Card → Apply Card，新版 PokeCard 手续费 0%，主要用于日常跨境消费。",
      b: "KYC 通过后进入 Card 页面 → Apply Card。新版 PokeCard 开卡费约 5 USDT，消费手续费 0%，是日常使用的推荐选择。PokePay 不作为 ChatGPT / Claude 订阅卡推荐，AI 订阅不要用它测试，避免无效扣款和风控。如有优惠券，申请时记得选择使用。首次充值建议 30 USDT（覆盖开卡费 + 手续费 buffer + 小额试刷金额）。",
      actions: [
        "KYC 审核通过后，进入 Card → Apply Card。",
        "查看当前可申请的卡片列表，确认新版 PokeCard、实体卡和历史卡种的区别。",
        "日常跨境消费选新版 PokeCard（开卡费约 5 USDT，消费手续费 0%）。",
        "如果目标是 ChatGPT / Claude，PokePay 不推荐使用，改看 Roogoo 等更适合 AI 订阅的卡。",
        "确认优惠券区域，如有优惠券点击选择使用，可抵扣部分开卡费。",
        "确认钱包余额足够支付开卡费，不足则先充值。",
        "首次充值建议至少 30 USDT：覆盖开卡费（约 5 USDT）+ 手续费缓冲 + 小额试刷金额。"
      ],
      checks: [
        "选择的卡片类型和自己的使用场景匹配（日常消费、支付宝、流媒体等）。",
        "优惠券已选择使用（如有）。",
        "钱包余额足够支付开卡费。"
      ],
      warnings: [
        "PokePay 不要作为 ChatGPT / Claude 订阅卡使用，失败率高且容易触发风控。",
        "优惠券只有通过邀请链接注册的账号才会发放，直接注册没有折扣。"
      ]
    },
    {
      n: "06",
      t: "充值 USDT（从 OKX C2C 购买）",
      img: "/images/tutorials/pokepay/step-06.jpg",
      caption: "充值流程截图：PokePay 只接受加密货币，需先在 OKX 用 C2C 买 USDT，再通过 TRC20 网络转入。",
      b: "PokePay 只接受加密货币充值，不能直接用支付宝或微信。流程：在 OKX 用 C2C 买 USDT → 从 OKX 提币到 PokePay。PokePay 充值路径：汇入 → 选 USDT → 选 TRC20 网络 → 复制地址。TRC20 到账约 3-15 分钟，超 30 分钟未到账保存 TXID 联系客服。",
      actions: [
        "进入 PokePay：钱包/Wallet → 汇入/Import → 选择 USDT → 选网络 TRC20。",
        "复制 PokePay 显示的 TRC20 充值地址，核对地址前 4 位和后 4 位。",
        "打开 OKX App → C2C 买币 → 选择 USDT → 选择支付宝或微信或银行卡付款。",
        "选择合适的卖家（选择月成交量高、好评率 98% 以上的商家）。",
        "按卖家银行账号转账，备注栏留空，不要写任何文字。",
        "转账完成后点「我已付款」，等待卖家确认并释放 USDT（通常 5-15 分钟）。",
        "OKX 资产 → 提币 → USDT → 网络选 TRC20 → 粘贴 PokePay 充值地址 → 确认金额。",
        "复制提币 TXID 保存，等待 3-15 分钟，刷新 PokePay 钱包确认余额到账。"
      ],
      checks: [
        "PokePay 充值地址和 OKX 提币地址完全一致。",
        "两端网络都选 TRC20，不能混用 ERC20 或其他网络。",
        "USDT 已到账，PokePay 钱包余额已更新。"
      ],
      warnings: [
        "C2C 转账备注栏必须留空，写备注可能被平台判定为违规交易被冻结。",
        "网络选错（一端 TRC20 一端 ERC20）资产可能永久丢失，每次都要核对。"
      ]
    },
    {
      n: "07",
      t: "申请并激活卡片",
      img: "/images/tutorials/pokepay/step-07.jpg",
      caption: "申请卡片截图：账户有余额后提交申请，虚拟卡秒出，申请成功后进入 My Card 激活。",
      b: "账户有余额后：Card → Apply Card → 选卡片类型 → 确认费用 → 同意条款 → 提交。虚拟卡秒出。申请成功后进入 My Card → 点击卡片 → Activate → 完成验证（短信/邮箱/App）完成激活。激活后才能查看完整卡号和 CVV。注意：连续输错 CVV、有效期或 PIN 会锁卡，需联系客服解锁。",
      actions: [
        "确认钱包余额足够支付开卡费，进入 Card → Apply Card。",
        "选择卡片类型，确认开卡费金额，确认优惠券已使用（如有）。",
        "勾选同意服务条款，点击提交申请。",
        "等待虚拟卡生成，通常秒出，刷新 My Card 页面查看。",
        "进入 My Card → 点击刚申请的卡片 → 点击 Activate（激活）。",
        "按页面提示完成短信、邮箱或 App 验证码验证。",
        "激活成功后确认卡片状态显示 Active（而非 Pending 或 Inactive）。"
      ],
      checks: [
        "卡片状态显示 Active，不是 Pending。",
        "能进入卡片详情页。",
        "激活验证（短信/邮箱）已完成。"
      ],
      warnings: [
        "连续输错 CVV、有效期或 PIN 会触发锁卡，需联系客服解锁，麻烦且耗时。",
        "卡片状态为 Pending 时不能消费，需等待或联系客服确认进度。"
      ]
    },
    {
      n: "08",
      t: "查看卡号和账单地址",
      img: "/images/tutorials/pokepay/step-08.jpg",
      caption: "卡片详情截图：My Card → 点击卡片，记录卡号、有效期、CVV、持卡人英文姓名和账单地址。",
      b: "进入 My Card → 点击卡片 → 查看卡片详情，记录以下信息：16 位卡号、有效期（MM/YY）、CVV（3 位）、持卡人英文姓名、账单地址。账单地址是美国或香港虚拟地址，绑定支付宝或网购时要用这个地址，不能填国内地址。卡号截图只保存给自己，不要发给任何人。",
      actions: [
        "进入 My Card，点击目标卡片，进入卡片详情页。",
        "记录 16 位卡号（Card Number），注意不要抄错。",
        "记录有效期（Expiry Date，格式 MM/YY）。",
        "记录 CVV（安全码，3 位数字）。",
        "记录持卡人英文姓名（Cardholder Name，格式和 KYC 时一致）。",
        "记录账单地址（Billing Address，美国或香港虚拟地址），后续绑卡时需要用到。",
        "将上述信息安全保存（截图存本地，不要传到云端或发给他人）。"
      ],
      checks: [
        "16 位卡号、有效期、CVV 已完整记录。",
        "账单地址已记录，包含街道、城市、州/省、邮编。",
        "持卡人英文姓名与 KYC 认证时填写的一致。"
      ],
      warnings: [
        "完整卡号加 CVV 等同于卡片本身，不要截图发给客服以外的任何人。",
        "账单地址必须用卡片详情页显示的虚拟地址，填国内地址会导致绑卡失败。"
      ]
    },
    {
      n: "09",
      t: "绑定支付宝",
      img: "/images/tutorials/pokepay/step-09.jpg",
      caption: "支付宝绑卡截图：添加银行卡 → 输入卡号，账单地址填卡片详情页的美国地址，切换英文界面成功率更高。",
      b: "支付宝 App → 我的 → 银行卡 → 添加银行卡 → 输入 16 位卡号。绑定失败率较高时，切换到英文界面（我的 → 设置 → 多语言 → English）再操作，成功率明显提升。账单地址填写 PokePay 卡片详情页显示的美国地址，不填国内地址。Apple Pay 明确不支持 PokePay（多名用户实测均提示不支持此卡片）。绑定成功后先做 10 元以内小额消费养卡。支付宝单笔 200 元以内不加手续费，超出收 3% 手续费。",
      actions: [
        "打开支付宝 App → 我的 → 银行卡 → 右上角添加银行卡。",
        "输入 PokePay 卡片的 16 位卡号，点击下一步。",
        "填写有效期、CVV、持卡人英文姓名。",
        "账单地址填写 PokePay 卡片详情页显示的美国地址（格式如：123 Main St, Los Angeles, CA 90001）。",
        "若绑定失败，切换支付宝到英文界面：我的 → 设置 → 多语言 → English，再重新操作。",
        "绑定成功后先做 10 元以内小额消费验证（如购买小额优惠券或充值）。",
        "支付宝消费 200 元以内每笔不收手续费，超出收 3%，合理控制单笔金额。"
      ],
      checks: [
        "支付宝显示 PokePay 卡片已绑定。",
        "小额消费（<10 元）测试成功，PokePay 有扣款记录。",
        "账单地址使用了 PokePay 提供的美国地址。"
      ],
      warnings: [
        "Apple Pay 明确不支持 PokePay，不要浪费时间尝试。",
        "Steam 官方明确不支持 PokePay，不要在 Steam 消费。"
      ]
    },
    {
      n: "10",
      t: "确认不支持的平台，避免无效扣款",
      img: "/images/tutorials/pokepay/step-10.jpg",
      caption: "风控检查截图：PokePay 不作为 ChatGPT / Claude 订阅卡推荐，先把不可用平台排除。",
      b: "PokePay 适合日常跨境消费、部分流媒体和小额验证，不要拿它反复测试 ChatGPT / Claude / Steam / AWS / GCP。反复失败会产生预授权占用、退款等待和账户风控。AI 订阅需求优先看 Roogoo 等明确支持的卡。",
      actions: [
        "不要用 PokePay 订阅 ChatGPT Plus 或 Claude Pro。",
        "不要用 PokePay 在 Steam、Blizzard、EA 这类明确限制预付卡的平台反复测试。",
        "不要用 PokePay 跑 AWS / GCP 云服务绑卡测试。",
        "先用 1-5 美元小额商户验证卡片状态，再用于目标场景。",
        "出现一次拒付或验证失败后，先查失败原因，不要连续重试。",
        "AI 订阅需求改用页面里标注支持 ChatGPT / Claude 的卡。"
      ],
      checks: [
        "已确认 PokePay 不用于 ChatGPT / Claude。",
        "目标商户支持预付卡或虚拟卡。",
        "卡片先通过小额试刷。"
      ],
      warnings: [
        "连续失败会占用余额或触发账户风控，别拿同一张卡硬刷。",
        "ChatGPT / Claude 需求不要放在 PokePay 这条路线里处理。"
      ]
    },
    {
      n: "11",
      t: "小额试刷验证卡片状态",
      img: "/images/tutorials/pokepay/step-11.jpg",
      caption: "试刷记录截图：先用 $1-5 小额消费验证卡片正常，再上长期订阅，连续失败时停下排查原因。",
      b: "不要一开卡就直接绑长期订阅。先选 $1-5 的小额消费验证卡片是否正常工作。检查交易记录、扣款金额、手续费是否在预期范围内。连续失败时停下来排查原因（余额不足、账单地址错误、3DS 验证未完成），不要连刷同一商户触发双重风控。Steam 官方明确不支持 PokePay，不要在 Steam 测试。",
      actions: [
        "选择一个 $1-5 美元的小额商户（如 Patreon 最低档、Google Play 应用、海外小额充值）。",
        "输入卡号、有效期、CVV 和卡片详情页的账单地址。",
        "遇到 3DS 验证时，按页面跳转完成邮箱或短信验证。",
        "等待交易结果，回 PokePay 查看交易记录是否有扣款或预授权记录。",
        "检查扣款金额和手续费是否在预期范围（消费手续费 0%，跨境汇率转换费另计）。",
        "失败时读错误提示，根据提示排查：余额不足 → 充值；账单地址错误 → 重新核对；3DS 失败 → 重走验证流程。",
        "不要在 Steam 消费，官方明确不支持 PokePay 卡。"
      ],
      checks: [
        "PokePay 交易记录中能看到该笔消费的授权或扣款记录。",
        "手续费在预期范围内。",
        "3DS 验证流程可以正常完成。"
      ],
      warnings: [
        "连续失败 3 次以上同一商户可能触发商户风控，停下来排查原因再继续。",
        "Steam 官方明确不支持 PokePay，不要用此卡在 Steam 消费。"
      ]
    },
    {
      n: "12",
      t: "账户维护和日常避坑",
      img: "/images/tutorials/pokepay/step-12.jpg",
      caption: "账户管理截图：保持账户活跃，随用随充，不要存大额，自动续费扣款失败会触发风控。",
      b: "2025 年下半年 PokePay 清退了大批长期不活跃的僵尸账号，需保持定期使用。随用随充，不要在账户存放大额资金。不要把同一张卡绑定到多个高风控订阅平台。C2C 转账不要写备注。自动续费扣款失败会触发风控，建议关闭自动续费改手动续费。退款时间：普通 3-7 工作日，跨境 7-30 工作日。",
      actions: [
        "保持账户活跃：每月至少有 1-2 笔消费记录，避免被判定为僵尸账号。",
        "随用随充：消费前充值，消费后不要在账户留大额余额，降低平台风险敞口。",
        "一张卡只用于一个主要场景，多平台共用会提高风控概率。",
        "关闭重要订阅服务的自动续费，改为到期前手动充值续费，避免扣款失败触发风控。",
        "C2C 购买 USDT 时转账备注栏留空，写备注可能被平台判定为违规交易。",
        "退款到账时间：普通商户 3-7 工作日，跨境退款 7-30 工作日，超时凭 ARN 联系客服。",
        "发现异常扣款立即在 My Card 页面使用锁卡功能冻结卡片，再联系客服处理。"
      ],
      checks: [
        "已了解锁卡/解锁入口位置。",
        "重要订阅服务已关闭自动续费，改为手动。",
        "客服联系方式已保存（官网 Live Chat 或 Telegram 官方群）。"
      ],
      warnings: [
        "长期不活跃账号有被清退风险，2025 年已有大规模清退案例。",
        "不要把卡号、CVV、有效期同时发给任何人，包括自称 PokePay 客服的陌生人。"
      ]
    }
  ],
  "roogoo": [
    {
      n: "01",
      t: "访问 Roogoo 并安装到主屏幕",
      img: "/images/tutorials/roogoo/step-01.jpg",
      caption: "PWA 安装截图：正确网址 h5.roogoo.money，iOS Safari 底部分享→添加到主屏幕，Android Chrome 右上角三点→添加到主屏幕。",
      b: "Roogoo 的正确网址是 https://h5.roogoo.money（旧域名 wap.roogoo.cloud 已废弃）。Roogoo 是 PWA 网页应用，没有 App Store 版本，安装到主屏幕后使用体验接近原生 App。iOS Safari 安装：底部分享图标（上箭头）→ 添加到主屏幕；微信内打开时先点右上角三点 → 在 Safari 中打开，再执行安装。Android Chrome：右上角三点 → 添加到主屏幕。不要从非官方链接进入，仅认准 h5.roogoo.money。",
      actions: [
        "iOS Safari：打开 h5.roogoo.money，点击底部分享图标（方块加上箭头）→ 添加到主屏幕。",
        "iOS 微信内打开时：右上角三点 → 在 Safari 中打开，再执行添加到主屏幕步骤。",
        "Android Chrome：打开 h5.roogoo.money，右上角三点菜单 → 添加到主屏幕。",
        "华为浏览器：右上角三点 → 添加到桌面。",
        "小米/VIVO 等国产浏览器：先进手机设置 → 应用权限 → 开启「创建桌面快捷方式」，再操作。",
        "安装完成后从主屏幕图标打开，确认进入 h5.roogoo.money 登录页。",
        "不要从非官方短链接、Telegram 私聊或陌生渠道进入，仅从 h5.roogoo.money 访问。"
      ],
      checks: [
        "浏览器地址栏显示 h5.roogoo.money，有 HTTPS 锁标志。",
        "主屏幕上已有 Roogoo 图标，点击可正常进入。",
        "没有被要求输入助记词或钱包私钥。"
      ],
      warnings: [
        "旧域名 wap.roogoo.cloud 已废弃，不要访问旧地址。",
        "Roogoo 没有 App Store 或 Google Play 版本，从应用商店搜到的同名应用是仿冒品。"
      ]
    },
    {
      n: "02",
      t: "注册账号（保留邀请码）",
      img: "/images/tutorials/roogoo/step-02.jpg",
      caption: "注册页截图：点本页「立即申请」，邀请码 0eq357 自动填入，不要删除。有邀请码可享 $3.3 折扣 + 激活后 $10 返现。",
      b: "点击本页「立即申请」，邀请码 0eq357 会自动填入注册页（不要删除）。填写邮箱，设置密码，完成邮箱验证码。有邀请码可享：$3.3 开卡费折扣 + 激活后 $10 返现直接进卡。注册成功后进入 Dashboard，第一次登录时建议设置支付密码并开启二步验证。",
      actions: [
        "点击本页上方「立即申请」，进入带邀请码的注册链接：https://h5.roogoo.money/register?inviteCode=0eq357。",
        "确认注册页邀请码栏已自动填入 0eq357，不要删除或修改。",
        "填写邮箱地址（推荐 Gmail 或 Outlook，国内邮箱可能收不到验证邮件）。",
        "设置密码（建议 12 位以上，含大小写和数字）。",
        "查收邮箱验证码，填入完成验证。",
        "注册成功后登录 Dashboard，进入安全设置，设置支付密码和二步验证。",
        "确认 Dashboard 可以正常访问，能看到 Asset Account 和 Cards 入口。"
      ],
      checks: [
        "注册时邀请码显示 0eq357，未被删除。",
        "邮箱验证已完成，能收到系统邮件。",
        "Dashboard 可正常访问，显示 Asset Account 和 Cards 入口。"
      ],
      warnings: [
        "邀请码只能在注册时填入，注册后无法补填，折扣和返现无法补救。",
        "删除邀请码后 $3.3 折扣和 $10 返现均无法获得，注意保留。"
      ]
    },
    {
      n: "03",
      t: "认识三种卡，选择适合的",
      img: "/images/tutorials/roogoo/step-03.jpg",
      caption: "卡片选择截图：尊享卡（紫色 Mastercard）唯一官方支持 AI 订阅；乐享卡（Visa）适合日常消费；无界卡（香港 Visa）支持微信香港钱包。",
      b: "Roogoo 提供三种卡，首张均免费（$0 开卡费），后续每张 $4.99。尊享卡（Premier Card）：紫色 Mastercard，美国发行，唯一官方支持 ChatGPT/Claude/Cursor 等 AI 订阅，首张免费。乐享卡（Enjoy Card）：Visa，美国（波多黎各）发行，适合日常跨境消费，Apple Pay 2026 Q2 上线。无界卡（Borderless Card）：Visa，香港发行，支持微信香港钱包，适合大额消费或香港场景。",
      actions: [
        "明确自己的主要用途：AI 订阅（ChatGPT/Claude/Cursor）→ 选尊享卡（Premier Card，紫色 Mastercard）。",
        "日常跨境网购和订阅 → 选乐享卡（Enjoy Card，Visa）。",
        "需要微信香港钱包、香港实体消费或大额消费 → 选无界卡（Borderless Card，香港 Visa）。",
        "进入 Dashboard → Cards → Apply Card，查看三种卡的详细说明和当前活动。",
        "确认首张免费（$0 开卡费），第二张起 $4.99/张。",
        "可以同时持有多种卡，分场景使用。",
        "如果同时有 AI 订阅和日常消费需求，建议先申请尊享卡，再申请乐享卡。"
      ],
      checks: [
        "已确认选择的卡片类型与使用场景匹配。",
        "已了解首张免费政策和后续开卡费用。",
        "AI 订阅场景确认选择尊享卡（Mastercard），不是乐享卡或无界卡。"
      ],
      warnings: [
        "乐享卡和无界卡不适合订阅 ChatGPT，AI 订阅必须用尊享卡（Mastercard）。",
        "无界卡是香港 Visa，不支持订阅 ChatGPT（香港 IP 被 OpenAI 封禁）。"
      ]
    },
    {
      n: "04",
      t: "充值 USDT（从 OKX 买入）",
      img: "/images/tutorials/roogoo/step-04.jpg",
      caption: "充值流程截图：Dashboard → Assets → Deposit → USDT → TRC20 → 复制地址，再从 OKX C2C 买 USDT 提币过来。",
      b: "进入 Dashboard → Assets → Deposit → USDT → 选 TRC20 网络 → 复制充值地址。在 OKX 用 C2C 买 USDT：C2C 买币 → USDT → 选支付宝/微信付款 → 转账时备注栏留空 → 点已付款 → 等卖家释放。OKX 提币时两端网络必须一致（都选 TRC20），选错永久丢失。TRC20 到账约 2 分钟，首次建议充 30-50 USDT。",
      actions: [
        "进入 Dashboard → Assets → Deposit，选择 USDT，网络选 TRC20。",
        "复制 Roogoo 显示的 TRC20 充值地址，核对前 4 位和后 4 位。",
        "打开 OKX App → C2C 买币 → 选择 USDT → 选支付宝或微信付款方式。",
        "选择成交量高、好评率 98% 以上的卖家，确认金额后下单。",
        "按卖家银行账号转账，备注栏留空（不写任何文字）。",
        "转账完成后点「我已付款」，等待卖家释放 USDT（通常 5-15 分钟）。",
        "OKX 资产 → 提币 → USDT → 网络选 TRC20 → 粘贴 Roogoo 充值地址 → 确认金额。",
        "等待约 2 分钟，刷新 Roogoo Dashboard 确认 Asset Account 余额到账。"
      ],
      checks: [
        "Roogoo 充值地址和 OKX 提币地址完全一致。",
        "两端网络都选 TRC20，绝对不能混用 ERC20 或其他网络。",
        "Asset Account 余额已更新，金额与充值金额一致。"
      ],
      warnings: [
        "两端网络必须完全一致（都是 TRC20），选错网络资产永久丢失，无法找回。",
        "OKX C2C 转账备注栏必须留空，写备注可能被平台判定违规导致资金冻结。"
      ]
    },
    {
      n: "05",
      t: "完成 Sumsub KYC",
      img: "/images/tutorials/roogoo/step-05.jpg",
      caption: "KYC 截图：Dashboard → Account/Verification，使用 Sumsub 平台，选中国和身份证，完成信息填写和人脸识别。",
      b: "Dashboard → Account/Verification → 进入 KYC 认证（使用 Sumsub 第三方平台）。选择国家（China）和证件类型（身份证或护照）。填写真实姓名、出生日期、证件号码。上传证件正反面照片并完成活体人脸识别。Sumsub 审核通常 5-15 分钟，审核结果不由 Roogoo 人工决定。",
      actions: [
        "进入 Dashboard → Account 或 Verification，找到 KYC 认证入口，点击开始。",
        "选择国家：China（中国）。",
        "选择证件类型：身份证（ID Card）或护照（Passport）。",
        "按提示填写真实姓名（拼音，名在前姓在后）、出生日期、证件号码。",
        "上传证件正面照片：光线均匀，四角完整，文字清晰，无反光，关闭美颜。",
        "上传证件背面照片：同样要求清晰完整，无遮挡。",
        "完成人脸识别（活体检测）：脸部完整，光线充足，无帽子/口罩，按提示做动作。",
        "提交后等待 5-15 分钟，回 Dashboard 查看 KYC 状态更新。"
      ],
      checks: [
        "KYC 状态显示 Approved 或 Verified。",
        "证件四角完整，无反光，文字可读。",
        "人脸识别已通过。"
      ],
      warnings: [
        "Sumsub 是第三方平台，审核结果自动判断，失败时按提示原因重新操作，不要重复提交同一张照片。",
        "截图、翻拍、P 图处理的证件会直接被拒，必须用手机原相机拍证件实物。"
      ]
    },
    {
      n: "06",
      t: "证件拍摄标准（KYC 成败关键）",
      img: "/images/tutorials/roogoo/step-06.jpg",
      caption: "证件拍摄示范：实物原件，光线均匀，四角完整，无反光，关闭美颜滤镜。人脸识别时脸部完整露出，光线充足。",
      b: "证件拍摄质量直接决定 KYC 成败。使用原始实体证件，禁止复印件、截图、PS 处理。光线要均匀，避免反光和眩光。四角完整入镜，文字清晰可读。关闭手机美颜、滤镜和自动对焦虚化。人脸识别：脸部完整露出，无帽子/口罩/墨镜，光线充足。Sumsub 审核失败时按原因重新拍摄，不要重复提交同一张照片。",
      actions: [
        "准备原始实体证件，不要使用复印件、截图、照片的照片或任何 P 图处理版本。",
        "找自然光或均匀室内灯光环境，避免窗户直射造成反光或眩光。",
        "将证件放在深色背景上（如黑色桌面），四角完整入镜，不要有遮挡。",
        "关闭手机美颜、滤镜、自动 HDR 和人像模式（自动虚化会让证件文字模糊）。",
        "拍完后放大检查：证件号码、姓名、有效期等关键文字是否清晰可读。",
        "人脸识别时：找光线充足的环境，脸部完整，摘掉帽子/口罩/墨镜，距手机约 30-50 厘米。",
        "Sumsub 审核失败时，认真读失败原因，根据具体原因重新拍摄对应材料，不要随意猜测。"
      ],
      checks: [
        "证件原件，非复印件、截图或 P 图。",
        "四角完整，无遮挡，关键文字清晰可读。",
        "关闭美颜滤镜，光线均匀无反光。"
      ],
      warnings: [
        "美颜和滤镜是 KYC 失败的常见原因，拍摄前必须关闭所有图像增强功能。",
        "失败后不要重复提交同一张照片，Sumsub 会识别重复图片并直接拒绝。"
      ]
    },
    {
      n: "07",
      t: "申请卡片（首张免费）",
      img: "/images/tutorials/roogoo/step-07.jpg",
      caption: "开卡页截图：KYC 通过后 Cards → Apply Card，AI 订阅选尊享卡，日常消费选乐享卡，首张开卡费 $0。",
      b: "KYC 通过后，进入 Cards → Apply Card。根据用途选择卡片：AI 订阅（ChatGPT/Claude/Cursor）选尊享卡（Premier Card，Mastercard）；日常跨境消费选乐享卡（Enjoy Card，Visa）。首张开卡费 $0，后续每张 $4.99。确认首次最低充值金额（建议 $50），同意服务条款后提交，虚拟卡申请后即时生成。",
      actions: [
        "确认 KYC 状态已通过，进入 Cards → Apply Card。",
        "根据用途选择卡片类型：AI 订阅选尊享卡（紫色 Mastercard），日常消费选乐享卡（Visa）。",
        "确认卡组织（Mastercard 或 Visa）、发行地区和开卡费（首张 $0）。",
        "确认 Asset Account 中有足够余额用于后续 Top-up（建议 $50 以上）。",
        "阅读并同意服务条款，点击提交申请。",
        "等待虚拟卡生成，通常几秒内即时完成。",
        "进入 Cards 页面确认新卡已出现，状态显示正常。"
      ],
      checks: [
        "KYC 状态已通过（Approved/Verified）。",
        "选择的卡片类型与用途匹配（AI 订阅 → 尊享卡）。",
        "首张开卡费显示 $0，卡片已即时生成。"
      ],
      warnings: [
        "尊享卡（Mastercard）才能用于 AI 订阅，乐享卡（Visa）不适合订阅 ChatGPT。",
        "卡片申请后不能更改卡片类型，选错了只能重新申请（第二张起收 $4.99）。"
      ]
    },
    {
      n: "08",
      t: "从资金账户充值到卡片（Top-up）",
      img: "/images/tutorials/roogoo/step-08.jpg",
      caption: "Top-up 截图：充值进来的 USDT 先在 Asset Account，还需手动 Cards → 选卡片 → Top-up 才能消费，卡片余额低于 $2 会自动冻结。",
      b: "Roogoo 资金账户（Asset Account）和卡片余额（Card Balance）是分开的，充值进来的 USDT 先进资金账户，需要手动 Top-up 到卡片才能消费。路径：Cards → 选择目标卡片 → Top-up / 充值 → 来源选 Asset Account → 输入金额 → 确认 → 等待 1-5 分钟同步。消费前余额建议比订单额高 3-5%（覆盖手续费）。卡片余额低于 $2 会被自动冻结，需充至 $10 解冻。",
      actions: [
        "进入 Cards 页面，点击目标卡片，找到 Top-up / 充值入口。",
        "来源选择 Asset Account（资金账户），确认 Asset Account 余额足够。",
        "输入充值金额，查看 USDT 换算为美元的汇率，确认无误。",
        "点击确认，等待 1-5 分钟，刷新卡片页面查看 Card Balance 是否更新。",
        "消费前确认卡片余额比预计消费额高 3-5%，覆盖手续费（尊享/乐享卡 1%，无界卡 0.8%）。",
        "确保卡片余额不低于 $2，低于 $2 卡片会被自动冻结。",
        "如卡片已被冻结（余额归零），需充值至 $10 才能解冻。"
      ],
      checks: [
        "卡片 Card Balance 已更新，金额与 Top-up 金额一致。",
        "Card Balance 高于预计消费额的 103-105%。",
        "Card Balance 不低于 $2。"
      ],
      warnings: [
        "Asset Account 里的 USDT 不能直接消费，必须先 Top-up 到卡片，这是最容易忽略的一步。",
        "卡片余额低于 $2 会自动冻结，需充值到 $10 才能解冻，订阅前务必确认余额充足。"
      ]
    },
    {
      n: "09",
      t: "查看卡号并绑定支付宝",
      img: "/images/tutorials/roogoo/step-09.jpg",
      caption: "卡片详情截图：Cards → 点击卡片 → 查看卡号/CVV/有效期/英文姓名/账单地址，绑定支付宝时账单地址填美国地址。",
      b: "进入 Cards → 点击目标卡片 → 卡片详情，查看并记录：卡号（16 位）、CVV（3 位）、有效期（MM/YY）、持卡人英文姓名、账单地址（美国地址）。绑定支付宝：支付宝 → 我的 → 银行卡 → 添加银行卡 → 输入卡号，账单地址填卡片详情页的美国地址，城市+州+邮编缺一不可。无界卡（香港 Visa）额外支持微信香港钱包绑定；乐享卡暂不支持微信。绑定后做小额消费测试。",
      actions: [
        "进入 Cards → 点击目标卡片 → 卡片详情，解锁查看敏感信息。",
        "记录：16 位卡号、CVV（3 位）、有效期（MM/YY）、持卡人英文姓名、账单地址（美国地址）。",
        "打开支付宝 App → 我的 → 银行卡 → 右上角添加银行卡。",
        "输入 16 位卡号，填写有效期、CVV、持卡人英文姓名。",
        "账单地址填写卡片详情页显示的美国地址，格式：街道 + 城市 + 州 + 邮编（缺一不可）。",
        "绑定成功后做小额消费测试（<10 元），确认扣款正常。",
        "无界卡（香港 Visa）用户：可额外绑定微信香港钱包；乐享卡（Visa）暂不支持微信。"
      ],
      checks: [
        "支付宝显示 Roogoo 卡片已绑定成功。",
        "小额消费（<10 元）测试成功，Roogoo 卡片有扣款记录。",
        "账单地址使用了卡片详情页的美国地址，不是国内地址。"
      ],
      warnings: [
        "账单地址必须完整（街道+城市+州+邮编），填国内地址或格式不完整会导致绑卡失败。",
        "完整卡号加 CVV 等同于卡片本身，截图只保存给自己，不要发给任何人。"
      ]
    },
    {
      n: "10",
      t: "用尊享卡订阅 ChatGPT Plus",
      img: "/images/tutorials/roogoo/step-10.jpg",
      caption: "ChatGPT 订阅截图：必须用尊享卡（紫色 Mastercard）+ Clash TUN 模式美国住宅 IP，卡内余额需 > $22。",
      b: "订阅 ChatGPT Plus 必须用尊享卡（Premier Card，紫色 Mastercard），乐享卡和无界卡不适合。VPN 设置：Clash Verge Rev → 以管理员身份运行 → 设置 → 安装服务 → 开启 TUN 模式；节点选美国住宅 IP（洛杉矶或旧金山），TUN 模式是关键，普通全局代理不够。Chrome 无痕模式访问 chat.openai.com → Upgrade to Plus。账单地址填卡片详情页的美国地址，卡内余额 > $22，同一张卡只给一个账号订阅。",
      actions: [
        "确认使用尊享卡（Premier Card，紫色 Mastercard），不是乐享卡或无界卡。",
        "确认卡片 Card Balance > $22（订阅 $20 + 税费 + 手续费）。",
        "下载 Clash Verge Rev（Windows），以管理员身份运行。",
        "进入设置 → 安装服务（Install Service），等待显示「运行中」，再打开 TUN 模式开关。",
        "选择美国住宅 IP 节点（洛杉矶或旧金山），访问 whoer.net 确认显示美国住宅 IP，无 DNS 泄漏。",
        "打开 Chrome 无痕窗口（Ctrl+Shift+N），访问 chat.openai.com → Upgrade to Plus。",
        "填写尊享卡的卡号、有效期、CVV，账单地址填卡片详情页的美国地址。",
        "点击提交，等待扣款结果，检查 Roogoo 卡片交易记录确认扣款成功。"
      ],
      checks: [
        "whoer.net 显示美国住宅 IP，无 DNS 泄漏。",
        "Clash Verge Rev 以管理员运行，服务「运行中」，TUN 模式已开启。",
        "卡片为尊享卡（Mastercard），Card Balance > $22。",
        "ChatGPT 订阅成功，账户显示 Plus 状态。"
      ],
      warnings: [
        "普通全局代理（System Proxy）无法通过 Stripe 的 IP 检测，必须用 TUN 模式。",
        "一张尊享卡只用于一个 ChatGPT 账号，多账号共用同一张卡会触发 OpenAI 风控封号。"
      ]
    },
    {
      n: "11",
      t: "费用说明和隐藏坑点",
      img: "/images/tutorials/roogoo/step-11.jpg",
      caption: "费用明细截图：消费手续费 1%，非美元区跨境费 1.6%，退款手续费 2.5%，争议处理费 $50/笔。禁用商户包括 Uber、Wise、AWS、Azure 等。",
      b: "使用前必须了解费用结构和禁用商户。消费手续费：尊享卡/乐享卡 1%，无界卡 0.8%（$30 以下每笔加 $0.35）。跨境手续费：美元区 0%，非美元区 1.6%。退款手续费：2.5%（主动退款反而被扣，是大坑）。争议处理费：$50/笔（发起拒付直接收 $50）。禁用商户：Uber、Wise、AWS、Azure、Oracle Cloud、OnlyFans、Coinbase、加油站、在线赌博平台。",
      actions: [
        "记住消费手续费：尊享卡/乐享卡 1%，无界卡 0.8%（$30 以下每笔额外加 $0.35）。",
        "非美元区消费（如人民币、欧元区）额外收 1.6% 跨境手续费，美元区 0%。",
        "退款手续费 2.5%：主动申请退款会被扣 2.5% 手续费，退款前想清楚。",
        "争议处理费 $50/笔：发起信用卡拒付（Chargeback）直接收 $50，不到万不得已不要用。",
        "以下商户消费会被直接拒绝，不要尝试：Uber、Wise、AWS、Azure、Oracle Cloud、OnlyFans、Coinbase、加油站、在线赌博平台。",
        "确保卡片有足够余额覆盖手续费（消费额 × 101%-103%）。",
        "长期账户余额为零或不活跃可能导致账户强制注销。"
      ],
      checks: [
        "已了解消费手续费率（尊享/乐享 1%，无界 0.8%）。",
        "已了解退款手续费（2.5%）和争议处理费（$50）。",
        "已知晓禁用商户列表，不在禁用商户消费。"
      ],
      warnings: [
        "退款手续费 2.5% 是最容易踩的坑，主动退款不是免费的，退款前务必确认。",
        "发起拒付（Chargeback）直接收 $50 手续费，绝大多数情况下直接联系商户退款更合算。"
      ]
    },
    {
      n: "12",
      t: "卡片安全和日常维护",
      img: "/images/tutorials/roogoo/step-12.jpg",
      caption: "安全设置截图：Cards → 选卡片 → Freeze/Unfreeze 冻结解冻，订阅扣款日前确认余额，异常交易立即冻结并联系客服。",
      b: "冻结/解冻入口：Cards → 选择卡片 → Freeze/Unfreeze（24 小时内生效）。订阅服务扣款日前 24 小时确保余额充足。不要在 Roogoo 账户长期存放大额 USDT。余额 > $2 才能正常使用，建议保留 $2-5 缓冲。发现异常交易立即冻结卡片，联系客服：help@roogoo.com 或 Telegram @mrpayfi。",
      actions: [
        "了解并记住冻结/解冻入口：Cards → 选择卡片 → Freeze（冻结）/ Unfreeze（解冻）。",
        "订阅服务（如 ChatGPT Plus）扣款日前 24 小时，确认卡片余额充足（> 订阅额 × 103%）。",
        "不要在 Roogoo 账户长期存放大额 USDT，按需充值，降低平台风险。",
        "保持卡片余额高于 $2，余额归零会自动冻结，需充至 $10 解冻。",
        "建议保留 $2-5 缓冲余额，避免因小额手续费导致余额归零触发冻结。",
        "发现异常交易：立即进入 Cards → 卡片 → Freeze 冻结卡片，截图保存交易记录。",
        "联系 Roogoo 客服：发送邮件至 help@roogoo.com，或 Telegram 联系 @mrpayfi，提供交易截图。"
      ],
      checks: [
        "已知晓冻结/解冻卡片的操作路径。",
        "客服联系方式已保存（help@roogoo.com 或 Telegram @mrpayfi）。",
        "重要订阅服务扣款日期已记录，提前确认余额充足。"
      ],
      warnings: [
        "账户余额长期为零或长期不活跃可能触发强制注销，需定期使用。",
        "发现异常交易第一时间冻结卡片，不要等待观望，先冻结再排查。"
      ]
    },
    {
      n: "04",
      t: "完成 Sumsub KYC",
      img: "/images/tutorials/roogoo/step-04.jpg",
      caption: "KYC 截图：Roogoo 接入 Sumsub，审核结果不由 Roogoo 人工决定。",
      b: "Roogoo 开卡需要真实个人信息。官方强调年龄、唯一账户、真实证件和真人扫脸。",
      actions: [
        "进入 Account / Verification。",
        "选择国家和证件类型。",
        "填写真实姓名、生日和证件信息。",
        "上传证件正反面或护照资料页。",
        "按提示做人脸识别。",
        "提交后等待审核。",
        "失败时按 Sumsub 返回原因重新提交。"
      ],
      checks: [
        "年龄在 18 到 65 岁范围。",
        "一人只做一个认证账户。",
        "证件和真人一致。"
      ],
      warnings: [
        "PS、截图、复印件、翻拍件都容易失败。",
        "Sumsub 审核失败需要按原因修正，不是多点几次就能过。"
      ]
    },
    {
      n: "05",
      t: "按标准拍摄证件和自拍",
      img: "/images/tutorials/roogoo/step-05.jpg",
      caption: "证件上传截图：清晰、原件、无反光。",
      b: "很多博主教程会把这一步单独拎出来，因为证件拍摄质量直接决定 KYC 成败。",
      actions: [
        "使用证件原件，不用复印件和屏幕照片。",
        "找自然光或均匀灯光。",
        "四角完整入镜，文字清晰。",
        "关闭美颜、滤镜、磨皮和自动虚化。",
        "自拍时脸和证件不要遮挡。",
        "Android 用户提前开启浏览器相机和相册权限。"
      ],
      checks: [
        "证件文字能放大看清。",
        "没有反光遮住姓名或证件号。",
        "自拍没有口罩、帽子、墨镜遮挡。"
      ],
      warnings: [
        "同一张失败图反复提交没有意义。",
        "KYC 截图只保留给自己核对，不要发到公开聊天里。"
      ]
    },
    {
      n: "06",
      t: "申请 Roogoo Card",
      img: "/images/tutorials/roogoo/step-06.jpg",
      caption: "开卡页截图：准备开卡费和首次卡片金额。",
      b: "开卡前要确认卡费、首次卡片金额和卡片类型。Roogoo 是资产账户扣费、卡片法币消费的模式。",
      actions: [
        "进入 Cards / Apply Card。",
        "选择要开的卡片类型。",
        "确认开卡费，一般在 16.6 到 19.9 USD 区间，优惠以页面为准。",
        "确认首次卡片金额，一般建议 50 USD。",
        "填写卡片资料和持卡人英文名。",
        "提交申请，等待卡片生成。",
        "开通后进入卡片管理页面。"
      ],
      checks: [
        "Asset Account 余额足够。",
        "卡片资料填写无误。",
        "卡片状态已生成。"
      ],
      warnings: [
        "开卡费和首充金额会随活动变化。",
        "资料提交后通常不能随意改，提交前先核对英文名和证件号。"
      ]
    },
    {
      n: "07",
      t: "从资金账户转入卡片余额",
      img: "/images/tutorials/roogoo/step-07.jpg",
      caption: "Top-up 截图：Asset Account 转 Card Balance。",
      b: "Roogoo 卡片余额和资金账户隔离。充值到 Roogoo 后，还要把钱 top-up 到具体卡片。",
      actions: [
        "进入 Card 管理。",
        "选择目标卡片。",
        "点击 Top-up。",
        "选择从 Asset Account 转入。",
        "输入要转入卡片的 USD 金额。",
        "确认 USDT 换算和当前费用。",
        "等待 1 到 5 分钟同步。"
      ],
      checks: [
        "Card Balance 增加。",
        "Asset Account 对应减少。",
        "转入记录可查。"
      ],
      warnings: [
        "资金在 Asset Account 里不能直接刷卡。",
        "消费前余额最好比订单高 3% 到 5%。"
      ]
    },
    {
      n: "08",
      t: "查看卡号并绑定第三方支付",
      img: "/images/tutorials/roogoo/step-08.jpg",
      caption: "卡片详情截图：复制卡号、CVV、有效期和英文名。",
      b: "Roogoo 官方以支付宝、微信等第三方支付举例，但实际支持列表会随卡段和地区变化，要看 App 当前提示。",
      actions: [
        "进入卡片详情。",
        "查看卡号、CVV、有效期和持卡人英文名。",
        "绑定支付宝、PayPal、Apple Pay 或 Google Pay。",
        "微信是否支持以 Roogoo App 当前支持列表为准。",
        "绑定后先用小额订单验证。",
        "不要把卡片信息截图发给别人。"
      ],
      checks: [
        "第三方支付显示绑定成功。",
        "小额消费有交易记录。",
        "卡片通知正常。"
      ],
      warnings: [
        "查看卡号时尽量避开录屏、直播和公共设备。",
        "同一卡不要一次绑定太多账号，先确认一个平台能稳定扣款。"
      ]
    },
    {
      n: "09",
      t: "订阅扣款和用卡维护",
      img: "/images/tutorials/roogoo/step-09.jpg",
      caption: "管理页截图：限额、冻结和余额预警都在这里。",
      b: "Roogoo 适合订阅和跨境消费，但长期使用的关键是余额、失败次数和商户扣款记录。",
      actions: [
        "设置余额预警。",
        "设置单日限额。",
        "订阅扣款日前 24 小时保证余额充足。",
        "消费后保留 2 到 5 USD，不要让余额归零。",
        "不想续费时去商户后台取消，不要靠余额不足拒付。",
        "不用时冻结卡片。",
        "发现异常交易立即锁卡并联系客服。"
      ],
      checks: [
        "余额预警已设置。",
        "知道冻结/启用入口。",
        "订阅商户后台能找到取消入口。"
      ],
      warnings: [
        "反复失败扣款会触发冻结或销卡。",
        "非美元区消费可能有跨境费或汇率损耗。"
      ]
    }
  ],
  "kraken-card": [
    {
      n: "01",
      t: "确认开卡资格（英国/EEA），下载独立 Krak App",
      img: "/images/tutorials/kraken-card/step-01.jpg",
      caption: "Krak App 入口：Krak 是独立于 Kraken Pro 交易所的单独 App，iOS 搜索「Krak: Money App & Card」，Android 搜索「Krak: Spend, Send & Grow」。",
      b: "Krak Card 仅限英国（UK）和 EEA 31 个国家居民申请，美国不支持。Krak App 是独立于 Kraken Pro 交易所的单独应用，两个 App 不是同一个。iOS：App Store 搜索「Krak: Money App & Card」（开发者 Payward，App ID: 6738051700）。Android：Google Play 搜索「Krak: Spend, Send & Grow」（包名: com.kraken.pay.app）。",
      actions: [
        "确认居住地在支持国家内：英国、德国、法国、西班牙、意大利、荷兰、比利时、奥地利等 EEA 国家。",
        "iOS 用户：App Store 搜索「Krak: Money App & Card」，确认开发者是 Payward，App ID: 6738051700。",
        "Android 用户：Google Play 搜索「Krak: Spend, Send & Grow」，包名 com.kraken.pay.app。",
        "安装后打开 Krak App（不是 Kraken Pro 交易所 App）。",
        "如已有 Kraken 账户可用同一邮箱登录；没有则点 Create account 新注册。",
        "确认 App 首页显示 Everyday account 入口，不是交易图表界面。"
      ],
      checks: [
        "下载的是 Krak App，不是 Kraken Pro。",
        "App 首页有 Everyday account 入口。",
        "居住国在支持列表内。"
      ],
      warnings: [
        "Krak App 和 Kraken Pro 是两个不同 App，开卡必须用 Krak App，不要搞混。",
        "不在支持国家居住的用户无法申请卡片，申请会被直接拒绝。"
      ]
    },
    {
      n: "02",
      t: "完成 KYC（证件 + 地址证明）",
      img: "/images/tutorials/kraken-card/step-02.jpg",
      caption: "KYC 截图：上传护照或政府身份证，再上传 3 个月内地址证明（银行账单、水电费账单等）。",
      b: "Krak Card 需要两级 KYC：身份证件（护照或政府颁发身份证）+ 地址证明（3 个月内）。地址证明可用银行月结单、水电费账单、政府信件或租约。证件上的姓名和地址必须与地址证明完全一致。",
      actions: [
        "进入 Krak App → Profile / Account → Identity Verification（KYC）。",
        "选择证件类型：护照（推荐）或政府颁发身份证。",
        "拍摄或上传证件正面（护照信息页），按提示完成人脸识别（自拍）。",
        "上传地址证明（3 个月内）：银行月结单、水电费账单、政府信件或租约均可。",
        "确认地址证明上的姓名和地址与证件完全一致。",
        "提交后等待审核，通常几分钟到数小时内完成。"
      ],
      checks: [
        "KYC 状态变为 Verified。",
        "地址证明在 3 个月内，姓名地址与证件一致。",
        "App 首页 Everyday account 正常可用。"
      ],
      warnings: [
        "地址证明超过 3 个月会被拒，请准备最新账单。",
        "证件照片模糊或四角不完整会导致审核失败，需重新拍摄。"
      ]
    },
    {
      n: "03",
      t: "查看 Everyday Account（UK Sort Code / EEA IBAN）",
      img: "/images/tutorials/kraken-card/step-03.jpg",
      caption: "账户详情：UK 用户获得真实英国 Sort Code + 账号（Faster Payments）；EEA 用户获得德国 IBAN（SEPA）。",
      b: "KYC 通过后 Krak 自动创建 Everyday Account。英国用户获得真实英国 Sort Code 和账号，支持 Faster Payments 入账（通常秒到）。EEA 用户获得德国 IBAN，支持 SEPA 入账（1-2 工作日）。这是 Krak Card 的扣款账户。",
      actions: [
        "进入 Krak App 首页，点击 Everyday account。",
        "UK 用户：查看并记录 Sort Code（6 位）和 Account Number（8 位）。",
        "EEA 用户：查看并记录德国 IBAN（DE 开头），用于 SEPA 转账入金。",
        "确认账户货币：UK 默认 GBP，EEA 默认 EUR。",
        "在自己的银行 App 中将 Krak 账户添加为收款人，方便后续转账。"
      ],
      checks: [
        "UK：Sort Code 和 Account Number 已记录。",
        "EEA：IBAN 已记录，确认是 DE 开头的德国 IBAN。",
        "账户状态显示正常可用。"
      ],
      warnings: [
        "EEA 用户的 IBAN 是德国 IBAN（DE 开头），即使你在其他 EEA 国家居住也是如此，属正常现象。",
        "Everyday Account 里的资金是普通法币，不是加密资产。"
      ]
    },
    {
      n: "04",
      t: "向 Everyday Account 存款",
      img: "/images/tutorials/kraken-card/step-04.jpg",
      caption: "存款截图：UK 银行转账到 Sort Code/账号（Faster Payments 秒到）；EEA 发 SEPA 到 IBAN（1-2 工作日）。",
      b: "三种存款方式：①UK 银行 Faster Payments（Sort Code + Account Number，通常秒到）；②EEA SEPA 转账（IBAN，1-2 工作日）；③Kraken 账户划转（即时）。存款后不需要额外激活，直接可以消费。",
      actions: [
        "UK：打开自己的银行 App，发起 Faster Payments，填入 Sort Code 和 Account Number，备注填自己姓名。",
        "EEA：在银行发起 SEPA 转账，收款 IBAN 填 Krak IBAN，收款人姓名填自己全名（必须与 KYC 一致）。",
        "Kraken 划转：Krak App 内选 Transfer from Kraken，选资产和金额，即时到账。",
        "存款后在 Everyday Account 页面确认余额已更新。",
        "建议先小额（£/€10）测试，确认路径无误再大额入金。"
      ],
      checks: [
        "Everyday Account 余额已更新，与存款金额一致。",
        "入金路径确认（UK 用 Sort Code，EEA 用 IBAN）。"
      ],
      warnings: [
        "EEA SEPA 转账收款人姓名必须与 KYC 姓名完全一致，姓名不符可能被退款。",
        "从加密交易所充值法币手续费可能较高，优先用银行直接转账。"
      ]
    },
    {
      n: "05",
      t: "创建虚拟卡",
      img: "/images/tutorials/kraken-card/step-05.jpg",
      caption: "开卡路径：首页 → Everyday account（中间）→ 右上角卡片图标 → Coral 或 Black → 接受 ToS → Continue。",
      b: "创建路径：Krak App 首页 → 点击中间的 Everyday account → 右上角 card icon → 弹出 Krak Card 说明 → 选颜色（Coral 或 Black，仅外观差异）→ 接受 ToS → Continue。虚拟卡即时生成，马上可用于线上支付。",
      actions: [
        "打开 Krak App，点击首页中间的 Everyday account。",
        "点击右上角 card icon（卡片图标）。",
        "阅读弹出的 Krak Card 介绍说明。",
        "选择卡面颜色：Coral（珊瑚色）或 Black（黑色），仅外观差异，功能完全相同。",
        "阅读并接受持卡人服务条款（Terms of Service）。",
        "点击 Continue，等待几秒，虚拟卡即时生成。",
        "进入 Card 页面确认卡片状态正常，能打开卡片详情。"
      ],
      checks: [
        "Card 页面出现新虚拟卡，状态正常。",
        "能进入卡片详情页。",
        "没有显示「暂不可用」或「区域限制」提示。"
      ],
      warnings: [
        "KYC 未完全审核通过时无法创建卡片，先确认 KYC 状态为 Verified。",
        "App 版本过旧可能没有卡片创建入口，先更新到最新版本。"
      ]
    },
    {
      n: "06",
      t: "查看卡号和 PIN，了解首次激活要求",
      img: "/images/tutorials/kraken-card/step-06.jpg",
      caption: "卡号查看：Card → Show card details，记录 16 位卡号、CVV、有效期、账单地址。实体卡首次必须插芯片 + 输 PIN。",
      b: "Card 页面点击 Show card details 或解锁查看完整卡号（16 位）、CVV（3 位）、有效期（MM/YY）和账单地址。PIN：Card settings → Show PIN。实体卡重要提示：收到后必须先在 POS 机插芯片 + 输 PIN 进行一次接触式支付，才能使用 NFC 非接触支付。虚拟卡无此限制，可直接线上使用。",
      actions: [
        "进入 Krak App → Card 页面，点击 Show card details，通过生物识别或 PIN 解锁。",
        "记录：16 位卡号、CVV（3 位）、有效期（MM/YY）。",
        "记录账单地址（Billing Address），用于线上绑卡表单。",
        "查看 PIN 码：Card settings → Show PIN（首次使用实体卡前必须知道 PIN）。",
        "实体卡使用前：先在支持芯片的 POS 机插卡 + 输 PIN，哪怕消费 £/€1 也算激活。",
        "完成插芯片消费后，NFC 非接触支付才能正常使用。",
        "虚拟卡可直接用于线上支付，无需特别激活步骤。"
      ],
      checks: [
        "卡号、CVV、有效期已记录。",
        "账单地址已知，用于填写线上支付表单。",
        "实体卡（如有）已完成首次插芯片 + PIN 激活。"
      ],
      warnings: [
        "实体卡不做插芯片 + PIN 操作，NFC 支付会被拒绝——这是用户最常踩的坑。",
        "卡号 + CVV 等同于卡片本身，截图请安全保管，不要发给任何人。"
      ]
    },
    {
      n: "07",
      t: "绑定 Apple Pay / Google Pay",
      img: "/images/tutorials/kraken-card/step-07.jpg",
      caption: "钱包绑定：Apple Pay 正常添加；Google Pay 必须手动输入卡号，不支持自动关联。",
      b: "Apple Pay：卡片详情页点击 Add to Apple Wallet，按提示完成设备验证即可。Google Pay：无法自动关联，必须手动输入。路径：Google Wallet → 右下角 + → Payment card → Enter details manually → 输入卡号/有效期/CVV/账单地址 → 完成短信验证。",
      actions: [
        "Apple Pay：Card 页面 → Add to Apple Wallet → 按提示完成验证 → Apple Wallet 中确认卡片出现。",
        "Google Pay（必须手动）：打开 Google Wallet → 右下角 + 号 → Payment card。",
        "选择 Enter details manually（手动输入），不要选扫描或自动导入。",
        "输入 16 位卡号、有效期、CVV、持卡人姓名、账单地址。",
        "完成短信或邮件验证码验证。",
        "验证成功后在 Google Wallet 中确认 Krak Card 已出现。",
        "做一笔小额 tap-to-pay 测试确认成功（实体卡需先完成插芯片 + PIN 激活）。"
      ],
      checks: [
        "Apple Pay 或 Google Pay 中显示 Krak Card。",
        "小额 tap-to-pay 测试成功。"
      ],
      warnings: [
        "Google Pay 不支持 Krak Card 自动关联，必须手动输入卡号，否则添加失败。",
        "实体卡未完成插芯片激活前，NFC tap-to-pay 会被拒绝。"
      ]
    },
    {
      n: "08",
      t: "管理消费资金来源和 Krak Vaults（UK 专属）",
      img: "/images/tutorials/kraken-card/step-08.jpg",
      caption: "资金管理：消费优先扣 Everyday Account GBP/EUR；UK 用户可开启 Krak Vaults 年化 5.5-10%+（EEA 不可用）。",
      b: "Krak Card 消费默认从 Everyday Account 的 GBP（UK）或 EUR（EEA）扣款。也可设置从加密资产自动兑换消费（触发资本利得税事件）。Krak Vaults（仅 UK 用户）：GBP 存入 Vaults 赚取年化 5.5-10%+，消费时自动取出，不影响日常使用。EEA 用户目前无 Vaults 功能。",
      actions: [
        "确认 Everyday Account 有足够 GBP（UK）或 EUR（EEA）用于日常消费。",
        "UK 用户：在 Krak App 找到 Vaults，将 Everyday Account GBP 存入，获取 5.5-10%+ APY。",
        "Vaults 存款不影响消费，消费时系统自动从 Vaults 取出，无需手动操作。",
        "如需用加密资产消费：进入 Card spending settings 设置消费资产顺序（注意每笔触发税务事件）。",
        "建议优先用 GBP/EUR 消费，避免频繁触发加密资产资本利得记录。"
      ],
      checks: [
        "Everyday Account 余额充足。",
        "UK 用户已了解 Vaults 功能（可选开启）。",
        "消费资金来源设置符合预期。"
      ],
      warnings: [
        "Krak Vaults 仅限 UK 用户，EEA 用户无法使用该功能。",
        "用加密资产自动消费会触发资本利得税事件，根据所在国税法可能需要申报。"
      ]
    },
    {
      n: "09",
      t: "了解返现规则（新用户 30 天 2% 欢迎期）",
      img: "/images/tutorials/kraken-card/step-09.jpg",
      caption: "返现规则：新用户前 30 天自动 2%；之后按 30 天平均余额分档（2026 年 3 月 31 日起生效）。",
      b: "新用户注册后前 30 天自动获得 2% 全品类消费返现，无需操作。30 天后按 30 天滚动平均余额分档（2026 年 3 月 31 日起）：< £/€200 = 0%；≥ £/€200 = 0.5%；≥ £/€1000 = 1%；≥ £/€10000 = 1.5%；≥ £/€50000 = 2%。返现以加密资产形式发放，商户确认交易后 1-3 天从 Pending 变为到账。",
      actions: [
        "注册后 30 天内所有消费自动 2% 返现，无需任何设置，好好利用欢迎期。",
        "30 天欢迎期结束后，维持目标档位余额：0.5% 需 ≥ £/€200；1% 需 ≥ £/€1000。",
        "返现查看：Card → Rewards / Cashback，可见 Pending 和已到账记录。",
        "返现以加密资产（BTC 或平台代币）形式发放，商户 finalize 后 1-3 天到账。",
        "UK 用户可将返现存入 Vaults 继续赚取 APY 复利增长。"
      ],
      checks: [
        "注册 30 天内消费已显示 2% 返现 Pending 记录。",
        "已了解 30 天后按余额分档的规则。",
        "Rewards 页面可以查看返现状态。"
      ],
      warnings: [
        "返现不是即时到账，必须等商户 finalize transaction 后才从 Pending 变为正式到账。",
        "2026 年 3 月 31 日起返现已改为余额分档，低余额用户（< £/€200）等于 0% 返现。"
      ]
    },
    {
      n: "10",
      t: "申请实体卡（可选，邮寄 14-30 工作日）",
      img: "/images/tutorials/kraken-card/step-10.jpg",
      caption: "实体卡申请：Card 页面 → Get physical card，填写收货地址，官方 14 工作日，实际可能 30 天以上。",
      b: "虚拟卡已足够线上使用。需要线下实体消费时可申请实体卡，免费邮寄。官方说 14 工作日到达，实际用户反馈有时超过 30 天。收到卡后必须先插芯片 + 输 PIN 完成一次接触式支付，之后才能使用 NFC 非接触支付。",
      actions: [
        "Card 页面 → Get physical card（或 Yes, get the physical card）。",
        "填写 EEA/UK 收货地址，确认与 KYC 地址一致。",
        "提交申请，等待邮寄。官方说 14 工作日，实际可能 30+ 天。",
        "收到卡后首次激活：在支持芯片的 POS 机插卡，输入 PIN 完成一笔消费（哪怕 £/€1）。",
        "完成插芯片消费后，NFC tap-to-pay 才能正常使用。",
        "实体卡添加到 Google Pay 时仍需手动输入卡号（同虚拟卡步骤）。"
      ],
      checks: [
        "邮寄地址正确无误，在 EEA/UK 境内。",
        "收到卡后已完成首次插芯片 + PIN 激活。",
        "NFC 支付可以正常使用。"
      ],
      warnings: [
        "跳过插芯片 + PIN 这一步会导致所有 NFC 支付被拒，务必先完成激活消费。",
        "卡片丢失时立即在 Krak App 中冻结（Card → Freeze）。"
      ]
    }
  ]
};

// ── 入金内容（与开卡步骤分开展示）───────────────────────────────
(function splitFundingFromTutorials() {
  const pad = n => String(n + 1).padStart(2, "0");
  const renumber = list => list.forEach((step, i) => { step.n = pad(i); });
  const moveRules = {
    "bybit-card": [/入金充值/],
    "safepal-card": [/准备 Arbitrum ETH/, /充值、消费/],
    "pokepay": [/充值 USDT 到钱包/],
    "roogoo": [/充值 USDT 到资金账户/, /从资金账户转入卡片余额/],
    "kraken-card": [/设置消费资产顺序/],
  };

  window.FUNDING_GUIDES = {};

  Object.entries(moveRules).forEach(([slug, rules]) => {
    const kept = [];
    const moved = [];
    (window.TUTORIALS[slug] || []).forEach(step => {
      const title = step.t || "";
      if (rules.some(rule => rule.test(title))) {
        moved.push({ ...step });
      } else {
        kept.push(step);
      }
    });
    renumber(kept);
    window.TUTORIALS[slug] = kept;
    if (moved.length) window.FUNDING_GUIDES[slug] = moved;
  });

  const euSteps = window.TUTORIALS["bybit-eu-card"] || [];
  const euFundingIndex = euSteps.findIndex(step => /充值 Funding Account/.test(step.t || ""));
  if (euFundingIndex >= 0) {
    const original = euSteps[euFundingIndex];
    window.FUNDING_GUIDES["bybit-eu-card"] = [{
      t: "Funding Account 入金和扣款顺序",
      img: original.img,
      caption: "Funding Account：开卡通过后再处理余额。",
      b: "Bybit EU 卡片通过后，再给 Funding Account 留 EUR 或支持的稳定币。入金和消费资产顺序单独看，不放在开卡步骤里。",
      actions: [
        "进入 Assets / Funding Account。",
        "准备 EUR 或页面支持的稳定币。",
        "如果从交易所入金，币种和网络按充值页显示选择。",
        "检查 crypto liquidation order，把准备用来消费的资产放在前面。",
        "确认 0.9% crypto conversion fee 和外汇费用规则。",
        "先小额线上支付，再绑定长期订阅。"
      ],
      checks: [
        "Funding Account 有可用余额。",
        "消费资产顺序已按你的偏好调整。",
        "第一笔小额订单能正常扣款。"
      ],
      warnings: [
        "余额在 Spot Account 不一定能被卡片直接扣。",
        "用波动资产消费会有价格波动和税务记录。"
      ]
    }];
    euSteps[euFundingIndex] = {
      ...original,
      t: "启用虚拟卡并检查卡片设置",
      caption: "虚拟卡通过后进入卡片详情。",
      b: "审核通过后进入 Card Dashboard，先把虚拟卡状态、卡号信息和安全设置确认好。",
      actions: [
        "审核通过后进入 Card Dashboard。",
        "查看虚拟卡号、有效期、CVV 和账单地址。",
        "确认卡片状态是 Active。",
        "打开交易通知。",
        "确认 3DS / OTP 验证方式可用。"
      ],
      checks: [
        "卡片状态 Active。",
        "卡号、有效期、CVV 能正常显示。",
        "交易通知和验证方式可用。"
      ],
      warnings: [
        "查看卡号时不要录屏或公开截图。"
      ]
    };
    renumber(euSteps);
  }
})();

// ── 礼品卡详情数据 ────────────────────────────────────────
(function strengthenOtherCardTutorials() {
  if (window.__CARD_TUTORIALS_STRENGTHENED__) return;
  window.__CARD_TUTORIALS_STRENGTHENED__ = true;

  const renumber = slug => (window.TUTORIALS[slug] || []).forEach((step, i) => { step.n = String(i + 1).padStart(2, "0"); });
  const addAfter = (slug, anchor, step) => {
    const steps = window.TUTORIALS[slug] || [];
    if (steps.some(item => item.t === step.t)) return;
    const index = steps.findIndex(item => (item.t || "").includes(anchor));
    steps.splice(index >= 0 ? index + 1 : steps.length, 0, step);
    renumber(slug);
  };

  addAfter("bybit-eu-card", "独立账户", {
    t: "账户安全和通知先做完",
    img: "/images/tutorials/bybit-card/step-02.jpg",
    caption: "安全设置截图：邮箱、手机号、2FA 和设备验证会反复用到。",
    b: "欧洲卡查看卡号、绑定钱包、实体卡激活都会触发安全验证。先把安全项做完，后面不会卡在验证码环节。",
    actions: [
      "进入 Profile / Security。",
      "确认邮箱已经验证。",
      "确认手机号已经验证。",
      "绑定 Google Authenticator 或平台要求的 2FA。",
      "保存 2FA 恢复码。",
      "打开登录通知和交易通知。",
      "检查登录设备列表，移除不认识的设备。"
    ],
    checks: [
      "邮箱能收 Bybit EU 邮件。",
      "手机号能收验证码。",
      "2FA 动态码可用。"
    ],
    warnings: [
      "安全项没做完时，Card 页面可能不让继续。",
      "换手机后要先恢复 2FA。"
    ]
  });

  addAfter("bybit-eu-card", "Get Your Card", {
    t: "国家选择和账单地址逐项核对",
    img: "/images/tutorials/bybit-card/step-04.jpg",
    caption: "国家和地址截图：德国选 Germany，法国选 France，账单地址跟材料一致。",
    b: "进入申请页后，国家和账单地址不要写模糊。德国地址选 Germany / Deutschland，法国地址选 France，其它欧盟地址按实际居住国选。",
    actions: [
      "在 Country of Residence 页面打开国家列表。",
      "德国地址选择 Germany / Deutschland。",
      "法国地址选择 France。",
      "西班牙、意大利、荷兰、奥地利、比利时、爱尔兰按实际国家选择。",
      "确认城市、邮编、街道和地址证明一致。",
      "核对手机号和邮箱。",
      "阅读费用和持卡人条款后继续。"
    ],
    checks: [
      "国家字段和地址证明一致。",
      "账单地址字段完整。",
      "页面能进入提交或审核状态。"
    ],
    warnings: [
      "国家选错会导致地址证明对不上。",
      "德国材料不要和法国路线混用。"
    ]
  });

  addAfter("bybit-eu-card", "等待审核", {
    t: "补件入口和邮箱通知单独检查",
    img: "/images/tutorials/bybit-card/step-05.jpg",
    caption: "审核状态截图：Need more information 出现时先点进去看原因。",
    b: "提交后不要只等页面变化。Card 页面、身份认证页和邮箱都要看，出现补件时按原因重新上传。",
    actions: [
      "回到 Card 页面查看申请状态。",
      "如果显示 Under Review，先等待审核。",
      "如果显示 Need more information，点进去查看缺什么。",
      "按要求重新上传证件或地址证明。",
      "检查邮箱是否有 Bybit EU 补件邮件。",
      "补件后回页面确认已提交。",
      "审核通过后再进入 Card Dashboard。"
    ],
    checks: [
      "没有未处理补件。",
      "邮箱没有待处理邮件。",
      "申请状态最终变为 Approved 或 Active。"
    ],
    warnings: [
      "同一张模糊文件重复上传没有意义。",
      "审核期间不要频繁修改个人资料。"
    ]
  });

  addAfter("safepal-card", "创建 Fiat24 账户", {
    t: "准备 ReadID、护照和 NFC",
    img: "/images/tutorials/safepal-card/step-04.jpg",
    caption: "ReadID 截图：护照、NFC、相机权限和人脸动作先准备。",
    b: "Fiat24 开户常见路径会要求护照和 ReadID。先准备护照原件，手机要能使用相机和 NFC。",
    actions: [
      "准备护照原件。",
      "确认手机 NFC 可用。",
      "按页面提示安装或打开 ReadID。",
      "给 SafePal 和 ReadID 相机权限。",
      "给 ReadID NFC 权限。",
      "找光线均匀的位置。",
      "取下护照保护套，保持证件页面平整。"
    ],
    checks: [
      "护照信息页清晰。",
      "手机能读取 NFC。",
      "ReadID 可以打开相机。"
    ],
    warnings: [
      "护照反光会导致识别失败。",
      "NFC 读不到时换手机背部位置慢慢贴近。"
    ]
  });

  addAfter("safepal-card", "签名并确认开户声明", {
    t: "填写个人资料和地址资料",
    img: "/images/tutorials/safepal-card/step-06.jpg",
    caption: "资料页截图：姓名、生日、地址、邮箱和手机号逐项确认。",
    b: "证件验证后继续补齐个人资料。自动识别出来的信息也要逐项看一遍，避免姓名或地址拼写不一致。",
    actions: [
      "核对英文姓名。",
      "核对出生日期。",
      "填写居住地址。",
      "填写城市、国家和邮编。",
      "填写邮箱。",
      "填写手机号。",
      "确认条款和隐私声明。",
      "提交注册资料。"
    ],
    checks: [
      "姓名和护照一致。",
      "地址字段完整。",
      "联系方式能接收通知。"
    ],
    warnings: [
      "自动识别出来的信息也要人工看一遍。",
      "地址拼写不完整会影响后续审核。"
    ]
  });

  addAfter("safepal-card", "查看完整卡号", {
    t: "绑定支付工具并做小额验证",
    img: "/images/tutorials/safepal-card/step-09.jpg",
    caption: "绑卡截图：PayPal、Apple Pay、Google Pay 或 Samsung Pay 先小额验证。",
    b: "卡片详情确认后，再绑定常用支付工具。先用小额订单验证卡号、3DS、通知和账单信息都能跑通。",
    actions: [
      "打开 PayPal、Apple Pay、Google Pay、Samsung Pay 或目标订阅平台。",
      "选择添加银行卡。",
      "输入卡号、有效期、CVV。",
      "填写账单地址。",
      "按页面提示完成 3DS 或短信验证。",
      "先做一笔小额订单。",
      "回 SafePal Bank 查看交易记录。"
    ],
    checks: [
      "支付工具显示绑卡成功。",
      "小额订单通过。",
      "交易通知能收到。"
    ],
    warnings: [
      "连续失败时先停下来查原因。",
      "长期订阅前先确认小额订单稳定。"
    ]
  });

  addAfter("pokepay", "注册 PokePay 账户", {
    t: "账户安全和支付密码",
    img: "/images/tutorials/pokepay/step-01.jpg",
    caption: "安全设置截图：邮箱、手机号、支付密码和通知先设置。",
    b: "PokePay 后面查看卡号、提交申请、确认扣费都会用到安全验证。注册后先把基础安全做好。",
    actions: [
      "进入账户中心。",
      "绑定邮箱。",
      "绑定手机号。",
      "设置支付密码或安全密码。",
      "打开登录通知。",
      "打开交易通知。",
      "确认可以重新登录账号。"
    ],
    checks: [
      "邮箱或手机号已验证。",
      "支付密码已设置。",
      "通知可以收到。"
    ],
    warnings: [
      "支付密码不要和登录密码相同。",
      "验证码过期就重新发送。"
    ]
  });

  addAfter("pokepay", "完成 KYC", {
    t: "KYC 补件和失败原因处理",
    img: "/images/tutorials/pokepay/step-02.jpg",
    caption: "审核状态截图：失败后先看原因，再重拍对应材料。",
    b: "KYC 提交后要回到账户中心看状态。失败时不要重复提交同一张照片，先按失败原因处理。",
    actions: [
      "回到账户中心查看 KYC 状态。",
      "如果显示 Pending，等待审核。",
      "如果显示 Failed，点开失败原因。",
      "姓名不一致就重新核对证件姓名。",
      "照片不清楚就重新拍证件。",
      "人脸失败就换光线重新做动作。",
      "补件提交后再次确认状态。"
    ],
    checks: [
      "KYC 显示通过。",
      "没有未处理补件。",
      "Card 页面可以进入。"
    ],
    warnings: [
      "不要用截图、扫描件或修图照片。",
      "证件姓名和填写姓名必须一致。"
    ]
  });

  addAfter("pokepay", "激活并查看卡片详情", {
    t: "卡片限额、冻结和通知",
    img: "/images/tutorials/pokepay/step-05.jpg",
    caption: "卡片设置截图：先找限额、冻结、通知和交易记录。",
    b: "卡片激活后不要马上长期使用，先把卡片管理入口摸清楚，后面排查失败交易会用到。",
    actions: [
      "进入 Card Settings。",
      "查看单笔限额。",
      "查看每日或每月限额。",
      "找到 Freeze / Unfreeze。",
      "打开交易通知。",
      "找到交易记录。",
      "保存客服入口。"
    ],
    checks: [
      "知道冻结入口。",
      "知道限额入口。",
      "知道交易记录入口。"
    ],
    warnings: [
      "不用时可以临时冻结。",
      "连续失败交易先停下来排查。"
    ]
  });

  addAfter("roogoo", "通过邀请链接注册", {
    t: "账户安全和 PWA 固定",
    img: "/images/tutorials/roogoo/step-02.jpg",
    caption: "PWA 设置截图：添加到主屏幕，设置支付密码和通知。",
    b: "Roogoo 是 PWA 页面，登录状态和浏览器有关。注册后先固定入口、设置安全项，再进入 KYC。",
    actions: [
      "把 Roogoo 添加到手机主屏幕。",
      "确认浏览器允许通知。",
      "进入账户安全设置。",
      "设置支付密码。",
      "确认邮箱或手机号可用。",
      "找到客服入口。",
      "重新打开 PWA 确认可登录。"
    ],
    checks: [
      "主屏幕能打开 Roogoo。",
      "支付密码可用。",
      "客服入口能找到。"
    ],
    warnings: [
      "不要清掉保存登录状态的浏览器数据。",
      "换浏览器后可能需要重新登录。"
    ]
  });

  addAfter("roogoo", "按标准拍摄证件", {
    t: "Sumsub 状态和补件处理",
    img: "/images/tutorials/roogoo/step-05.jpg",
    caption: "审核状态截图：失败后按 Sumsub 原因重新拍对应材料。",
    b: "Sumsub 审核结果出来后要回 Dashboard 看状态。失败时先读原因，再重新拍对应材料。",
    actions: [
      "回 Dashboard 查看 KYC 状态。",
      "如果显示 Pending，等待审核。",
      "如果失败，打开失败原因。",
      "证件模糊就重新拍证件。",
      "人脸失败就换光线重做自拍。",
      "浏览器相机失败就换 Chrome 或换手机扫码。",
      "通过后刷新 Card 页面。"
    ],
    checks: [
      "KYC 显示通过。",
      "没有未处理补件。",
      "Card 入口可用。"
    ],
    warnings: [
      "不要盲目重复提交同一张照片。",
      "只改失败原因对应的材料。"
    ]
  });

  addAfter("roogoo", "Sumsub 状态和补件处理", {
    t: "核对卡片等级和费用规则",
    img: "/images/tutorials/roogoo/step-06.jpg",
    caption: "卡片等级截图：Smart、Elite、Premier、Infinity 先看费用和场景。",
    b: "提交申请前先看卡片等级、开卡费、交易费、跨境费和当前活动。选错卡会影响后续使用成本。",
    actions: [
      "查看 Smart Card。",
      "查看 Elite / Premier / Infinity。",
      "确认卡组织和发行地区。",
      "确认开卡费。",
      "确认交易费。",
      "确认跨境费用。",
      "选择当前要开的卡片类型。"
    ],
    checks: [
      "卡片类型选对。",
      "费用规则已看清。",
      "页面能继续提交。"
    ],
    warnings: [
      "不同等级费率不同。",
      "活动优惠以页面当时显示为准。"
    ]
  });

  addAfter("roogoo", "查看卡号", {
    t: "卡片安全设置和交易记录",
    img: "/images/tutorials/roogoo/step-09.jpg",
    caption: "管理页截图：冻结、限额、交易记录和异常处理入口。",
    b: "卡片生成后，先把卡片安全和交易记录入口看清楚。异常交易时先冻结，再联系客服。",
    actions: [
      "进入 Cards。",
      "选择目标卡片。",
      "查看 Freeze / Unfreeze。",
      "查看交易记录。",
      "查看限额设置。",
      "查看账单资料。",
      "保存客服入口。"
    ],
    checks: [
      "冻结入口能找到。",
      "交易记录能打开。",
      "知道客服入口。"
    ],
    warnings: [
      "异常交易先冻结卡片。",
      "连续失败时先停用再排查。"
    ]
  });

  addAfter("kraken-card", "确认 Krak", {
    t: "设置 App 安全验证",
    img: "/images/tutorials/kraken-card/step-01.jpg",
    caption: "安全页截图：PIN、生物识别和设备验证会影响查看卡号。",
    b: "Krak Card 查看卡号、PIN 和添加钱包时会要求设备安全。先把 PIN、生物识别和通知设置好。",
    actions: [
      "进入 App 安全设置。",
      "设置 App PIN。",
      "开启 Face ID、Touch ID 或系统生物识别。",
      "确认邮箱验证可用。",
      "确认手机号验证可用。",
      "打开交易通知。",
      "检查登录设备。"
    ],
    checks: [
      "PIN 可用。",
      "生物识别可用。",
      "通知能收到。"
    ],
    warnings: [
      "没有设备锁屏密码时可能看不了完整卡号。",
      "更换手机后要重新完成设备验证。"
    ]
  });

  addAfter("kraken-card", "创建虚拟卡", {
    t: "查看卡号、CVV 和 PIN",
    img: "/images/tutorials/kraken-card/step-05.jpg",
    caption: "卡片详情截图：See Details 查看卡号，View PIN 查看 PIN。",
    b: "卡片生成后，先确认卡号、有效期、CVV 和 PIN 的查看入口。实体卡和虚拟卡如果同时存在，会分开展示。",
    actions: [
      "进入 Card 页面。",
      "选择虚拟卡。",
      "点击 See Details。",
      "完成额外验证。",
      "查看卡号、有效期、CVV。",
      "点击 View PIN 查看 PIN。",
      "返回 Card 页面确认冻结和管理入口。"
    ],
    checks: [
      "卡号能显示。",
      "PIN 能查看。",
      "冻结入口能找到。"
    ],
    warnings: [
      "查看卡号需要设备安全验证。",
      "卡号页面不要录屏。"
    ]
  });

  addAfter("kraken-card", "Google Pay", {
    t: "申请实体卡和查看配送状态",
    img: "/images/tutorials/kraken-card/step-06.jpg",
    caption: "实体卡截图：按需申请实体卡，确认显示名和收货地址。",
    b: "虚拟卡可用后，再按需要申请实体卡。实体卡会有收货地址、显示名、配送和激活流程。",
    actions: [
      "进入 Card 页面。",
      "选择 Physical Card。",
      "确认显示姓名。",
      "填写收货地址。",
      "确认配送说明。",
      "提交实体卡申请。",
      "在 Card Management 里查看配送状态。"
    ],
    checks: [
      "实体卡申请已提交。",
      "收货地址无误。",
      "配送状态可查看。"
    ],
    warnings: [
      "实体卡到手前先用虚拟卡。",
      "收货地址错误会影响配送。"
    ]
  });

  const replaceStep = (slug, anchor, next) => {
    const steps = window.TUTORIALS[slug] || [];
    const index = steps.findIndex(item => (item.t || "").includes(anchor));
    if (index >= 0) steps[index] = { ...steps[index], ...next };
  };

  replaceStep("roogoo", "认识 Dashboard", {
    t: "认识 Dashboard 和卡片入口",
    img: "/images/tutorials/roogoo/step-02.jpg",
    caption: "Dashboard 截图：先找个人中心、安全、KYC、Card 和客服入口。",
    b: "Roogoo 是 PWA 形态。开卡前先认识界面，后面做认证、申请卡片、查看卡号时不会找不到入口。",
    actions: [
      "查看用户设置入口。",
      "查看安全设置入口。",
      "把 Roogoo 添加到手机主屏幕。",
      "找到 KYC 状态入口。",
      "找到 Card 管理菜单。",
      "找到客服入口。",
      "确认语言和时区显示正常。"
    ],
    checks: [
      "知道 Card 菜单位置。",
      "知道 KYC 状态入口。",
      "知道联系客服的位置。"
    ],
    warnings: [
      "PWA 使用时要注意浏览器保存的登录状态。",
      "找不到菜单时先刷新页面或重新登录。"
    ]
  });

  replaceStep("pokepay", "申请 PokeCard", {
    t: "申请 PokeCard",
    img: "/images/tutorials/pokepay/step-04.jpg",
    caption: "申请卡截图：选择卡片类型，核对卡组织、币种、费用和条款。",
    b: "KYC 通过后进入 Card 页面。先看清楚卡类型、卡组织、币种、费用和使用场景，再提交申请。",
    actions: [
      "进入 Card 页面。",
      "点击 Apply Card 或申请新卡。",
      "选择 PokeCard 或页面当前推荐卡段。",
      "确认 Visa / Mastercard 标识。",
      "确认卡片币种。",
      "确认开卡费、月费和消费费率。",
      "阅读服务条款。",
      "提交开卡申请。"
    ],
    checks: [
      "卡片类型选对。",
      "费用页面显示清楚。",
      "申请状态进入处理中或卡片生成。"
    ],
    warnings: [
      "旧版卡、新版 PokeCard、实体卡规则可能不同。",
      "费用和卡段以页面实时显示为准。"
    ]
  });

  window.FUNDING_GUIDES["safepal-card"] = [
    {
      t: "准备 Arbitrum ETH 和 USDC",
      img: "/images/tutorials/safepal-card/step-02.jpg",
      caption: "资产准备截图：Arbitrum 链上至少要有验证 gas。",
      b: "SafePal / Fiat24 的部分签名和激活动作需要 Arbitrum 网络资产。资金准备单独放在这里，不放进开卡步骤。",
      actions: [
        "在 Arbitrum 网络准备少量 ETH 用于 gas。",
        "如果页面要求激活费用，按页面显示准备对应 USDC。",
        "确认资产在 SafePal 钱包里。",
        "确认网络是 Arbitrum。",
        "不要把其它网络资产直接拿来操作。"
      ],
      checks: [
        "Arbitrum 网络可用。",
        "钱包能发起签名。",
        "页面没有网络不匹配提示。"
      ],
      warnings: [
        "网络选错会造成损失。",
        "激活金额以页面实时显示为准。"
      ]
    },
    {
      t: "Fiat24 账户资金准备和到账检查",
      img: "/images/tutorials/safepal-card/step-09.jpg",
      caption: "账户资金截图：资金到账后再用于卡片消费。",
      b: "卡片消费依赖 Fiat24 账户可用资金。这里只放资金准备和到账检查，不写绑卡和消费教程。",
      actions: [
        "进入 Fiat24 / Bank 账户页面。",
        "点击对应账户的资金入口。",
        "选择页面支持的资产和目标币种账户。",
        "确认汇率、手续费和链上 gas。",
        "提交后等待页面显示到账。",
        "查看 Fiat24 账户可用数字。"
      ],
      checks: [
        "目标币种账户显示可用数字。",
        "链上记录和账户记录能对应。",
        "没有待处理失败提示。"
      ],
      warnings: [
        "页面支持的币种和网络以当时显示为准。",
        "不要在网络拥堵时连续重复提交。"
      ]
    }
  ];

  ["bybit-eu-card", "safepal-card", "pokepay", "roogoo", "kraken-card"].forEach(renumber);
})();

window.GIFT_DETAILS = {
  apple: {
    name: "Apple Gift Card",
    sub: "App Store · iTunes · Apple Music",
    color: "#1d1d1f",
    desc: "Apple Gift Card 按国家/地区发行，兑换后进入对应 Apple Account Balance。礼品卡只能在购买国家或地区使用，选择时按账号地区和本地币种下单。",
    regions: [
      { code: "US", name: "美国", currency: "USD", denom: "美元面额 / 自选金额", note: "用于美国 Apple ID、App Store、iCloud、Apple Music 等。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "加元面额 / 自选金额", note: "兑换到加拿大 Apple Account Balance。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "英镑面额 / 自选金额", note: "英国区账号使用，账单币种为 GBP。" },
      { code: "AU", name: "澳大利亚", currency: "AUD", denom: "澳元面额 / 自选金额", note: "澳区 Apple ID 使用。" },
      { code: "JP", name: "日本", currency: "JPY", denom: "日元面额 / 零售固定面额", note: "日区 App、游戏和订阅常用。" },
      { code: "HK", name: "中国香港", currency: "HKD", denom: "港币面额 / 零售固定面额", note: "港区 Apple ID 使用。" },
      { code: "SG", name: "新加坡", currency: "SGD", denom: "新加坡元面额", note: "新加坡区账号使用。" },
      { code: "TW", name: "中国台湾", currency: "TWD", denom: "新台币面额", note: "台区 Apple ID 使用。" },
      { code: "TR", name: "土耳其", currency: "TRY", denom: "土耳其里拉面额", note: "土耳其区 Apple ID / App Store 使用。" },
      { code: "IN", name: "印度", currency: "INR", denom: "印度卢比面额", note: "印度区 Apple ID、App Store、Apple Account Balance 使用。" },
      { code: "DE", name: "德国", currency: "EUR", denom: "欧元面额 / 自选金额", note: "欧元区账号仍要按具体国家/地区购买。" },
      { code: "FR", name: "法国", currency: "EUR", denom: "欧元面额 / 自选金额", note: "欧元币种相同，但 Apple 仍按购买国家/地区限制。" },
      { code: "IT", name: "意大利", currency: "EUR", denom: "欧元面额 / 自选金额", note: "意区账号使用。" },
      { code: "ES", name: "西班牙", currency: "EUR", denom: "欧元面额 / 自选金额", note: "西区账号使用。" },
      { code: "NL", name: "荷兰", currency: "EUR", denom: "欧元面额 / 自选金额", note: "荷兰区账号使用。" },
      { code: "IE", name: "爱尔兰", currency: "EUR", denom: "欧元面额 / 自选金额", note: "爱尔兰区账号使用。" },
    ],
    use: ["给对应国家/地区 Apple ID 充值", "iCloud 200GB / 2TB 续费", "Apple Music / Apple TV+ 订阅", "App Store 应用购买与内购"],
  },
  steam: {
    name: "Steam 钱包卡",
    sub: "Steam Wallet · 数字礼品卡 · 钱包码",
    color: "#1b2838",
    desc: "Steam 官方数字礼品卡在接收时会自动换算成好友钱包币种；Steamworks 官方币种表列出的 live currency 是当前商店可用币种。实体钱包码/零售码按钱包币种选择。",
    regions: [
      { code: "US", name: "美国", currency: "USD", denom: "$5 / $10 / $25 / $50 / $100", note: "Steam 官方数字礼品卡美元页显示这些固定金额。" },
      { code: "EU", name: "欧元区", currency: "EUR", denom: "接收后转为 EUR 钱包", note: "欧洲未单列本地币的地区通常使用 EUR。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "接收后转为 GBP 钱包", note: "英国 Steam 钱包币种为英镑。" },
      { code: "AU", name: "澳大利亚", currency: "AUD", denom: "接收后转为 AUD 钱包", note: "Steam live currency。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "接收后转为 CAD 钱包", note: "Steam live currency。" },
      { code: "JP", name: "日本", currency: "JPY", denom: "接收后转为 JPY 钱包", note: "Steam live currency。" },
      { code: "HK", name: "中国香港", currency: "HKD", denom: "接收后转为 HKD 钱包", note: "Steam live currency。" },
      { code: "KR", name: "韩国", currency: "KRW", denom: "接收后转为 KRW 钱包", note: "Steam live currency。" },
      { code: "TW", name: "中国台湾", currency: "TWD", denom: "接收后转为 TWD 钱包", note: "Steam live currency。" },
      { code: "SG", name: "新加坡", currency: "SGD", denom: "接收后转为 SGD 钱包", note: "Steam live currency。" },
      { code: "TH", name: "泰国", currency: "THB", denom: "接收后转为 THB 钱包", note: "Steam live currency。" },
      { code: "VN", name: "越南", currency: "VND", denom: "接收后转为 VND 钱包", note: "Steam live currency。" },
      { code: "PH", name: "菲律宾", currency: "PHP", denom: "接收后转为 PHP 钱包", note: "Steam live currency。" },
      { code: "ID", name: "印度尼西亚", currency: "IDR", denom: "接收后转为 IDR 钱包", note: "Steam live currency。" },
      { code: "MY", name: "马来西亚", currency: "MYR", denom: "接收后转为 MYR 钱包", note: "Steam live currency。" },
      { code: "IN", name: "印度", currency: "INR", denom: "接收后转为 INR 钱包", note: "Steam live currency。" },
      { code: "BR", name: "巴西", currency: "BRL", denom: "接收后转为 BRL 钱包", note: "Steam live currency。" },
      { code: "MX", name: "墨西哥", currency: "MXN", denom: "接收后转为 MXN 钱包", note: "Steam live currency。" },
      { code: "CL", name: "智利", currency: "CLP", denom: "接收后转为 CLP 钱包", note: "Steam live currency。" },
      { code: "CO", name: "哥伦比亚", currency: "COP", denom: "接收后转为 COP 钱包", note: "Steam live currency。" },
      { code: "PE", name: "秘鲁", currency: "PEN", denom: "接收后转为 PEN 钱包", note: "Steam live currency。" },
      { code: "ZA", name: "南非", currency: "ZAR", denom: "接收后转为 ZAR 钱包", note: "Steam live currency。" },
      { code: "PL", name: "波兰", currency: "PLN", denom: "接收后转为 PLN 钱包", note: "Steam live currency。" },
      { code: "CH", name: "瑞士", currency: "CHF", denom: "接收后转为 CHF 钱包", note: "Steam live currency。" },
      { code: "NO", name: "挪威", currency: "NOK", denom: "接收后转为 NOK 钱包", note: "Steam live currency。" },
      { code: "AE", name: "阿联酋", currency: "AED", denom: "接收后转为 AED 钱包", note: "Steam live currency。" },
      { code: "SA", name: "沙特阿拉伯", currency: "SAR", denom: "接收后转为 SAR 钱包", note: "Steam live currency。" },
      { code: "QA", name: "卡塔尔", currency: "QAR", denom: "接收后转为 QAR 钱包", note: "Steam live currency。" },
      { code: "KW", name: "科威特", currency: "KWD", denom: "接收后转为 KWD 钱包", note: "Steam live currency。" },
      { code: "IL", name: "以色列", currency: "ILS", denom: "接收后转为 ILS 钱包", note: "Steam live currency。" },
      { code: "UA", name: "乌克兰", currency: "UAH", denom: "接收后转为 UAH 钱包", note: "Steam live currency。" },
      { code: "KZ", name: "哈萨克斯坦", currency: "KZT", denom: "接收后转为 KZT 钱包", note: "Steam live currency。" },
      { code: "NZ", name: "新西兰", currency: "NZD", denom: "接收后转为 NZD 钱包", note: "Steam live currency。" },
    ],
    use: ["Steam 商店游戏、DLC、季票", "游戏内微交易", "Steam 社区市场余额", "给好友发送数字礼品卡"],
  },
  netflix: {
    name: "Netflix 礼品卡",
    sub: "Netflix 账户余额",
    color: "#a51722",
    desc: "Netflix 礼品卡可用于支付 Netflix 会员；跨国家购买时，只有礼品卡币种和 Netflix 账单币种相同才可使用。",
    regions: [
      { code: "US", name: "美国", currency: "USD", denom: "美元零售面额", note: "账单币种为 USD 的账号使用。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "加元零售面额", note: "账单币种为 CAD 的账号使用。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "英镑零售面额", note: "账单币种为 GBP 的账号使用。" },
      { code: "IE", name: "爱尔兰", currency: "EUR", denom: "欧元零售面额", note: "同为欧元账单时才可兑换。" },
      { code: "DE", name: "德国", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "FR", name: "法国", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "ES", name: "西班牙", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "IT", name: "意大利", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "NL", name: "荷兰", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "BE", name: "比利时", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "AT", name: "奥地利", currency: "EUR", denom: "欧元零售面额", note: "以当区 Netflix 礼品卡零售商为准。" },
      { code: "CH", name: "瑞士", currency: "CHF", denom: "瑞士法郎零售面额", note: "账单币种为 CHF 的账号使用。" },
      { code: "AU", name: "澳大利亚", currency: "AUD", denom: "澳元零售面额", note: "账单币种为 AUD 的账号使用。" },
      { code: "NZ", name: "新西兰", currency: "NZD", denom: "新西兰元零售面额", note: "账单币种为 NZD 的账号使用。" },
      { code: "JP", name: "日本", currency: "JPY", denom: "日元零售面额", note: "账单币种为 JPY 的账号使用。" },
      { code: "KR", name: "韩国", currency: "KRW", denom: "韩元零售面额", note: "账单币种为 KRW 的账号使用。" },
      { code: "HK", name: "中国香港", currency: "HKD", denom: "港币零售面额", note: "账单币种为 HKD 的账号使用。" },
      { code: "SG", name: "新加坡", currency: "SGD", denom: "新加坡元零售面额", note: "账单币种为 SGD 的账号使用。" },
      { code: "TW", name: "中国台湾", currency: "TWD", denom: "新台币零售面额", note: "账单币种为 TWD 的账号使用。" },
      { code: "MX", name: "墨西哥", currency: "MXN", denom: "墨西哥比索零售面额", note: "账单币种为 MXN 的账号使用。" },
      { code: "BR", name: "巴西", currency: "BRL", denom: "雷亚尔零售面额", note: "账单币种为 BRL 的账号使用。" },
    ],
    use: ["给 Netflix 账户充值余额", "用余额抵扣月费", "给同币种账单的账号送礼", "查询余额和多张礼品卡叠加"],
  },
  google: {
    name: "Google Play",
    sub: "Google Play 应用市场充值",
    color: "#1f60c4",
    desc: "Google Play 礼品卡按国家/地区和币种发行，只能在购买国家和购买币种内兑换使用。下方按国家列出可选面额和范围。",
    regions: [
      { code: "AU", name: "澳大利亚", currency: "AUD", denom: "A$20 / A$30 / A$50 / A$100 / A$300 / A$500；A$20-A$500", note: "按该国家/地区面额选择。" },
      { code: "AT", name: "奥地利", currency: "EUR", denom: "€5 / €15 / €25 / €50 / €100；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "BE", name: "比利时", currency: "EUR", denom: "€5 / €10 / €25 / €50；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "BR", name: "巴西", currency: "BRL", denom: "R$10 / R$15 / R$30 / R$50 / R$100；R$10-R$300", note: "按该国家/地区面额选择。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "C$10 / C$15 / C$25 / C$50；C$10-C$200", note: "按该国家/地区面额选择。" },
      { code: "CO", name: "哥伦比亚", currency: "COP", denom: "COP 10,000 / 30,000 / 50,000 / 100,000 / 250,000；10,000-990,000", note: "按该国家/地区面额选择。" },
      { code: "FI", name: "芬兰", currency: "EUR", denom: "€5-€200", note: "按该国家/地区面额选择。" },
      { code: "FR", name: "法国", currency: "EUR", denom: "€5 / €15 / €25 / €50 / €100；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "DE", name: "德国", currency: "EUR", denom: "€5 / €10 / €15 / €25 / €50 / €100；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "GR", name: "希腊", currency: "EUR", denom: "€15 / €25 / €50", note: "按该国家/地区面额选择。" },
      { code: "HK", name: "中国香港", currency: "HKD", denom: "HK$200 / HK$500 / HK$1,000；HK$150-HK$2,000", note: "按该国家/地区面额选择。" },
      { code: "IN", name: "印度", currency: "INR", denom: "₹100 / ₹300 / ₹500 / ₹1,000 / ₹1,500；₹10-₹5,000", note: "按该国家/地区面额选择。" },
      { code: "ID", name: "印度尼西亚", currency: "IDR", denom: "Rp5,000 / 20,000 / 50,000 / 100,000 / 150,000 / 500,000", note: "按该国家/地区面额选择。" },
      { code: "IQ", name: "伊拉克", currency: "IQD", denom: "2,000 / 5,000 / 10,000 / 25,000 / 50,000 / 100,000 / 150,000 IQD", note: "按该国家/地区面额选择。" },
      { code: "IE", name: "爱尔兰", currency: "EUR", denom: "€15 / €25 / €50", note: "按该国家/地区面额选择。" },
      { code: "IT", name: "意大利", currency: "EUR", denom: "€15 / €25 / €50 / €100；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "JP", name: "日本", currency: "JPY", denom: "¥1,000 / ¥3,000 / ¥5,000 / ¥10,000 / ¥20,000；¥1,000-¥50,000", note: "官方注明 ¥1,500 和 ¥15,000 已于 2023-09-19 停售。" },
      { code: "MX", name: "墨西哥", currency: "MXN", denom: "$100 / $200 / $300 / $600；$100-$5,000", note: "按该国家/地区面额选择。" },
      { code: "NL", name: "荷兰", currency: "EUR", denom: "€15 / €25 / €50；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "NZ", name: "新西兰", currency: "NZD", denom: "NZ$20 / NZ$30 / NZ$50", note: "按该国家/地区面额选择。" },
      { code: "PL", name: "波兰", currency: "PLN", denom: "10 / 20 / 50 / 75 / 150 / 400 zł；1-600 zł", note: "按该国家/地区面额选择。" },
      { code: "PT", name: "葡萄牙", currency: "EUR", denom: "€15 / €25 / €50", note: "按该国家/地区面额选择。" },
      { code: "SA", name: "沙特阿拉伯", currency: "SAR", denom: "20 / 50 / 100 / 300 / 400 SAR；5-1,000 SAR", note: "按该国家/地区面额选择。" },
      { code: "ZA", name: "南非", currency: "ZAR", denom: "R10-R5,000", note: "按该国家/地区面额选择。" },
      { code: "KR", name: "韩国", currency: "KRW", denom: "₩10,000 / ₩15,000 / ₩30,000 / ₩50,000 / ₩100,000；₩10,000-₩200,000", note: "按该国家/地区面额选择。" },
      { code: "ES", name: "西班牙", currency: "EUR", denom: "€5 / €15 / €25 / €50 / €100；€1-€500", note: "按该国家/地区面额选择。" },
      { code: "CH", name: "瑞士", currency: "CHF", denom: "10 / 30 / 50 / 100 CHF；CHF 1-1,000", note: "按该国家/地区面额选择。" },
      { code: "TR", name: "土耳其", currency: "TRY", denom: "TRY 25 / TRY 50 / TRY 100；TRY 25-250", note: "按该国家/地区面额选择。" },
      { code: "AE", name: "阿联酋", currency: "AED", denom: "30 / 50 / 100 / 300 / 500 AED", note: "按该国家/地区面额选择。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "£10 / £25 / £50；£1-£500", note: "按该国家/地区面额选择。" },
      { code: "US", name: "美国", currency: "USD", denom: "$10 / $15 / $25 / $50 / $100；$5-$200", note: "按该国家/地区面额选择。" },
      { code: "VN", name: "越南", currency: "VND", denom: "30,000 / 50,000 / 100,000 / 200,000 / 300,000 / 500,000 / 1,000,000 / 2,000,000 / 3,000,000 VND", note: "按该国家/地区面额选择。" },
    ],
    use: ["Google Play 应用购买", "Android 游戏内购", "YouTube Premium 等支持 Play 余额的付款", "按账号国家和购买币种兑换"],
  },
  psn: {
    name: "PlayStation Store",
    sub: "PS Store 钱包充值",
    color: "#0a2c7a",
    desc: "PS Store voucher code 需要和账号地区一致，实体券通常会印有国家/地区标识。选择时按账号地区匹配本地币。",
    regions: [
      { code: "US", name: "美国", currency: "USD", denom: "美元钱包充值卡", note: "12 位兑换码，账号地区需为美国。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "加元钱包充值卡", note: "账号地区需为加拿大。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "英镑钱包充值卡", note: "英国 PlayStation 礼品卡页由 CashStar 履约。" },
      { code: "IE", name: "爱尔兰", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配爱尔兰。" },
      { code: "DE", name: "德国", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配德国。" },
      { code: "FR", name: "法国", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配法国。" },
      { code: "ES", name: "西班牙", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配西班牙。" },
      { code: "IT", name: "意大利", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配意大利。" },
      { code: "NL", name: "荷兰", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配荷兰。" },
      { code: "BE", name: "比利时", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配比利时。" },
      { code: "AT", name: "奥地利", currency: "EUR", denom: "欧元钱包充值卡", note: "账号地区需匹配奥地利。" },
      { code: "CH", name: "瑞士", currency: "CHF", denom: "瑞士法郎钱包充值卡", note: "账号地区需匹配瑞士。" },
      { code: "AU", name: "澳大利亚", currency: "AUD", denom: "澳元钱包充值卡", note: "账号地区需匹配澳大利亚。" },
      { code: "NZ", name: "新西兰", currency: "NZD", denom: "新西兰元钱包充值卡", note: "账号地区需匹配新西兰。" },
      { code: "JP", name: "日本", currency: "JPY", denom: "日元钱包充值卡", note: "账号地区需匹配日本。" },
      { code: "HK", name: "中国香港", currency: "HKD", denom: "港币钱包充值卡", note: "账号地区需匹配中国香港。" },
      { code: "SG", name: "新加坡", currency: "SGD", denom: "新加坡元钱包充值卡", note: "账号地区需匹配新加坡。" },
      { code: "KR", name: "韩国", currency: "KRW", denom: "韩元钱包充值卡", note: "账号地区需匹配韩国。" },
      { code: "TW", name: "中国台湾", currency: "TWD", denom: "新台币钱包充值卡", note: "账号地区需匹配中国台湾。" },
      { code: "MX", name: "墨西哥", currency: "MXN", denom: "墨西哥比索钱包充值卡", note: "账号地区需匹配墨西哥。" },
      { code: "BR", name: "巴西", currency: "BRL", denom: "雷亚尔钱包充值卡", note: "账号地区需匹配巴西。" },
    ],
    use: ["PS5 / PS4 数字游戏", "PlayStation Plus 会员", "DLC、季票和游戏内虚拟货币", "网页、主机或 PlayStation App 兑换 12 位代码"],
  },
  battlenet: {
    name: "Battle.net 点卡",
    sub: "Battle.net Balance",
    color: "#0e6cd1",
    desc: "Battle.net Balance 是暴雪商店余额。余额币种必须和商店显示币种一致；可购买余额，也可兑换实体零售卡代码。",
    regions: [
      { code: "US", name: "美国", currency: "USD", denom: "$1 起余额；零售码按面额", note: "USD 余额最低购买 $1。" },
      { code: "EU", name: "欧元区", currency: "EUR", denom: "€1 起余额；零售码按面额", note: "EUR 余额最低购买 €1。" },
      { code: "GB", name: "英国", currency: "GBP", denom: "£1 起余额；零售码按面额", note: "GBP 余额最低购买 £1。" },
      { code: "CA", name: "加拿大", currency: "CAD", denom: "加元余额 / 零售码按面额", note: "余额币种需和商店币种一致。" },
      { code: "MX", name: "墨西哥", currency: "MXN", denom: "MXN 60 起余额", note: "MXN 余额最低购买额为 60。" },
      { code: "AR", name: "阿根廷", currency: "ARS", denom: "ARS 20 起余额", note: "ARS 余额最低购买额为 20。" },
      { code: "CL", name: "智利", currency: "CLP", denom: "CLP 2,400 起余额", note: "CLP 余额最低购买额为 2,400。" },
      { code: "KR", name: "韩国", currency: "KRW", denom: "韩元 Battlecoin 余额", note: "韩国支持页以本地 Battlecoin 规则为准。" },
      { code: "AE", name: "阿联酋", currency: "AED", denom: "AED 本地余额", note: "AED 本地余额可用。" },
      { code: "CO", name: "哥伦比亚", currency: "COP", denom: "COP 本地余额", note: "COP 本地余额可用。" },
      { code: "CR", name: "哥斯达黎加", currency: "CRC", denom: "CRC 本地余额", note: "CRC 本地余额可用。" },
      { code: "ID", name: "印度尼西亚", currency: "IDR", denom: "IDR 本地余额", note: "IDR 本地余额可用。" },
      { code: "IL", name: "以色列", currency: "ILS", denom: "ILS 本地余额", note: "ILS 本地余额可用。" },
      { code: "MY", name: "马来西亚", currency: "MYR", denom: "MYR 本地余额", note: "MYR 本地余额可用。" },
      { code: "PE", name: "秘鲁", currency: "PEN", denom: "PEN 本地余额", note: "PEN 本地余额可用。" },
      { code: "QA", name: "卡塔尔", currency: "QAR", denom: "QAR 本地余额", note: "QAR 本地余额可用。" },
      { code: "SA", name: "沙特阿拉伯", currency: "SAR", denom: "SAR 本地余额", note: "SAR 本地余额可用。" },
      { code: "SG", name: "新加坡", currency: "SGD", denom: "SGD 本地余额", note: "SGD 本地余额可用。" },
      { code: "TH", name: "泰国", currency: "THB", denom: "THB 本地余额", note: "THB 本地余额可用。" },
      { code: "UY", name: "乌拉圭", currency: "UYU", denom: "UYU 本地余额", note: "UYU 本地余额可用。" },
      { code: "RS", name: "塞尔维亚", currency: "RSD", denom: "RSD 本地余额", note: "RSD 本地余额可用。" },
    ],
    use: ["Battle.net 商店游戏和服务", "《魔兽世界》游戏时间", "《炉石传说》卡包", "《守望先锋 2》《暗黑破坏神 IV》内容"],
  },
};
