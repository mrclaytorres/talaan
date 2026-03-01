# Trading Journal

A personal trading journal for tracking trades, calculating risk-reward ratios, and visualizing P&L on a calendar. Built with SvelteKit 5, Payload CMS 3, PostgreSQL, and Capacitor for mobile.

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`corepack enable && corepack prepare pnpm@latest --activate`)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (for containerized setup)
- PostgreSQL 16 (if running without Docker)

## Quick Start (Docker)

The fastest way to get everything running:

```bash
# 1. Copy environment file and edit the values
cp .env.example .env

# 2. Set a strong password and secret in .env
#    - POSTGRES_PASSWORD: any strong password
#    - PAYLOAD_SECRET: a random 32+ character string

# 3. Start all services
docker compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend** (Payload CMS + API) on port `3000`
- **Frontend** (SvelteKit via nginx) on port `8080`

Open [http://localhost:8080](http://localhost:8080) in your browser.

The Payload admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

## Quick Start (Local Development)

If you prefer running services directly for development with hot reload:

### 1. Start PostgreSQL

Either use Docker for just the database:

```bash
docker compose up postgres -d
```

Or use a local PostgreSQL instance and make sure it's running on port 5432.

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database credentials and a PAYLOAD_SECRET
```

### 3. Install dependencies and start the backend

```bash
cd backend
pnpm install
pnpm dev
```

The backend starts on [http://localhost:3000](http://localhost:3000). On first run, Payload will create the database tables automatically.

### 4. (Optional) Seed ticker data

```bash
cd backend
pnpm seed:tickers
```

This populates the tickers collection with ~110 stocks, forex pairs, and crypto symbols for the autocomplete search.

### 5. Start the frontend

In a separate terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend starts on [http://localhost:5173](http://localhost:5173).

## Production (Docker)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This runs optimized production builds with:
- No source bind mounts
- `NODE_ENV=production`
- Memory limits and `restart: always`
- Frontend served on port `80`

## Running Tests

```bash
cd frontend

# Unit tests
pnpm test:unit

# Unit tests with coverage
pnpm test:coverage

# Type checking
pnpm check

# Linting
pnpm lint

# E2E tests (requires running dev server)
pnpm test:e2e
```

## Mobile (Capacitor)

The frontend can be wrapped as a native iOS/Android app using Capacitor:

```bash
cd frontend

# Add platforms (first time only)
npx cap add ios
npx cap add android

# Build and sync
pnpm build:ios      # or build:android

# Open in native IDE
npx cap open ios     # opens Xcode
npx cap open android # opens Android Studio
```

## Project Structure

```
backend/                  # Payload CMS 3.x (Next.js)
  src/
    collections/          # Payload collection configs
    endpoints/            # Custom API endpoints (export/import)
    hooks/                # Payload hooks (trade validation)
    seed/                 # Ticker seed script + data

frontend/                 # SvelteKit 5 (adapter-static)
  src/
    lib/
      components/         # Svelte components (ui, trade, calendar, account)
      services/           # DataService abstraction (Payload REST, SQLite stub)
      stores/             # Svelte 5 rune-based stores
      types/              # TypeScript interfaces
      utils/              # Calculations, formatters, validators, P&L, export
    routes/               # SvelteKit pages
  tests/                  # Vitest unit + Playwright E2E
  static/data/            # Bundled ticker catalog for mobile

docker-compose.yml        # Development compose
docker-compose.prod.yml   # Production compose
Dockerfile.backend        # Multi-stage backend build
Dockerfile.frontend       # Multi-stage frontend build (nginx)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | `payload` |
| `POSTGRES_USER` | Database user | `payload` |
| `POSTGRES_PASSWORD` | Database password | *(required)* |
| `DATABASE_URI` | Full Postgres connection string | *(derived from above)* |
| `PAYLOAD_SECRET` | Payload CMS encryption secret | *(required)* |
| `NEXT_PUBLIC_SERVER_URL` | Backend URL | `http://localhost:3000` |
| `PUBLIC_API_URL` | API URL for frontend | `http://localhost:3000/api` |
