# 🏆 Shashka Game Platform — Production-Ready MVP Hisoboti

Ushbu platforma `@shashka_gamebot` va `checkers.sifr.uz` mahsulot oqimi referensi asosida **mutlaqo mustaqil arxitektura, original dizayn va toza kod** bilan to'liq ishlab chiqildi.

---

## 📊 Loyiha Holati va Tekshiruv Natijalari

| Komponent | Tavsifi | Holat | Build / Test |
| :--- | :--- | :---: | :---: |
| **`packages/game-engine`** | Pure TypeScript Rus shashkasi dvigateli (AI, Minimax, Bitboard qoidalari) | ✅ Tayyor | **60/60 Test O'tdi (100%)** |
| **`packages/database`** | PostgreSQL + Prisma ORM (17 ta model, migrations, seed) | ✅ Tayyor | **Client generatsiya qilindi va build bo'ldi** |
| **`packages/shared-types`** | Umumiy DTO, WebSocket events, enums, modellar | ✅ Tayyor | **Build bo'ldi** |
| **`packages/validation`** | Zod schemalari (auth, moves, admin, settings) | ✅ Tayyor | **Build bo'ldi** |
| **`packages/config`** | Zod-asosidagi env parser va type-safe konfiguratsiya | ✅ Tayyor | **Build bo'ldi** |
| **`packages/ui`** | Umumiy tugmalar, badglar, shashka toshlari komponentlari | ✅ Tayyor | **Build bo'ldi** |
| **`apps/api`** | Fastify v5 REST + Socket.IO real-time multiplayer serveri | ✅ Tayyor | **Production Build bo'ldi** |
| **`apps/bot`** | grammY asosidagi Telegram Bot (Webhook + Polling, i18n, deep link) | ✅ Tayyor | **Production Build bo'ldi** |
| **`apps/web`** | React 18 + Vite + Tailwind CSS Telegram Mini App | ✅ Tayyor | **Production Build bo'ldi (dist/)** |
| **`apps/admin`** | React + Vite + Recharts boshqaruv paneli | ✅ Tayyor | **Production Build bo'ldi (dist/)** |

> **Turborepo Natijasi:** `Tasks: 10 successful, 10 total` (Monorepo to'liq xatosiz yig'ildi).

---

## 🎯 Asosiy Imkoniyatlar va Arxitektura

### 1. Rus Shashkasi Game Engine (`packages/game-engine`)
* **Qoidalar:** 8×8 doska, qora kataklar, 12 tadan tosh.
* **Majburiy urish (Mandatory capture):** Agar urish imkoni bo'lsa, oddiy yurishlar taqiqlanadi.
* **Orqaga urish:** Oddiy toshlar oldinga va orqaga sakrab ura oladi.
* **Ko'p bosqichli urish (Multi-capture):** Tosh sakrashni davom ettira oladi; bitta tosh ustidan ikki marta sakrash mumkin emas.
* **Uchuvchi Damka (Flying King):** Diagonal bo'ylab istalgan masofaga yuradi va masofadan sakrab uradi.
* **Sakrash vaqtida damkaga aylanish:** Oxirgi qatorga yetgan tosh darhol damka bo'ladi va urishni damka sifatida davom ettiradi.
* **Avtomatik durang:** 3 marta takrorlanish (repetition) va urishsiz yurishlar chegarasi (move limit).
* **Bot AI:** Minimax + Alpha-Beta Pruning (Oson, O'rta, Qiyin darajalar).

### 2. Telegram Bot (`apps/bot`)
* `/start` menyusi:
  1. 🎮 **Shashka o'ynash** (Mini App ochadi)
  2. 🕹 **Mini o'yinlar** ("Tez orada" xabarnomasi)
  3. 🛒 **Do'kon** (Mini App do'kon katalogi)
