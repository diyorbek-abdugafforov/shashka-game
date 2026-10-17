# Russian Checkers Architecture & System Design

## Overview
This platform delivers real-time Russian Checkers (*Русские шашки*) games across Web and Telegram Mini App environments.

```mermaid
flowchart TD
    subgraph Clients
        TG["Telegram Mini App (Web)"]
        WEB["Desktop / Mobile Browser (Web)"]
        ADMIN["Admin Backoffice Panel"]
    end

    subgraph Gateway ["Reverse Proxy (Nginx)"]
        NGX["Nginx Proxy (Port 80)"]
    end

    subgraph Applications ["Apps"]
        API["Fastify API & WebSocket Server (Port 4000)"]
        BOT["grammY Telegram Bot"]
        WEB_SRV["Web Client Static Server (Port 3000)"]
        ADM_SRV["Admin Static Server (Port 3001)"]
    end

    subgraph Storage ["Databases & Cache"]
        PG[("PostgreSQL 16 (Prisma)")]
        RD[("Redis 7 (Matchmaking & PubSub)")]
    end

    TG -->|HTTP / WS| NGX
    WEB -->|HTTP / WS| NGX
    ADMIN -->|HTTP| NGX

    NGX -->|/api & /ws| API
    NGX -->|/| WEB_SRV
    NGX -->|/admin| ADM_SRV

    BOT -->|Bot API| TG
    API --> PG
    API --> RD
    BOT --> PG
    BOT --> RD
```

## Packages

- **`@shashka/shared-types`**: Pure TypeScript contracts, enums, REST DTOs, and WebSocket event declarations.
- **`@shashka/validation`**: Zod validation schemas shared between frontend and backend.
- **`@shashka/config`**: Strict environment loading and typed configs.
- **`@shashka/database`**: Complete Prisma schema, migrations, and database singleton client.
- **`@shashka/game-engine`**: Complete Russian Checkers move generator, mandatory capture calculator, and flying king logic.
- **`@shashka/ui`**: React component design system.
