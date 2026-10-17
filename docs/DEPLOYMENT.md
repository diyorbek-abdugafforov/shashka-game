# 🚀 Russian Checkers Platform — Production Deployment Guide

Hujjat versiyasi: `1.0.0`  
Muhit: `Production (Ubuntu Linux 22.04 LTS / 24.04 LTS)`  
Konteynerlashtirish: `Docker` + `Docker Compose v2`  
Reverse Proxy: `Nginx` (yoki `Caddy`)  
SSL: `Let's Encrypt (Certbot)`

---

## 1. Talablar va Tizim ehtiyojlari (Prerequisites)

### 1.1. Server konfiguratsiyasi (Tavsiya etiladigan apparat ta'minoti)
- **Boshlang'ich (0 – 10,000 DAU)**:
  - CPU: 2 vCPU
  - RAM: 4 GB
  - SSD: 40 GB NVMe
  - Bandwidth: 1 Gbps port
- **O'sish bosqichi (10,000 – 100,000 DAU)**:
  - CPU: 4–8 vCPU
  - RAM: 16 GB
  - SSD: 100 GB NVMe

### 1.2. Dasturiy ta'minot talablari
Serverda quyidagi dasturlar o'rnatilgan bo'lishi kerak:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw jq unzip apt-transport-https ca-certificates gnupg

# Docker Engine va Docker Compose v2 o'rnatish
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Nginx va Certbot o'rnatish
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 2. Muhit o'zgaruvchilari (Environment Setup & `.env`)

Loyiha ildizida ishlab chiqarish muhiti uchun `.env` fayli yaratiladi:

```ini
# ==============================================================================
# GENERAL SETTINGS
# ==============================================================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DOMAIN=shashka.app
WEBAPP_URL=https://shashka.app

# ==============================================================================
# SECURITY & AUTHENTICATION
# ==============================================================================
# 64-belgili tasodifiy secret key (openssl rand -hex 32)
JWT_SECRET=c8f39a7b9319e0b2408de7bbf33580436d40dfae61f8941785f20188091ab92e
JWT_EXPIRES_IN=7d

# ==============================================================================
# TELEGRAM BOT CREDENTIALS
# ==============================================================================
TELEGRAM_BOT_TOKEN=1234567890:AAH78q...your_botfather_token...
TELEGRAM_BOT_USERNAME=shashka_game_bot
TELEGRAM_WEBHOOK_SECRET=7f918e90ab12f459c00de...

# ==============================================================================
# DATABASE (PostgreSQL)
# ==============================================================================
POSTGRES_USER=shashka_admin
POSTGRES_PASSWORD=SuperStrongDBPassword_2026!
POSTGRES_DB=shashka_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://shashka_admin:SuperStrongDBPassword_2026!@postgres:5432/shashka_db?schema=public&connection_limit=25

# ==============================================================================
# IN-MEMORY CACHE & MESSAGE BROKER (Redis)
# ==============================================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=UltraSecureRedisPass_2026!
REDIS_URL=redis://:UltraSecureRedisPass_2026!@redis:6379/0

# ==============================================================================
# CORS & RATE LIMITING
# ==============================================================================
CORS_ORIGIN=https://shashka.app,https://web.telegram.org
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## 3. Docker va Multi-stage Konteynerlar

Monorepo paketlarini alohida, ixcham va xavfsiz (non-root user) konteynerlarga yig'ish uchun Multi-stage Dockerfile'lar qo'llaniladi.

### 3.1. `docker-compose.prod.yml`
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: shashka-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: shashka-redis
    restart: always
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    networks:
      - internal-net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: shashka-server
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file: .env
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - internal-net

  bot:
    build:
      context: .
      dockerfile: apps/bot/Dockerfile
    container_name: shashka-bot
    restart: always
    depends_on:
      server:
        condition: service_started
    env_file: .env
    ports:
      - "127.0.0.1:3001:3001"
    networks:
      - internal-net

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    container_name: shashka-worker
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file: .env
    networks:
      - internal-net

volumes:
  postgres_data:
  redis_data:

networks:
  internal-net:
    driver: bridge
```

