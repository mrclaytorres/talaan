# Implementation Plan: Trading Journal Application ("Talaan")

**Branch**: `001-trading-journal` | **Date**: 2026-02-28 | **Updated**: 2026-03-01
**Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-trading-journal/spec.md`

## Summary

Build an offline-first trading journal application ("Talaan") that tracks trading performance across multiple brokerage accounts. The app provides trade position entry with automatic Risk-to-Reward calculation, P&L tracking, a calendar-based dashboard with daily/monthly/yearly views, and a searchable ticker catalog. Architecture: SvelteKit 5 SPA frontend with Capacitor for iOS/Android, Payload CMS 3.x (Next.js) + PostgreSQL backend for web, SQLite for mobile — unified via a DataService abstraction layer. Single-user per device with future cloud sync anticipated (last-write-wins conflict resolution).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: SvelteKit 5 (frontend), Payload CMS 3.x / Next.js 15 (backend), Capacitor 8.x (mobile), Chart.js 4.x (charts), Tiptap 3.x (rich text editor), DOMPurify 3.x (XSS prevention)
**Storage**: PostgreSQL 16 (web/backend via Docker), SQLite via `@capacitor-community/sqlite` (mobile)
**Testing**: Vitest 4.x (unit/component), Playwright 1.58+ (E2E)
**Target Platform**: Web (modern browsers), iOS 15+, Android (via Capacitor)
**Project Type**: Web application + mobile app (hybrid)
**Performance Goals**: FCP < 1.5s on 4G, route transitions < 300ms, API p95 < 200ms, trade list renders 1,000 rows without lag, Lighthouse ≥ 90
**Constraints**: Fully offline-capable, < 200KB gzipped initial bundle, no cloud auth (local password only), single-user per device
**Scale/Scope**: 10+ accounts per user, 10,000+ trades per account, ~50 screens/views across web and mobile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality — TypeScript strict mode | ✅ Pass | `tsconfig.json` has `strict: true` in both frontend and backend |
| I. Code Quality — Linter/formatter | ✅ Pass | ESLint + Prettier configured for both projects |
| I. Code Quality — Single responsibility | ✅ Pass | Components decomposed by feature (ui/, calendar/, trade/, account/) |
| I. Code Quality — Dependency discipline | ✅ Pass | All deps justified in research.md (Decisions 1-7) |
| II. Testing — Coverage ≥ 80% | ✅ Pass | Vitest configured with coverage threshold; 80 unit tests passing |
| II. Testing — Test categories | ✅ Pass | Unit (Vitest), E2E (Playwright) test directories established |
| III. UX — Design system | ✅ Pass | Shared `components/ui/` library (Button, Input, Modal, Select, Badge, etc.) |
| III. UX — Responsive 320px–2560px | ✅ Pass | Mobile-first CSS with breakpoints; Capacitor for native mobile |
| III. UX — Loading states | ✅ Pass | `LoadingSpinner`, `isLoading` state in all stores |
| III. UX — Error feedback | ✅ Pass | Form validation errors, toast notifications, error boundaries |
| III. UX — Accessibility | ✅ Pass | Keyboard navigation, ARIA labels, WCAG 2.1 AA target |
| IV. Performance — FCP < 1.5s | ✅ Pass | `adapter-static` SPA with `bundleStrategy: 'single'` |
| IV. Performance — Bundle < 200KB | ⚠️ Monitor | Tiptap adds ~100KB; monitor after full build |
| IV. Performance — API p95 < 200ms | ✅ Pass | Payload CMS auto-generated endpoints with PostgreSQL |
| Quality Gate — Static Analysis | ✅ Pass | ESLint + TypeScript check configured as CI gates |
| Quality Gate — Build | ✅ Pass | Both dev and production builds verified |
| Quality Gate — Security | ✅ Pass | DOMPurify for XSS, no secrets in code, `.env.example` pattern |

**Post-Phase 1 re-check**: All gates pass. Bundle size requires monitoring as Tiptap rich text editor adds significant weight — consider lazy-loading the editor component on trade form routes only.

## Project Structure

### Documentation (this feature)

```text
specs/001-trading-journal/
├── plan.md              # This file
├── spec.md              # Feature specification (5 user stories)
├── research.md          # Phase 0 output (7 technology decisions)
├── data-model.md        # Phase 1 output (5 entities + export schemas)
├── quickstart.md        # Phase 1 output (setup & dev workflow)
├── contracts/
│   └── payload-collections.md  # Phase 1 output (Payload REST API contracts)
└── tasks.md             # Phase 2 output (17 phases, 101 tasks)
```

### Source Code (repository root)

```text
backend/                        # Payload CMS 3.x (Next.js 15)
├── src/
│   ├── app/                    # Next.js app directory
│   ├── collections/            # Payload collection definitions
│   │   ├── Users.ts
│   │   ├── TradingAccounts.ts
│   │   ├── TradePositions.ts
│   │   ├── TradeImages.ts
│   │   └── Tickers.ts
│   ├── endpoints/              # Custom REST endpoints
│   │   ├── export-json.ts
│   │   ├── export-csv.ts
│   │   └── import-json.ts
│   ├── hooks/                  # Collection hooks (validation)
│   ├── migrations/             # Database migrations
│   ├── seed/                   # Ticker catalog seeder
│   └── payload.config.ts       # Main Payload configuration
├── media/                      # Uploaded trade images
└── package.json

