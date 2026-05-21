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
ADMIN_EMAIL=你的管理员邮箱
FIVESIM_API_KEY=你的5sim新密钥
SMS_USD_CNY_RATE=7.2
SMS_MARGIN_CNY=10
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
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
