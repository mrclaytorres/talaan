# Quickstart: Trading Journal Application

**Branch**: `001-trading-journal` | **Date**: 2026-02-28 | **Updated**: 2026-03-01

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker Desktop (for backend + database)
- Xcode 15+ (for iOS development, macOS only)
- Android Studio (for Android development)

## Initial Setup

```bash
# Clone and enter project
git clone <repo-url> && cd claytradingjournal

# Install frontend dependencies
cd frontend && pnpm install && cd ..

# Install backend dependencies
cd backend && pnpm install && cd ..
```

## Running the Application

### Web/Desktop (Docker)

```bash
# Start PostgreSQL + Payload CMS backend
docker compose up -d

# Start SvelteKit frontend (dev mode)
cd frontend && pnpm dev
```

- Frontend: http://localhost:5173
- Payload API: http://localhost:3000/api
- Payload Admin: http://localhost:3000/admin

### Mobile (iOS)

```bash
cd frontend

# Build static SPA
pnpm build

# Sync web assets to native project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Build and run from Xcode on a simulator or device.

### Mobile (Android)

```bash
cd frontend

# Build static SPA
pnpm build

# Sync web assets to native project
npx cap sync android

# Open in Android Studio
npx cap open android
```

Build and run from Android Studio on an emulator or device.

## Development Workflow

### Frontend Development

```bash
cd frontend
pnpm dev          # Start dev server at :5173
pnpm check        # TypeScript + Svelte type checking
pnpm lint         # ESLint + Prettier
pnpm test:unit    # Vitest unit/component tests
pnpm test:e2e     # Playwright E2E tests
pnpm build        # Production build
```

### Backend Development

```bash
cd backend
pnpm dev          # Start Payload dev server at :3000
pnpm build        # Production build
pnpm test         # Vitest tests for hooks/validation
```

### Docker Commands

```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs backend   # View backend logs
docker compose exec postgres psql -U payload payload  # DB shell
```

## Seed Data

```bash
# Seed ticker catalog (run once after first backend start)
cd backend && pnpm seed:tickers
```

This loads the bundled ticker catalog (US stocks, forex pairs, crypto
pairs) into the Payload tickers collection.

## Mobile Dev with Live Reload

For mobile development with hot reload:

```bash
cd frontend && pnpm dev  # Note the network URL (e.g., 192.168.1.x:5173)
```

Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.1.x:5173',  // Your local IP
  cleartext: true
}
```

Then `npx cap sync && npx cap run ios` (or `android`).

**Important**: Remove the `server` config before production builds.

## Project Structure

```text
claytradingjournal/
├── frontend/                   # SvelteKit 5 + TypeScript
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/     # Svelte components
│   │   │   │   ├── ui/         # Design system primitives
│   │   │   │   ├── calendar/   # Calendar P&L components
│   │   │   │   ├── trade/      # Trade entry/list components
│   │   │   │   └── account/    # Account management components
│   │   │   ├── services/       # DataService abstraction
│   │   │   │   ├── types.ts    # DataService interface
│   │   │   │   ├── payload.ts  # PayloadAdapter (web)
│   │   │   │   └── sqlite.ts   # SQLiteAdapter (mobile)
│   │   │   ├── stores/         # Svelte stores (state)
│   │   │   ├── utils/          # R:R calc, P&L calc, formatters
│   │   │   └── types/          # TypeScript type definitions
│   │   ├── routes/             # SvelteKit pages
│   │   │   ├── +layout.svelte  # Root layout (nav, auth guard, account switcher)
│   │   │   ├── +page.svelte    # Entry redirect → /dashboard or /setup
│   │   │   ├── setup/          # First-time profile setup
│   │   │   ├── dashboard/      # Unified dashboard (stats, calendar, charts, trades)
│   │   │   ├── trades/         # Trade detail + edit (new, [id], [id]/edit)
│   │   │   ├── accounts/       # Account management
│   │   │   └── settings/       # Profile, export/import
│   │   └── app.html
│   ├── static/
│   │   └── data/
│   │       └── tickers.json    # Bundled ticker catalog
│   ├── tests/
│   │   ├── unit/               # Vitest unit tests
│   │   ├── integration/        # Vitest integration tests
│   │   └── e2e/                # Playwright E2E tests
│   ├── ios/                    # Capacitor iOS project
│   ├── android/                # Capacitor Android project
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── capacitor.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                    # Payload CMS 3.x (Next.js)
│   ├── src/
│   │   ├── collections/        # Payload collection definitions
│   │   │   ├── Users.ts
│   │   │   ├── TradingAccounts.ts
│   │   │   ├── TradePositions.ts
│   │   │   ├── TradeImages.ts
│   │   │   └── Tickers.ts
│   │   ├── endpoints/          # Custom API endpoints
│   │   │   ├── export-json.ts
│   │   │   ├── export-csv.ts
│   │   │   └── import-json.ts
│   │   ├── hooks/              # Collection hooks (validation)
│   │   ├── seed/               # Ticker catalog seeder
│   │   │   └── tickers.ts
│   │   └── payload.config.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── media/                  # Uploaded trade images
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml          # Dev compose (default)
├── docker-compose.prod.yml     # Production compose
├── .env.example                # Environment template
└── specs/                      # Specification documents
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
POSTGRES_DB=payload
POSTGRES_USER=payload
POSTGRES_PASSWORD=<set-a-strong-password>
DATABASE_URI=postgres://payload:${POSTGRES_PASSWORD}@localhost:5432/payload

# Payload
PAYLOAD_SECRET=<random-32-char-string>
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Frontend
PUBLIC_API_URL=http://localhost:3000/api
```

## Verification Steps

After setup, verify the application works:

1. `docker compose up -d` — backend and database start without errors
2. Open http://localhost:3000/api — Payload API responds
3. `cd frontend && pnpm dev` — SvelteKit dev server starts
4. Open http://localhost:5173 — first-time setup flow appears
5. Create a profile → "Default" account is auto-created
6. Add a trade → R:R ratio calculates correctly
7. View calendar → trade appears on the correct date