---

## 4. HTTPS va Nginx konfiguratsiyasi (Reverse Proxy & WebSockets)

Nginx mijoz so'rovlarini qabul qilib, statik TMA fayllarini uzatadi hamda `/api` va `/socket.io` yo'llarini ichki Fastify konteyneriga yo'naltiradi.

### 4.1. Nginx sayt konfiguratsiyasi: `/etc/nginx/sites-available/shashka.app`

```nginx
# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name shashka.app www.shashka.app;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name shashka.app;

    # SSL Sertifikatlari (Certbot o'rnatadi)
    ssl_certificate /etc/letsencrypt/live/shashka.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shashka.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Xavfsizlik sarlavhalari
    add_header X-Frame-Options "ALLOW-FROM https://web.telegram.org/" always;
    add_header Content-Security-Policy "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # TMA Frontend Statik Fayllari (React Build)
    root /var/www/shashka-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # Statik assetlar (rasmlar, shriftlar) uzoq keshlanadi
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # Fastify REST API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO WebSocket Ulanishlari
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Telegram Bot Webhook Endpoint
    location /webhook/telegram {
        proxy_pass http://127.0.0.1:3001/webhook/telegram;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4.2. SSL Sertifikatini olish (Certbot)
```bash
sudo ln -s /etc/nginx/sites-available/shashka.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d shashka.app -d www.shashka.app
sudo systemctl reload nginx
```

---

## 5. Telegram Webhook konfiguratsiyasi

Ishlab chiqarish muhitida grammY botiga xabarlarni tez yetkazish uchun Webhook ulanadi:

```bash
# Webhook o'rnatish uchun curl so'rovi
curl -F "url=https://shashka.app/webhook/telegram" \
     -F "secret_token=7f918e90ab12f459c00de..." \
     -F "max_connections=100" \
     -F "drop_pending_updates=true" \
     https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
```

Holatni tekshirish:
```bash
curl https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

---

## 6. Ma'lumotlar bazasi zaxira nusxasi (Database Backup Strategy)

Har kecha avtomatik ravishda PostgreSQL ma'lumotlar bazasini arxivlovchi va 14 kundan eski nusxalarni tozalovchi bash skripti:

### 6.1. Zaxira skripti: `/usr/local/bin/backup_shashka_db.sh`
```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/shashka-postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/shashka_db_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

echo "[$(date)] Ma'lumotlar bazasi nusxalanmoqda..."
docker exec -t shashka-postgres pg_dump -U shashka_admin shashka_db | gzip > $FILENAME

echo "[$(date)] Nusxa muvaffaqiyatli saqlandi: $FILENAME"

# 14 kundan eski arxivlarni o'chirish (Retention Policy)
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete
echo "[$(date)] Eskirgan nusxalar tozalandi."
```

Skriptga ruxsat berish va `crontab` ga qo'shish:
```bash
chmod +x /usr/local/bin/backup_shashka_db.sh
# Har kecha soat 03:00 da ishga tushirish
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup_shashka_db.sh >> /var/log/shashka_backup.log 2>&1") | crontab -
```

---

## 7. Monitoring va Xizmatlar salomatligi (Health Checks)

### 7.1. Server Health Check Endpoint
Fastify serverida `/health` va `/ready` endpointlari ochiq bo'ladi:
```json
// GET https://shashka.app/api/v1/health
{
  "status": "UP",
  "timestamp": "2026-11-01T15:00:00.000Z",
  "services": {
    "database": "CONNECTED",
    "redis": "CONNECTED",
    "activeSockets": 1420
  },
  "uptimeSeconds": 86420
}
```

### 7.2. Loglarni kuzatish (Monitoring Logs)
```bash
# Barcha xizmatlar loglarini real-time kuzatish
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Faqat xatoliklarni filtrlab ko'rish
docker compose -f docker-compose.prod.yml logs server | grep "ERROR"
```
