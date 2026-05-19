---
cardSlug: safepal-card
title: SafePal 万事达卡开通教程（2026最新）
updatedAt: "2025-05-19"
---

SafePal Card 是由瑞士持牌银行 **Fiat24** 发行的万事达借记卡，附赠瑞士个人 IBAN 账户，支持全球消费和 USDT 出金。完全免费开卡，推广佣金高达 40%。

> ⚠️ **2026年重要更新**：2026年1月23日起，Fiat24 正式关闭身份证（大陆二代身份证）验证通道。**新用户必须使用护照**，且需要**带 NFC 芯片的电子护照**（2012年后签发的中国护照均带 NFC）。

---

## 开卡前准备

- **2012年后签发的中国护照**（带 NFC 芯片，必须）
- **支持 NFC 的手机**（iPhone XS 以上 / Android 大多数支持）
- 下载 **SafePal App** + **ReadID Ready App**（扫护照芯片用）
- SafePal 钱包内准备 **Arbitrum 链的少量 ETH**（约 $0.5，用于 Gas 费）
- 科学上网工具（GPS 定位不能挂 VPN，见注意事项）

---

## 第一步：注册 SafePal 钱包

![SafePal 钱包注册界面](/images/tutorials/safepal-card/step-01.jpg)

1. 下载 **SafePal App**（App Store / Google Play）
2. 点击「Create Wallet」→「Software Wallet」
3. **手写并妥善保管 12 个助记词**（不能截图，丢了等于丢资产）
4. 按顺序验证助记词，钱包创建完成

---

![SafePal 助记词备份界面](/images/tutorials/safepal-card/step-02.jpg)

## 第二步：向 SafePal 充入 Arbitrum ETH

开户时需要支付少量 Gas 费，必须提前准备：

1. 在 SafePal 钱包中切换到 **Arbitrum One** 网络
2. 复制 Arbitrum 地址
3. 在欧易/币安提币 ETH，**网络选 Arbitrum One**，充入约 **0.001 ETH**（约 $3，实际只用 $0.2 左右）

> ⚠️ **必须是 Arbitrum One 链**，充入以太坊主网或其他链会导致 Gas 费无法使用。

---

![Arbitrum One 网络充值 ETH](/images/tutorials/safepal-card/step-03.jpg)

## 第三步：进入 Fiat24 开户入口

1. 打开 SafePal App
2. 点击底部「Bank」图标（或「Discover」→ 搜索「Fiat24」）
3. 点击「开始」→「开立账户」

---

![SafePal App 内 Fiat24 Bank 入口](/images/tutorials/safepal-card/step-04.jpg)

## 第四步：KYC 护照认证（核心步骤）

> 💡 全程保持 GPS 定位开启，不要挂 VPN（否则系统判定高风险地区）

1. 填写个人信息：
   - 姓名（与护照完全一致）
   - 居住地址（**必须填真实地址，GPS 定位必须在填写地址 2 公里范围内**）
   - 出生日期、国籍

2. 系统跳转 KYC 页面，选择 **ReadID Ready App** 方式

3. 打开 **ReadID Ready App**：
   - 打开护照信息页（有照片的那一页）
   - 将手机 NFC 区域贴近护照芯片（通常在封底附近）
   - 等待 App 读取芯片（约 10-30 秒）

4. 回到 SafePal，完成**人脸识别**（与护照照片对比）

5. 提交，等待审核（通常 **几小时内**，最慢 1 个工作日）

---

![ReadID App 扫描护照 NFC 芯片](/images/tutorials/safepal-card/step-06.jpg)

## 第五步：铸造 NFT 账户

KYC 通过后，需要在 Arbitrum 链上铸造 NFT 来激活账户：

1. 进入 Fiat24 DApp → 点击「Mint NFT」
2. 确认 Gas 费（约 $0.1-0.3，从 Arbitrum ETH 余额扣除）
3. 确认交易，等待链上确认（约 1-2 分钟）

铸造完成后账户正式激活，可以看到你的**瑞士 IBAN 账号**（IBAN 格式：CH 开头）。

---

![Arbitrum 链上 NFT 铸造确认](/images/tutorials/safepal-card/step-08.jpg)

## 第六步：充值激活万事达卡

1. 进入 Fiat24 DApp →「Exchange」
2. 将 USDT（Arbitrum 链）兑换为 **USDC**（建议先换 ≥20 USDC）
3. 充值有 **1% 手续费**，建议一次充入足够用一段时间的金额
4. 余额到账后，进入「Card」→ 即可查看虚拟万事达卡信息

---

![Fiat24 万事达虚拟卡卡号查看](/images/tutorials/safepal-card/step-09.jpg)

## 额外福利：免费领 SafePal 硬件钱包

开通 Fiat24 账户后，可申请免费领 **SafePal X1 硬件钱包**（零售价约 $69）。在 SafePal App 内找到对应活动页面申请。

---

## 费率说明

| 项目 | 费用 |
|------|------|
| 开卡费 | 免费 |
| 年费 | 免费 |
| Gas 费（NFT 铸造）| 约 $0.2 |
| USDC 充值 | 1% |
| 外汇兑换 | 约 0.1-0.5% |
| 实体卡（可选）| 约 €25 |
| ATM 取现 | €2 / 次 |

---

## 常见问题

**Q：NFC 读取护照失败怎么办？**
部分国产手机 NFC 与 ReadID App 不兼容。解决方法：用电脑访问 Fiat24 官网 KYC 页面获取验证链接，再用手机 ReadID 继续操作。

**Q：用身份证会怎样？**
2026年1月起，用身份证 KYC 会被直接拒绝，且有被 Fiat24 **永久拉黑**的风险。必须使用护照。

**Q：GPS 定位要求是什么意思？**
你填写的居住地址与你手机实际 GPS 位置必须相距 2 公里以内。开 VPN 会导致 GPS 偏移，被系统判定高风险，建议 KYC 期间关闭 VPN。

**Q：已经在 Fiat24 官网直接注册过，能再用 SafePal 开吗？**
不行，同一身份只能绑定一个平台（SafePal 或 Fiat24 官网二选一）。

**Q：瑞士 IBAN 有什么用？**
可从 Wise、N26、Revolut 等欧洲银行转欧元进来，也可接收雇主工资，用途很广。

**Q：Arbitrum ETH 怎么获得？**
欧易/币安购买 ETH → 提币时选 **Arbitrum One** 网络 → 地址填 SafePal 钱包地址。
