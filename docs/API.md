# 🔌 Russian Checkers Platform — API & WebSocket Documentation

Hujjat versiyasi: `1.0.0`  
Protokollar: `HTTPS (REST API)`, `WSS (Socket.IO v4)`  
Kontent turi: `application/json`  
Base URL: `https://shashka.app/api/v1` (Production), `http://localhost:3000/api/v1` (Development)

---

## 1. Umumiy tamoyillar va Autentifikatsiya (Overview & Auth)

Barcha himoyalangan REST endpointlar va WebSocket ulanishlari foydalanuvchini autentifikatsiya qilish uchun **JWT Access Token** yoki **Telegram WebApp initData** qatoridan foydalanadi.

### 1.1. HTTP So'rov Headerlari (Request Headers)

| Header | Majburiymi? | Misol / Tavsif |
| :--- | :--- | :--- |
| `Content-Type` | Ha (POST/PUT uchun) | `application/json` |
| `Authorization` | Ha (himoyalangan yo'llar uchun) | `Bearer eyJhbGciOiJIUzI1NiIsIn...` |
| `X-Telegram-Init-Data` | Faqat login vaqtida | `query_id=...&user=%7B%22id...&hash=...` |
| `Accept-Language` | Yo'q | `uz`, `ru`, `en` (Xabarlar tili uchun) |

### 1.2. Standart Xatolik Formati (RFC-7807 Problem Details)
Barcha 4xx va 5xx HTTP xatolari quyidagi formatda qaytariladi:
```json
{
  "type": "https://shashka.app/errors/invalid-move",
  "title": "Invalid Move",
  "status": 400,
  "detail": "Capture is mandatory according to Russian Checkers rules.",
  "code": "CAPTURE_MANDATORY",
  "timestamp": "2026-11-01T14:30:00.000Z"
}
```

---

## 2. REST API Endpoints

### 2.1. Autentifikatsiya (Authentication)

#### `POST /auth/telegram`
Telegram Mini App tomonidan taqdim etilgan `initData` ni tekshirish va tizimga kirish (Login / Register).

- **Request Body**:
```json
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohD12345&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Aziz%22%2C%22username%22%3A%22aziz_dev%22%2C%22language_code%22%3A%22uz%22%7D&auth_date=1730000000&hash=d8a4f..."
}
```

- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_clx109283019",
    "telegramId": 123456789,
    "username": "aziz_dev",
    "firstName": "Aziz",
    "coins": 250,
    "rating": 1542.5,
    "ratingDeviation": 85.3,
    "equippedBoardSkin": "board_classic",
    "equippedPieceSkin": "piece_classic"
  }
}
```

- **Response `401 Unauthorized`**:
```json
{
  "status": 401,
  "code": "INVALID_TELEGRAM_HASH",
  "detail": "The provided initData hash could not be validated against bot token."
}
```

---

### 2.2. Foydalanuvchilar va Profil (Users & Profiles)

#### `GET /users/me`
Joriy autentifikatsiyadan o'tgan foydalanuvchining to'liq profili va statistikasi.

- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "id": "usr_clx109283019",
  "telegramId": 123456789,
  "username": "aziz_dev",
  "firstName": "Aziz",
  "avatarUrl": "https://t.me/i/userpic/320/aziz_dev.jpg",
  "coins": 450,
  "stats": {
    "rating": 1620.4,
    "ratingDeviation": 68.2,
    "volatility": 0.058,
    "gamesPlayed": 42,
    "wins": 26,
    "losses": 12,
    "draws": 4,
    "winRate": 61.9,
    "currentStreak": 3,
    "bestStreak": 7,
    "tier": "GOLD"
  },
  "inventory": {
    "equippedBoard": "board_marble",
    "equippedPiece": "piece_gold"
  }
}
```

#### `GET /users/:id`
Boshqa o'yinchining ochiq profili.

- **Response `200 OK`**:
```json
{
  "id": "usr_clx99887766",
  "username": "shashka_master",
  "firstName": "Rustam",
  "avatarUrl": null,
  "stats": {
    "rating": 1850.0,
    "gamesPlayed": 310,
    "wins": 210,
    "winRate": 67.7,
    "tier": "PLATINUM"
  }
}
```

---

