(() => {
const {
  useState
} = React;
const CARDS = window.CARDS;
const GIFT_CARDS = window.GIFT_CARDS;
const FAQS = window.FAQS;
const MAIL_SERVICES = [{
  name: "域名企业邮箱",
  scope: "自有域名",
  desc: "Cloudflare Email Routing、Gmail 发信身份、MX / SPF / DKIM 记录检查。",
  tag: "推荐"
}, {
  name: "Google Workspace",
  scope: "官方订阅",
  desc: "绑定域名、创建邮箱用户、配置 Gmail 收发和基础安全设置。",
  tag: "Google"
}, {
  name: "Microsoft 365",
  scope: "官方订阅",
  desc: "Outlook 企业邮箱、Exchange Online、域名解析和客户端登录配置。",
  tag: "Outlook"
}, {
  name: "邮箱迁移配置",
  scope: "收发迁移",
  desc: "旧邮箱迁移、新邮箱别名、转发、发信身份和常用客户端设置。",
  tag: "配置"
}];
const ACCOUNT_ITEMS = [{
  slug: "gmail",
  name: "Gmail 账号",
  icon: "G",
  tag: "热销",
  scope: "Google 全系服务",
  price: "询价",
  desc: "手工注册真实 Gmail，可绑 YouTube、Google Play、Google Workspace，支持海外平台注册。",
  note: "独立 IP 注册，交付后请立即修改密码和绑定手机。"
}, {
  slug: "outlook",
  name: "Outlook 账号",
  icon: "O",
  tag: "微软",
  scope: "Microsoft 全系服务",
  price: "询价",
  desc: "微软 Outlook 邮箱，可绑 Office 365、Azure、Xbox、GitHub，适合海外平台注册备用。",
  note: "交付后请立即修改密码，可选绑定手机号加固。"
}, {
  slug: "telegram",
  name: "Telegram 账号",
  icon: "T",
  tag: "海外手机号",
  scope: "TG 正常使用",
  price: "询价",
  desc: "海外真实手机号注册，TG 账号可正常收发消息、加群、建频道，无封号风险。",
  note: "交付后建议绑定邮箱和两步验证，提升账号安全性。"
}];
const homeHref = (section = "") => {
  if (!section) return "/";
  if (section === "cards") return "/cards";
  if (section === "gifts") return "/shop";
  if (section === "accounts") return "/accounts";
  if (section === "faq") return "/faq";
  if (section === "contact") return "/contact";
  if (section === "wechat") return "/contact";
  return "/";
};
const cardHref = slug => `/cards/${slug}`;
const cardTutorialHref = slug => `${cardHref(slug)}#tutorial`;
const cardApplyHref = card => card.applyUrl || card.officialUrl || cardHref(card.slug);
const externalTargetFor = href => href && href.startsWith("http") ? "_blank" : undefined;
const giftHref = slug => `/shop/${slug}`;
const Kicker = ({
  children,
  tone,
  className = ""
}) => {
  const t = tone === "brand" ? "ca-kicker--brand" : tone === "warn" ? "ca-kicker--warn" : "";
  return React.createElement("div", {
    className: `ca-kicker ${t} ${className}`
  }, children);
};
const StatusDot = ({
  s
}) => {
  if (s === "ok") return React.createElement("span", {
    className: "sd sd-ok",
    title: "\u652F\u6301"
  });
  if (s === "warn") return React.createElement("span", {
    className: "sd sd-warn",
    title: "\u53D7\u9650"
  });
  return React.createElement("span", {
    className: "sd sd-no",
    title: "\u4E0D\u652F\u6301"
  });
};
function NetworkMark({
  network
}) {
  if (network && network.includes("Visa") && network.includes("Master")) {
    return React.createElement("text", {
      x: "298",
      y: "178",
      fill: "#fff",
      fontSize: "11",
      fontWeight: "700",
      fontFamily: "Inter, sans-serif",
      letterSpacing: "1.2",
      textAnchor: "end"
    }, "VISA / MC");
  }
  if (network && network.includes("Visa")) {
    return React.createElement("text", {
      x: "298",
      y: "178",
      fill: "#fff",
      fontSize: "15",
      fontWeight: "800",
      fontFamily: "Inter, sans-serif",
      letterSpacing: "2.5",
      textAnchor: "end"
    }, "VISA");
  }
  return React.createElement("g", null, React.createElement("circle", {
    cx: "262",
    cy: "172",
    r: "12",
    fill: "#eb001b"
  }), React.createElement("circle", {
    cx: "278",
    cy: "172",
    r: "12",
    fill: "#f79e1b",
    opacity: ".92"
  }));
}
function CardFace({
  card,
  large = false
}) {
  const {
    color,
    name,
    network,
    no
  } = card;
  return React.createElement("div", {
    className: `cardface ${large ? "cardface--lg" : ""}`
  }, React.createElement("svg", {
    viewBox: "0 0 320 200",
    xmlns: "http://www.w3.org/2000/svg",
    role: "img",
    "aria-label": `${name} 卡面`
  }, React.createElement("rect", {
    x: "0",
    y: "0",
    width: "320",
    height: "200",
    rx: "14",
    fill: color
  }), React.createElement("path", {
    d: "M0 70 L320 0 L320 26 L0 96 Z",
    fill: "#ffffff",
    opacity: ".08"
  }), React.createElement("rect", {
    x: "22",
    y: "34",
    width: "38",
    height: "28",
    rx: "4",
    fill: "#e6d28a",
    opacity: ".92"
  }), React.createElement("rect", {
    x: "26",
    y: "38",
    width: "30",
    height: "20",
    rx: "2",
    fill: "none",
    stroke: "#b58c2f",
    strokeOpacity: ".75"
  }), React.createElement("line", {
    x1: "41",
    y1: "38",
    x2: "41",
    y2: "58",
    stroke: "#b58c2f",
    strokeOpacity: ".55"
  }), React.createElement("line", {
    x1: "26",
    y1: "48",
    x2: "56",
    y2: "48",
    stroke: "#b58c2f",
    strokeOpacity: ".55"
  }), React.createElement("text", {
    x: "22",
    y: "150",
    fill: "#fff",
    fontSize: "9",
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    letterSpacing: "1.8",
    opacity: ".7"
  }, "CARDHOLDER"), React.createElement("text", {
    x: "22",
    y: "170",
    fill: "#fff",
    fontSize: "14",
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    letterSpacing: ".5"
  }, name.toUpperCase()), React.createElement(NetworkMark, {
    network: network
  })));
}
function PromoBar() {
  const [announcement, setAnnouncement] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/announcements", {
      credentials: "include"
    }).then(r => r.ok ? r.json() : null).then(d => {
      const item = d?.announcements?.[0];
      if (item?.title || item?.body) setAnnouncement(item);
    }).catch(() => {});
  }, []);
  if (announcement) {
    const href = announcement.linkUrl || "";
    const external = /^https?:\/\//i.test(href);
    return React.createElement("div", {
      className: "promo"
    }, React.createElement("div", {
      className: "wrap promo-inner"
    }, React.createElement("span", {
      className: "promo-tag"
    }, announcement.title), React.createElement("span", null, announcement.body), href && React.createElement("a", {
      href: href,
      className: "promo-link",
      target: external ? "_blank" : undefined,
      rel: external ? "noreferrer" : undefined
    }, announcement.linkLabel || "查看")));
  }
  return React.createElement("div", {
    className: "promo"
  }, React.createElement("div", {
    className: "wrap promo-inner"
  }, React.createElement("span", {
    className: "promo-tag"
  }, "\u672C\u5468"), React.createElement("span", null, "Bybit \u6B27\u6D32\u5361\u65B0\u6237\u4F53\u9A8C\u91D1\u8C03\u6574\u4E3A ", React.createElement("strong", null, "10 USDC"), "\uFF0C\u6D3B\u52A8\u81F3 06-30\u3002"), React.createElement("a", {
    href: "/cards/bybit-eu-card",
    className: "promo-link"
  }, "\u67E5\u770B")));
}
function useAuth() {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include"
    }).then(r => r.json()).then(d => setUser(d.user || null)).catch(() => {});
  }, []);
  return [user, setUser];
}
function Header({
  section,
  setSection,
  user: userProp,
  onLogout: onLogoutProp
}) {
  const [selfUser, setSelfUser] = useAuth();
  const user = userProp !== undefined ? userProp : selfUser;
  const onLogout = onLogoutProp || (() => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    }).finally(() => setSelfUser(null));
  });
  const tabs = [{
    id: "cards",
    label: "银行卡"
  }, {
    id: "gifts",
    label: "礼品卡"
  }, {
    id: "sms",
    label: "接码",
    href: "/sms"
  }, {
    id: "accounts",
    label: "账号",
    href: "/accounts"
  }, {
    id: "faq",
    label: "常见问题"
  }];
  return React.createElement("header", {
    className: "hdr"
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
    className: "hdr-nav",
    "aria-label": "\u4E3B\u5BFC\u822A"
  }, tabs.map(t => React.createElement("a", {
    key: t.id,
    href: t.href || homeHref(t.id),
    className: `hdr-tab ${section === t.id ? "is-active" : ""}`,
    onClick: () => setSection(t.id)
  }, t.label))), React.createElement("div", {
    className: "hdr-right"
  }, React.createElement("a", {
    className: "hdr-link",
    href: "/contact"
  }, "\u52A0\u5165\u793E\u7FA4"), user ? React.createElement("div", {
    className: "hdr-user"
  }, user.role === "admin" && React.createElement("a", {
    className: "hdr-tab",
    href: "/admin",
    style: {
      fontSize: "12px",
      color: "#4d91e9"
    }
  }, "\u540E\u53F0"), React.createElement("span", {
    className: "hdr-user-email"
  }, user.email), React.createElement("button", {
    className: "ca-button ca-button--outline hdr-logout",
    onClick: onLogout
  }, "\u9000\u51FA")) : React.createElement("a", {
    className: "ca-button ca-button--outline",
    href: "/login?next=" + encodeURIComponent(window.location.pathname)
  }, "\u767B\u5F55"), React.createElement("a", {
    className: "ca-button ca-button--primary",
    href: "/cards"
  }, "\u7ACB\u5373\u5F00\u5361"))));
}
function Hero({
  featured
}) {
  const featuredCards = CARDS.slice(0, 3);
  return React.createElement("section", {
    className: "hero"
  }, React.createElement("div", {
    className: "wrap hero-inner"
  }, React.createElement("div", {
    className: "hero-text"
  }, React.createElement("h1", {
    className: "hero-h1"
  }, React.createElement("span", {
    className: "hero-h1-line"
  }, React.createElement("span", {
    className: "hero-h1-jade"
  }, "\u6D77\u5916\u94F6\u884C\u5361"), "\uFF0C\u653B\u7565\u9F50\u5168\u3002")), React.createElement("div", {
    className: "hero-cta"
  }, React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: "/cards"
  }, "\u6D4F\u89C8\u94F6\u884C\u5361"), React.createElement("a", {
    className: "ca-button ca-button--outline ca-button--lg",
    href: "/shop"
  }, "\u793C\u54C1\u5361\u5546\u5E97"))), React.createElement("div", {
    className: "hero-product"
  }, React.createElement("div", {
    className: "hero-product-frame"
  }, React.createElement("div", {
    className: "mini-head"
  }, React.createElement("h2", {
    className: "mini-title"
  }, "\u672C\u671F\u4E3B\u6253"), React.createElement("a", {
    href: cardTutorialHref(featured.slug),
    className: "mini-link"
  }, "\u67E5\u770B\u653B\u7565")), React.createElement("div", {
    className: "hero-reco-list"
  }, featuredCards.map(card => React.createElement("a", {
    key: card.slug,
    href: cardHref(card.slug),
    className: "hero-reco"
  }, React.createElement("span", {
    className: window.cardArtFrameClass(card, "hero-reco-art"),
    style: window.cardArtFrameStyle(card)
  }, React.createElement("img", {
    src: window.cardArt(card),
    alt: "",
    className: "art"
  })), React.createElement("span", {
    className: "hero-reco-body"
  }, React.createElement("strong", null, card.name), React.createElement("span", null, card.lead), React.createElement("em", null, card.fee)))))))));
}
function HomeBoard({
  cards
}) {
  return React.createElement("main", {
    className: "home-main"
  }, React.createElement("div", {
    className: "wrap home-board"
  }, React.createElement("div", {
    className: "home-panel home-panel--cards"
  }, React.createElement(ProductGrid, {
    cards: cards
  })), React.createElement("div", {
    className: "home-panel home-panel--gifts"
  }, React.createElement(GiftCardStrip, null)), React.createElement("div", {
    className: "home-panel home-panel--accounts"
  }, React.createElement(AccountStrip, null)), React.createElement("div", {
    className: "home-panel home-panel--faq"
  }, React.createElement(FAQ, null)), React.createElement("div", {
    className: "home-panel home-panel--contact"
  }, React.createElement(Contact, null))));
}
function ProductCard({
  card
}) {
  const tutorialUrl = cardTutorialHref(card.slug);
  const applyUrl = cardApplyHref(card);
  const applyTarget = externalTargetFor(applyUrl);
  return React.createElement("article", {
    className: "pc",
    id: `card-${card.slug}`
  }, React.createElement("a", {
    href: cardHref(card.slug),
    className: "pc-cardface-link",
    "aria-label": `${card.name} 详情`
  }, React.createElement("span", {
    className: window.cardArtFrameClass(card),
    style: window.cardArtFrameStyle(card)
  }, React.createElement("img", {
    src: window.cardArt(card),
    alt: "",
    className: "art"
  }))), React.createElement("div", {
    className: "pc-body"
  }, React.createElement("header", {
    className: "pc-head"
  }, React.createElement(Kicker, null, card.issuer), React.createElement("h3", {
    className: "pc-name"
  }, card.name)), React.createElement("p", {
    className: "pc-lead"
  }, card.lead), React.createElement("dl", {
    className: "pc-specs"
  }, React.createElement("div", null, React.createElement("dt", null, "\u8D39\u7528"), React.createElement("dd", null, card.fee)), React.createElement("div", null, React.createElement("dt", null, "\u8FD4\u73B0"), React.createElement("dd", null, card.cashback)), React.createElement("div", null, React.createElement("dt", null, "\u5F00\u5361\u8EAB\u4EFD"), React.createElement("dd", null, card.idType)), React.createElement("div", null, React.createElement("dt", null, "\u53D1\u5361\u5730"), React.createElement("dd", null, card.bin))), React.createElement("div", {
    className: "pc-ai"
  }, React.createElement("span", {
    className: "pc-ai-label"
  }, "\u9002\u7528\u670D\u52A1"), React.createElement("div", {
    className: "pc-ai-rows"
  }, React.createElement("span", {
    className: "pc-ai-row"
  }, React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.chatgpt
  }), " ChatGPT"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.claude
  }), " Claude"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.midjourney
  }), " MJ"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.cursor
  }), " Cursor")), React.createElement("span", {
    className: "pc-ai-row"
  }, React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.netflix
  }), " Netflix"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.steam
  }), " Steam"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.appstore
  }), " App Store")), React.createElement("span", {
    className: "pc-ai-row"
  }, React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.aws
  }), " AWS"), React.createElement("span", {
    className: "pc-ai-item"
  }, React.createElement(StatusDot, {
    s: card.ai.gcp
  }), " GCP")), React.createElement("span", {
    className: "pc-ai-legend"
  }, React.createElement("span", {
    className: "sd sd-ok"
  }), "\u652F\u6301 \xA0", React.createElement("span", {
    className: "sd sd-warn"
  }), "\u53D7\u9650 \xA0", React.createElement("span", {
    className: "sd sd-no"
  }), "\u4E0D\u652F\u6301"))), React.createElement("div", {
    className: "pc-foot"
  }, React.createElement("a", {
    className: "ca-button ca-button--outline pc-guide",
    href: tutorialUrl,
    "data-card": card.slug
  }, "\u67E5\u770B\u653B\u7565"), React.createElement("a", {
    className: "ca-button ca-button--primary pc-apply",
    href: applyUrl,
    target: applyTarget,
    rel: applyTarget ? "noopener" : undefined,
    "data-card": card.slug
  }, "\u7ACB\u5373\u5F00\u5361"))));
}
function ProductGrid({
  cards
}) {
  return React.createElement("section", {
    className: "k-section",
    id: "cards"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u94F6\u884C\u5361"), React.createElement("div", {
    className: "grid-filters"
  }, React.createElement("button", {
    className: "ca-tab is-active"
  }, "\u5168\u90E8"))), React.createElement("div", {
    className: "pgrid"
  }, cards.map(c => React.createElement(ProductCard, {
    key: c.slug,
    card: c
  })))));
}
function GiftCardStrip() {
  return React.createElement("section", {
    className: "k-section gifts-section",
    id: "gifts"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u793C\u54C1\u5361"), React.createElement("a", {
    href: "/shop",
    className: "ca-button ca-button--outline"
  }, "\u8FDB\u5165\u5546\u5E97")), React.createElement("div", {
    className: "ggrid"
  }, GIFT_CARDS.map(g => React.createElement("a", {
    key: g.slug,
    href: giftHref(g.slug),
    className: "gc"
  }, React.createElement("div", {
    className: "gc-face"
  }, React.createElement("span", {
    className: window.giftArtFrameClass(g),
    style: window.giftArtFrameStyle(g)
  }, React.createElement("img", {
    src: window.giftArt(g),
    alt: "",
    className: "art"
  }))), React.createElement("div", {
    className: "gc-body"
  }, React.createElement("div", {
    className: "gc-head"
  }, React.createElement("strong", {
    className: "gc-name"
  }, g.name), g.tag && React.createElement("span", {
    className: "ca-pill ca-pill--warn gc-tag"
  }, g.tag)), React.createElement("div", {
    className: "gc-scope"
  }, g.scope), React.createElement("div", {
    className: "gc-price"
  }, g.price)))))));
}
function MailServiceStrip() {
  return React.createElement("section", {
    className: "k-section mail-section",
    id: "mail"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u90AE\u7BB1\u670D\u52A1"), React.createElement("a", {
    href: "/mail",
    className: "ca-button ca-button--outline"
  }, "\u8FDB\u5165\u90AE\u7BB1")), React.createElement("div", {
    className: "mail-grid"
  }, MAIL_SERVICES.map(item => React.createElement("a", {
    key: item.name,
    href: "/mail",
    className: "mail-card"
  }, React.createElement("span", {
    className: "mail-icon"
  }, item.name.slice(0, 1)), React.createElement("span", {
    className: "mail-copy"
  }, React.createElement("strong", null, item.name), React.createElement("span", null, item.scope), React.createElement("em", null, item.tag)))))));
}
function MailStore() {
  return React.createElement(React.Fragment, null, React.createElement("section", {
    className: "gift-store-hero mail-hero"
  }, React.createElement("div", {
    className: "wrap gift-store-hero-inner"
  }, React.createElement("div", null, React.createElement(Kicker, {
    tone: "brand"
  }, "\u90AE\u7BB1\u670D\u52A1"), React.createElement("h1", {
    className: "gift-store-title"
  }, "\u4F01\u4E1A\u90AE\u7BB1\u548C\u6536\u53D1\u914D\u7F6E"), React.createElement("p", {
    className: "gift-store-lead"
  }, "\u6309\u5B98\u65B9\u6E20\u9053\u5F00\u901A Google Workspace / Microsoft 365\uFF0C\u6216\u4F7F\u7528\u81EA\u6709\u57DF\u540D\u914D\u7F6E Cloudflare Email Routing\u3001Gmail \u53D1\u4FE1\u8EAB\u4EFD\u548C\u5E38\u7528\u5BA2\u6237\u7AEF\u6536\u53D1\u3002")), React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: "/contact"
  }, "\u8054\u7CFB\u914D\u7F6E"))), React.createElement("section", {
    className: "k-section mail-store-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "mail-store-grid"
  }, MAIL_SERVICES.map(item => React.createElement("article", {
    key: item.name,
    className: "mail-store-card"
  }, React.createElement("div", {
    className: "mail-store-head"
  }, React.createElement("span", {
    className: "mail-icon"
  }, item.name.slice(0, 1)), React.createElement("span", {
    className: "ca-pill ca-pill--brand"
  }, item.tag)), React.createElement("h2", null, item.name), React.createElement("p", null, item.desc), React.createElement("div", {
    className: "mail-store-foot"
  }, React.createElement("span", null, item.scope), React.createElement("a", {
    href: "/contact"
  }, "\u8054\u7CFB\u914D\u7F6E"))))))));
}
function AccountStrip() {
  const preview = [...ACCOUNT_ITEMS, ...MAIL_SERVICES.map(m => ({
    slug: m.name,
    icon: m.name.slice(0, 1),
    name: m.name,
    scope: m.scope,
    tag: m.tag
  }))];
  return React.createElement("section", {
    className: "k-section mail-section",
    id: "accounts"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "grid-head"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u8D26\u53F7 & \u90AE\u7BB1"), React.createElement("a", {
    href: "/accounts",
    className: "ca-button ca-button--outline"
  }, "\u8FDB\u5165\u5546\u5E97")), React.createElement("div", {
    className: "mail-grid"
  }, preview.map(item => React.createElement("a", {
    key: item.slug,
    href: "/accounts",
    className: "mail-card"
  }, React.createElement("span", {
    className: "mail-icon"
  }, item.icon), React.createElement("span", {
    className: "mail-copy"
  }, React.createElement("strong", null, item.name), React.createElement("span", null, item.scope), React.createElement("em", null, item.tag)))))));
}
function AccountStore() {
  return React.createElement(React.Fragment, null, React.createElement("section", {
    className: "gift-store-hero mail-hero"
  }, React.createElement("div", {
    className: "wrap gift-store-hero-inner"
  }, React.createElement("div", null, React.createElement(Kicker, {
    tone: "brand"
  }, "\u8D26\u53F7 & \u90AE\u7BB1"), React.createElement("h1", {
    className: "gift-store-title"
  }, "\u8D26\u53F7\u51FA\u552E \xB7 \u90AE\u7BB1\u670D\u52A1"), React.createElement("p", {
    className: "gift-store-lead"
  }, "Gmail / Outlook / Telegram \u8D26\u53F7\u51FA\u552E\uFF0C\u4EE5\u53CA\u4F01\u4E1A\u90AE\u7BB1\u5F00\u901A\u4E0E\u914D\u7F6E\u670D\u52A1\u3002\u652F\u6301 USDT / \u5FAE\u4FE1\u4ED8\u6B3E\uFF0CTG \u79C1\u4FE1\u4E0B\u5355\u3002")), React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "TG \u4E0B\u5355"))), React.createElement("section", {
    className: "k-section mail-store-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("h2", {
    className: "acct-section-title"
  }, "\u8D26\u53F7\u51FA\u552E"), React.createElement("div", {
    className: "mail-store-grid"
  }, ACCOUNT_ITEMS.map(item => React.createElement("article", {
    key: item.slug,
    className: "mail-store-card"
  }, React.createElement("div", {
    className: "mail-store-head"
  }, React.createElement("span", {
    className: "mail-icon"
  }, item.icon), React.createElement("span", {
    className: "ca-pill ca-pill--brand"
  }, item.tag)), React.createElement("h2", null, item.name), React.createElement("p", null, item.desc), React.createElement("div", {
    className: "mail-store-foot"
  }, React.createElement("span", null, item.price), React.createElement("a", {
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "TG \u8BE2\u4EF7")), React.createElement("div", {
    className: "acct-note"
  }, item.note)))))), React.createElement("section", {
    className: "k-section mail-store-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("h2", {
    className: "acct-section-title"
  }, "\u90AE\u7BB1\u670D\u52A1"), React.createElement("div", {
    className: "mail-store-grid"
  }, MAIL_SERVICES.map(item => React.createElement("article", {
    key: item.name,
    className: "mail-store-card"
  }, React.createElement("div", {
    className: "mail-store-head"
  }, React.createElement("span", {
    className: "mail-icon"
  }, item.name.slice(0, 1)), React.createElement("span", {
    className: "ca-pill ca-pill--brand"
  }, item.tag)), React.createElement("h2", null, item.name), React.createElement("p", null, item.desc), React.createElement("div", {
    className: "mail-store-foot"
  }, React.createElement("span", null, item.scope), React.createElement("a", {
    href: "https://t.me/Whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "\u8054\u7CFB\u914D\u7F6E"))))))));
}
function GiftStore() {
  return React.createElement(React.Fragment, null, React.createElement("section", {
    className: "gift-store-hero"
  }, React.createElement("div", {
    className: "wrap gift-store-hero-inner"
  }, React.createElement("div", null, React.createElement(Kicker, {
    tone: "brand"
  }, "\u793C\u54C1\u5361\u5546\u5E97"), React.createElement("h1", {
    className: "gift-store-title"
  }, "\u9009\u62E9\u5546\u54C1\uFF0C\u518D\u9009\u56FD\u5BB6\u548C\u5E01\u79CD"), React.createElement("p", {
    className: "gift-store-lead"
  }, "Apple\u3001Steam\u3001Netflix\u3001Google Play\u3001PlayStation\u3001Battle.net \u90FD\u6309\u5BF9\u5E94\u56FD\u5BB6/\u5730\u533A\u4E0B\u5355\uFF0C\u4ED8\u6B3E\u524D\u5148\u786E\u8BA4\u8D26\u53F7\u5730\u533A\u548C\u672C\u5730\u5E01\u79CD\u3002")), React.createElement("a", {
    className: "ca-button ca-button--primary ca-button--lg",
    href: "/contact"
  }, "\u8054\u7CFB\u4E0B\u5355"))), React.createElement("section", {
    className: "k-section gift-store-section"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "gift-store-grid"
  }, GIFT_CARDS.map(g => {
    const detail = window.GIFT_DETAILS?.[g.slug] || {};
    const regions = detail.regions || [];
    return React.createElement("article", {
      key: g.slug,
      className: "gift-store-card"
    }, React.createElement("a", {
      href: giftHref(g.slug),
      className: window.giftArtFrameClass(g, "gift-store-art"),
      style: window.giftArtFrameStyle(g)
    }, React.createElement("img", {
      src: window.giftArt(g),
      alt: `${g.name} 礼品卡`,
      className: "art"
    })), React.createElement("div", {
      className: "gift-store-body"
    }, React.createElement("div", {
      className: "gift-store-meta"
    }, React.createElement("span", null, g.scope), React.createElement("span", null, regions.length ? `${regions.length} 个地区` : g.price)), React.createElement("h2", null, g.name), React.createElement("p", null, detail.desc || "按账号国家、兑换币种和官方面额选择。"), React.createElement("div", {
      className: "gift-store-regions"
    }, regions.slice(0, 8).map(r => React.createElement("a", {
      key: r.code,
      href: `/shop/${g.slug}/buy/${r.code}`
    }, r.code, " \xB7 ", r.currency)))), React.createElement("div", {
      className: "gift-store-actions"
    }, React.createElement("a", {
      className: "ca-button ca-button--outline",
      href: giftHref(g.slug)
    }, "\u67E5\u770B\u533A\u7801"), regions[0] && React.createElement("a", {
      className: "ca-button ca-button--primary",
      href: `/shop/${g.slug}/buy/${regions[0].code}`
    }, "\u586B\u5199\u91D1\u989D")));
  })))));
}
function FAQ() {
  const [open, setOpen] = useState(0);
  return React.createElement("section", {
    className: "k-section",
    id: "faq"
  }, React.createElement("div", {
    className: "wrap faq-wrap"
  }, React.createElement("h2", {
    className: "ca-h2"
  }, "\u5E38\u89C1\u95EE\u9898"), React.createElement("ul", {
    className: "faq-list"
  }, FAQS.map((f, i) => React.createElement("li", {
    key: i,
    className: `faq-item ${open === i ? "is-open" : ""}`
  }, React.createElement("button", {
    className: "faq-q",
    onClick: () => setOpen(open === i ? -1 : i)
  }, React.createElement("span", null, f.q), React.createElement("span", {
    className: "faq-toggle",
    "aria-hidden": "true"
  }, open === i ? "−" : "+")), open === i && React.createElement("div", {
    className: "faq-a"
  }, f.a))))));
}
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
  return React.createElement("div", {
    className: "cmodal-overlay",
    onClick: () => setOpen(false)
  }, React.createElement("div", {
    className: "cmodal",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "cmodal-header"
  }, React.createElement("div", null, React.createElement("div", {
    className: "cmodal-title"
  }, "\u8054\u7CFB\u6211"), React.createElement("div", {
    className: "cmodal-sub"
  }, "\u5F00\u5361 \xB7 \u5165\u91D1 \xB7 \u9009\u5361\uFF0C\u968F\u65F6\u53EF\u95EE")), React.createElement("button", {
    className: "cmodal-close",
    onClick: () => setOpen(false)
  }, "\xD7")), React.createElement("div", {
    className: "cmodal-list"
  }, React.createElement("a", {
    className: "cmodal-item",
    href: "https://t.me/whohaoe",
    target: "_blank",
    rel: "noopener"
  }, React.createElement("span", {
    className: "cmodal-badge cmodal-badge--tg"
  }, "TG"), React.createElement("div", {
    className: "cmodal-info"
  }, React.createElement("div", {
    className: "cmodal-platform"
  }, "Telegram"), React.createElement("div", {
    className: "cmodal-id"
  }, "@whohaoe")), React.createElement("span", {
    className: "cmodal-action"
  }, "\u6253\u5F00")), React.createElement("div", {
    className: "cmodal-item"
  }, React.createElement("span", {
    className: "cmodal-badge cmodal-badge--wx"
  }, "\u5FAE"), React.createElement("div", {
    className: "cmodal-info"
  }, React.createElement("div", {
    className: "cmodal-platform"
  }, "\u5FAE\u4FE1"), React.createElement("div", {
    className: "cmodal-id"
  }, "HKFG0512")), React.createElement("span", {
    className: "cmodal-action"
  }, "\u957F\u6309\u590D\u5236")), React.createElement("div", {
    className: "cmodal-item"
  }, React.createElement("span", {
    className: "cmodal-badge cmodal-badge--qq"
  }, "QQ"), React.createElement("div", {
    className: "cmodal-info"
  }, React.createElement("div", {
    className: "cmodal-platform"
  }, "QQ"), React.createElement("div", {
    className: "cmodal-id"
  }, "2393155725")), React.createElement("span", {
    className: "cmodal-action"
  }, "\u957F\u6309\u590D\u5236")))));
}
function ContactTrigger() {
  return React.createElement("section", {
    className: "k-section ctrigger-section",
    id: "contact"
  }, React.createElement("div", {
    className: "wrap"
  }, React.createElement("div", {
    className: "ctrigger",
    onClick: () => window.dispatchEvent(new CustomEvent('openContactModal'))
  }, React.createElement("span", {
    className: "ctrigger-q"
  }, "?"), React.createElement("div", {
    className: "ctrigger-text"
  }, React.createElement("div", {
    className: "ctrigger-title"
  }, "\u6709\u7591\u95EE\uFF1F"), React.createElement("div", {
    className: "ctrigger-sub"
  }, "TG \xB7 \u5FAE\u4FE1 \xB7 QQ \u5747\u53EF\uFF0C\u5F00\u5361 / \u5165\u91D1 / \u9009\u5361\u90FD\u80FD\u95EE")), React.createElement("span", {
    className: "ctrigger-cta"
  }, "\u8054\u7CFB\u6211"))));
}
const Contact = ContactTrigger;
function Footer() {
  return React.createElement("footer", {
    className: "ftr",
    id: "disclosure"
  }, React.createElement("div", {
    className: "wrap ftr-inner"
  }, React.createElement("div", {
    className: "ftr-brand"
  }, React.createElement("span", {
    className: "ca-brand-mark ftr-mark"
  }, React.createElement("img", {
    src: "/images/brand/blue-cat.svg",
    alt: "",
    "aria-hidden": "true"
  })), React.createElement("strong", null, "Blooming")), React.createElement("div", {
    className: "ftr-cols"
  }, React.createElement("div", null, React.createElement("h4", null, "\u94F6\u884C\u5361"), CARDS.slice(0, 4).map(c => React.createElement("a", {
    key: c.slug,
    href: `/cards/${c.slug}`
  }, c.name)), React.createElement("a", {
    href: "/cards"
  }, "\u67E5\u770B\u5168\u90E8")), React.createElement("div", null, React.createElement("h4", null, "\u793C\u54C1\u5361"), React.createElement("a", {
    href: "/shop"
  }, "\u5E94\u7528\u5546\u5E97"), React.createElement("a", {
    href: "/shop"
  }, "\u6D41\u5A92\u4F53"), React.createElement("a", {
    href: "/shop"
  }, "\u6E38\u620F"), React.createElement("a", {
    href: "/shop"
  }, "\u8BA2\u9605")), React.createElement("div", null, React.createElement("h4", null, "\u8054\u7CFB"), React.createElement("a", {
    href: "https://t.me/whohaoe",
    target: "_blank",
    rel: "noopener"
  }, "TG @whohaoe"), React.createElement("a", {
    href: "/contact"
  }, "\u5FAE\u4FE1 HKFG0512"), React.createElement("a", {
    href: "/contact"
  }, "QQ 2393155725")))), React.createElement("div", {
    className: "wrap ftr-bottom"
  }, React.createElement("span", null, "\xA9 2026 Blooming"), React.createElement("span", null, "\u90E8\u5206\u94FE\u63A5\u4E3A\u63A8\u5E7F\u94FE\u63A5")));
}
function readRoute() {
  const clean = window.location.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts[0] === "cards" && !parts[1]) return {
    scene: "home",
    section: "cards"
  };
  if (parts[0] === "cards" && parts[1]) return {
    scene: "card",
    slug: parts[1]
  };
  if (parts[0] === "shop" && !parts[1]) return {
    scene: "giftStore",
    section: "gifts"
  };
  if (parts[0] === "shop" && parts[1] && parts[2] === "buy") {
    return {
      scene: "giftBuy",
      slug: parts[1],
      region: parts[3] || null
    };
  }
  if (parts[0] === "shop" && parts[1]) return {
    scene: "gift",
    slug: parts[1]
  };
  if (parts[0] === "mail" && !parts[1]) return {
    scene: "accounts",
    section: "accounts"
  };
  if (parts[0] === "accounts" && !parts[1]) return {
    scene: "accounts",
    section: "accounts"
  };
  if (parts[0] === "faq" && !parts[1]) return {
    scene: "home",
    section: "faq"
  };
  if (parts[0] === "contact" && !parts[1]) return {
    scene: "home",
    section: "contact"
  };
  if (parts[0] === "wechat" && !parts[1]) return {
    scene: "home",
    section: "contact"
  };
  if (parts[0] === "sms") return {
    scene: "sms"
  };
  if (parts[0] === "login" && !parts[1]) return {
    scene: "login"
  };
  if (parts[0] === "admin") return {
    scene: "admin"
  };
  return {
    scene: "home"
  };
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
function App() {
  const route = useRoute();
  const [section, setSection] = useState("cards");
  const [authUser, setAuthUser] = useAuth();
  const handleLogout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    }).finally(() => setAuthUser(null));
  };
  React.useEffect(() => {
    const pageMap = {
      home: route.section || "home",
      giftStore: "gifts",
      gift: "gifts",
      giftBuy: "gifts",
      card: "cards",
      accounts: "accounts",
      sms: "sms",
      login: "login",
      admin: "admin"
    };
    const page = pageMap[route.scene] || "home";
    fetch("/api/stats/pageview", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page
      })
    }).catch(() => {});
  }, [route.scene, route.section]);
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
        document.getElementById("contact")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return;
      }
      const targetId = nextSection === "gifts" ? "gifts" : nextSection;
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }, [route.scene, route.section]);
  const TWEAK_DEFAULTS = {
    "showPromo": true,
    "gridCols": "three",
    "featuredSlug": "bybit-card",
    "accentMode": "jade"
  };
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const accents = {
    jade: {
      jade: "#6aa9ff",
      soft: "rgba(106,169,255,0.10)"
    },
    cobalt: {
      jade: "#1f4ea8",
      soft: "rgba(31,78,168,0.08)"
    },
    rust: {
      jade: "#a3491f",
      soft: "rgba(163,73,31,0.08)"
    }
  };
  const acc = accents[tweaks.accentMode] || accents.jade;
  const featured = CARDS.find(c => c.slug === tweaks.featuredSlug) || CARDS[0];
  let scene;
  if (route.scene === "card" && window.CardDetail) {
    scene = React.createElement(window.CardDetail, {
      slug: route.slug
    });
  } else if (route.scene === "gift" && window.GiftDetail) {
    scene = React.createElement(window.GiftDetail, {
      slug: route.slug
    });
  } else if (route.scene === "giftBuy" && window.GiftBuy) {
    scene = React.createElement(window.GiftBuy, {
      slug: route.slug,
      region: route.region
    });
  } else if (route.scene === "giftStore") {
    scene = React.createElement(React.Fragment, null, tweaks.showPromo && React.createElement(PromoBar, null), React.createElement(Header, {
      section: "gifts",
      setSection: setSection,
      user: authUser,
      onLogout: handleLogout
    }), React.createElement(GiftStore, null), React.createElement(FAQ, null), React.createElement(Contact, null), React.createElement(Footer, null));
  } else if (route.scene === "accounts") {
    scene = React.createElement(React.Fragment, null, tweaks.showPromo && React.createElement(PromoBar, null), React.createElement(Header, {
      section: "accounts",
      setSection: setSection,
      user: authUser,
      onLogout: handleLogout
    }), React.createElement(AccountStore, null), React.createElement(FAQ, null), React.createElement(Contact, null), React.createElement(Footer, null));
  } else if (route.scene === "login" && window.LoginDesk) {
    scene = React.createElement(window.LoginDesk, null);
  } else if (route.scene === "admin" && window.AdminDesk) {
    scene = React.createElement(window.AdminDesk, null);
  } else if (route.scene === "sms" && window.SmsDesk) {
    scene = React.createElement(window.SmsDesk, null);
  } else {
    scene = React.createElement(React.Fragment, null, tweaks.showPromo && React.createElement(PromoBar, null), React.createElement(Header, {
      section: section,
      setSection: setSection,
      user: authUser,
      onLogout: handleLogout
    }), React.createElement(Hero, {
      featured: featured
    }), React.createElement(HomeBoard, {
      cards: CARDS
    }), React.createElement(Footer, null));
  }
  return React.createElement("div", {
    className: `shell cols-${tweaks.gridCols}`,
    id: "top",
    style: {
      "--color-jade": acc.jade,
      "--bg-brand-soft": acc.soft,
      "--fg-brand": acc.jade
    }
  }, scene, React.createElement(ContactModal, null), window.TweaksPanel && React.createElement(window.TweaksPanel, {
    title: "Tweaks"
  }, React.createElement(window.TweakSection, {
    label: "\u5E03\u5C40"
  }, React.createElement(window.TweakToggle, {
    label: "\u9876\u90E8\u516C\u544A\u6761",
    value: tweaks.showPromo,
    onChange: v => setTweak("showPromo", v)
  }), React.createElement(window.TweakRadio, {
    label: "\u4EA7\u54C1\u7F51\u683C",
    value: tweaks.gridCols,
    onChange: v => setTweak("gridCols", v),
    options: [{
      value: "two",
      label: "两列"
    }, {
      value: "three",
      label: "三列"
    }]
  })), React.createElement(window.TweakSection, {
    label: "\u672C\u671F\u4E3B\u6253"
  }, React.createElement(window.TweakSelect, {
    value: tweaks.featuredSlug,
    onChange: v => setTweak("featuredSlug", v),
    options: CARDS.map(c => ({
      value: c.slug,
      label: c.name
    }))
  })), React.createElement(window.TweakSection, {
    label: "\u4E3B\u8272\u8C03"
  }, React.createElement(window.TweakRadio, {
    value: tweaks.accentMode,
    onChange: v => setTweak("accentMode", v),
    options: [{
      value: "jade",
      label: "祖母绿"
    }, {
      value: "cobalt",
      label: "钴蓝"
    }, {
      value: "rust",
      label: "赭红"
    }]
  }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
Object.assign(window, {
  Footer,
  Contact,
  ContactTrigger,
  ContactModal,
  Header
});
})();
