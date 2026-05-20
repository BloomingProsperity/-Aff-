# 花开SHOP — 首页 + 产品详情

China Atlas 设计系统下的商品站重做。**单文件 + 数据驱动**——纯 HTML/JS，不需要构建。

## 文件结构

```
index.html          页面壳，挂载 React + 引入各 script
tokens.css          China Atlas 设计系统色彩 / 排版 token（不要改）
styles.css          本站组合样式（基于 token 的局部样式）
data.js             全部产品数据 + SVG 卡面生成函数 + 教程 / FAQ / 礼品卡详情
app.jsx             首页 + 路由 + 全局 chrome（顶栏 / 公告条 / 页脚 / 社群）
detail.jsx          /cards/<slug> 银行卡详情、/shop/<slug> 礼品卡详情
tweaks-panel.jsx    Tweaks 面板（右下角，运行时切换布局 / 主打 / 主色）
image-slot.js       拖拽上传图槽（保留备用，当前未使用）
```

## 部署

直接把整个目录上传到任何静态托管（Cloudflare Pages、Netlify、Vercel、Nginx 静态目录均可）。无构建步骤、无 npm install。

入口：`index.html`。路由：URL hash（`#/`、`#/cards/<slug>`、`#/shop/<slug>`）。

## 改东西

### 加一张银行卡
打开 `data.js`，在 `window.CARDS = [...]` 里照样格式加一项。

```js
{
  slug: "new-card",          // URL slug，必须唯一
  no: "07",                  // 卡面右上编号 (SVG 卡面用，可省)
  name: "新卡名",
  issuer: "Issuer · Mastercard",
  lead: "一句话概括",
  rating: 4.5,
  tag: "推荐",                // 角标，null 不显示
  idType: "身份证",
  regions: "全球",
  fee: "免费",
  cashback: "1%",
  network: "Mastercard",
  bin: "美国",
  color: "#1f4ea8",          // SVG 卡面背景色（品牌色）
  officialArt: null,         // 设为官方卡面 URL 可覆盖 SVG mock
  pros: ["..."],
  cons: ["..."],
  ai: { chatgpt: "ok", claude: "warn", midjourney: "ok",
        note: "AI 通过率说明" }
}
```

再到 `window.TUTORIALS["new-card"] = [...]` 加 5–6 个开卡步骤。

### 换成官方卡面图
两种方式：

**方式 A —— data.js 里加 URL**
```js
{ slug: "bybit-card", color: "#f0a800",
  officialArt: "https://你的图床/bybit-card.png",
  ...
}
```
`window.cardArt(card)` 会优先用 `officialArt`，没有再用 SVG mock。

**方式 B —— 改 SVG 模板**
直接编辑 `data.js` 里 `window.cardFaceToDataUrl` 函数，按品牌定制更精致的 SVG（添加 logo、波浪线等）。

### 改文案 / 公告条
- 顶部公告条：`app.jsx` → `PromoBar` 组件
- Hero 标题：`app.jsx` → `Hero` 组件
- FAQ：`data.js` → `window.FAQS`
- 教程：`data.js` → `window.TUTORIALS[slug]`
- 礼品卡详情：`data.js` → `window.GIFT_DETAILS[slug]`

### 加新礼品卡
1. `window.GIFT_CARDS` 加一项（首页轮播）
2. `window.GIFT_DETAILS[slug] = { ... }` 加详情数据
3. 同样可加 `officialArt` 字段

### Tweaks 面板（右下角切换）
- 顶部公告条 开 / 关
- 产品网格 两列 / 三列
- 本期主打卡 切换
- 主色 祖母绿 / 钴蓝 / 赭红

切换的设定会自动保存回 `data.js` 上方的 `TWEAK_DEFAULTS` 区块。

## 设计系统

视觉沿用 [China Atlas](https://github.com/...)：
- 纸 + 墨 + 玉 + 琥珀四色
- 无渐变、无投影、无 emoji
- 字体 Inter + PingFang SC
- 标识 Kicker 大写字母 + tracking-widest

完整 token 在 `tokens.css`，不要改它。

## 仍待完成

- [ ] **官方卡面图**：填 `officialArt` 字段或换 SVG 模板（详见上面）
- [ ] **真正的购买流程**：当前 `立即申请 / 立即购买 / 购买区码` 按钮 href="#"，需接入 Aff 链接或电商后端
- [ ] **微信二维码弹层**：当前 `#wechat` 锚点，未实现弹层
- [ ] **筛选 tabs 联动**：`银行卡` 区的「大陆可办 / 护照办 / 欧洲 / AI 友好」当前是静态 UI，未实现过滤
- [ ] **Tweaks 持久化到磁盘**：当前只在浏览器存储，刷新后重置
- [ ] **后端 SEO**：单页 hash 路由对 SEO 不友好。如需 SEO 优化建议接回 Astro 多页结构

## 怎么接回 Astro 项目

如果你要把这个原型接到原 Astro 工程（`银行卡Aff项目/site/`）：

1. 把 `tokens.css` 内容追加到 `src/styles/global.css`（或单独引入）
2. `styles.css` 拆到 Astro layout 的 `<style>` 块
3. `data.js` 的内容转成 `src/data/cards.ts` + `src/data/giftcards.ts` 的 TypeScript 数据
4. `app.jsx` 拆成 Astro 组件：`src/components/Hero.astro`、`ProductGrid.astro`、`GiftStrip.astro`、`FAQ.astro`
5. `detail.jsx` 拆成 `src/pages/cards/[slug].astro` 和 `src/pages/shop/[slug].astro`
6. SVG 卡面生成放到 Astro 的服务器侧（生成时静态化），或客户端 hydrate

要做这一步的话告诉我。