### 2.3. Peshqadamlar jadvali (Leaderboard)

#### `GET /leaderboard`
Eng yuqori reytingli o'yinchilar ro'yxati.

- **Query Parameters**:
  - `limit` (default: 50, max: 100)
  - `offset` (default: 0)
  - `timeframe`: `all_time` | `monthly` | `weekly` (default: `all_time`)
- **Response `200 OK`**:
```json
{
  "total": 12450,
  "page": 1,
  "players": [
    {
      "rank": 1,
      "id": "usr_9988",
      "username": "grandmaster_uz",
      "firstName": "Bobur",
      "rating": 2145.8,
      "tier": "GRANDMASTER",
      "gamesWon": 420
    },
    {
      "rank": 2,
      "id": "usr_7766",
      "username": "shashka_pro",
      "firstName": "Olim",
      "rating": 2088.2,
      "tier": "DIAMOND",
      "gamesWon": 315
    }
  ]
}
```

---

### 2.4. O'yinlar tarixi va Detallar (Games History)

#### `GET /games/history`
Foydalanuvchining o'tgan o'yinlari ro'yxati.

- **Query Parameters**:
  - `limit`: 10
  - `page`: 1
- **Response `200 OK`**:
```json
{
  "games": [
    {
      "id": "gm_7730129",
      "gameType": "ONLINE_RANKED",
      "timeControl": "BLITZ_3_2",
      "opponent": {
        "id": "usr_4433",
        "username": "nodir_88",
        "rating": 1590.0
      },
      "playerColor": "WHITE",
      "result": "WIN",
      "endReason": "CHECKMATE",
      "ratingChange": +18.4,
      "totalMoves": 34,
      "finishedAt": "2026-11-01T12:45:00.000Z"
    }
  ],
  "totalCount": 42
}
```

#### `GET /games/:id`
Muayyan o'yinning to'liq tafsiloti va barcha yurishlar tarixi (Replay uchun).

- **Response `200 OK`**:
```json
{
  "id": "gm_7730129",
  "timeControl": "BLITZ_3_2",
  "whitePlayer": { "id": "usr_1", "username": "aziz_dev", "rating": 1600.0 },
  "blackPlayer": { "id": "usr_2", "username": "nodir_88", "rating": 1590.0 },
  "winnerId": "usr_1",
  "endReason": "CHECKMATE",
  "moves": [
    { "ply": 1, "color": "WHITE", "from": "c3", "to": "d4", "notation": "c3-d4", "timeSpentMs": 1200 },
    { "ply": 2, "color": "BLACK", "from": "b6", "to": "a5", "notation": "b6-a5", "timeSpentMs": 2400 },
    { "ply": 3, "color": "WHITE", "from": "d4", "to": "c5", "captured": ["b6"], "notation": "d4:b6", "timeSpentMs": 950 }
  ]
}
```

---

### 2.5. Do'kon va Kosmetika (Shop & Items)

#### `GET /shop/items`
Do'kondagi barcha mavjud skinlar va tovarlar katalogi.

- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "itm_board_marble",
      "sku": "board_marble",
      "category": "BOARD_SKIN",
      "name": "Marmar Saroy",
      "priceCoins": 1500,
      "priceStars": 25,
      "previewUrl": "https://assets.shashka.app/skins/board_marble_preview.png"
    },
    {
      "id": "itm_piece_gold",
      "sku": "piece_gold",
      "category": "PIECE_SKIN",
      "name": "Oltin Toshlar",
      "priceCoins": 4000,
      "priceStars": 50,
      "previewUrl": "https://assets.shashka.app/skins/piece_gold_preview.png"
    }
  ]
}
```

#### `POST /shop/purchase`
Tanga yoki Stars orqali skin xarid qilish.

- **Request Body**:
```json
{
  "itemId": "itm_board_marble",
  "currency": "COINS"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "remainingCoins": 350,
  "inventoryItem": {
    "itemId": "itm_board_marble",
    "acquiredAt": "2026-11-01T15:00:00.000Z"
  }
}
```

#### `POST /shop/equip`
Xarid qilingan skinni faollashtirish (kiyish).

- **Request Body**:
```json
{
  "itemId": "itm_board_marble"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "equipped": "board_marble"
}
```

---

## 3. Real-Time WebSocket API (Socket.IO Events)

Barcha real-time aloqalar Socket.IO orqali boshqariladi.

### 3.1. Ulanish va Autentifikatsiya Handshake

```typescript
import { io } from "socket.io-client";

