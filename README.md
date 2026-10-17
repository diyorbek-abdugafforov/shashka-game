# Russian Checkers (Shashki) Gaming Platform Monorepo

Production-grade, high-performance monorepo platform for Russian Checkers (*Русские шашки*), supporting real-time multiplayer, Telegram Mini App & bot integration, full web client, administrative dashboard, rating system, and in-game economy.

## 🚀 Tech Stack

- **Monorepo Manager**: [pnpm](https://pnpm.io/) workspaces + [Turborepo v2](https://turbo.build/repo)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled across all packages)
- **Backend API**: [Fastify](https://fastify.dev/) with WebSockets, JWT/Session auth, and Zod validation
- **Telegram Bot**: [grammY](https://grammy.dev/) for bot interactions and Mini App webapp launch
- **Web Clients**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) (Web player & Admin backoffice)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Caching & Realtime Queues**: [Redis](https://redis.io/)
- **Reverse Proxy**: [Nginx](https://nginx.org/) with WebSocket proxying & rate-limiting
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose multi-stage builds

---

## 📁 Repository Structure

```text
shashka-game/
├── apps/
│   ├── api/             # Fastify REST & WebSocket Game Server
│   ├── bot/             # grammY Telegram Bot & Mini App launcher
│   ├── web/             # React + Vite Web Client & Telegram Mini App
│   └── admin/           # React + Vite Backoffice Administration Panel
├── packages/
│   ├── config/          # Centralized typed environment & app configuration
│   ├── database/        # Prisma schema, migrations, seed scripts, & client
│   ├── game-engine/     # Russian Checkers logic, move validator, bitboards
│   ├── shared-types/    # Shared TypeScript DTOs, Enums, Models, & WS events
│   ├── ui/              # Reusable React component library & design system
│   └── validation/      # Shared Zod schemas for auth, games, users, & admin
├── infra/
│   ├── docker/          # Multi-stage production Dockerfiles (api, bot, web, admin)
│   └── nginx/           # Nginx reverse proxy configuration with WebSocket support
├── docs/                # Architecture documentation and game rules
├── docker-compose.yml   # Production Docker Compose orchestration
├── docker-compose.dev.yml # Local development Docker Compose overrides
├── turbo.json           # Turborepo task pipeline definition
├── pnpm-workspace.yaml  # Monorepo workspace configuration
└── tsconfig.base.json   # Base strict TypeScript configuration
```

---

## 🛠️ Prerequisites

- **Node.js**: `v20.0.0` or later
- **pnpm**: `v9.0.0` or later (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker & Docker Compose**: latest desktop or engine
- **PostgreSQL**: `v16+` (or run via Docker)
- **Redis**: `v7+` (or run via Docker)

---

## ⚡ Quickstart

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> shashka-game
cd shashka-game
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file and edit your credentials:

```bash
cp .env.example .env
```

Ensure you configure:
- `TELEGRAM_BOT_TOKEN`: From Telegram [@BotFather](https://t.me/BotFather)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SESSION_SECRET` & `JWT_SECRET`: Random 32+ character secrets

### 3. Spin Up Infrastructure (Postgres & Redis)

You can spin up local backing services via Docker Compose:

```bash
docker compose up -d postgres redis
```

### 4. Database Setup & Seeding

Generate the Prisma client, run initial migrations, and seed default flags/items/admin:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers

Run all services in development mode with Turborepo:

```bash
pnpm dev
```

- **Web Client**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3001](http://localhost:3001)
- **Fastify API**: [http://localhost:4000](http://localhost:4000)
- **API Health**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 📜 Available Commands

| Command | Description |
|---|---|
| `pnpm dev` | Run all applications and packages in development mode |
| `pnpm build` | Build all packages and applications via Turborepo |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm lint:fix` | Automatically fix ESLint errors |
| `pnpm typecheck` | Run `tsc --noEmit` on all workspace packages |
| `pnpm test` | Run unit & integration tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm format` | Format repository files using Prettier |
| `pnpm clean` | Clean build artifacts and Turbo cache |
| `pnpm db:generate` | Generate Prisma client code |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema changes directly to development DB |
| `pnpm db:seed` | Seed default database records and test users |
| `pnpm db:studio` | Launch Prisma Studio GUI |
| `pnpm docker:up` | Launch all services via production Docker Compose |
| `pnpm docker:down` | Stop all Docker Compose services |
| `pnpm docker:dev:up` | Launch dev compose with volume mounts and live reload |

---

## 🐳 Docker Deployment

To launch the entire platform (Postgres, Redis, Fastify API, grammY Bot, Web Client, Admin Panel, and Nginx reverse proxy):

```bash
# Production mode
docker compose up -d --build

# Inspect logs
docker compose logs -f api
```

The Nginx proxy exposes:
- Port `80` (or `443` in TLS setup):
  - `/api/*` -> API service
  - `/ws` -> WebSocket API endpoint
  - `/admin/*` -> Admin panel
  - `/*` -> Web app frontend

---

## 🔒 Security Best Practices

- Strict TypeScript mode enabled across all packages.
- Cross-site request forgery and secure HTTP-only cookies on session management.
- Webhook HMAC SHA-256 verification for Telegram Mini App `initData` and webhooks.
- Fine-grained RBAC roles (`USER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`).
- Rate limiting at both Nginx proxy and Fastify route levels.
- Non-root container execution in multi-stage Docker images.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
