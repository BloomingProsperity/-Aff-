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
      t: "确认你用的是 Bybit EU 独立账户",
      img: "/images/tutorials/bybit-card/step-01.jpg",
      caption: "账户体系截图：Bybit EU 与普通 Bybit 是独立账户体系，入口相似。",
      b: "Bybit EU 卡走欧洲路线：德国地址选 Germany / 德国；法区地址选 France / 法国；同类欧盟用户再按 Spain、Italy、Netherlands、Austria、Belgium、Ireland 这类欧盟国家走。",
      actions: [
        "先点击本页「立即申请」，进入 Bybit EU 注册入口。",
        "打开 bybit.eu 注册或登录，确认页面主体是 Bybit EU。",
        "使用本人长期可控邮箱和手机号。",
        "邀请码输入框填 1NNDZ0W；如果链接已经自动带出邀请码，不要删除。",
        "开启 2FA，完成基础安全设置。",
        "德国路线选择 Germany / Deutschland。",
        "法国路线选择 France。",
        "其它欧盟路线选择 Spain、Italy、Netherlands、Austria、Belgium、Ireland 等欧盟国家。"
      ],
      checks: [
        "浏览器地址是 bybit.eu。",
        "账户已完成基础 KYC。",
        "菜单里能进入 Finance / Card。",
        "邀请码显示 1NNDZ0W。"
      ],
      warnings: [
        "bybit.com 的 KYC 不等于 bybit.eu KYC。",
        "本页 EU 教程只讲德国/法国/欧盟路线，不再写模糊地区。"
      ]
    },
    {
      n: "02",
      t: "准备证件和地址证明",
      img: "/images/tutorials/bybit-card/step-02.jpg",
      caption: "证件上传截图：证件上传和自拍审核逻辑与普通 Bybit 类似。",
      b: "欧洲卡按德国/法国这类欧盟地址证明准备材料。不要自己猜材料类型，按下面清单准备：证件、地址证明、手机号、邮箱、2FA。",
      actions: [
        "准备护照、身份证、驾照、居留卡等页面支持证件。",
        "德国路线准备德国地址证明；法国路线准备法国地址证明。",
        "准备近 3 个月地址证明：银行账单、水电账单、政府信件或租住证明。",
        "文件必须显示完整姓名、完整地址、签发日期。",
        "证件姓名、Bybit EU 账户姓名、地址证明姓名保持一致。",
        "如果文件是多页 PDF，上传前确认第一页就能看到关键信息。"
      ],
      checks: [
        "地址证明没有过期。",
        "不是手机截图或裁切图。",
        "文件语言和格式能被系统识别。"
      ],
      warnings: [
        "地址证明文件过期、缺页、截图压缩都会导致退回。",
        "实体卡收货地址按德国/法国地址证明填写，不要和申请国家分开。"
      ]
    },
    {
      n: "03",
      t: "进入 Get Your Card 流程",
      img: "/images/tutorials/bybit-card/step-03.jpg",
      caption: "Card 入口截图：Card 入口通常在 Finance 菜单下。",
      b: "登录 Bybit EU 后进入 Finance / Card，点击 Get Your Card。国家选择不要模糊：德区选 Germany，法区选 France，其它欧盟用户按自己欧盟居住国选择。",
      actions: [
        "打开 Finance 菜单，进入 Card。",
        "点击 Get Your Card 或 Apply Now。",
        "Country of Residence 德国用户选 Germany / Deutschland。",
        "法国用户选 France。",
        "其它欧盟路线选 Spain、Italy、Netherlands、Austria、Belgium、Ireland 等实际居住国。",
        "阅读 Bybit EU Card 条款和费用说明。",
        "如页面要求补充邮箱确认或 2FA，先完成再继续。"
      ],
      checks: [
        "没有跳回普通 Bybit 国际站。",
        "申请页显示的是 Bybit EU Card。",
        "国家字段已经显示 Germany 或 France。"
      ],
      warnings: [
        "这页 EU 教程默认给德国/法国用户看，不再让用户自己猜 EEA。",
        "如果是西班牙、意大利、荷兰、奥地利、比利时、爱尔兰用户，按同样流程替换国家字段。"
      ]
    },
    {
      n: "04",
      t: "上传材料并等待审核",
      img: "/images/tutorials/bybit-card/step-04.jpg",
      caption: "材料页截图：地区和材料页需要逐项核对。",
      b: "Bybit EU Card 提交后按页面显示的审核时间等待。补件邮件会发到注册邮箱，所以要保持邮箱可收信。",
      actions: [
        "上传身份证明文件。",
        "上传地址证明文件。",
        "确认账单地址和 Germany / France 居住国家一致。",
        "绑定或确认注册邮箱。",
        "把 Bybit EU 通知邮箱加入联系人，避免补件邮件漏掉。",
        "提交后保存申请时间，便于后续追踪。"
      ],
      checks: [
        "申请状态进入 Under Review。",
        "邮箱能收到 Bybit EU 通知。",
        "补件时知道在哪里重新上传。"
      ],
      warnings: [
        "德国路线就用德国地址证明，法国路线就用法国地址证明。",
        "地址证明不清晰会直接退回。"
      ]
    },
    {
      n: "05",
      t: "启用虚拟卡并充值 Funding Account",
      img: "/images/tutorials/bybit-card/step-05.jpg",
      caption: "卡片详情：虚拟卡通过后进入卡片信息。",
      b: "Bybit EU Card 优先从 Funding Account 扣法币；法币不足时会按设置顺序卖出支持的加密资产。",
      actions: [
        "审核通过后进入 Card Dashboard。",
        "查看虚拟卡号、有效期、CVV 和账单地址。",
        "给 Funding Account 留 EUR 或支持的稳定币。",
        "检查 crypto liquidation order，设置不想优先卖出的资产。",
        "确认 0.9% crypto conversion fee 和外汇费用规则。",
        "先小额线上支付，再绑定订阅。"
      ],
      checks: [
        "卡片状态 Active。",
        "Funding Account 余额足够。",
        "消费资产顺序已按你的偏好调整。"
      ],
      warnings: [
        "余额在 Spot Account 不一定能被卡片直接扣。",
        "用波动资产消费会有价格波动和税务记录。"
      ]
    },
    {
      n: "06",
      t: "3DS 验证、钱包绑定和实体卡",
      img: "/images/tutorials/bybit-card/step-07.jpg",
      caption: "绑卡截图：绑卡后先做小额验证。",
      b: "欧洲卡适合 Apple Pay、Google Pay 和线上订阅，但仍要先确认 3DS 验证链路稳定。",
      actions: [
        "线上支付时填写卡号、有效期、CVV 和账单地址。",
        "遇到 3DS 时回 Bybit EU App 完成生物识别或 OTP。",
        "绑定 Apple Pay / Google Pay 时按系统提示完成设备验证。",
        "实体卡需要先有虚拟卡，显示名最多 21 个拉丁字符。",
        "实体卡收货地址要能收件，并与地址验证一致。",
        "收到实体卡后按 App 提示激活，设置 PIN。"
      ],
      checks: [
        "小额订单能成功授权。",
        "钱包里显示卡片可用。",
        "实体卡寄送地址可收信。"
      ],
      warnings: [
        "部分地区钱包绑定支持会变。",
        "跨境消费、ATM、第三方费用要看实时费率页。"
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
      t: "通过邀请链接注册 PokePay 账户",
      img: "/images/tutorials/pokepay/step-01.jpg",
      caption: "注册入口截图：先点本页邀请链接，再完成注册。",
      b: "先点本页「立即申请」进入 PokePay 邀请注册页，邀请码 447963 会自动填入。注册入口只走官网或官方应用商店，不要从陌生链接进入。",
      actions: [
        "先点击本页上方「立即申请」，使用邀请链接：https://app.pokepay.cc/pages/invitation/regist?r=447963。",
        "页面邀请码栏会自动填入 447963，不要删除。",
        "用长期可控邮箱或手机号注册。",
        "设置强密码并完成邮箱验证码。",
        "进入账户后先看安全中心，开启可用的二次验证。",
        "确认网页和 App 都能正常登录。"
      ],
      checks: [
        "注册时邀请码显示 447963。",
        "邮箱验证完成。",
        "能进入钱包和 Card 页面。"
      ],
      warnings: [
        "不要从 Telegram 私聊链接直接登录，以免进仿站。",
        "如果页面要求助记词，大概率不是正常 PokePay 登录。"
      ]
    },
    {
      n: "02",
      t: "完成 KYC 实名：英文姓名顺序是最大坑",
      img: "/images/tutorials/pokepay/step-02.jpg",
      caption: "KYC 入口截图：英文名填反是最常见被拒原因，名在前姓在后。",
      b: "PokePay 的英文姓名顺序和国内习惯相反：Given Name（名）在前，Family Name（姓）在后。例如张三，First Name 填 SAN，Last Name 填 ZHANG。填反了就会被拒，提交前务必核对一遍。",
      actions: [
        "登录后进入 Identity Verification / 身份认证页面。",
        "选择证件签发国（大陆选 China）和证件类型（ID Card 身份证或 Passport 护照）。",
        "英文姓名：Given Name 填拼音名，Family Name 填拼音姓。张三举例 → First: SAN，Last: ZHANG。",
        "上传证件正面和背面，找自然光，四角完整，文字清晰，不要反光遮字。",
        "在浏览器弹窗里允许摄像头权限，完成人脸识别。",
        "提交后等状态更新，通常几分钟内出结果。",
        "失败时看失败原因再改，姓名问题重填，照片问题重拍，不要随意猜测。"
      ],
      checks: [
        "英文姓名：Given Name（名字）在前，Family Name（姓氏）在后。",
        "证件四角完整、无反光、文字可读。",
        "摄像头权限已在浏览器弹窗层面允许，不只是 App 层面。"
      ],
      warnings: [
        "姓名顺序填反是被拒首因，提交前再看一遍 First Name / Last Name。",
        "截图、翻拍、美颜修过的证件照片会直接被拒，用原相机拍证件实物。"
      ]
    },
    {
      n: "03",
      t: "充值 USDT：选 TRC20，手续费最低",
      img: "/images/tutorials/pokepay/step-03.jpg",
      caption: "充值页截图：PokePay 不支持人民币直充，需先在交易所换好 USDT 再转入。",
      b: "PokePay 只接受加密货币充值（USDT、USDC、BTC、ETH），不能直接用人民币。没有境外交易所的话，先在欧易或币安用 C2C 功能买好 USDT，再转到 PokePay 钱包地址。开卡费折后约 7 美元，建议首次充 20-30 美元留有余量。",
      actions: [
        "登录后进入 Wallet → Recharge / Import，选择 USDT。",
        "网络优先选 TRC20（Tron 链），手续费约 1 美元，到账快，是最划算的路线。",
        "复制 PokePay 的 USDT 充值地址，核对前 4 位和后 4 位。",
        "没有境外交易所的话：打开欧易或币安 App → C2C 交易 → 用支付宝或微信买 USDT → 提币到上面的地址。",
        "提币时网络同样选 TRC20，两边必须一致。",
        "复制交易 TXID 保存，到账通常 2-5 分钟，超 30 分钟未到账时凭 TXID 找客服。",
        "刷新页面确认 Wallet 余额已更新。"
      ],
      checks: [
        "PokePay 充值地址和提币端地址一字不差。",
        "两端网络都是 TRC20，不能一端 TRC20 一端 ERC20。",
        "余额已到账，金额正确。"
      ],
      warnings: [
        "网络选错（如一端 TRC20 一端 ERC20）资产可能永久丢失，每次转账前反复核对网络。",
        "不要接受陌生人转来的 USDT，来源不明的资产可能导致账户被风控。"
      ]
    },
    {
      n: "04",
      t: "申请 PokeCard：邀请码自动抵扣开卡费",
      img: "/images/tutorials/pokepay/step-04.jpg",
      caption: "开卡页截图：通过邀请链接注册后系统发放折扣券，实付约 7 美元。",
      b: "PokeCard 虚拟卡原价 20 美元开卡费，通过邀请链接注册后系统会发放约 12.8 美元优惠券，实际只需约 7 美元。开卡后有效期 5 年，无月费，消费手续费 1%，跨境汇率转换 1%，每日限额最高 10 万港元。",
      actions: [
        "确认已通过邀请链接注册，邀请码 447963 已填入。",
        "进入 Card → Apply Card，选择 PokeCard 虚拟卡（Virtual Card）。",
        "支付页面确认优惠券是否已自动抵扣，正常显示约 7 美元而非原价 20 美元。",
        "确认扣费来源是钱包余额，余额不足先补充值。",
        "阅读并同意卡片服务条款，点击确认申请。",
        "等待卡片生成，通常几分钟内完成。",
        "进入 My Card 查看卡片状态是否为 Active。"
      ],
      checks: [
        "开卡费显示折后价约 7 美元，不是原价 20 美元。",
        "卡片生成后状态为 Active，不是 Pending。",
        "能进入卡片详情页查看卡号区域。"
      ],
      warnings: [
        "优惠券只有通过邀请链接注册的账号才有，直接官网注册没有折扣。",
        "实体卡开卡费 88 美元，建议先开虚拟卡用几个月再决定要不要实体卡。"
      ]
    },
    {
      n: "05",
      t: "激活并查看卡片详情",
      img: "/images/tutorials/pokepay/step-05.jpg",
      caption: "卡片详情截图：激活后才能查看卡号信息。",
      b: "卡片生成后先激活，再查看卡号、有效期、CVV 和持卡人名。这里要像保管实体信用卡一样保管信息。",
      actions: [
        "进入 My Card，点击刚申请的卡。",
        "按页面提示 Activate。",
        "完成短信、邮箱或 App 验证。",
        "查看卡号、有效期、CVV。",
        "复制账单信息备用。",
        "打开交易通知和锁卡入口。",
        "不要把完整卡号发给客服以外的人。"
      ],
      checks: [
        "卡片状态 Active。",
        "能看到卡号、有效期、CVV。",
        "锁卡功能位置已确认。"
      ],
      warnings: [
        "连续输错 CVV、有效期或 PIN 会锁卡。",
        "卡号泄露后退款/争议处理会很麻烦。"
      ]
    },
    {
      n: "06",
      t: "小额试刷和 3DS 验证",
      img: "/images/tutorials/pokepay/step-06.jpg",
      caption: "消费验证截图：先试小额，再绑定长期订阅。",
      b: "别一开卡就拿去大额订阅。先跑通小额订单，确认余额、3DS、短信和商户接受情况。",
      actions: [
        "选择 1 到 5 美元或等值小额商户。",
        "填写卡号、有效期、CVV 和账单地址。",
        "遇到 3DS 时按页面跳转完成验证。",
        "回 PokePay 查看是否成功扣款。",
        "记录扣款币种、手续费、汇率。",
        "失败时看错误提示，不要连续重复刷同一个商户。"
      ],
      checks: [
        "交易记录能看到授权或扣款。",
        "3DS 可以正常完成。",
        "手续费和汇率在预期范围。"
      ],
      warnings: [
        "有些商户会先预授权再结算。",
        "连续失败可能触发商户和卡片双重风控。"
      ]
    },
    {
      n: "07",
      t: "绑定 PayPal / 支付平台并处理退款",
      img: "/images/tutorials/pokepay/step-07.jpg",
      caption: "绑卡截图：支付平台支持会随卡段变化。",
      b: "PokePay 常见用法是 PayPal、Apple Store、海外订阅和部分平台绑卡。绑定前先看当前卡段支持列表。",
      actions: [
        "在 PayPal 或目标平台选择添加信用卡 / 借记卡。",
        "输入卡号、有效期、CVV 和账单地址。",
        "如平台扣验证小额，等记录出现后再确认。",
        "订阅服务先用月付，观察一次续费。",
        "退款时记录商户退款时间和 PokePay 入账时间。",
        "长时间未入账时带订单号、ARN 或商户退款凭证联系支持。"
      ],
      checks: [
        "支付平台显示卡片已验证。",
        "订阅扣款成功且 PokePay 有记录。",
        "退款知道查询路径。"
      ],
      warnings: [
        "线上平台退款常见 3 到 10 个工作日，跨境退款可能更久。",
        "如果平台提示地区、KYC 或风控原因，先保存提示文案再联系客服。"
      ]
    }
  ],
  "roogoo": [
    {
      n: "01",
      t: "通过邀请链接注册并保留邀请码",
      img: "/images/tutorials/roogoo/step-01.jpg",
      caption: "注册页截图：邀请码 0eq357 不要删，影响折扣和返现。",
      b: "先点本页「立即申请」，使用邀请链接进入注册页，邀请码 0eq357 会自动填入。填入邀请码可享 $3.3 开卡费折扣 + 激活后 $10 返现到卡。",
      actions: [
        "先点击本页上方「立即申请」，使用邀请链接：https://wap.roogoo.cloud/register?inviteCode=0eq357。",
        "页面邀请码栏会自动填入 0eq357，不要删除。",
        "填写邮箱，设置密码。",
        "完成邮箱验证码。",
        "注册后进入 dashboard。"
      ],
      checks: [
        "注册时邀请码显示 0eq357。",
        "能登录 dashboard。",
        "邮箱能收到系统邮件。"
      ],
      warnings: [
        "删除邀请码后折扣和返现无法补救。",
        "只从 wap.roogoo.cloud 官方地址注册，不要从非官方短链接进入。"
      ]
    },
    {
      n: "02",
      t: "认识 Dashboard：资金账户和卡片余额是两个口袋",
      img: "/images/tutorials/roogoo/step-02.jpg",
      caption: "Dashboard 截图：Asset Account 是资金池，Card Balance 是消费余额，充值进来的钱要手动 Top-up 到卡片才能刷。",
      b: "注册完成后登录 wap.roogoo.cloud/dashboard。Roogoo 是 PWA 网页应用，建议在 Safari 或 Chrome 里添加到主屏幕当 App 用。最关键的一点：Asset Account（资金账户）和 Card Balance（卡片余额）是分开的，充值进来的 USDT 先进资金账户，后面还要单独 Top-up 到卡片才能消费。",
      actions: [
        "用浏览器打开 wap.roogoo.cloud，登录后进入 Dashboard。",
        "在浏览器菜单里选添加到主屏幕，方便日后直接打开。",
        "找到 Asset Account 区域：这里显示充进来的 USDT 余额，不含卡片余额。",
        "找到 Deposit（充币）、Withdraw（提币）、Transfer（转账）入口。",
        "找到 Cards 或 Card Management 菜单，管理虚拟卡用。",
        "找到 Help / Support 客服入口，截图保存备用。"
      ],
      checks: [
        "能看到 Asset Account 余额区域（即使是 0）。",
        "Cards 管理入口能正常点开。",
        "页面地址是 wap.roogoo.cloud，不是其他域名。"
      ],
      warnings: [
        "Asset Account 里的钱不能直接刷卡，必须先 Top-up 到具体卡片才能消费。",
        "PWA 登录状态存在浏览器里，换浏览器或清除缓存后需要重新登录。"
      ]
    },
    {
      n: "03",
      t: "充值 USDT：首次备足 100 USDT 最省事",
      img: "/images/tutorials/roogoo/step-03.jpg",
      caption: "充值页截图：TRC20 或 SOL 链到账约 2 分钟，首次建议备 100 USDT 覆盖开卡费和首次 Top-up。",
      b: "开卡前必须先往 Asset Account 充值。Roogoo 开卡费约 16.6-19.9 美元，首次 Top-up 到卡建议 50 美元，合计约需 70 美元。为了中途不卡顿，建议首次充值 100 USDT。支持 TRC20（Tron）和 SOL（Solana）两条链，到账约 2 分钟。",
      actions: [
        "进入 Dashboard → Deposit，选择 USDT。",
        "选充值网络：TRC20（Tron）或 SOL（Solana），两者手续费都低，到账约 2 分钟。",
        "也可选站内收款：让另一个 Roogoo 用户直接站内转账给你，0 网络手续费。",
        "复制 Roogoo 充值地址，核对前 4 位和后 4 位。",
        "去交易所提币，提币端选和 Roogoo 一致的网络（TRC20 对 TRC20，SOL 对 SOL）。",
        "首次建议充 100 USDT：17-20 美元开卡费 + 50 美元首次卡片充值 + 少量余量。",
        "等 2-5 分钟，刷新 Dashboard 确认 Asset Account 余额增加。"
      ],
      checks: [
        "Roogoo 充值网络和交易所提币网络完全一致（都是 TRC20 或都是 SOL）。",
        "Asset Account 余额已更新，金额正确。",
        "余额足够覆盖开卡费加首次卡片 Top-up。"
      ],
      warnings: [
        "网络选错（如一端 TRC20 一端 ERC20）资产大概率丢失，每次操作前都要对一遍。",
        "只充刚好够开卡费会导致后面 Top-up 不够用，多备一点更稳。"
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
      t: "确认 Krak App 和开卡入口",
      img: "/images/tutorials/kraken-card/step-01.jpg",
      caption: "Krak 入口截图：Krak Card 当前主要面向 UK / EEA 用户。",
      b: "Krak Card 是 Kraken 新的消费卡入口，不是老式交易所卡片页面。先确认你用的是 Krak App，并且首页能看到 Everyday account。",
      actions: [
        "安装或更新 Krak App。",
        "登录 Kraken / Krak 账户。",
        "完成个人 KYC。",
        "确认账户资料已完成到页面要求的级别。",
        "打开 Everyday account。",
        "确认页面有 card icon 或卡片弹窗。"
      ],
      checks: [
        "Krak App 已登录。",
        "KYC 通过。",
        "Everyday account 可用。"
      ],
      warnings: [
        "如果没有开卡入口，先更新 App，再检查账户状态。",
        "Krak Card 和普通 Kraken Pro 交易页不是同一个入口。"
      ]
    },
    {
      n: "02",
      t: "进入 Everyday Account 开卡",
      img: "/images/tutorials/kraken-card/step-02.jpg",
      caption: "Everyday account 截图：点击右上角卡片图标。",
      b: "官方步骤很短，但真实操作路径是：Home 中间的 Everyday account，再进入卡片图标。",
      actions: [
        "打开 Krak App 首页。",
        "点击中间的 Everyday account。",
        "点击右上角 card icon。",
        "阅读弹出的 Krak Card 说明。",
        "选择是否立即创建虚拟卡。",
        "如果没有弹窗，检查地区、版本和 KYC 状态。"
      ],
      checks: [
        "看到 Krak Card 申请弹窗。",
        "可以继续选择卡面颜色。",
        "没有被提示暂不可用。"
      ],
      warnings: [
        "部分账户需要等待功能开放。",
        "老版本 App 可能没有入口。"
      ]
    },
    {
      n: "03",
      t: "创建虚拟卡",
      img: "/images/tutorials/kraken-card/step-03.jpg",
      caption: "虚拟卡创建截图：选择 Coral 或 Black。",
      b: "Krak Card 先创建虚拟卡。创建后就可以线上使用，也可以添加到手机钱包。",
      actions: [
        "选择 Krak Coral 或 Krak Black。",
        "阅读 Krak Card terms of service。",
        "点击 Continue。",
        "等待卡片创建。",
        "查看虚拟卡号、有效期和安全码。",
        "记录账单信息和卡片状态。"
      ],
      checks: [
        "虚拟卡显示 ready to use。",
        "能打开卡片详情。",
        "能进入钱包绑定按钮。"
      ],
      warnings: [
        "虚拟卡不是一次性卡。",
        "30 天滚动周期内虚拟卡数量有限。"
      ]
    },
    {
      n: "04",
      t: "添加 Apple Pay / Google Pay",
      img: "/images/tutorials/kraken-card/step-04.jpg",
      caption: "钱包绑定截图：创建后可添加到手机或手表。",
      b: "Krak Card 的核心体验之一是直接放进手机钱包，用于线下和线上 tap-to-pay。",
      actions: [
        "在卡片详情中点击 Add to Apple Wallet 或 Add to Google Wallet。",
        "选择添加到手机或手表。",
        "按系统提示接受设备服务条款。",
        "完成设备验证。",
        "打开钱包 App 确认卡片出现。",
        "先做小额线下或线上测试。"
      ],
      checks: [
        "钱包里能看到 Krak Card。",
        "设备验证完成。",
        "小额支付成功。"
      ],
      warnings: [
        "钱包支持取决于国家、设备和 App 版本。",
        "线下支付前确认实体店接受 Mastercard / contactless。"
      ]
    },
    {
      n: "05",
      t: "设置消费资产顺序",
      img: "/images/tutorials/kraken-card/step-05.jpg",
      caption: "资产顺序截图：Krak Card 可从多种现金和加密资产扣款。",
      b: "Krak Card 可以从 Everyday account 中的现金和 400+ 资产消费。关键是设置优先扣哪种资产。",
      actions: [
        "进入 Card spending settings。",
        "查看可用于消费的现金和 crypto 资产。",
        "把你想优先使用的现金或稳定资产排在前面。",
        "把不想动的长期持仓从消费顺序里移除或放后面。",
        "确认资产不足时是否允许组合扣款。",
        "做一笔小额测试看扣款记录。"
      ],
      checks: [
        "扣款顺序符合预期。",
        "不想消费的资产不会被自动卖出。",
        "交易记录显示用了哪些资产。"
      ],
      warnings: [
        "用加密资产消费可能触发税务事件。",
        "自动换汇/换币存在 spread。"
      ]
    },
    {
      n: "06",
      t: "实体卡、安全和返现",
      img: "/images/tutorials/kraken-card/step-06.jpg",
      caption: "实体卡和设置截图：实体卡、冻结、PIN、返现都在 App 内管理。",
      b: "虚拟卡跑通后再考虑实体卡。日常使用要理解冻结、PIN、返现 pending 和资产等级。",
      actions: [
        "需要实体卡时点击 Yes, get the physical card。",
        "选择显示姓名并确认收货地址。",
        "等待邮寄，通常约 14 个工作日。",
        "收到后按 App 提示激活并设置 PIN。",
        "在安全设置里熟悉 freeze / unfreeze。",
        "查看 cashback 规则：最高返现按 30 天平均资产分档。",
        "商户 finalizes transaction 后返现才从 pending 变为到账。"
      ],
      checks: [
        "知道冻结入口。",
        "知道 PIN 管理入口。",
        "明白返现不是下单瞬间到账。"
      ],
      warnings: [
        "第三方 ATM 可能收费。",
        "Metal Card 和最高返现需要较高平均资产门槛。"
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