const socket = io("https://shashka.app", {
  path: "/socket.io",
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsIn..."
  },
  transports: ["websocket"]
});
```

Agar token yaroqsiz bo'lsa, server ulanishni darhol uzadi:
`connect_error: { message: "AUTHENTICATION_FAILED" }`

---

### 3.2. Matchmaking Hodisalari

#### `CLIENT -> SERVER`
| Event | Payload | Tavsif |
| :--- | :--- | :--- |
| `matchmaking:join` | `{ timeControl: "BLITZ_3_2" \| "RAPID_5_3" \| "CLASSIC_10_0" }` | Mos reytingdagi raqib qidirish navbatiga kirish |
| `matchmaking:leave` | `{}` | Qidiruv navbatidan chiqish |
| `room:create` | `{ timeControl: "BLITZ_3_2" }` | Do'stni taklif qilish uchun shaxsiy xona ochish |
| `room:join` | `{ roomCode: "ROOM_7X8Y" }` | Taklif havolasi bo'yicha xonaga kirish |

#### `SERVER -> CLIENT`
| Event | Payload | Tavsif |
| :--- | :--- | :--- |
| `matchmaking:queued` | `{ timeControl: string, queuedAt: number, estimatedWaitSec: number }` | Qidiruv boshlandi |
| `matchmaking:matched` | `{ gameId: string, opponent: { id: string, username: string, rating: number } }` | Raqib topildi |

---

### 3.3. O'yin Jarayoni Hodisalari (Game Events)

#### `CLIENT -> SERVER`

##### 1. `game:move`
O'yinchi toshni harakatlantirganda yuboriladi.
```typescript
socket.emit("game:move", {
  gameId: "gm_7730129",
  from: "c3",
  to: "d4",
  // Ketma-ket urish bo'lsa, butun zanjir massiv sifatida:
  // path: ["c3", "e5", "g7"]
  clientTimestamp: 1730000100250
});
```

##### 2. `game:offer_draw`
Raqibga durang taklif qilish.
```typescript
socket.emit("game:offer_draw", { gameId: "gm_7730129" });
```

##### 3. `game:respond_draw`
Durang taklifiga javob berish.
```typescript
socket.emit("game:respond_draw", { gameId: "gm_7730129", accepted: true });
```

##### 4. `game:resign`
O'yinni taslim bo'lib yakunlash.
```typescript
socket.emit("game:resign", { gameId: "gm_7730129" });
```

##### 5. `game:reconnect`
Aloqa uzilgandan so'ng xonaga qayta ulanish va so'nggi holatni so'rash.
```typescript
socket.emit("game:reconnect", { gameId: "gm_7730129" });
```

##### 6. `game:send_reaction`
O'yin davomida tezkor kulgili reaksiya yuborish.
```typescript
socket.emit("game:send_reaction", { gameId: "gm_7730129", emoji: "🔥" });
```

---

#### `SERVER -> CLIENT`

##### 1. `game:start`
Partiya boshlanganda ikkala o'yinchiga yuboriladi.
```json
{
  "gameId": "gm_7730129",
  "whitePlayer": { "id": "usr_1", "username": "aziz_dev", "rating": 1540 },
  "blackPlayer": { "id": "usr_2", "username": "nodir_88", "rating": 1525 },
  "yourColor": "WHITE",
  "board": [
    ["", "b", "", "b", "", "b", "", "b"],
    ["b", "", "b", "", "b", "", "b", ""],
    ["", "b", "", "b", "", "b", "", "b"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["w", "", "w", "", "w", "", "w", ""],
    ["", "w", "", "w", "", "w", "", "w"],
    ["w", "", "w", "", "w", "", "w", ""]
  ],
  "turn": "WHITE",
  "whiteTimeMs": 180000,
  "blackTimeMs": 180000
}
```

##### 2. `game:move_made`
Har bir tasdiqlangan qonuniy yurishdan keyin xonadagi ikkala o'yinchiga tarqatiladi.
```json
{
  "gameId": "gm_7730129",
  "move": {
    "from": "c3",
    "to": "d4",
    "capturedPieces": [],
    "isKingTransformation": false
  },
  "turn": "BLACK",
  "whiteTimeMs": 178500,
  "blackTimeMs": 180000,
  "moveNumber": 1
}
```

##### 3. `game:timer_tick`
Har soniyada yoki aktiv harakatlarda vaqt sinxronizatsiyasi.
```json
{
  "whiteTimeMs": 164000,
  "blackTimeMs": 172000
}
```

##### 4. `game:opponent_status`
Raqibning aloqa holati o'zgarganda.
```json
{
  "status": "DISCONNECTED",
  "gracePeriodRemainingMs": 45000
}
```

##### 5. `game:state_sync`
Qayta ulangan (reconnected) o'yinchi uchun doska holatini tiklash.
```json
{
  "gameId": "gm_7730129",
  "board": [ ... ],
  "turn": "BLACK",
  "whiteTimeMs": 142000,
  "blackTimeMs": 158000,
  "history": [ "c3-d4", "b6-a5" ]
}
```

##### 6. `game:over`
Partiya yakunlanganda.
```json
{
  "gameId": "gm_7730129",
  "winner": "WHITE",
  "reason": "CHECKMATE",
  "newRatings": {
    "white": { "rating": 1558.4, "change": +18.4 },
    "black": { "rating": 1506.6, "change": -18.4 }
  },
  "rewards": {
    "coinsEarned": 30
  }
}
```

---

## 4. Xatolik kodlari ro'yxati (Error Codes Reference)

| Xatolik Kodi | HTTP Status | Tavsif |
| :--- | :--- | :--- |
| `INVALID_TELEGRAM_HASH` | 401 | Telegram initData HMAC tekshiruvi muvaffaqiyatsiz bo'ldi. |
| `TOKEN_EXPIRED` | 401 | JWT yoki initData amal qilish muddati o'tgan (>24 soat). |
| `USER_NOT_FOUND` | 404 | Ko'rsatilgan foydalanuvchi tizimda mavjud emas. |
| `USER_BANNED` | 403 | Foydalanuvchi firibgarlik yoki qoidabuzarlik uchun bloklangan. |
| `ALREADY_IN_QUEUE` | 409 | Foydalanuvchi allaqachon boshqa qidiruv navbatida turibdi. |
| `GAME_NOT_FOUND` | 404 | Berilgan gameId bo'yicha aktiv o'yin topilmadi. |
| `NOT_YOUR_TURN` | 400 | Hozir navbat boshqa o'yinchida. |
| `INVALID_MOVE` | 400 | Yurish rus shashkasi qoidalariga zid (noto'g'ri diagonal yoki katak band). |
| `CAPTURE_MANDATORY` | 400 | Qoidaga ko'ra toshni urish majburiy, oddiy yurish qilish mumkin emas. |
| `INSUFFICIENT_FUNDS` | 400 | Do'kondagi skinni sotib olish uchun tangalar yetarli emas. |
| `RATE_LIMITED` | 429 | So'rovlar chastotasi belgilangan cheklovdan oshib ketdi. |

---

## 5. Rate Limiting strategiyasi

Serverni botnet va DoS hujumlaridan himoya qilish uchun Redis asosidagi quyidagi qat'iy cheklovlar o'rnatilgan:

| Kanal / Yo'nalish | Cheklov (Limit) | Oqibat |
| :--- | :--- | :--- |
| **Barcha REST API (`/api/v1/*`)** | 1 daqiqada 100 ta so'rov (har bir IP bo'yicha) | HTTP `429 Too Many Requests` |
| **Telegram Auth (`/auth/telegram`)** | 1 daqiqada 10 ta urinish | Vaqtinchalik IP blok (15 daqiqa) |
| **Do'kon xaridi (`/shop/purchase`)** | 1 daqiqada 20 ta so'rov | Operatsiya rad etiladi |
| **WS `game:move` hodisasi** | 1 soniyada maksimal 3 ta harakat | Server yurishni rad etadi (`RATE_LIMITED`) |
| **WS `game:send_reaction`** | 5 soniyada maksimal 2 ta emoji | Spamerlik xabari ko'rsatiladi |
