# Research: Trading Journal Application

**Branch**: `001-trading-journal` | **Date**: 2026-02-28 | **Updated**: 2026-03-01

## Decision 1: Cross-Platform Framework

**Decision**: SvelteKit 5 + `@sveltejs/adapter-static` (SPA mode) +
Capacitor for iOS/Android deployment.

**Rationale**: SvelteKit 5 officially supports Capacitor as a mobile
target. Using `adapter-static` with `fallback: 'index.html'` and
`ssr = false` produces a static SPA that Capacitor can wrap into
native iOS/Android shells. Vite is built into SvelteKit, satisfying
the user's Vite requirement. This gives a single TypeScript/Svelte
codebase for all three platforms (web, iOS, Android).

**Alternatives considered**:
- **React Native**: Would require a completely separate codebase from
  the web frontend. Rejected for code duplication.
- **Flutter**: Non-web-native, requires Dart. Rejected for tech stack
  mismatch.
- **Tauri Mobile**: Less mature mobile support than Capacitor. More
  appropriate for desktop-only apps.
- **PWA-only**: Limited access to native features (camera, filesystem).
  Capacitor provides native plugin access while using the same web code.

**Key configuration**:
- `svelte.config.js`: `adapter-static` with `fallback: 'index.html'`
- `src/routes/+layout.js`: `export const ssr = false`
- `capacitor.config.ts`: `webDir: 'build'`
- Vite config: `bundleStrategy: 'single'` for mobile performance

**Relevant Capacitor plugins**:
- `@capacitor-community/sqlite` — local SQLite on mobile
- `@capacitor/camera` — photo capture for trade image attachments
- `@capacitor/filesystem` — file read/write for export/import
- `@capacitor/clipboard` — paste images on desktop

## Decision 2: Backend Architecture (Payload CMS 3.x)

**Decision**: Payload CMS 3.x as a standalone API backend running in
Docker alongside PostgreSQL.

**Rationale**: Payload CMS 3.x provides auto-generated REST API
endpoints from collection definitions, built-in admin panel, and
PostgreSQL support via `@payloadcms/db-postgres`. It runs as a Next.js
application. The SvelteKit frontend communicates with it via REST API
over HTTP. Docker makes the backend easily installable for desktop use.

**Alternatives considered**:
- **Custom SvelteKit API routes + SQLite**: Simpler but loses the
  Payload admin panel, auto-generated CRUD, and migration tooling.
  Rejected per user's explicit Payload requirement.
- **Payload CMS 2.x (Express-based)**: No longer actively developed.
  3.x is the current version.
- **Strapi / Directus**: Alternative headless CMS options. Rejected
  since user specified Payload CMS.

**Architecture note**: Payload CMS 3.x is deeply integrated with
Next.js. It runs as its own Next.js application in `/backend`. The
SvelteKit frontend in `/frontend` calls Payload's REST API at
`http://localhost:3000/api/`. CORS is configured in `payload.config.ts`.

**REST API auto-generated endpoints** (per collection slug):
- `GET /api/{collection}` — list
- `POST /api/{collection}` — create
- `GET /api/{collection}/{id}` — read
- `PATCH /api/{collection}/{id}` — update
- `DELETE /api/{collection}/{id}` — delete

## Decision 3: Offline Data Strategy

**Decision**: DataService abstraction pattern (Repository Pattern) with
two implementations:
- **Web/Desktop**: `PayloadAdapter` — calls Payload REST API
- **Mobile**: `SQLiteAdapter` — uses `@capacitor-community/sqlite`

**Rationale**: The app must work fully offline on mobile but uses
Payload CMS (server-based) on desktop. A shared DataService interface
allows the same Svelte components and stores to work on both platforms
without conditional logic in the UI layer. Runtime detection via
`Capacitor.isNativePlatform()` selects the adapter at startup.

**Alternatives considered**:
- **Single SQLite for all platforms**: Would bypass Payload CMS
  entirely on web. Rejected per user's explicit Payload requirement.
- **RxDB with replication**: Over-engineered for the export/import
  data transfer model. No cloud sync needed.
- **IndexedDB on web**: `@capacitor-community/sqlite` uses IndexedDB
  via `jeep-sqlite` on web, but Payload provides a richer data layer
  for the web/desktop context.

**Data portability**: Export produces JSON (full backup with images
base64-encoded) and CSV (flat trade data). Import reads JSON and
restores to whichever adapter is active (Payload or SQLite).

## Decision 4: Database

**Decision**: PostgreSQL 16 for Payload CMS backend (Docker). SQLite
via `@capacitor-community/sqlite` for mobile.