frontend/                       # SvelteKit 5 + Svelte 5 + TypeScript
├── src/
│   ├── lib/
│   │   ├── components/         # Svelte components
│   │   │   ├── ui/             # Design system (Button, Input, Modal, RichText...)
│   │   │   ├── calendar/       # Calendar P&L (DayCell, CalendarMonth, CalendarYear, DayDetail)
│   │   │   ├── trade/          # Trade entry (TradeForm, RRBadge, ImageAttachment, TickerSearch)
│   │   │   └── account/        # Account mgmt (AccountSwitcher, AccountForm)
│   │   ├── services/           # DataService abstraction layer
│   │   │   ├── types.ts        # DataService interface
│   │   │   ├── payload.ts      # PayloadAdapter (web)
│   │   │   ├── sqlite.ts       # SQLiteAdapter (mobile)
│   │   │   └── index.ts        # Factory + singleton
│   │   ├── stores/             # Svelte 5 rune-based stores ($state, $derived)
│   │   │   ├── app.svelte.ts   # App state (auth, loading, first launch)
│   │   │   ├── user.svelte.ts  # User profile
│   │   │   ├── accounts.svelte.ts  # Trading accounts + active selection
│   │   │   └── trades.svelte.ts    # Trade positions + CRUD + P&L
│   │   ├── utils/              # Pure utility functions
│   │   │   ├── calculations.ts # R:R ratio, P&L, direction inference
│   │   │   ├── formatters.ts   # Currency, percent, date, R:R formatting
│   │   │   ├── validators.ts   # Password, price, price relationship validation
│   │   │   ├── pnl.ts          # P&L aggregation (daily, monthly, yearly)
│   │   │   ├── chart-data.ts   # Chart.js data builders (P&L time series, win/loss, ticker dist)
│   │   │   └── export.ts       # JSON/CSV export, JSON import
│   │   └── types/              # TypeScript interfaces
│   │       ├── user.ts
│   │       ├── account.ts
│   │       ├── trade.ts
│   │       ├── ticker.ts
│   │       └── export.ts
│   └── routes/                 # SvelteKit pages
│       ├── +layout.svelte      # Root layout (nav, auth guard, account switcher)
│       ├── +page.svelte        # Entry redirect → /dashboard or /setup
│       ├── setup/              # First-time profile setup wizard
│       ├── dashboard/          # Unified dashboard (stats, calendar, charts, trades)
│       ├── trades/
│       │   ├── new/            # New trade form
│       │   └── [id]/           # Trade detail + edit
│       ├── accounts/           # Account management
│       └── settings/           # Profile, export/import
├── static/
│   ├── data/tickers.json       # Bundled ticker catalog (~500 stocks, 30 forex, 20 crypto)
│   └── logo.svg                # Talaan brand logo
├── tests/
│   ├── unit/                   # Vitest unit tests
│   ├── integration/            # Vitest integration tests
│   └── e2e/                    # Playwright E2E tests
├── capacitor.config.ts         # Capacitor mobile config
├── svelte.config.js            # SvelteKit config (adapter-static)
├── vite.config.ts              # Vite config (proxy, bundleStrategy)
└── package.json

