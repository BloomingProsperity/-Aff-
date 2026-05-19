export interface CountryVariant {
  flag: string;
  name: string;
  currency: string;
}

export interface GiftCard {
  slug: string;
  name: string;
  icon: string;
  accent: string;
  desc: string;
  badge?: string;
  category: string;
  countries: CountryVariant[];
}

export interface Subscription {
  slug: string;
  name: string;
  icon: string;
  accent: string;
  desc: string;
  badge?: string;
}

export const giftCards: GiftCard[] = [

  // ── 应用商店 ──────────────────────────────────────────
  {
    slug: 'apple-gift-card',
    name: 'Apple Gift Card',
    icon: '🍎',
    accent: '#A8A9AD',
    desc: 'App Store / iTunes 充值，国区下架的 App 用港区/美区账号购买',
    badge: '热销',
    category: '应用商店',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇭🇰', name: '港区', currency: 'HKD' },
      { flag: '🇬🇧', name: '英国', currency: 'GBP' },
      { flag: '🇯🇵', name: '日本', currency: 'JPY' },
      { flag: '🇦🇺', name: '澳大利亚', currency: 'AUD' },
      { flag: '🇨🇦', name: '加拿大', currency: 'CAD' },
    ],
  },
  {
    slug: 'google-play-gift-card',
    name: 'Google Play 礼品卡',
    icon: '▶️',
    accent: '#4285F4',
    desc: '订阅 YouTube Premium、购买安卓应用，非国产安卓机必备',
    category: '应用商店',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇯🇵', name: '日本', currency: 'JPY' },
      { flag: '🇬🇧', name: '英国', currency: 'GBP' },
    ],
  },

  // ── 流媒体 ────────────────────────────────────────────
  {
    slug: 'netflix-gift-card',
    name: 'Netflix 礼品卡',
    icon: '🎬',
    accent: '#E50914',
    desc: '充值 Netflix 账户，配合梯子看 4K 正版剧',
    badge: '热销',
    category: '流媒体',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇬🇧', name: '英国', currency: 'GBP' },
    ],
  },
  {
    slug: 'spotify-gift-card',
    name: 'Spotify 礼品卡',
    icon: '🎵',
    accent: '#1DB954',
    desc: '充值 Spotify Premium，梯子 + 美区账号无广告听歌',
    category: '流媒体',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇬🇧', name: '英国', currency: 'GBP' },
    ],
  },

  // ── 游戏 ─────────────────────────────────────────────
  {
    slug: 'steam-gift-card',
    name: 'Steam 钱包卡',
    icon: '🎮',
    accent: '#1B2838',
    desc: 'Steam 钱包充值，国区可直接用，美元区游戏更便宜',
    badge: '热销',
    category: '游戏',
    countries: [
      { flag: '🇺🇸', name: '美元区', currency: 'USD' },
      { flag: '🇪🇺', name: '欧元区', currency: 'EUR' },
      { flag: '🇬🇧', name: '英镑区', currency: 'GBP' },
    ],
  },
  {
    slug: 'playstation-gift-card',
    name: 'PlayStation Store',
    icon: '🕹️',
    accent: '#003791',
    desc: 'PSN 钱包充值，港区账号大陆直连最快',
    category: '游戏',
    countries: [
      { flag: '🇭🇰', name: '港区', currency: 'HKD' },
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇯🇵', name: '日本', currency: 'JPY' },
    ],
  },
  {
    slug: 'nintendo-gift-card',
    name: 'Nintendo eShop 卡',
    icon: '🔴',
    accent: '#E4000F',
    desc: 'Switch 日区 / 美区购买游戏，日区价格优势明显',
    category: '游戏',
    countries: [
      { flag: '🇯🇵', name: '日本', currency: 'JPY' },
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
    ],
  },
  {
    slug: 'battlenet-gift-card',
    name: 'Battle.net 点卡',
    icon: '🔵',
    accent: '#148EFF',
    desc: '暴雪国服停运后必备，魔兽 / 炉石 / 守望先锋国际服',
    badge: '国服停运',
    category: '游戏',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇪🇺', name: '欧洲', currency: 'EUR' },
    ],
  },
  {
    slug: 'roblox-gift-card',
    name: 'Roblox 礼品卡',
    icon: '🧱',
    accent: '#FF0000',
    desc: '购买 Robux，兑换道具与 Premium 会员',
    category: '游戏',
    countries: [
      { flag: '🌐', name: '全球通用', currency: 'USD' },
    ],
  },
  {
    slug: 'pubg-gift-card',
    name: 'PUBG Mobile UC',
    icon: '🪂',
    accent: '#F5A623',
    desc: '国际服 UC 点券，皮肤 / 道具 / 战令充值',
    category: '游戏',
    countries: [
      { flag: '🌐', name: '全球通用', currency: 'USD' },
    ],
  },
  {
    slug: 'razer-gold-gift-card',
    name: 'Razer Gold',
    icon: '⚡',
    accent: '#44D62C',
    desc: '全球通用游戏点券，支持 100+ 款游戏充值',
    category: '游戏',
    countries: [
      { flag: '🌐', name: '全球通用', currency: 'USD' },
    ],
  },
  {
    slug: 'riot-gift-card',
    name: 'Riot Access 点卡',
    icon: '⚔️',
    accent: '#D0312D',
    desc: '国际服英雄联盟 / Valorant 充值 RP 点数',
    category: '游戏',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇪🇺', name: '欧洲', currency: 'EUR' },
    ],
  },
  {
    slug: 'discord-gift-card',
    name: 'Discord Nitro',
    icon: '💬',
    accent: '#5865F2',
    desc: '订阅 Discord Nitro，高清语音 + 自定义表情',
    category: '游戏',
    countries: [
      { flag: '🌐', name: '全球通用', currency: 'USD' },
    ],
  },
  {
    slug: 'free-fire-gift-card',
    name: 'Free Fire 钻石',
    icon: '💎',
    accent: '#FF6B00',
    desc: '国际服钻石充值，皮肤 / 角色 / 道具',
    category: '游戏',
    countries: [
      { flag: '🌐', name: '全球通用', currency: 'USD' },
    ],
  },

  // ── 购物 ─────────────────────────────────────────────
  {
    slug: 'amazon-gift-card',
    name: 'Amazon Gift Card',
    icon: '📦',
    accent: '#FF9900',
    desc: '亚马逊海淘必备，配合转运公司直邮国内',
    category: '购物',
    countries: [
      { flag: '🇺🇸', name: '美国', currency: 'USD' },
      { flag: '🇯🇵', name: '日本', currency: 'JPY' },
      { flag: '🇬🇧', name: '英国', currency: 'GBP' },
      { flag: '🇩🇪', name: '德国', currency: 'EUR' },
    ],
  },
];