* **Deep-linking:** Referral taklif havolalari (`t.me/bot?start=ref_123`) va o'yinga taklif havolalari (`t.me/bot?start=invite_xyz`).
* **Ko'p tilli qo'llab-quvvatlash:** O'zbekcha (asosiy), Ruscha, Inglizcha.
* **Ish rejimi:** Local development uchun Long Polling, Production uchun xavfsiz Webhook secret verification.

### 3. Telegram Mini App (`apps/web`)
* **Dizayn:** Premium mobil-first UI (Indigo/Violet/Emerald aksentlar, qora zamonaviy mavzu).
* **Sahifalar:**
  - Bosh sahifa (Tezkor o'yin, Rejim tanlash)
  - Botga qarshi o'yin (Oson, O'rta, Qiyin)
  - Bitta qurilmada ikki kishilik o'yin (Pass & Play, doskani aylantirish imkoniyati)
  - Onlayn tasodifiy raqib qidirish (Matchmaking queue)
  - Real-time onlayn o'yin (Socket.IO, jonli taymer, taslim bo'lish, durang taklifi)
  - Foydalanuvchi profili va statistika (Winrate, ELO/Glicko-2 reytingi, tarix)
  - Reyting jadvali (Leaderboard)
  - O'yinlar tarixi va Game Replay (yurishlarni qadamma-qadam ko'rish)
  - Do'kon (Tosh va doska dizaynlari katalogi)
  - Sozlamalar (Ovoz, animatsiya, til)

### 4. Backend & Real-time Server (`apps/api`)
* **Autentifikatsiya:** Telegram `initData` HMAC-SHA256 imzosi tekshiruvi, xavfsiz JWT sessiya tokenlari.
* **Real-time Multiplayer:** Socket.IO typed eventlar (`queue:join`, `game:move`, `game:resign`, `game:draw_offer`, `game:finished`).
* **Reyting Tizimi:** To'liq Glicko-2 algoritmi (Rating, Rating Deviation, Volatility).
* **Virtual Hamyon:** Tranzaksiyalar immutability (audit log, g'alaba mukofotlari).

### 5. Admin Panel (`apps/admin`)
* Foydalanuvchilarni qidirish, bloklash (ban/unban).
* Hamyon balansini boshqarish.
* O'yinlarni va shikoyatlarni (reports) ko'rib chiqish.
* Dashboard grafiklari (Recharts orqali faollik va o'yin statistikasi).
* Tizim sozlamalari va Feature Flags.

---

## 🚀 Ishga Tushirish Yo'riqnomasi

### 1. Muhit Sozlamalari (`.env`)
Loyiha ildizidagi `.env.example` dan `.env` nusxasini yarating:
```bash
cp .env.example .env
```
Va quyidagi asosiy o'zgaruvchilarni kiriting:
- `TELEGRAM_BOT_TOKEN`: @BotFather dan olingan token
- `DATABASE_URL`: PostgreSQL ulanish manzili (masalan: `postgresql://postgres:postgres@localhost:5432/shashka_db?schema=public`)
- `REDIS_URL`: Redis ulanish manzili (masalan: `redis://localhost:6379`)
- `JWT_SECRET` va `SESSION_SECRET`: Maxfiy kalitlar

### 2. Ma'lumotlar Bazasini Tayyorlash
```bash
pnpm db:push
pnpm db:seed
```

### 3. Development Rejimida Ishga Tushirish
Barcha servislarni bir vaqtda ishga tushirish (Turborepo parallel):
```bash
pnpm dev
```
Yoki har bir servisni alohida:
```bash
# Backend API (port 3000)
pnpm --filter @shashka/api dev

# Telegram Bot
pnpm --filter @shashka/bot dev

# Web Mini App (port 5173)
pnpm --filter @shashka/web dev

# Admin Panel (port 5174)
pnpm --filter @shashka/admin dev
```

### 4. Docker Orqali Ishga Tushirish
To'liq infratuzilma (PostgreSQL, Redis, Nginx, API, Bot, Web, Admin) uchun:
```bash
docker compose up -d
```
