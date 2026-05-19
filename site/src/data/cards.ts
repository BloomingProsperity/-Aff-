export type AiStatus = '✅' | '⚠️' | '❌';

export interface Card {
  slug: string;
  name: string;
  tagline: string;
  rating: number;
  tag?: string;
  idType: '身份证' | '护照';
  regions: string;
  fee: string;
  cashback: string;
  network: string;
  affLink: string;
  youtubeId?: string;
  pros: string[];
  cons: string[];
  color: string;
  ai: {
    chatgpt: AiStatus;
    claude: AiStatus;
    midjourney: AiStatus;
    note: string;
  };
}

export const cards: Card[] = [
  {
    slug: 'bybit-card',
    name: 'Bybit 虚拟卡',
    tagline: '0门槛、0年费，大陆用户首选 USDT 消费卡',
    rating: 4.8,
    tag: '推荐',
    idType: '身份证',
    regions: '全球（含亚太）',
    fee: '免费',
    cashback: '最高 10%',
    network: 'Mastercard',
    affLink: 'https://www.bybit.com/cards/?ref=RZDGOXK&source=applet_invite',
    youtubeId: 'nRonDOI1Hho',
    pros: ['无开卡费年费', '大陆身份证可开', '无需地址证明（选澳区）', '可绑定支付宝/微信', '消费有返现'],
    cons: ['需要 Bybit 交易所账户', '返现需一定持仓量'],
    color: '#F59E0B',
    ai: {
      chatgpt: '⚠️',
      claude: '⚠️',
      midjourney: '✅',
      note: '需美国住宅 IP + 全局代理，哈萨克斯坦卡段被 Stripe 标记为风险区域，成功率不稳定',
    },
  },
  {
    slug: 'bybit-eu-card',
    name: 'Bybit 欧洲卡',
    tagline: '欧洲华人专属，10%返现 + 10 USDC 体验金，0年费',
    rating: 4.7,
    tag: '欧洲专属',
    idType: '护照',
    regions: '欧洲 EEA',
    fee: '免费',
    cashback: '最高 10%',
    network: 'Mastercard',
    affLink: 'https://www.bybit.eu/cards/?ref=1NNDZ0W&source=applet_invite',
    youtubeId: 'nRonDOI1Hho',
    pros: ['0开卡费年费', '欧洲护照/欧盟居民可开', '注册送10 USDC体验金', '最高10%消费返现', '支持USDT充值消费'],
    cons: ['需要欧洲居住地址', '仅限EEA地区用户'],
    color: '#2563EB',
    ai: {
      chatgpt: '⚠️',
      claude: '⚠️',
      midjourney: '✅',
      note: '欧洲 EEA BIN，Stripe 信任度较高；需美国/欧洲 IP，ChatGPT/Claude 订阅成功率因节点而异',
    },
  },
  {
    slug: 'safepal-card',
    name: 'SafePal 万事达卡',
    tagline: '瑞士银行背书，附赠 IBAN 账户，大陆可用',
    rating: 4.6,
    tag: '大陆可用',
    idType: '护照',
    regions: '全球（含大陆）',
    fee: '免费',
    cashback: '1%',
    network: 'Mastercard',
    affLink: '#',
    youtubeId: 'rSWtH_urn1Y',
    pros: ['完全免费', '附赠瑞士 IBAN 账户', '可绑定支付宝/微信', '大陆护照可开', 'Aff佣金最高40%'],
    cons: ['2026年起需护照（不支持身份证）', '需链上 ETH 铸造 NFT'],
    color: '#3B82F6',
    ai: {
      chatgpt: '⚠️',
      claude: '⚠️',
      midjourney: '✅',
      note: '直刷成功率偏低，绑定美区 Apple Pay 后可大幅提升；需美国 IP',
    },
  },
  {
    slug: 'pokepay',
    name: 'Pokepay 虚拟卡',
    tagline: '专为华人设计，身份证可开，支持微信支付宝',
    rating: 4.5,
    tag: '身份证可开',
    idType: '身份证',
    regions: '全球（含大陆/香港）',
    fee: '0 月费',
    cashback: '—',
    network: 'Visa / Mastercard',
    affLink: '#',
    youtubeId: 'CUfqusNgyVU',
    pros: ['中国大陆身份证可开', '可绑定微信/支付宝/PayPal', 'Visa + MC 双卡网络', '0月费0年费'],
    cons: ['开卡费 5-20 USDT', '不支持 Steam/暴雪等游戏平台'],
    color: '#8B5CF6',
    ai: {
      chatgpt: '❌',
      claude: '❌',
      midjourney: '✅',
      note: '香港 Visa 卡段被 OpenAI / Anthropic 屏蔽，ChatGPT/Claude 直接付款失败；Midjourney 等宽松平台可用',
    },
  },
  {
    slug: 'roogoo',
    name: 'Roogoo 卡',
    tagline: '跨境 0 费率，USDT 直接消费，华人圈热门',
    rating: 4.4,
    tag: '0费率',
    idType: '身份证',
    regions: '全球华人（美国MSB牌照）',
    fee: '免费',
    cashback: '—',
    network: 'Visa / Mastercard',
    affLink: 'https://wap.roogoo.cloud/register?inviteCode=0eq357',
    youtubeId: 't9dhdeERN7g',
    pros: ['持ROOG代币可终身0费率', '7天试用期0费率', '支持支付宝/微信绑定', 'Aff佣金最高30%'],
    cons: ['仅支持 USDT 充值', '高费率套餐需持仓代币'],
    color: '#10B981',
    ai: {
      chatgpt: '✅',
      claude: '✅',
      midjourney: '✅',
      note: '美国 MSB 牌照 + 美国 BIN，官方提供 ChatGPT / Claude 订阅教程，需美国 IP',
    },
  },
  {
    slug: 'kraken-card',
    name: 'Kraken 海妖卡',
    tagline: '全球第二大交易所出品，新用户30天2%返现',
    rating: 4.2,
    idType: '护照',
    regions: '英国 + EEA',
    fee: '免费',
    cashback: '0.5% - 2%',
    network: 'Mastercard',
    affLink: '#',
    youtubeId: 'mKqiHKqy2k8',
    pros: ['0 外汇手续费', '新用户30天享2%顶级返现', '支持400+加密货币消费', '即时发放虚拟卡'],
    cons: ['仅限英国/欧洲用户', '2%返现需持仓£50,000+'],
    color: '#7C3AED',
    ai: {
      chatgpt: '⚠️',
      claude: '⚠️',
      midjourney: '✅',
      note: '英国/欧盟 BIN，Stripe 信任度高于亚洲卡，理论可用；仅限欧洲用户申请',
    },
  },
];