export const subscriptions: Subscription[] = [
  {
    slug: 'netflix',
    name: 'Netflix 合租',
    icon: '🎬',
    accent: '#E50914',
    desc: '高级版 4K 合租席位，稳定不掉线，月付',
    badge: '新上架',
  },
  {
    slug: 'spotify',
    name: 'Spotify Premium',
    icon: '🎵',
    accent: '#1DB954',
    desc: '个人独享 Premium 账号，年付更优惠',
  },
];

export const giftCardCategories = [...new Set(giftCards.map(c => c.category))];

// ── AI 充值 ────────────────────────────────────────────
export interface AiTopup {
  slug: string;
  name: string;
  icon: string;
  accent: string;
  desc: string;
  price: string;
  badge?: string;
}

export const aiTopups: AiTopup[] = [
  // 对话 AI
  { slug: 'chatgpt-plus',     name: 'ChatGPT Plus',        icon: '🤖', accent: '#10A37F', desc: 'GPT-4o / o1 全功能，官网正价，可出官方发票', price: '询价', badge: '热销' },
  { slug: 'claude-pro',       name: 'Claude Pro',          icon: '🧠', accent: '#CC785C', desc: 'Sonnet / Opus 无限制，官网正价，可出官方发票', price: '询价' },
  { slug: 'gemini-advanced',  name: 'Gemini Advanced',     icon: '♊', accent: '#4285F4', desc: 'Google Gemini Ultra，官网正价，可出官方发票', price: '询价' },
  { slug: 'grok-premium',     name: 'Grok Premium',        icon: '✖️', accent: '#000000', desc: 'xAI Grok 2 无限制，需绑定 X Premium，可出发票', price: '询价' },
  { slug: 'copilot-pro',      name: 'Microsoft Copilot Pro', icon: '🪟', accent: '#0078D4', desc: 'GPT-4 加持的微软 AI，官网正价，可出官方发票', price: '询价' },

  // 创作 AI
  { slug: 'midjourney',       name: 'Midjourney',          icon: '🎨', accent: '#7B68EE', desc: 'Basic / Standard / Pro，官网正价，可出发票', price: '询价' },
  { slug: 'canva-pro',        name: 'Canva Pro',           icon: '🖌️', accent: '#00C4CC', desc: 'AI 设计平台 Pro 版，官网正价，可出官方发票', price: '询价' },
  { slug: 'runway',           name: 'Runway Gen-3',        icon: '🎬', accent: '#FF4500', desc: 'AI 视频生成，Standard / Pro，可出官方发票', price: '询价', badge: '新上架' },
  { slug: 'heygen',           name: 'HeyGen',              icon: '🧑‍💻', accent: '#6C63FF', desc: 'AI 数字人视频，官网正价，可出官方发票', price: '询价' },
  { slug: 'elevenlabs',       name: 'ElevenLabs',          icon: '🎙️', accent: '#FF6B35', desc: 'AI 语音克隆，官网正价，可出官方发票', price: '询价' },

  // 编程 AI
  { slug: 'cursor-pro',       name: 'Cursor Pro',          icon: '💻', accent: '#222222', desc: 'AI 编程助手，官网正价，可出官方发票', price: '询价' },
  { slug: 'github-copilot',   name: 'GitHub Copilot',      icon: '🐙', accent: '#24292E', desc: 'Pro / Business，官网正价，可出官方发票', price: '询价' },

  // 其他
  { slug: 'perplexity-pro',   name: 'Perplexity Pro',      icon: '🔍', accent: '#20B2AA', desc: 'AI 搜索引擎，官网正价，可出官方发票', price: '询价' },
  { slug: 'notion-ai',        name: 'Notion AI',           icon: '📝', accent: '#000000', desc: 'Notion AI 附加包，官网正价，可出官方发票', price: '询价' },

  // 代付 / 代购
  { slug: 'paypal-pay',       name: 'PayPal 代付',         icon: '💳', accent: '#003087', desc: '没有 PayPal？发来链接，代为付款，USDT / 微信均可', price: '询价' },
  { slug: 'daigou',           name: '代购服务',             icon: '🛍️', accent: '#FF6B6B', desc: '海外任意商品代购，亚马逊 / eBay / 独立站，报价后下单', price: '询价' },
];