**Rationale**: PostgreSQL is Payload CMS 3.x's recommended production
database via `@payloadcms/db-postgres`. SQLite is the only viable
embedded database for offline mobile apps. Both use relational schemas
with the same logical data model.

**Alternatives considered**:
- **MongoDB**: Supported by Payload but relational data (accounts →
  trades → images) maps better to SQL.
- **Payload's SQLite adapter** (`@payloadcms/db-sqlite`): Possible
  for development but PostgreSQL is more robust for production.

## Decision 5: Testing Stack

**Decision**: Vitest (Browser Mode with Playwright provider) for
unit/component tests. Playwright standalone for E2E tests.

**Rationale**: Vitest is the official recommended test runner for
SvelteKit 5. Browser Mode with `vitest-browser-svelte` runs component
tests in real browsers via Playwright, avoiding jsdom compatibility
issues with Svelte 5's rune-based reactivity. Playwright standalone
tests full user flows against the running application.

**Key packages**:
- `vitest` + `@vitest/browser` + `vitest-browser-svelte`
- `@playwright/test` for E2E
- `@sveltejs/vite-plugin-svelte` for test builds

**Alternatives considered**:
- **Jest**: Not recommended for SvelteKit/Vite projects. Requires
  additional transformation configuration.
- **jsdom + @testing-library/svelte**: Known reliability issues with
  Svelte 5 runes. Browser Mode eliminates these.

## Decision 6: Ticker Catalog

**Decision**: Bundled static JSON file seeded from open-source data.
Curated set of ~500 US stocks, ~30 major forex pairs, ~20 top crypto
pairs.

**Rationale**: The app is offline-first. A bundled JSON file (~200KB)
provides instant search without network requests. The curated size
keeps the bundle small. Users can add custom tickers for instruments
not in the catalog.

**Data sources**:
- US Stocks: `rreichel3/US-Stock-Symbols` (GitHub, nightly updates)
- Forex + Crypto: `JerBouma/FinanceDatabase` (GitHub, MIT license)

**Alternatives considered**:
- **Live API (Alpha Vantage, Finnhub)**: Requires internet. Conflicts
  with offline-first requirement. Could be added later as an optional
  feature.
- **Full market coverage (~8K symbols)**: 1-2MB JSON. Acceptable but
  unnecessary for initial version.

## Decision 7: Docker Configuration

**Decision**: Docker Compose with three services: `frontend`
(SvelteKit), `backend` (Payload CMS / Next.js), `postgres`
(PostgreSQL 16). Multi-stage Dockerfiles for optimized images.

**Rationale**: Docker Compose provides a single `docker compose up`
command to install and run the full desktop/web application. Multi-stage
builds keep images small. Separate dev and prod compose files allow
different configurations.

**Services**:
- `postgres`: `postgres:16-alpine` with health check
- `backend`: Payload CMS with `output: 'standalone'` Next.js build
- `frontend`: SvelteKit with `adapter-node` for Docker (adapter-static
  for Capacitor mobile builds)

**Key configuration**:
- Backend waits for PostgreSQL health check before starting
- Environment variables via `.env` file
- Named volume for PostgreSQL data persistence
- Frontend connects to backend via Docker network

## Decision 8: Multi-Device & Cloud Sync Architecture

**Decision**: Single-user per device. Future cloud sync with
last-write-wins conflict resolution. Hybrid backend: Payload CMS for
web, SQLite for mobile via Capacitor.

**Rationale**: The app is designed as a personal trading journal — one
trader per device installation. The existing DataService abstraction
(PayloadAdapter for web, SQLiteAdapter for mobile) provides the
migration path for a future CloudAdapter without changing UI or store
code. Last-write-wins is chosen for conflict resolution because it is
simple, predictable, and avoids complex merge logic that would add
significant development overhead for a personal journal app. All
entities track `createdAt` and `updatedAt` timestamps (already present
via Payload CMS) which are preserved through export/import (FR-037) to
support this future sync strategy.

**Alternatives considered**:
- **Multi-user per device**: Rejected — adds user switching UI, data
  isolation complexity, and login flows that are unnecessary for a
  personal journal.
- **CRDT-based conflict resolution**: Over-engineered for a single-user
  journal. CRDTs add complexity and data overhead without meaningful
  benefit when concurrent edits on the same record are extremely rare.
- **Manual conflict resolution (prompt user)**: Better data integrity
  but worse UX. For a personal journal where the same user is editing
  on different devices, last-write-wins is sufficient.
- **Server-only (no local storage on mobile)**: Rejected — violates
  the offline-first requirement. Traders need journal access during
  market hours regardless of connectivity.
