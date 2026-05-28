(() => {
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
  if (target) target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
};
const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
const tutorialAnchor = step => `tutorial-step-${step.n}`;
const fundingAnchor = index => `funding-item-${String(index + 1).padStart(2, "0")}`;
const CARD_CLICK_FLOWS = {
  "bybit-card": ["打开 Bybit App", "首页点 More / 更多", "Finance / 金融", "Card", "Activate / Apply Now", "选择哈萨克斯坦", "填写地址和用途", "绑定手机号", "提交审核", "查看虚拟卡"],
  "bybit-eu-card": ["打开 Bybit EU", "Finance / 金融", "Card", "Apply", "选择德国 / 法国等 EU 地区", "上传身份材料", "提交地址证明", "设置安全项", "提交申请", "启用虚拟卡"],
  "safepal-card": ["打开 SafePal", "底部 Bank", "Get Started", "Next", "Mint My Account NFT", "Register", "填写资料", "打开 ReadID", "扫护照和 NFC", "等待审核", "Activate Card"],
  "pokepay": ["打开 Pokepay", "注册 / 登录", "填写邀请码", "Account / KYC", "上传证件和自拍", "Wallet / Deposit", "USDT TRC20 充值", "Cards / PokeCard", "Apply", "支付开卡费", "View Card"],
  "roogoo": ["打开 Roogoo Dashboard", "Assets", "Deposit USDT", "选择 TRC20", "Account / Verification", "完成 Sumsub KYC", "Cards", "Apply Card", "选择卡片", "Transfer to Card", "View Details"],
  "kraken-card": ["打开 Krak App", "Profile / KYC", "上传证件", "上传地址证明", "Everyday Account", "Card", "Apply", "确认条款", "View Virtual Card", "Add to Apple Pay / Google Pay"]
};
const requiresPassport = card => [card.idType, card.lead, card.regions, ...(card.pros || []), ...(card.cons || [])].filter(Boolean).join(" ").includes("护照");
const CURRENCY_SYMBOLS = {
  USD: "$",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  HKD: "HK$",
  SGD: "S$",
  TWD: "NT$",
  KRW: "₩",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "$",
  CHF: "CHF",
  PLN: "zł",
  NOK: "kr",
  SEK: "kr",
  DKK: "kr",
  THB: "฿",
  VND: "₫",
  PHP: "₱",
  IDR: "Rp",
  MYR: "RM",
  ZAR: "R",
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  KWD: "KWD",
  ILS: "₪",
  UAH: "₴",
  KZT: "₸",
  COP: "COP",
  CLP: "CLP",
  PEN: "S/",
  TRY: "TRY",
  ARS: "ARS",
  CRC: "CRC",
  UYU: "UYU",
  RSD: "RSD",
  IQD: "IQD"
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
  }
};
const GIFT_REGION_AMOUNT_OVERRIDES = {
  battlenet: {
    MX: {
      min: 60,
      presets: [60, 120, 250, 500, 1000]
    },
    AR: {
      min: 20,
      presets: [20, 100, 500, 1000, 2000]
    },
    CL: {
      min: 2400,
      presets: [2400, 5000, 10000, 25000, 50000]
    }
  }
};
function currencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || "";
}
function amountModelFor(slug, region) {
  const base = GIFT_AMOUNT_MODELS[slug] || GIFT_AMOUNT_MODELS.apple;
  const regionPatch = (GIFT_REGION_AMOUNT_OVERRIDES[slug] || {})[region.code] || {};
  return {
    ...base,
    ...regionPatch
  };
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
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2
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
function TutorialStep({
  step,
  anchorId
}) {
  const actions = asArray(step.actions);
  const checks = asArray(step.checks);
  const warnings = asArray(step.warnings || step.warn);
  const pathFor = item => {
    if (typeof item !== "string" || !item.includes("→")) return [];
    return item.split("→").map(part => part.trim()).filter(Boolean);
  };
  return React.createElement("li", {
    className: "step",
    id: anchorId
  }, React.createElement("div", {
    className: "step-num"
  }, step.n), React.createElement("div", {
    className: "step-body"
  }, React.createElement("div", {
    className: "step-copy"
  }, React.createElement("h3", {
    className: "step-title"
  }, step.t), React.createElement("p", {
    className: "step-text"
  }, step.b), actions.length > 0 && React.createElement("div", {
    className: "step-actions-wrap"
  }, React.createElement("div", {
    className: "step-actions-title"
  }, "\u7167\u7740\u70B9"), React.createElement("ol", {
    className: "step-actions"
  }, actions.map((item, i) => {
    const path = pathFor(item);
    return React.createElement("li", {
      key: i
    }, React.createElement("span", {
      className: "step-action-index"
    }, "\u7B2C ", String(i + 1).padStart(2, "0"), " \u6B65"), React.createElement("span", {
      className: "step-action-text"
    }, item), path.length > 1 && React.createElement("span", {
      className: "step-click-path",
      "aria-label": "\u70B9\u51FB\u8DEF\u5F84"
    }, React.createElement("b", null, "\u70B9\u51FB\u8DEF\u5F84"), path.map((part, pi) => React.createElement(React.Fragment, {
      key: `${part}-${pi}`
    }, pi > 0 && React.createElement("em", null, "-"), React.createElement("span", null, part)))));
  }))), checks.length > 0 && React.createElement("div", {
    className: "step-callout step-callout--ok"
  }, React.createElement("strong", null, "\u68C0\u67E5\u70B9"), React.createElement("ul", null, checks.map((item, i) => React.createElement("li", {
    key: i
  }, item)))), warnings.length > 0 && React.createElement("div", {
    className: "step-callout step-callout--warn"
  }, React.createElement("strong", null, "\u7EC6\u8282\u8865\u5145"), React.createElement("ul", null, warnings.map((item, i) => React.createElement("li", {
    key: i
  }, item)))))));
}
function FundingBlock({
  item,
  anchorId
}) {
  const actions = asArray(item.actions);
  const checks = asArray(item.checks);
  const warnings = asArray(item.warnings || item.warn);
  return React.createElement("article", {
    className: "funding-card",
    id: anchorId
  }, React.createElement("div", {
    className: "funding-copy"
  }, React.createElement("h3", {
    className: "funding-title"
  }, item.t), React.createElement("p", {
    className: "funding-text"
  }, item.b), actions.length > 0 && React.createElement("ul", {
    className: "funding-actions"
  }, actions.map((action, i) => React.createElement("li", {
    key: i
  }, action))), checks.length > 0 && React.createElement("div", {
    className: "funding-note"
  }, React.createElement("strong", null, "\u786E\u8BA4"), React.createElement("ul", null, checks.map((check, i) => React.createElement("li", {
    key: i
  }, check)))), warnings.length > 0 && React.createElement("div", {
    className: "funding-note funding-note--warn"
  }, React.createElement("strong", null, "\u6CE8\u610F"), React.createElement("ul", null, warnings.map((warning, i) => React.createElement("li", {
    key: i
  }, warning))))));
}
function PassportGuideSidebar() {
  return React.createElement("aside", {
    className: "passport-guide",
    "aria-label": "\u62A4\u7167\u529E\u7406\u6559\u7A0B"
  }, React.createElement("div", {
    className: "passport-guide-head"
  }, React.createElement("div", {
    className: "ca-kicker"
  }, "\u62A4\u7167\u529E\u7406\u6559\u7A0B"), React.createElement("h3", null, "\u666E\u901A\u62A4\u7167\u4FDD\u59C6\u7EA7\u529E\u7406\u6D41\u7A0B"), React.createElement("p", null, "\u6309\u7B2C\u4E00\u6B21\u529E\u7406\u6765\u5199\uFF0C\u6362\u53D1\u3001\u8865\u53D1\u4E5F\u80FD\u7167\u7740\u51C6\u5907\u3002\u91CD\u70B9\u662F\u9884\u7EA6\u3001\u7167\u7247\u3001\u73B0\u573A\u6392\u961F\u3001\u56DE\u6267\u548C\u53D6\u8BC1\u3002"), React.createElement("div", {
    className: "passport-facts"
  }, React.createElement("span", null, "\u5DE5\u672C\u8D39 120 \u5143/\u672C"), React.createElement("span", null, "\u6237\u7C4D\u5730 7 \u4E2A\u5DE5\u4F5C\u65E5\u5DE6\u53F3"), React.createElement("span", null, "\u8DE8\u7701\u5F02\u5730\u7EA6 20 \u65E5"), React.createElement("span", null, "\u6210\u4EBA\u62A4\u7167\u6709\u6548\u671F 10 \u5E74"))), React.createElement("ol", {
    className: "passport-steps"
  }, React.createElement("li", null, React.createElement("strong", null, "1. \u5148\u786E\u5B9A\u5728\u54EA\u529E"), React.createElement("span", null, "\u4F18\u5148\u9009\u79BB\u4F60\u6700\u8FD1\u7684\u516C\u5B89\u51FA\u5165\u5883\u5927\u5385\u3002\u5185\u5730\u5C45\u6C11\u666E\u901A\u62A4\u7167\u53EF\u5168\u56FD\u901A\u529E\uFF0C\u4F46\u6BCF\u4E2A\u57CE\u5E02\u7684\u9884\u7EA6\u5165\u53E3\u3001\u653E\u53F7\u65F6\u95F4\u3001\u5468\u516D\u662F\u5426\u529E\u516C\u4E0D\u4E00\u6837\uFF0C\u5148\u5728\u5730\u56FE\u641C\u201C\u51FA\u5165\u5883\u63A5\u5F85\u5927\u5385\u201D\uFF0C\u518D\u53BB\u5B98\u65B9\u5165\u53E3\u9884\u7EA6\u3002")), React.createElement("li", null, React.createElement("strong", null, "2. \u6253\u5F00\u9884\u7EA6\u5165\u53E3"), React.createElement("span", null, "\u5FAE\u4FE1/\u652F\u4ED8\u5B9D\u641C\u201C\u79FB\u6C11\u5C40 12367\u201D\uFF0C\u8FDB\u5165\u540E\u70B9\u201C\u4E2D\u56FD\u516C\u6C11\u670D\u52A1\u201D\u6216\u201C\u51FA\u5165\u5883\u8BC1\u4EF6\u9884\u7EA6\u201D\u3002\u6709\u4E9B\u57CE\u5E02\u4E5F\u80FD\u7528\u672C\u5730\u516C\u5B89\u51FA\u5165\u5883\u516C\u4F17\u53F7\u3001\u7CA4\u7701\u4E8B\u3001\u968F\u7533\u529E\u3001\u653F\u52A1\u670D\u52A1\u5C0F\u7A0B\u5E8F\u9884\u7EA6\u3002")), React.createElement("li", null, React.createElement("strong", null, "3. \u9009\u62E9\u529E\u8BC1\u4E8B\u9879"), React.createElement("span", null, "\u7B2C\u4E00\u6B21\u529E\u9009\u201C\u666E\u901A\u62A4\u7167\u9996\u6B21\u7533\u8BF7\u201D\uFF1B\u5FEB\u5230\u671F\u3001\u7B7E\u8BC1\u9875\u5FEB\u7528\u5B8C\u9009\u201C\u6362\u53D1\u201D\uFF1B\u9057\u5931\u3001\u88AB\u76D7\u3001\u635F\u6BC1\u9009\u201C\u8865\u53D1\u201D\uFF1B\u59D3\u540D\u7B49\u8BB0\u8F7D\u4E8B\u9879\u53D8\u5316\u624D\u9009\u201C\u52A0\u6CE8\u201D\u3002\u4E8B\u9879\u9009\u9519\uFF0C\u5230\u7A97\u53E3\u53EF\u80FD\u4F1A\u8BA9\u4F60\u91CD\u65B0\u53D6\u53F7\u3002")), React.createElement("li", null, React.createElement("strong", null, "4. \u586B\u9884\u7EA6\u4FE1\u606F"), React.createElement("span", null, "\u6309\u9875\u9762\u586B\u6237\u7C4D\u5730\u3001\u73B0\u5C45\u5730\u3001\u9884\u7EA6\u5927\u5385\u3001\u9884\u7EA6\u65E5\u671F\u3001\u9884\u7EA6\u65F6\u6BB5\u3001\u524D\u5F80\u56FD\u5BB6/\u5730\u533A\u3001\u7533\u8BF7\u4E8B\u7531\u3001\u624B\u673A\u53F7\u548C\u9886\u8BC1\u65B9\u5F0F\u3002\u4FE1\u606F\u63D0\u4EA4\u524D\u6838\u5BF9\u8EAB\u4EFD\u8BC1\u53F7\u3001\u59D3\u540D\u62FC\u97F3\u548C\u624B\u673A\u53F7\uFF0C\u624B\u673A\u53F7\u540E\u9762\u4F1A\u6536\u8FDB\u5EA6\u77ED\u4FE1\u3002")), React.createElement("li", null, React.createElement("strong", null, "5. \u51C6\u5907\u8EAB\u4EFD\u8BC1"), React.createElement("span", null, "\u6210\u5E74\u4EBA\u5E26\u5C45\u6C11\u8EAB\u4EFD\u8BC1\u539F\u4EF6\u3002\u8EAB\u4EFD\u8BC1\u6B63\u5728\u6362\u9886\u3001\u8865\u9886\u7684\uFF0C\u5E26\u4E34\u65F6\u5C45\u6C11\u8EAB\u4EFD\u8BC1\u3002\u591A\u6570\u666E\u901A\u6210\u5E74\u4EBA\u9996\u6B21\u529E\u7406\u4E0D\u7528\u518D\u5E26\u6237\u53E3\u7C3F\uFF0C\u4F46\u5F53\u5730\u7A97\u53E3\u53E6\u6709\u8981\u6C42\u65F6\u6309\u5F53\u5730\u8981\u6C42\u6765\u3002")), React.createElement("li", null, React.createElement("strong", null, "6. \u7167\u7247\u548C\u56DE\u6267\u8FD9\u6837\u5904\u7406"), React.createElement("span", null, "\u7167\u7247\u662F\u6700\u5BB9\u6613\u8FD4\u5DE5\u7684\u5730\u65B9\u3002\u6700\u7A33\u7684\u662F\u5230\u529E\u8BC1\u5927\u5385\u73B0\u573A\u62CD\uFF1B\u60F3\u8282\u7701\u6392\u961F\u65F6\u95F4\uFF0C\u53EF\u4EE5\u63D0\u524D\u53BB\u5B98\u65B9\u8BA4\u53EF\u7167\u76F8\u70B9\u62CD\uFF0C\u62FF\u201C\u51FA\u5165\u5883\u8BC1\u4EF6\u6570\u5B57\u76F8\u7247\u91C7\u96C6\u56DE\u6267\u201D\u3002\u4E0D\u8981\u7F8E\u989C\u3001\u6EE4\u955C\u3001\u7FFB\u62CD\u3001\u955C\u9762\u7167\u3001\u6D53\u5986\u3001\u5E3D\u5B50\u3001\u6709\u8272\u955C\u7247\uFF0C\u5934\u53D1\u4E0D\u8981\u6321\u7709\u773C\u3002")), React.createElement("li", null, React.createElement("strong", null, "7. \u5206\u60C5\u51B5\u8865\u6750\u6599"), React.createElement("span", null, "\u6362\u53D1\u5E26\u65E7\u62A4\u7167\uFF1B\u8865\u53D1\u51C6\u5907\u9057\u5931\u3001\u88AB\u76D7\u6216\u635F\u6BC1\u60C5\u51B5\u8BF4\u660E\uFF1B\u672A\u6EE1 16 \u5468\u5C81\u7531\u76D1\u62A4\u4EBA\u966A\u540C\uFF0C\u5E76\u5E26\u51FA\u751F\u8BC1\u660E\u6216\u6237\u53E3\u7C3F\u7B49\u76D1\u62A4\u5173\u7CFB\u8BC1\u660E\u3001\u76D1\u62A4\u4EBA\u8EAB\u4EFD\u8BC1\u660E\uFF1B\u767B\u8BB0\u5907\u6848\u4EBA\u5458\u548C\u73B0\u5F79\u519B\u4EBA\u63D0\u524D\u51C6\u5907\u5355\u4F4D\u6216\u4E3B\u7BA1\u90E8\u95E8\u540C\u610F\u610F\u89C1\u3002")), React.createElement("li", null, React.createElement("strong", null, "8. \u5230\u573A\u524D\u68C0\u67E5\u4E00\u904D"), React.createElement("span", null, "\u51FA\u95E8\u524D\u786E\u8BA4\u8EAB\u4EFD\u8BC1\u3001\u9884\u7EA6\u8BB0\u5F55\u3001\u7167\u7247\u56DE\u6267\u3001\u65E7\u62A4\u7167\u6216\u8865\u5145\u6750\u6599\u90FD\u5728\u3002\u5EFA\u8BAE\u63D0\u524D 15-30 \u5206\u949F\u5230\uFF0C\u8282\u5047\u65E5\u524D\u540E\u4EBA\u591A\uFF1B\u6CA1\u62CD\u7167\u7684\u5148\u53BB\u62CD\u7167\u673A\u6216\u7167\u76F8\u7A97\u53E3\uFF0C\u62CD\u5B8C\u518D\u53D6\u53F7\u3002")), React.createElement("li", null, React.createElement("strong", null, "9. \u8FDB\u5927\u5385\u540E\u7684\u987A\u5E8F"), React.createElement("span", null, "\u5E38\u89C1\u987A\u5E8F\u662F\uFF1A\u62CD\u7167\u6216\u53D6\u7167\u7247\u56DE\u6267 \u2192 \u81EA\u52A9\u586B\u8868/\u6253\u5370\u7533\u8BF7\u8868 \u2192 \u53D6\u53F7 \u2192 \u7B49\u53EB\u53F7 \u2192 \u7A97\u53E3\u4EA4\u6750\u6599\u3002\u5927\u5385\u5E03\u5C40\u4E0D\u540C\uFF0C\u4F46\u770B\u201C\u7167\u76F8\u3001\u586B\u8868\u3001\u53D6\u53F7\u3001\u53D7\u7406\u201D\u8FD9\u51E0\u4E2A\u724C\u5B50\u8D70\u5C31\u884C\u3002")), React.createElement("li", null, React.createElement("strong", null, "10. \u7A97\u53E3\u6838\u9A8C"), React.createElement("span", null, "\u7A97\u53E3\u4F1A\u6838\u5BF9\u8EAB\u4EFD\u8BC1\u3001\u7167\u7247\u3001\u7533\u8BF7\u8868\u548C\u8865\u5145\u6750\u6599\uFF0C\u5E76\u786E\u8BA4\u672C\u4EBA\u529E\u7406\u3002\u88AB\u95EE\u7533\u8BF7\u4E8B\u7531\u65F6\uFF0C\u6309\u771F\u5B9E\u7528\u9014\u8BF4\uFF0C\u6BD4\u5982\u65C5\u6E38\u3001\u63A2\u4EB2\u3001\u7559\u5B66\u3001\u5546\u52A1\u3001\u5DE5\u4F5C\u7B49\uFF0C\u548C\u9884\u7EA6\u91CC\u586B\u5199\u7684\u5185\u5BB9\u4FDD\u6301\u4E00\u81F4\u3002")), React.createElement("li", null, React.createElement("strong", null, "11. \u5F55\u6307\u7EB9\u548C\u7B7E\u540D"), React.createElement("span", null, "\u7A97\u53E3\u53D7\u7406\u65F6\u4F1A\u91C7\u96C6\u4EBA\u50CF\u3001\u6307\u7EB9\u548C\u7B7E\u540D\u3002\u7B7E\u540D\u5199\u5728\u6307\u5B9A\u6846\u5185\uFF0C\u4E0D\u8981\u538B\u7EBF\u3001\u8FDE\u5230\u8FB9\u6846\uFF1B\u6307\u7EB9\u6309\u5DE5\u4F5C\u4EBA\u5458\u63D0\u793A\u5F55\u5165\u3002\u5982\u679C\u624B\u6307\u53D7\u4F24\u3001\u8131\u76AE\u6216\u5F55\u4E0D\u4E0A\uFF0C\u73B0\u573A\u8BF4\u660E\u5373\u53EF\u3002")), React.createElement("li", null, React.createElement("strong", null, "12. \u7F34\u8D39\u548C\u62FF\u56DE\u6267"), React.createElement("span", null, "\u666E\u901A\u62A4\u7167\u5DE5\u672C\u8D39 120 \u5143/\u672C\uFF0C\u73B0\u573A\u4E00\u822C\u652F\u6301\u626B\u7801\u6216\u5237\u5361\u3002\u7F34\u8D39\u540E\u62FF\u597D\u53D7\u7406\u56DE\u6267\uFF0C\u4E0A\u9762\u6709\u53D7\u7406\u7F16\u53F7\u3001\u9884\u8BA1\u53D6\u8BC1\u65E5\u671F\u3001\u67E5\u8BE2\u65B9\u5F0F\u3001\u53D6\u8BC1\u65B9\u5F0F\uFF0C\u540E\u9762\u67E5\u8FDB\u5EA6\u548C\u53D6\u8BC1\u90FD\u9760\u5B83\u3002")), React.createElement("li", null, React.createElement("strong", null, "13. \u9009\u62E9\u81EA\u53D6\u6216\u90AE\u5BC4"), React.createElement("span", null, "\u4E0D\u6025\u53EF\u4EE5\u9009\u90AE\u5BC4\u5230\u5BB6\uFF0C\u7701\u5F97\u518D\u8DD1\u4E00\u8D9F\uFF1B\u6025\u7528\u5C31\u770B\u5F53\u5730\u7A97\u53E3\u81EA\u53D6\u901F\u5EA6\u3002\u90AE\u5BC4\u53E6\u4ED8\u90AE\u8D39\uFF0C\u5730\u5740\u8981\u5199\u80FD\u7B7E\u6536\u7684\u5730\u5740\uFF0C\u522B\u5199\u4E34\u65F6\u4F4F\u5904\u6216\u6536\u4E0D\u5230\u7535\u8BDD\u7684\u5730\u65B9\u3002")), React.createElement("li", null, React.createElement("strong", null, "14. \u7B49\u5F85\u548C\u67E5\u8FDB\u5EA6"), React.createElement("span", null, "\u6237\u7C4D\u5730\u4E00\u822C 7 \u4E2A\u5DE5\u4F5C\u65E5\u5DE6\u53F3\uFF0C\u8DE8\u7701\u5F02\u5730\u4E00\u822C 20 \u65E5\u5DE6\u53F3\u3002\u53EF\u4EE5\u7528\u201C\u79FB\u6C11\u5C40 12367\u201D\u6216\u5F53\u5730\u51FA\u5165\u5883\u5165\u53E3\u67E5\u8FDB\u5EA6\u3002\u8282\u5047\u65E5\u3001\u8865\u6750\u6599\u3001\u51FD\u67E5\u3001\u90AE\u5BC4\u65F6\u95F4\u53EF\u80FD\u8BA9\u5B9E\u9645\u62FF\u8BC1\u66F4\u665A\u3002")), React.createElement("li", null, React.createElement("strong", null, "15. \u52A0\u6025\u600E\u4E48\u5904\u7406"), React.createElement("span", null, "\u52A0\u6025\u4E0D\u662F\u60F3\u52A0\u5C31\u52A0\uFF0C\u901A\u5E38\u8981\u6709\u7D27\u6025\u51FA\u5883\u7406\u7531\uFF0C\u6BD4\u5982\u5954\u4E27\u3001\u63A2\u671B\u5371\u91CD\u75C5\u4EBA\u3001\u7B7E\u8BC1\u6216\u5165\u5883\u8BB8\u53EF\u5373\u5C06\u5230\u671F\u3001\u7D27\u6025\u4F1A\u8BAE\u8C08\u5224\u3001\u7559\u5B66\u62A5\u5230\u4E34\u8FD1\u7B49\uFF0C\u5E76\u6309\u7A97\u53E3\u8981\u6C42\u63D0\u4EA4\u8BC1\u660E\u6750\u6599\u3002")), React.createElement("li", null, React.createElement("strong", null, "16. \u62FF\u5230\u62A4\u7167\u540E\u68C0\u67E5"), React.createElement("span", null, "\u5F53\u573A\u6838\u5BF9\u59D3\u540D\u3001\u62FC\u97F3\u3001\u6027\u522B\u3001\u51FA\u751F\u65E5\u671F\u3001\u51FA\u751F\u5730\u3001\u7B7E\u53D1\u5730\u3001\u6709\u6548\u671F\u3002\u94F6\u884C\u5361\u6216\u6D77\u5916\u5E73\u53F0 KYC \u586B\u82F1\u6587\u540D\u65F6\uFF0C\u6309\u62A4\u7167\u62FC\u97F3\u6765\uFF0C\u5927\u5C0F\u5199\u65E0\u6240\u8C13\uFF0C\u62FC\u5199\u4E0D\u8981\u5DEE\u4E00\u4E2A\u5B57\u6BCD\u3002")), React.createElement("li", null, React.createElement("strong", null, "17. \u540E\u7EED\u4FDD\u7BA1"), React.createElement("span", null, "\u62A4\u7167\u4FE1\u606F\u9875\u62CD\u7167\u5907\u4EFD\u4E00\u4EFD\uFF0C\u539F\u4EF6\u5355\u72EC\u653E\u597D\u3002\u4E0D\u8981\u628A\u62A4\u7167\u7167\u7247\u3001\u8BC1\u4EF6\u53F7\u3001\u51FA\u751F\u65E5\u671F\u968F\u4FBF\u53D1\u7FA4\u91CC\uFF1B\u505A KYC \u4E0A\u4F20\u65F6\u786E\u8BA4\u662F\u5B98\u7F51\u5417\uFF0C\u522B\u53D1\u7ED9\u964C\u751F\u5BA2\u670D\u3002"))), React.createElement("div", {
    className: "passport-guide-foot"
  }, React.createElement("a", {
    href: "https://www.nia.gov.cn/n741440/n741587/n1316094/n1355872/c1614514/content.html",
    target: "_blank",
    rel: "noopener"
  }, "\u56FD\u5BB6\u79FB\u6C11\u7BA1\u7406\u5C40"), React.createElement("span", null, "\u5177\u4F53\u6750\u6599\u4EE5\u5F53\u5730\u51FA\u5165\u5883\u7A97\u53E3\u4E3A\u51C6")));
}
function CardClickFlow({
  slug
}) {
  const flow = CARD_CLICK_FLOWS[slug];
  if (!flow || flow.length === 0) return null;
  return React.createElement("div", {
    className: "card-click-flow",
    "aria-label": "\u5F00\u5361\u70B9\u51FB\u8DEF\u7EBF"
  }, React.createElement("div", {
    className: "card-click-flow-head"
  }, React.createElement("span", null, "\u5148\u770B\u6574\u6761\u70B9\u51FB\u8DEF\u7EBF"), React.createElement("strong", null, flow.length, " \u6B65")), React.createElement("div", {
    className: "card-click-flow-list"
  }, flow.map((item, index) => React.createElement(React.Fragment, {
    key: `${item}-${index}`
  }, index > 0 && React.createElement("span", {
    className: "card-click-flow-dash"
  }, "-"), React.createElement("span", {
    className: "card-click-flow-item"
  }, item)))));
}
function DetailToc({
  steps,
  funding,
  passport = false
}) {
  return React.createElement("section", {
    className: "toc-section",
    "aria-label": "\u76EE\u5F55"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "toc-box"
  }, React.createElement("div", {
    className: "toc-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "ca-kicker"
  }, "\u76EE\u5F55"), React.createElement("h2", {
    className: "toc-title"
  }, "\u672C\u9875\u5185\u5BB9")), React.createElement("span", {
    className: "ca-meta"
  }, steps.length, " \u7AE0\u5F00\u5361\u6559\u7A0B", funding.length ? ` / ${funding.length} 条入金方式` : "")), React.createElement("div", {
    className: `toc-grid ${passport ? "toc-grid--passport" : ""}`
  }, React.createElement("div", {
    className: "toc-group"
  }, React.createElement("h3", {
    className: "toc-group-title"
  }, "\u5F00\u5361\u6559\u7A0B"), React.createElement("ol", {
    className: "toc-list"
  }, steps.map(step => React.createElement("li", {
    key: step.n
  }, React.createElement("button", {
    className: "toc-link",
    type: "button",
    onClick: () => scrollToAnchor(tutorialAnchor(step))
  }, React.createElement("span", {
    className: "toc-num"
  }, step.n), React.createElement("span", null, step.t)))))), funding.length > 0 && React.createElement("div", {
    className: "toc-group"
  }, React.createElement("h3", {
    className: "toc-group-title"
  }, "\u5165\u91D1\u65B9\u5F0F"), React.createElement("ol", {
    className: "toc-list"
  }, funding.map((item, i) => React.createElement("li", {
    key: item.t || i
  }, React.createElement("button", {
    className: "toc-link",
    type: "button",
    onClick: () => scrollToAnchor(fundingAnchor(i))
  }, React.createElement("span", {
    className: "toc-num"
  }, String(i + 1).padStart(2, "0")), React.createElement("span", null, item.t)))))), passport && React.createElement(PassportGuideSidebar, null)))));
}
function DetailHeader({
  back = "/",
  backLabel = "全部产品"
}) {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include"
    }).then(r => r.json()).then(d => setUser(d.user || null)).catch(() => {});
  }, []);
  const handleLogout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    }).finally(() => setUser(null));
  };
  return React.createElement("header", {
    className: "hdr hdr--detail"
  }, React.createElement("div", {
    className: "hdr-inner"
  }, React.createElement("a", {
    href: "/",
    className: "brand"
  }, React.createElement("span", {
    className: "ca-brand-mark"
  }, React.createElement("img", {
    src: "/images/brand/blue-cat.svg",
    alt: "",
    "aria-hidden": "true"
  })), React.createElement("span", {
    className: "brand-word"
  }, React.createElement("span", {
    className: "brand-zh"
  }, "Blooming"))), React.createElement("nav", {
    className: "hdr-nav"
  }, React.createElement("a", {
    className: "hdr-tab",
    href: "/"
  }, "\u9996\u9875"), React.createElement("a", {
    className: "hdr-tab",
    href: dHomeHref("cards")
  }, "\u94F6\u884C\u5361"), React.createElement("a", {
    className: "hdr-tab",
    href: dHomeHref("gifts")
  }, "\u793C\u54C1\u5361"), React.createElement("a", {
    className: "hdr-tab",
    href: "/sms"
  }, "\u63A5\u7801"), React.createElement("a", {
    className: "hdr-tab",
    href: "/accounts"
  }, "\u8D26\u53F7"), React.createElement("a", {
    className: "hdr-tab",
    href: dHomeHref("faq")
  }, "\u5E38\u89C1\u95EE\u9898")), React.createElement("div", {
    className: "hdr-right"
  }, React.createElement("a", {
    className: "hdr-link",
    href: back
  }, "\u8FD4\u56DE", backLabel), user ? React.createElement("div", {
    className: "hdr-user"
  }, React.createElement("span", {
    className: "hdr-user-email"
  }, user.email), React.createElement("button", {
    className: "ca-button ca-button--outline hdr-logout",
    onClick: handleLogout
  }, "\u9000\u51FA")) : React.createElement("a", {
    className: "ca-button ca-button--outline",
    href: "/login?next=" + encodeURIComponent(window.location.pathname)
  }, "\u767B\u5F55"), React.createElement("a", {
    className: "ca-button ca-button--primary",
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "\u52A0\u5165\u793E\u7FA4"))));
}
function CardDetail({
  slug
}) {
  const card = CARDS_BY_SLUG[slug];
  if (!card) return React.createElement(NotFound, null);
  const steps = TUTORIALS[slug] || [];
  const funding = FUNDING_GUIDES[slug] || [];
  const actionCount = steps.reduce((sum, s) => sum + asArray(s.actions).length, 0);
  const others = window.CARDS.filter(c => c.slug !== slug).slice(0, 3);
  const applyUrl = dCardApplyHref(card);
  const applyTarget = externalTargetFor(applyUrl);
  const passportRequired = requiresPassport(card);
  return React.createElement("div", {
    className: "detail"
  }, React.createElement(DetailHeader, {
    back: dHomeHref("cards"),
    backLabel: "\u94F6\u884C\u5361"
  }), React.createElement("section", {
    className: "d-hero"
  }, React.createElement("div", {
    className: "wrap d-hero-inner"
  }, React.createElement("div", {
    className: window.cardArtFrameClass(card, "d-hero-art"),
    style: window.cardArtFrameStyle(card)
  }, React.createElement("img", {
    src: cardArt(card),
    alt: `${card.name} 卡面`,
    className: "art"
  })), React.createElement("div", {
    className: "d-hero-text"
  }, React.createElement("a", {
    href: dHomeHref("cards"),
    className: "d-back"
  }, "\u5168\u90E8\u94F6\u884C\u5361"), React.createElement("div", {
    className: "ca-kicker"
  }, card.issuer), React.createElement("h1", {
    className: "d-h1"
  }, card.name), React.createElement("p", {
    className: "d-lead"
  }, card.lead), React.createElement("dl", {
    className: "d-spec-row"
  }, React.createElement("div", null, React.createElement("dt", null, "\u8D39\u7528"), React.createElement("dd", null, card.fee)), React.createElement("div", null, React.createElement("dt", null, "\u8FD4\u73B0"), React.createElement("dd", null, card.cashback)), React.createElement("div", null, React.createElement("dt", null, "\u8EAB\u4EFD"), React.createElement("dd", null, card.idType)), React.createElement("div", null, React.createElement("dt", null, "\u53D1\u5361\u5730"), React.createElement("dd", null, card.bin))), React.createElement("div", {
    className: "d-cta"
  }, React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: dCardTutorialHref(slug),
    "data-aff": slug
  }, "\u67E5\u770B\u653B\u7565"), React.createElement("a", {
    className: "ca-button ca-button--outline ca-button--lg",
    href: applyUrl,
    target: applyTarget,
    rel: applyTarget ? "noopener" : undefined,
    "data-aff": slug
  }, "\u7ACB\u5373\u5F00\u5361"))))), React.createElement(DetailToc, {
    steps: steps,
    funding: funding,
    passport: passportRequired
  }), React.createElement("section", {
    className: "k-section",
    id: "tutorial"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u5F00\u5361\u6559\u7A0B \xB7 ", steps.length, " \u7AE0"), React.createElement("span", {
    className: "ca-meta"
  }, actionCount || steps.length, " \u6B65\u7167\u7740\u70B9")), React.createElement(CardClickFlow, {
    slug: slug
  }), React.createElement("div", {
    className: "tutorial-warning"
  }, "\u26A0 \u7981\u6B62\u5B58\u653E\u5927\u91CF\u8D44\u91D1\uFF0C\u5373\u7528\u5373\u5145"), React.createElement("ol", {
    className: "steps"
  }, steps.map(s => React.createElement(TutorialStep, {
    key: s.n,
    step: s,
    anchorId: tutorialAnchor(s)
  }))), card.promoNote && React.createElement("div", {
    className: "tutorial-promo-note"
  }, React.createElement("span", {
    className: "promo-note-icon"
  }, "\uD83D\uDCAC"), React.createElement("span", null, card.promoNote)))), funding.length > 0 && React.createElement("section", {
    className: "k-section funding-section",
    id: "funding"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u5165\u91D1\u65B9\u5F0F"), React.createElement("span", {
    className: "ca-meta"
  }, "\u4E0D\u8BA1\u5165\u5F00\u5361\u6B65\u9AA4")), React.createElement("div", {
    className: "funding-list"
  }, funding.map((item, i) => React.createElement(FundingBlock, {
    key: item.t || i,
    item: item,
    anchorId: fundingAnchor(i)
  }))))), React.createElement("section", {
    className: "k-section d-procon-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "d-procon"
  }, React.createElement("div", {
    className: "d-procon-col"
  }, React.createElement("div", {
    className: "ca-kicker ca-kicker--brand"
  }, "\u4F18\u52BF"), React.createElement("ul", {
    className: "d-list d-list--pros"
  }, card.pros.map((p, i) => React.createElement("li", {
    key: i
  }, p)))), React.createElement("div", {
    className: "d-procon-col"
  }, React.createElement("div", {
    className: "ca-kicker ca-kicker--warn"
  }, "\u6CE8\u610F"), React.createElement("ul", {
    className: "d-list d-list--cons"
  }, card.cons.map((p, i) => React.createElement("li", {
    key: i
  }, p))))))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "ai-block"
  }, React.createElement("div", {
    className: "ai-block-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "ca-kicker"
  }, "AI \u8BA2\u9605\u901A\u8FC7\u7387"), React.createElement("h3", {
    className: "ca-h3",
    style: {
      margin: "4px 0 0"
    }
  }, "\u8FD9\u5F20\u5361\u80FD\u4E0D\u80FD\u4ED8 AI \u670D\u52A1")), React.createElement("div", {
    className: "ai-block-dots"
  }, React.createElement("span", {
    className: "ai-dot"
  }, React.createElement(Dot, {
    s: card.ai.chatgpt
  }), " ChatGPT"), React.createElement("span", {
    className: "ai-dot"
  }, React.createElement(Dot, {
    s: card.ai.claude
  }), " Claude"), React.createElement("span", {
    className: "ai-dot"
  }, React.createElement(Dot, {
    s: card.ai.midjourney
  }), " Midjourney"))), React.createElement("p", {
    className: "ai-block-note"
  }, card.ai.note)))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("h2", {
    className: "ca-h2",
    style: {
      marginBottom: 24
    }
  }, "\u770B\u770B\u5176\u5B83\u5361"), React.createElement("div", {
    className: "cross"
  }, others.map(c => React.createElement("a", {
    key: c.slug,
    href: dCardHref(c.slug),
    className: "cross-item"
  }, React.createElement("div", {
    className: "cross-face"
  }, React.createElement("span", {
    className: window.cardArtFrameClass(c),
    style: window.cardArtFrameStyle(c)
  }, React.createElement("img", {
    src: cardArt(c),
    alt: "",
    className: "art"
  }))), React.createElement("div", {
    className: "cross-body"
  }, React.createElement("div", {
    className: "ca-kicker"
  }, c.issuer), React.createElement("strong", null, c.name), React.createElement("span", {
    className: "cross-cta"
  }, "\u67E5\u770B\u8BE6\u60C5"))))))), React.createElement(window.ContactTrigger, null), React.createElement(window.Footer, null));
}
function GiftDirectory({
  slug,
  detail
}) {
  const primaryRegions = detail.regions.slice(0, 8);
  const firstRegion = detail.regions[0];
  return React.createElement("section", {
    className: "k-section gift-directory"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "gift-directory-card"
  }, React.createElement("div", {
    className: "gift-directory-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "ca-kicker"
  }, "\u793C\u54C1\u5361\u76EE\u5F55"), React.createElement("h2", {
    className: "ca-h2"
  }, "\u5148\u9009\u533A\u7801\uFF0C\u518D\u586B\u91D1\u989D")), React.createElement("span", {
    className: "ca-meta"
  }, "\u533A\u7801 / \u91D1\u989D / \u4E0B\u5355")), React.createElement("div", {
    className: "gift-directory-nav"
  }, React.createElement("button", {
    type: "button",
    className: "gift-route-card",
    onClick: () => scrollToAnchor("regions")
  }, React.createElement("span", null, "01"), React.createElement("strong", null, "\u533A\u7801\u4E0E\u5E01\u79CD"), React.createElement("em", null, "\u56FD\u5BB6\u3001\u8D27\u5E01\u3001\u5B98\u65B9\u9762\u989D")), firstRegion ? React.createElement("a", {
    href: dGiftBuyHref(slug, firstRegion.code),
    className: "gift-route-card"
  }, React.createElement("span", null, "02"), React.createElement("strong", null, "\u91D1\u989D\u586B\u5199"), React.createElement("em", null, "\u8F93\u5165\u9700\u8981\u591A\u5C11\u672C\u5730\u5E01")) : React.createElement("button", {
    type: "button",
    className: "gift-route-card",
    onClick: () => scrollToAnchor("regions")
  }, React.createElement("span", null, "02"), React.createElement("strong", null, "\u91D1\u989D\u586B\u5199"), React.createElement("em", null, "\u8F93\u5165\u9700\u8981\u591A\u5C11\u672C\u5730\u5E01")), React.createElement("button", {
    type: "button",
    className: "gift-route-card",
    onClick: () => scrollToAnchor("use")
  }, React.createElement("span", null, "03"), React.createElement("strong", null, "\u4F7F\u7528\u8BF4\u660E"), React.createElement("em", null, "\u5151\u6362\u7528\u9014\u548C\u6CE8\u610F\u70B9"))), React.createElement("div", {
    className: "gift-route-pills",
    "aria-label": "\u70ED\u95E8\u533A\u7801"
  }, primaryRegions.map(r => React.createElement("a", {
    key: r.code,
    href: dGiftBuyHref(slug, r.code)
  }, r.code, " \xB7 ", r.currency))))));
}
function GiftOrderForm({
  slug,
  detail,
  selected,
  regions
}) {
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
  return React.createElement("section", {
    className: "k-section gift-order",
    id: "amount"
  }, React.createElement("div", {
    className: "wrap gift-order-grid"
  }, React.createElement("div", {
    className: "gift-order-panel"
  }, React.createElement("div", {
    className: "gift-order-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "ca-kicker"
  }, "\u8D2D\u4E70\u4FE1\u606F"), React.createElement("h2", {
    className: "ca-h2"
  }, "\u586B\u5199\u8D2D\u4E70\u4FE1\u606F")), React.createElement("span", {
    className: "ca-meta"
  }, selected.code, " / ", selected.currency)), React.createElement("div", {
    className: "gift-buy-steps",
    "aria-label": "\u8D2D\u4E70\u6B65\u9AA4"
  }, React.createElement("span", {
    className: "is-active"
  }, "1 \u9009\u533A\u7801"), React.createElement("span", {
    className: "is-active"
  }, "2 \u586B\u91D1\u989D"), React.createElement("span", null, "3 \u8054\u7CFB\u4E0B\u5355")), React.createElement("label", {
    className: "order-field"
  }, React.createElement("span", null, "\u56FD\u5BB6/\u5730\u533A"), React.createElement("select", {
    value: selected.code,
    onChange: event => goRegion(event.target.value)
  }, regions.map(r => React.createElement("option", {
    key: r.code,
    value: r.code
  }, r.name, " \xB7 ", r.currency)))), React.createElement("label", {
    className: "order-field"
  }, React.createElement("span", null, "\u9700\u8981\u91D1\u989D"), React.createElement("div", {
    className: "amount-control"
  }, React.createElement("strong", null, currencySymbol(selected.currency)), React.createElement("input", {
    type: "number",
    min: model.min || 1,
    max: model.max || undefined,
    step: amountStep(selected.currency),
    value: amount,
    placeholder: `输入需要多少 ${selected.currency}`,
    onChange: event => setAmount(event.target.value)
  }), React.createElement("em", null, selected.currency))), React.createElement("div", {
    className: "amount-presets",
    "aria-label": "\u5B98\u65B9\u9762\u989D\u5FEB\u6377\u9009\u62E9"
  }, model.presets.map(value => React.createElement("button", {
    key: value,
    type: "button",
    className: Number(amount) === value ? "is-active" : "",
    onClick: () => setAmount(String(value))
  }, formatGiftAmount(value, selected.currency)))), React.createElement("div", {
    className: "official-denom"
  }, React.createElement("strong", null, "\u8BE5\u533A\u9762\u989D"), React.createElement("span", null, selected.denom)), React.createElement("p", {
    className: "order-status"
  }, status), React.createElement("div", {
    className: "d-cta"
  }, React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener",
    "data-order": orderText
  }, "\u8054\u7CFB\u4E0B\u5355"), React.createElement("button", {
    className: "ca-button ca-button--outline ca-button--lg",
    type: "button",
    onClick: () => scrollToAnchor("regions")
  }, "\u6362\u533A\u7801"))), React.createElement("aside", {
    className: "order-receipt",
    "aria-label": "\u8BA2\u5355\u6458\u8981"
  }, React.createElement("div", {
    className: window.giftArtFrameClass(GIFTS_BY_SLUG[slug]),
    style: window.giftArtFrameStyle(GIFTS_BY_SLUG[slug])
  }, React.createElement("img", {
    src: giftArt(GIFTS_BY_SLUG[slug]),
    alt: "",
    className: "art"
  })), React.createElement("div", {
    className: "receipt-row"
  }, React.createElement("span", null, "\u4EA7\u54C1"), React.createElement("strong", null, detail.name)), React.createElement("div", {
    className: "receipt-row"
  }, React.createElement("span", null, "\u533A\u7801"), React.createElement("strong", null, selected.name, " \xB7 ", selected.code)), React.createElement("div", {
    className: "receipt-row"
  }, React.createElement("span", null, "\u5E01\u79CD"), React.createElement("strong", null, selected.currency)), React.createElement("div", {
    className: "receipt-total"
  }, React.createElement("span", null, "\u9700\u8981\u91D1\u989D"), React.createElement("strong", null, formatGiftAmount(amount, selected.currency))))));
}
function GiftDetail({
  slug
}) {
  const g = GIFTS_BY_SLUG[slug];
  const d = GIFT_DETAILS[slug];
  if (!g || !d) return React.createElement(NotFound, null);
  const others = window.GIFT_CARDS.filter(x => x.slug !== slug).slice(0, 3);
  return React.createElement("div", {
    className: "detail"
  }, React.createElement(DetailHeader, {
    back: dHomeHref("gifts"),
    backLabel: "\u793C\u54C1\u5361"
  }), React.createElement("section", {
    className: "d-hero"
  }, React.createElement("div", {
    className: "wrap d-hero-inner"
  }, React.createElement("div", {
    className: window.giftArtFrameClass(g, "d-hero-art"),
    style: window.giftArtFrameStyle(g)
  }, React.createElement("img", {
    src: giftArt(g),
    alt: `${d.name} 礼品卡`,
    className: "art"
  })), React.createElement("div", {
    className: "d-hero-text"
  }, React.createElement("a", {
    href: dHomeHref("gifts"),
    className: "d-back"
  }, "\u5168\u90E8\u793C\u54C1\u5361"), React.createElement("div", {
    className: "ca-kicker"
  }, d.sub), React.createElement("h1", {
    className: "d-h1"
  }, d.name), React.createElement("p", {
    className: "d-lead"
  }, d.desc), React.createElement("div", {
    className: "d-cta"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg",
    type: "button",
    onClick: () => scrollToAnchor("regions"),
    "data-aff": slug
  }, "\u9009\u62E9\u533A\u7801"), React.createElement("button", {
    className: "ca-button ca-button--outline ca-button--lg",
    type: "button",
    onClick: () => scrollToAnchor("use")
  }, "\u4F7F\u7528\u8BF4\u660E"))))), React.createElement(GiftDirectory, {
    slug: slug,
    detail: d
  }), React.createElement("section", {
    className: "k-section",
    id: "regions"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u533A\u7801\u4E0E\u9762\u989D"), React.createElement("span", {
    className: "ca-meta"
  }, "\u5171 ", d.regions.length, " \u4E2A\u533A")), React.createElement("div", {
    className: "region-grid"
  }, d.regions.map(r => React.createElement("article", {
    key: r.code,
    className: "region-card"
  }, React.createElement("div", {
    className: "region-head"
  }, React.createElement("span", {
    className: "region-code"
  }, r.code), React.createElement("strong", null, r.name), React.createElement("span", {
    className: "region-cur"
  }, r.currency)), React.createElement("div", {
    className: "region-denom"
  }, r.denom), r.note && React.createElement("p", {
    className: "region-note"
  }, r.note), React.createElement("a", {
    className: "region-buy",
    href: dGiftBuyHref(slug, r.code),
    "data-aff": `${slug}-${r.code}`
  }, "\u9009\u62E9\u91D1\u989D")))))), React.createElement("section", {
    className: "k-section",
    id: "use"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u80FD\u7528\u6765\u505A\u4EC0\u4E48")), React.createElement("ul", {
    className: "use-list"
  }, d.use.map((u, i) => React.createElement("li", {
    key: i,
    className: "use-item"
  }, React.createElement("span", {
    className: "use-num"
  }, String(i + 1).padStart(2, "0")), React.createElement("span", null, u)))))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("h2", {
    className: "ca-h2",
    style: {
      marginBottom: 24
    }
  }, "\u770B\u770B\u5176\u5B83\u793C\u54C1\u5361"), React.createElement("div", {
    className: "cross"
  }, others.map(x => React.createElement("a", {
    key: x.slug,
    href: dGiftHref(x.slug),
    className: "cross-item"
  }, React.createElement("div", {
    className: "cross-face"
  }, React.createElement("span", {
    className: window.giftArtFrameClass(x),
    style: window.giftArtFrameStyle(x)
  }, React.createElement("img", {
    src: giftArt(x),
    alt: "",
    className: "art"
  }))), React.createElement("div", {
    className: "cross-body"
  }, React.createElement("div", {
    className: "ca-kicker"
  }, x.scope), React.createElement("strong", null, x.name), React.createElement("span", {
    className: "cross-cta"
  }, "\u67E5\u770B\u8BE6\u60C5"))))))), React.createElement(window.Footer, null));
}
function GiftBuy({
  slug,
  region
}) {
  const g = GIFTS_BY_SLUG[slug];
  const d = GIFT_DETAILS[slug];
  if (!g || !d) return React.createElement(NotFound, null);
  const selected = d.regions.find(r => r.code.toLowerCase() === String(region || "").toLowerCase()) || d.regions[0];
  const regions = [selected, ...d.regions.filter(r => r.code !== selected.code)];
  const starterAmount = defaultGiftAmount(slug, selected);
  return React.createElement("div", {
    className: "detail"
  }, React.createElement(DetailHeader, {
    back: dGiftHref(slug),
    backLabel: `${d.name} 详情`
  }), React.createElement("section", {
    className: "d-hero buy-hero"
  }, React.createElement("div", {
    className: "wrap d-hero-inner"
  }, React.createElement("div", {
    className: window.giftArtFrameClass(g, "d-hero-art"),
    style: window.giftArtFrameStyle(g)
  }, React.createElement("img", {
    src: giftArt(g),
    alt: `${d.name} 礼品卡`,
    className: "art"
  })), React.createElement("div", {
    className: "d-hero-text"
  }, React.createElement("a", {
    href: dGiftHref(slug),
    className: "d-back"
  }, "\u8FD4\u56DE\u793C\u54C1\u5361\u8BE6\u60C5"), React.createElement("div", {
    className: "ca-kicker"
  }, selected.name, " \xB7 ", selected.currency), React.createElement("h1", {
    className: "d-h1"
  }, "\u8D2D\u4E70 ", d.name), React.createElement("p", {
    className: "d-lead"
  }, "\u5F53\u524D\u9009\u62E9 ", selected.name, "\uFF0C\u91D1\u989D\u6309 ", selected.currency, " \u586B\u5199\u3002\u5148\u786E\u8BA4\u533A\u7801\uFF0C\u518D\u8F93\u5165\u9700\u8981\u591A\u5C11\u91D1\u989D\u3002"), React.createElement("div", {
    className: "buy-summary"
  }, React.createElement("div", null, React.createElement("span", null, "\u4EA7\u54C1"), React.createElement("strong", null, d.name)), React.createElement("div", null, React.createElement("span", null, "\u533A\u7801"), React.createElement("strong", null, selected.code)), React.createElement("div", null, React.createElement("span", null, "\u8D77\u9009\u91D1\u989D"), React.createElement("strong", null, formatGiftAmount(starterAmount, selected.currency)))), React.createElement("div", {
    className: "d-cta"
  }, React.createElement("button", {
    className: "ca-button ca-button--primary ca-button--lg",
    type: "button",
    onClick: () => scrollToAnchor("amount"),
    "data-aff": `${slug}-${selected.code}`
  }, "\u586B\u5199\u91D1\u989D"), React.createElement("button", {
    className: "ca-button ca-button--outline ca-button--lg",
    type: "button",
    onClick: () => scrollToAnchor("regions")
  }, "\u6362\u533A\u7801"))))), React.createElement(GiftOrderForm, {
    slug: slug,
    detail: d,
    selected: selected,
    regions: d.regions
  }), React.createElement("section", {
    className: "k-section",
    id: "regions"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u5207\u6362\u533A\u7801"), React.createElement("span", {
    className: "ca-meta"
  }, "\u5F53\u524D\u533A\u7801\uFF1A", selected.code, " / ", selected.currency)), React.createElement("div", {
    className: "region-grid"
  }, regions.map(r => React.createElement("article", {
    key: r.code,
    className: `region-card ${selected && r.code === selected.code ? "is-selected" : ""}`
  }, React.createElement("div", {
    className: "region-head"
  }, React.createElement("span", {
    className: "region-code"
  }, r.code), React.createElement("strong", null, r.name), React.createElement("span", {
    className: "region-cur"
  }, r.currency)), React.createElement("div", {
    className: "region-denom"
  }, r.denom), r.note && React.createElement("p", {
    className: "region-note"
  }, r.note), React.createElement("a", {
    className: "region-buy",
    href: dGiftBuyHref(slug, r.code),
    "data-aff": `${slug}-${r.code}`
  }, "\u9009\u62E9 ", r.code, " \u533A\u7801")))))), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "buy-note"
  }, React.createElement("div", {
    className: "ca-kicker ca-kicker--brand"
  }, "\u4E0B\u5355\u524D\u786E\u8BA4"), React.createElement("h2", {
    className: "ca-h2"
  }, "\u533A\u7801\u5FC5\u987B\u548C\u8D26\u53F7\u5730\u533A\u4E00\u81F4"), React.createElement("p", null, "Apple\u3001Steam\u3001Google Play \u8FD9\u7C7B\u793C\u54C1\u5361\u901A\u5E38\u4E0D\u652F\u6301\u8DE8\u533A\u5151\u6362\u3002\u4E0B\u5355\u524D\u5148\u786E\u8BA4\u8D26\u53F7\u5730\u533A\uFF0C\u518D\u9009\u5BF9\u5E94\u533A\u7801\u548C\u9762\u989D\u3002")))), React.createElement(window.Footer, null));
}
function Dot({
  s
}) {
  if (s === "ok") return React.createElement("span", {
    className: "dot dot-ok"
  }, "\u25CF");
  if (s === "warn") return React.createElement("span", {
    className: "dot dot-warn"
  }, "\u25D0");
  return React.createElement("span", {
    className: "dot dot-no"
  }, "\u25CB");
}
function NotFound() {
  return React.createElement("div", {
    className: "detail"
  }, React.createElement(DetailHeader, null), React.createElement("section", {
    className: "k-section"
  }, React.createElement("div", {
    className: "wrap",
    style: {
      textAlign: "center",
      padding: "80px 0"
    }
  }, React.createElement("h1", {
    className: "ca-h2"
  }, "\u672A\u627E\u5230\u8BE5\u4EA7\u54C1"), React.createElement("p", {
    style: {
      marginTop: 14
    }
  }, React.createElement("a", {
    className: "link-jade",
    href: "/"
  }, "\u8FD4\u56DE\u9996\u9875")))));
}
Object.assign(window, {
  CardDetail,
  GiftDetail,
  GiftBuy,
  DetailHeader,
  NotFound,
  Dot
});
})();