// ── 账号售卖 ───────────────────────────────────────────
export interface AccountItem {
  slug: string;
  name: string;
  icon: string;
  accent: string;
  desc: string;
  price: string;
  badge?: string;
}

export const accounts: AccountItem[] = [
  {
    slug: 'apple-id',
    name: '苹果 Apple ID',
    icon: '🍎',
    accent: '#A8A9AD',
    desc: '美区 / 港区独立账号，可下载小火箭等工具，带密保',
    price: '询价',
    badge: '热销',
  },
  {
    slug: 'shadowrocket',
    name: '小火箭 Shadowrocket',
    icon: '🚀',
    accent: '#FF3B30',
    desc: '美区 Apple ID 已购小火箭，登录 App Store 直接下载',
    price: '询价',
    badge: '热销',
  },
  {
    slug: 'gmail',
    name: 'Gmail 账号',
    icon: '📧',
    accent: '#EA4335',
    desc: '手工注册真实 Gmail，可用于各类海外平台注册',
    price: '询价',
  },
  {
    slug: 'outlook',
    name: 'Outlook 账号',
    icon: '📨',
    accent: '#0078D4',
    desc: '微软 Outlook 邮箱账号，可绑定 Office 365 等服务',
    price: '询价',
  },
  {
    slug: 'telegram',
    name: 'Telegram 账号',
    icon: '✈️',
    accent: '#2AABEE',
    desc: '实名注册 TG 账号，海外手机号，可正常使用',
    price: '询价',
  },
];