docker-compose.yml              # Dev: postgres + backend + frontend
docker-compose.prod.yml         # Production overrides
Dockerfile.backend              # Multi-stage Payload CMS build
Dockerfile.frontend             # Multi-stage SvelteKit → Nginx
.env.example                    # Environment variable template
```

**Structure Decision**: Web application pattern (separate `backend/` and `frontend/` directories). Backend is a standalone Payload CMS/Next.js API server communicating with the SvelteKit frontend via REST. Docker Compose orchestrates all services for desktop/web deployment. Capacitor wraps the static SPA build for mobile deployment with local SQLite storage.

## Complexity Tracking

> No constitution violations to justify. All principles satisfied.

| Area | Decision | Rationale |
|------|----------|-----------|
| Two backends (Payload + SQLite) | Hybrid DataService pattern | Payload for web (rich CMS features), SQLite for offline mobile. Single interface hides complexity |
| Rich text editor (Tiptap) | Lazy-load on trade form routes | Bundle size concern (~100KB). Only loaded when editing trade notes |
| Dual export paths (backend + frontend) | Backend endpoints for web, frontend utils for mobile | Web can leverage server-side image encoding; mobile must operate offline |

## Phase 0 Artifacts

All research decisions documented in [research.md](./research.md):

1. **Cross-Platform Framework**: SvelteKit 5 + Capacitor
2. **Backend Architecture**: Payload CMS 3.x + Next.js
3. **Offline Data Strategy**: DataService abstraction (PayloadAdapter / SQLiteAdapter)
4. **Database**: PostgreSQL 16 (web) + SQLite (mobile)
5. **Testing Stack**: Vitest (Browser Mode) + Playwright
6. **Ticker Catalog**: Bundled static JSON (~500 stocks, 30 forex, 20 crypto)
7. **Docker Configuration**: 3-service Docker Compose (postgres, backend, frontend)
8. **Multi-Device & Cloud Sync Strategy**: Single-user per device, future cloud sync with last-write-wins, hybrid backend (Payload CMS web / SQLite mobile via Capacitor)

## Phase 1 Artifacts

- **[data-model.md](./data-model.md)**: 5 entities (User, TradingAccount, TradePosition, TradeImage, Ticker) + JSON/CSV export schemas
- **[contracts/payload-collections.md](./contracts/payload-collections.md)**: Payload CMS collection contracts with field definitions, access control, query patterns, custom endpoints
- **[quickstart.md](./quickstart.md)**: Setup prerequisites, running instructions (Docker/web, iOS, Android), development workflow, seed data, environment variables

## Implementation Progress

All 17 phases (101 tasks) are **complete**. See [tasks.md](./tasks.md) for full breakdown:

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 1 | Setup (Infrastructure) | T001–T008 | ✅ Complete |
| 2 | Foundational (Blocking) | T009–T019 | ✅ Complete |
| 3 | US1 — User Profile Setup | T020–T025 | ✅ Complete |
| 4 | US2 — Trade Entry & R:R | T026–T036 | ✅ Complete |
| 5 | US3 — Account Management | T037–T043 | ✅ Complete |
| 6 | US4 — Calendar P&L Dashboard | T044–T049, T072 | ✅ Complete |
| 7 | US5 — Ticker Display & Selection | T050–T054 | ✅ Complete |
| 8 | Data Export & Import | T055–T059 | ✅ Complete |
| 9 | Polish & Cross-Cutting | T060–T064 | ✅ Complete |
| 10 | Starting Capital & Auto P&L % | T065–T071 | ✅ Complete |
| 11 | Rich Text Editor | T073–T078 | ✅ Complete |
| 12 | Dashboard Restructuring | T079–T081 | ✅ Complete |
| 13 | Dark Mode & Calendar Fixes | T082–T084 | ✅ Complete |
| 14 | Realized R:R & TP Validation | T085–T089 | ✅ Complete |
| 15 | Networking & Deployment | T090–T094 | ✅ Complete |
| 16 | Dashboard Enhancements & Branding | T095–T097 | ✅ Complete |
| 17 | Account & Dashboard Bug Fixes | T098–T101 | ✅ Complete |

## Clarifications Incorporated

From spec clarification session 2026-03-01:

1. **Single-user per device** — No multi-user support on a single device. Each installation is one user's journal.
2. **No cloud auth now** — Keep local-only password model. DataService abstraction is the migration path for future cloud adapter.
3. **Last-write-wins conflict resolution** — When cloud sync is added, most recent edit overwrites older data.
4. **Preserve timestamps in export** — `createdAt`/`updatedAt` on all entities preserved through export/import (FR-037).
5. **Hybrid backend architecture** — Payload CMS for web, SQLite for mobile via Capacitor. Current `PayloadAdapter` + `SQLiteAdapter` already supports this.

## Next Steps

With all 17 phases complete, potential future phases include:

- **Phase 18**: Cloud Sync — Implement cloud-based DataService adapter with last-write-wins conflict resolution
- **Phase 19**: Mobile Polish — Native iOS/Android build verification, App Store / Play Store submission preparation
- **Phase 20**: Advanced Analytics — Win rate trends, drawdown tracking, strategy tagging, performance by ticker/timeframe
- **Phase 21**: Multi-Currency Support — Cross-account P&L aggregation with currency conversion
