# 花开SHOP 接码后端

这个目录是独立的 Node API + PostgreSQL 后端。前端仍然可以放在 Cloudflare Pages，接码系统的数据、订单、余额、5sim 密钥放在 VPS。

## 本地开发

```powershell
cd server
npm install
copy .env.example .env
npm run migrate
npm run dev
```

默认端口是 `8788`。本地前端可以在浏览器控制台设置：

```js
localStorage.setItem("HKAI_SMS_API_BASE", "http://127.0.0.1:8788")
```

## VPS 环境变量

`.env` 至少要填这些：

```env
DATABASE_URL=postgres://hkai_sms:你的密码@127.0.0.1:5432/hkai_sms
PUBLIC_URL=https://api.hkai.shop
CORS_ORIGIN=https://hkai.shop,https://www.hkai.shop
COOKIE_DOMAIN=.hkai.shop
COOKIE_SECURE=true
TRUST_PROXY_HEADERS=false
ADMIN_EMAIL=huakaifugui2.0@gmail.com
FIVESIM_API_KEY=你的5sim新密钥
SMS_USD_CNY_RATE=7.2
SMS_MARGIN_CNY=10
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

## 上线安全检查

1. 先填 `ADMIN_EMAIL`，只有这个邮箱注册后才会是管理员。
2. 开启 Cloudflare Turnstile，填 `TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`。
3. 5sim 密钥只放在 VPS 的 `.env`，不要放进前端、GitHub 或 Cloudflare Pages 变量。
4. 跑 `npm run migrate`，确保 `page_views` 和 `app_settings` 表已创建。
5. 防火墙只开放 `80/443/22`，Node 端口 `8788` 只允许本机访问。
6. 如果密钥、SSH 私钥、服务器密码在聊天或截图里出现过，按泄露处理，重新生成后再上线。

上线后可以在后台 `系统设置` 里替换 `5sim API 密钥`、`Turnstile 站点密钥` 和 `Turnstile 私钥`。密钥不会明文回显，留空保存不会覆盖旧值。

管理员账号只允许 `huakaifugui2.0@gmail.com` 进入后台。跑迁移后，如果这个邮箱已经注册，会保留原密码并提升为管理员。首次部署或需要重置密码时，在 VPS 的 `server` 目录执行：

```bash
ADMIN_PASSWORD='你的第一次登录密码' npm run admin:reset
```

## Ubuntu 部署

```bash
sudo apt update
sudo apt install -y postgresql nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo -u postgres psql
```

PostgreSQL 里执行：

```sql
CREATE USER hkai_sms WITH PASSWORD '换成强密码';
CREATE DATABASE hkai_sms OWNER hkai_sms;
\q
```

上传项目后执行：

```bash
cd /opt/hkai-shop/server
npm ci
cp .env.example .env
nano .env
npm run migrate
sudo cp deploy/hkai-sms.service /etc/systemd/system/hkai-sms.service
sudo systemctl daemon-reload
sudo systemctl enable --now hkai-sms
sudo systemctl status hkai-sms
```

Nginx：

```bash
sudo cp deploy/nginx-hkai-sms.conf /etc/nginx/sites-available/hkai-sms
sudo ln -s /etc/nginx/sites-available/hkai-sms /etc/nginx/sites-enabled/hkai-sms
sudo nginx -t
sudo systemctl reload nginx
```

SSL 可以用：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.hkai.shop
```

## 数据库备份

生产环境的用户余额、订单、充值券和邀请记录都在 PostgreSQL，必须保留自动备份。安装或更新备份定时器：

```powershell
cd C:\Users\h\Desktop\银行卡Aff项目
.\server\scripts\install-db-backup.ps1
```

默认会在 VPS 上安装 `hkai-db-backup.timer`，每天凌晨自动运行 `pg_dump`，备份文件放在 `/root/hkai-db-backups`，保留 14 天。手动检查：

```bash
systemctl list-timers --all hkai-db-backup.timer
ls -lh /root/hkai-db-backups
```
