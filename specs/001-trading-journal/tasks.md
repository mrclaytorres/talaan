# Tasks: Trading Journal Application

**Input**: Design documents from `/specs/001-trading-journal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/payload-collections.md, quickstart.md

**Tests**: Not explicitly requested in the spec. Constitution mandates test coverage (≥80%), so each implementation task SHOULD include tests alongside the implementation code. Tests are not broken out as separate tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (SvelteKit 5 + TypeScript)
- **Backend**: `backend/src/` (Payload CMS 3.x)
- **Docker**: repo root (`docker-compose.yml`, `Dockerfile.*`)
- **Tests**: `frontend/tests/`, `backend/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both projects, configure tooling, and establish the Docker environment.

- [x] T001 Initialize SvelteKit 5 project with TypeScript in `frontend/` — run `pnpm create svelte@latest` with TypeScript, configure `adapter-static` with `fallback: 'index.html'` in `frontend/svelte.config.js`, set `ssr = false` in `frontend/src/routes/+layout.ts`, configure Vite with `bundleStrategy: 'single'` in `frontend/vite.config.ts`
- [x] T002 Initialize Payload CMS 3.x project in `backend/` — run `npx create-payload-app@latest` with TypeScript and `@payloadcms/db-postgres`, configure CORS for `http://localhost:5173` in `backend/src/payload.config.ts`, set `output: 'standalone'` in `backend/next.config.js`
- [x] T003 [P] Create Docker Compose configuration — write `docker-compose.yml` at repo root with three services: `postgres` (postgres:16-alpine with healthcheck), `backend` (Payload CMS, depends on postgres healthy), `frontend` (nginx:alpine serving adapter-static build output from `frontend/build/`). Write `Dockerfile.frontend` (multi-stage: Node build stage runs `pnpm build` with adapter-static, nginx stage copies build output to `/usr/share/nginx/html` with SPA fallback config), `Dockerfile.backend` (multi-stage Payload build). Write `.env.example` with DATABASE_URI, PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL, PUBLIC_API_URL
- [x] T004 [P] Configure ESLint and Prettier for frontend — install `eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-svelte`, `@typescript-eslint/parser` in `frontend/`. Write `frontend/eslint.config.js` with TypeScript strict rules, Svelte plugin, no-unused-vars. Write `frontend/prettier.config.js` with consistent style
- [x] T005 [P] Configure ESLint and Prettier for backend — install `eslint`, `prettier`, `@typescript-eslint/parser` in `backend/`. Write `backend/eslint.config.js` and `backend/prettier.config.js`
- [x] T006 [P] Configure Vitest for frontend — install `vitest`, `@vitest/browser`, `vitest-browser-svelte`, `@vitest/coverage-v8` in `frontend/`. Write `frontend/vitest.config.ts` with browser mode (Playwright provider), coverage threshold 80%. Add `test:unit` script to `frontend/package.json`
- [x] T007 [P] Configure Playwright for E2E tests — install `@playwright/test` in `frontend/`. Write `frontend/playwright.config.ts` targeting Chromium. Add `test:e2e` script to `frontend/package.json`. Create `frontend/tests/e2e/` directory
- [x] T008 [P] Configure Capacitor for mobile — install `@capacitor/core`, `@capacitor/cli`, `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/clipboard`, `@capacitor-community/sqlite` in `frontend/`. Write `frontend/capacitor.config.ts` with `appId`, `appName`, `webDir: 'build'`. Run `npx cap add ios && npx cap add android`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by ALL user stories. MUST be complete before any story phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T009 [P] Define TypeScript interfaces for all entities in `frontend/src/lib/types/` — create `user.ts` (User interface per data-model.md), `account.ts` (TradingAccount), `trade.ts` (TradePosition, TradeImage with direction/status enums), `ticker.ts` (Ticker with assetClass enum), `export.ts` (ExportData with version schema per data-model.md export format)
- [x] T010 [P] Implement utility functions in `frontend/src/lib/utils/calculations.ts` — `calculateRRRatio(entry, stopLoss, takeProfit): number`, `calculatePnL(direction, entry, exit, positionSize): { amount: number, percent: number }`, `inferDirection(entry, stopLoss): 'long' | 'short'`. Include edge case handling: stopLoss === entry returns null, takeProfit === entry returns 0 for reward
- [x] T011 [P] Implement formatter utilities in `frontend/src/lib/utils/formatters.ts` — `formatCurrency(amount, currency)`, `formatPercent(value)`, `formatDate(date, timezone)`, `formatRRRatio(ratio)`. All locale-aware using Intl APIs. Include timezone parameter support per User.timezone
- [x] T012 [P] Implement validator utilities in `frontend/src/lib/utils/validators.ts` — `validatePassword(password): { valid: boolean, errors: string[] }` (min 8 chars, 1 uppercase, 1 number, 1 special), `validatePrice(value): boolean` (> 0), `validatePriceRelationship(direction, entry, stopLoss, takeProfit): { valid: boolean, warnings: string[] }`, `validateMimeType(type): boolean`
- [x] T013 Define DataService interface in `frontend/src/lib/services/types.ts` — TypeScript interface `DataService` with methods: `getUser()`, `createUser(data)`, `updateUser(id, data)`, `getAccounts()`, `createAccount(data)`, `updateAccount(id, data)`, `deleteAccount(id)`, `getTrades(filters?)`, `getTradesByDateRange(start, end, accountId?)`, `createTrade(data)`, `updateTrade(id, data)`, `deleteTrade(id)`, `getTradeImages(tradeId)`, `uploadImage(tradeId, file)`, `deleteImage(id)`, `searchTickers(query)`, `getRecentTickers(limit)`. All return Promises with typed results
- [x] T014 Implement PayloadAdapter in `frontend/src/lib/services/payload.ts` — class implementing DataService interface. All methods make HTTP fetch calls to Payload REST API at `PUBLIC_API_URL` (e.g., `GET /api/trade-positions?where[account][equals]={id}`). Handle pagination, error responses, and file uploads (multipart for images). Use query patterns from contracts/payload-collections.md
- [x] T015 Implement SQLiteAdapter in `frontend/src/lib/services/sqlite.ts` — class implementing DataService interface using `@capacitor-community/sqlite`. Initialize database with schema matching data-model.md (CREATE TABLE statements for users, trading_accounts, trade_positions, trade_images, tickers). Implement all DataService methods with SQL queries. Store images via `@capacitor/filesystem` and reference paths in trade_images table
- [x] T016 Implement DataService factory in `frontend/src/lib/services/index.ts` — export `createDataService(): DataService` that checks `Capacitor.isNativePlatform()` and returns `SQLiteAdapter` on mobile or `PayloadAdapter` on web. Export singleton `dataService` initialized on app load
- [x] T017 [P] Create design system UI components in `frontend/src/lib/components/ui/` — implement `Button.svelte` (primary/secondary/danger variants, loading state), `Input.svelte` (text/number/date/password types, label, error message, validation), `Modal.svelte` (overlay, title, body slot, confirm/cancel actions), `Select.svelte` (dropdown with options), `Badge.svelte` (colored label), `LoadingSpinner.svelte`, `EmptyState.svelte` (icon, message, action slot), `Toast.svelte` (success/error/warning notifications). All components keyboard-accessible per constitution
- [x] T018 Implement root layout in `frontend/src/routes/+layout.svelte` — navigation sidebar/bottom bar (responsive: sidebar on desktop, bottom tabs on mobile), route links for Dashboard, Trades, Calendar, Accounts, Settings. Auth guard: check if user profile exists via dataService, redirect to `/setup` if not. Show password lock screen if password is set and session not authenticated
- [x] T019 [P] Implement app-level Svelte store in `frontend/src/lib/stores/app.svelte.ts` — rune-based store using `$state` for: `isLoading: boolean`, `isAuthenticated: boolean`, `isFirstLaunch: boolean`, `error: string | null`, `activeAccountId: string | 'all'`. Include `init()` method that checks DataService for existing user profile

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — User Profile Setup (Priority: P1) 🎯 MVP

**Goal**: First-time setup flow with local profile, optional password protection, "Default" account auto-creation, and settings page.

**Independent Test**: Launch app → complete setup → close and reopen → verify data persists. Set password → reopen → verify lock screen appears.

### Implementation for User Story 1

- [x] T020 [US1] Implement Users collection in Payload in `backend/src/collections/Users.ts` — fields per contracts: displayName (text, required, max 100), passwordHash (text, optional), timezone (text, required, default "UTC"), securityQ (text, optional, max 200), securityA (text, optional). Access control: all operations allowed. Register in `backend/src/payload.config.ts`
- [x] T021 [US1] Implement user store in `frontend/src/lib/stores/user.svelte.ts` — rune-based store with `$state` for User data. Methods: `loadUser()` (calls dataService.getUser()), `createUser(data)` (calls dataService.createUser() then creates "Default" account via dataService.createAccount()), `updateUser(id, data)`, `verifyPassword(input, hash)`, `hashPassword(input)`. Use Web Crypto API with PBKDF2 (SHA-256, 100K iterations, random 16-byte salt) for password hashing — store as `salt:hash` in passwordHash field
- [x] T022 [US1] Implement setup page in `frontend/src/routes/setup/+page.svelte` — multi-step form: Step 1: display name (required), timezone selector (IANA timezones, default UTC). Step 2: optional password + confirm password (with strength validation from validators.ts), optional security question and answer. Step 3: confirmation. On submit: create user profile + "Default" trading account, redirect to dashboard. Use UI components from Phase 2
- [x] T023 [US1] Implement password lock screen component in `frontend/src/lib/components/ui/LockScreen.svelte` — full-screen overlay, password input, submit button, error message on wrong password, "Forgot password?" link. Compare hashed input against stored passwordHash. On success: set isAuthenticated in app store. "Forgot password?" flow: show security question if set, or warn about data reset
- [x] T024 [US1] Implement settings page in `frontend/src/routes/settings/+page.svelte` — profile section: edit display name, timezone selector, change/set/remove password (require current password if changing). Security question section: set or update question and answer. App info section: version number. Use form validation from validators.ts. Save via userStore.updateUser()
- [x] T025 [US1] Implement dashboard redirect in `frontend/src/routes/+page.svelte` — check app store state: if `isFirstLaunch`, redirect to `/setup`. If authenticated, redirect to `/trades` (default landing page). If password set but not authenticated, show LockScreen

**Checkpoint**: User Story 1 complete. App launches, user creates profile, password protection works, "Default" account auto-created.

---

## Phase 4: User Story 2 — Trade Entry & Risk-Reward (Priority: P2)

**Goal**: Create, view, edit, and delete trade positions with automatic R:R calculation, P&L computation on close, free-text notes, and image attachments.

**Independent Test**: Add a trade with entry $150, SL $145, TP $165 → verify R:R shows 1:3. Edit trade, delete trade. Close trade with exit price → verify P&L. Attach image → verify it displays.

### Implementation for User Story 2

- [x] T026 [US2] Implement TradePositions collection in Payload in `backend/src/collections/TradePositions.ts` — fields per contracts: account (relationship → trading-accounts), date, tickerSymbol, direction (select: long/short), entryPrice, stopLoss, takeProfit, positionSize, exitPrice, status (select: open/closed, default open), rrRatio, pnlAmount, pnlPercent, notes (richText). Sort default: date descending
- [x] T027 [US2] Implement trade validation hooks in `backend/src/hooks/trade-validation.ts` — `beforeChange` hook: reject if stopLoss === entryPrice (R:R undefined), reject negative prices, require exitPrice when status === "closed", warn (add validation message) if direction/SL/TP mismatch (long: SL should < entry, TP should > entry). Register hook in TradePositions collection
- [x] T028 [US2] Implement TradeImages collection in Payload in `backend/src/collections/TradeImages.ts` — upload collection per contracts: trade (relationship → trade-positions), sortOrder (number, default 0). Upload config: mimeTypes (png, jpeg, webp, gif), staticDir `./media/trade-images`, imageSizes (thumbnail 200x200, medium 800x600). Register in payload.config.ts
- [x] T029 [US2] Implement trades store in `frontend/src/lib/stores/trades.svelte.ts` — rune-based store with `$state` for `trades: TradePosition[]`, `currentTrade: TradePosition | null`, `filters: { accountId, status, dateRange }`. Methods: `loadTrades(filters?)`, `createTrade(data)` (compute rrRatio via calculations.ts before save), `updateTrade(id, data)` (recompute R:R and P&L), `deleteTrade(id)` (cascade delete images), `closeTrade(id, exitPrice)` (compute P&L via calculations.ts, set status to closed)
- [x] T030 [P] [US2] Implement RRBadge component in `frontend/src/lib/components/trade/RRBadge.svelte` — displays R:R ratio as "1:X" with color coding (green if ratio ≥ 2, yellow if 1-2, red if < 1). Accept `ratio: number | null` prop. Show "—" if null (edge case). Uses Badge UI component
- [x] T031 [P] [US2] Implement TradeForm component in `frontend/src/lib/components/trade/TradeForm.svelte` — form fields: date (date input, default today), tickerSymbol (text input — ticker search integration deferred to US5), direction (select: long/short, auto-inferred from entry vs SL), entryPrice, stopLoss, takeProfit (number inputs), positionSize (optional number), exitPrice (optional, shown when closing), status (select), notes (textarea). Live R:R calculation displayed via RRBadge as user types. Validation: all prices > 0, SL ≠ entry, direction warning. Props: `trade?: TradePosition` for edit mode, `onSubmit`, `onCancel`
- [x] T032 [P] [US2] Implement ImageAttachment component in `frontend/src/lib/components/trade/ImageAttachment.svelte` — displays attached images as thumbnail grid. Add button: on mobile uses `@capacitor/camera` (choose camera or photo library), on web uses file input or `@capacitor/clipboard` paste. Upload via dataService.uploadImage(). Delete button per image. Drag-to-reorder via sortOrder. Props: `tradeId: string`, `images: TradeImage[]`, `editable: boolean`
- [x] T033 [US2] Implement trade list page in `frontend/src/routes/trades/+page.svelte` — paginated list of trades from tradesStore. Each row: date, ticker, direction badge, entry/SL/TP, R:R badge, status badge, P&L (if closed). Sort by date descending. Filter by status (all/open/closed). Empty state when no trades. "Add Trade" button links to `/trades/new`
- [x] T034 [US2] Implement new trade page in `frontend/src/routes/trades/new/+page.svelte` — renders TradeForm in create mode. On submit: tradesStore.createTrade(), redirect to `/trades`. Page title: "New Trade"
- [x] T035 [US2] Implement trade detail page in `frontend/src/routes/trades/[id]/+page.svelte` — load trade by ID from tradesStore. Display all fields read-only with formatted values. Show R:R badge, P&L if closed. Show attached images (full-size on click). Show notes. Action buttons: Edit (→ `/trades/[id]/edit`), Delete (with confirmation modal), Close Trade (if open — prompt for exit price)
- [x] T036 [US2] Implement trade edit page in `frontend/src/routes/trades/[id]/edit/+page.svelte` — renders TradeForm in edit mode with existing trade data. ImageAttachment component in editable mode. On submit: tradesStore.updateTrade(), redirect to `/trades/[id]`

**Checkpoint**: User Story 2 complete. Trades can be created, viewed, edited, deleted. R:R calculates live. P&L computes on close. Notes and images attach to trades.

---

## Phase 5: User Story 3 — Account Management (Priority: P3)

**Goal**: Create, rename, delete trading accounts. Switch between accounts to filter trades. "All Accounts" aggregate view.

**Independent Test**: Create two accounts, add trades to each, switch views → verify filtering. Delete empty account → verify removed. Delete account with trades → verify confirmation prompt.

### Implementation for User Story 3

- [x] T037 [US3] Implement TradingAccounts collection in Payload in `backend/src/collections/TradingAccounts.ts` — fields per contracts: user (relationship → users), name (text, required, max 100), description (textarea, optional, max 500), currency (text, required, default "USD", max 10). Sort default: createdAt ascending. Register in payload.config.ts
- [x] T038 [US3] Implement accounts store in `frontend/src/lib/stores/accounts.svelte.ts` — rune-based store with `$state` for `accounts: TradingAccount[]`, `activeAccountId: string | 'all'`. Methods: `loadAccounts()`, `createAccount(data)`, `updateAccount(id, data)`, `deleteAccount(id)` (check for existing trades, return count for confirmation UX), `setActiveAccount(id | 'all')`. Initialize with existing accounts on app load
- [x] T039 [P] [US3] Implement AccountSwitcher component in `frontend/src/lib/components/account/AccountSwitcher.svelte` — dropdown selector showing all accounts + "All Accounts" option at top. Current selection highlighted. On change: update accountsStore.activeAccountId. Display account currency next to name. Place in root layout header/nav area
- [x] T040 [P] [US3] Implement AccountForm component in `frontend/src/lib/components/account/AccountForm.svelte` — form fields: name (required, max 100), description (optional, max 500), currency (select from common currencies: USD, EUR, GBP, JPY, AUD, CAD, CHF, BTC). Props: `account?: TradingAccount` for edit mode, `onSubmit`, `onCancel`. Validate name uniqueness against existing accounts
- [x] T041 [US3] Implement accounts page in `frontend/src/routes/accounts/+page.svelte` — list all trading accounts with name, currency, description, trade count per account. Actions per account: Rename (inline edit or modal with AccountForm), Delete (modal confirmation showing trade count — "This will delete X trades. Are you sure?"). "Create Account" button opens AccountForm modal. Cannot delete last remaining account
- [x] T042 [US3] Integrate account filtering into trade list — update `frontend/src/routes/trades/+page.svelte` to filter trades by `accountsStore.activeAccountId`. When "All Accounts", show all trades with account name badge per row. When specific account selected, filter by accountId. Update tradesStore.loadTrades() to accept accountId filter
- [x] T043 [US3] Integrate AccountSwitcher into root layout — add AccountSwitcher component to `frontend/src/routes/+layout.svelte` navigation area. Visible on all pages. Selection persists across route navigation via accountsStore

**Checkpoint**: User Story 3 complete. Multiple accounts creatable. Trade list filters by active account. "All Accounts" shows aggregate. Delete with confirmation.

---

## Phase 6: User Story 4 — Calendar P&L Dashboard (Priority: P4)

**Goal**: Calendar visualization showing daily P&L with color coding. Monthly and yearly aggregate views. Filter by account. Click day for trade breakdown.

**Independent Test**: Add trades across multiple dates → verify daily P&L amounts and colors. Switch to monthly → verify aggregates. Switch to yearly → verify monthly totals. Filter by account → verify only that account's P&L.

### Implementation for User Story 4

- [x] T044 [P] [US4] Implement P&L aggregation utilities in `frontend/src/lib/utils/pnl.ts` — `aggregateDailyPnL(trades: TradePosition[]): Map<string, { amount: number, percent: number, tradeCount: number }>` keyed by ISO date. `aggregateMonthlyPnL(dailyMap): Map<string, { amount: number, percent: number, tradingDays: number }>` keyed by "YYYY-MM". `aggregateYearlyPnL(monthlyMap): Map<string, { amount: number, percent: number, tradingMonths: number }>` keyed by "YYYY". Only include closed trades. Apply user timezone for date grouping
- [x] T045 [P] [US4] Implement DayCell component in `frontend/src/lib/components/calendar/DayCell.svelte` — renders a single calendar day. Props: `date: string`, `pnl: { amount: number, percent: number } | null`, `isCurrentMonth: boolean`. Color: green background if amount > 0, red if < 0, neutral/gray if null or 0. Display formatted amount and percent. Clickable (emits `onClick` event). Dim if not current month
- [x] T046 [US4] Implement CalendarMonth component in `frontend/src/lib/components/calendar/CalendarMonth.svelte` — renders a full month grid (7 columns: Mon-Sun, 5-6 rows). Props: `year: number`, `month: number`, `dailyPnL: Map`. Renders DayCell for each day. Navigation arrows to go prev/next month. Month/year title header. Summary row: total P&L for the month
- [x] T047 [US4] Implement CalendarYear component in `frontend/src/lib/components/calendar/CalendarYear.svelte` — renders 12 month cards in a grid (4x3 or responsive). Props: `year: number`, `monthlyPnL: Map`. Each card shows month name, total P&L amount, percent, color-coded. Clickable month → navigates to monthly view for that month. Navigation arrows for prev/next year
- [x] T048 [US4] Implement DayDetail component in `frontend/src/lib/components/calendar/DayDetail.svelte` — modal or slide-over panel showing all closed trades for a specific date. Props: `date: string`, `trades: TradePosition[]`. Each trade row: ticker, direction, entry→exit, P&L amount and percent. Total daily P&L at bottom. "View Trade" link per row → `/trades/[id]`
- [x] T049 [US4] Implement calendar page in `frontend/src/routes/calendar/+page.svelte` — load all closed trades via tradesStore.loadTrades({ status: 'closed', accountId: activeAccountId }). Compute P&L maps using pnl.ts utilities. Toggle between Monthly and Yearly views (tab bar). Monthly view: render CalendarMonth. Yearly view: render CalendarYear. On day click: show DayDetail with filtered trades. Account filter via AccountSwitcher already in layout. Default to current month

- [x] T072 [US4] Add weekly P&L total column to CalendarMonth in `frontend/src/lib/components/calendar/CalendarMonth.svelte` — add 8th "Total" column to the calendar grid. Grid changes from `repeat(7, 1fr)` to `repeat(7, 1fr) auto`. Added `weekRows` derived state that chunks `calendarDays` into arrays of 7, and `weekTotal()` helper that sums P&L amount/percent for each week. Week total cells display formatted currency and percent, color-coded green (#d1fae5) for positive and red (#fecaca) for negative, with slightly muted background to distinguish from day cells. Mobile breakpoint (max-width: 640px) hides the total column and reverts to 7-column grid

**Checkpoint**: User Story 4 complete. Calendar shows daily P&L color-coded. Monthly and yearly views aggregate correctly. Day click shows trade breakdown. Account filter works.

---

## Phase 7: User Story 5 — Ticker Display & Selection (Priority: P5)

**Goal**: Searchable ticker catalog with autocomplete on trade entry. Recent tickers as suggestions. Custom ticker entry for unlisted instruments.

**Independent Test**: Open trade form → type "AA" → verify dropdown shows AAPL, AAL. Select AAPL → verify field populates. Enter a custom ticker → verify it saves. Open new trade → verify AAPL appears as recent.

### Implementation for User Story 5

- [x] T050 [US5] Implement Tickers collection in Payload in `backend/src/collections/Tickers.ts` — fields per contracts: symbol (text, unique, max 20), name (text, required), assetClass (select: stock/forex/crypto), exchange (text, optional), baseCurrency (text, optional), quoteCurrency (text, optional). Access: read-only for API consumers. Register in payload.config.ts
- [x] T051 [US5] Create ticker seed script in `backend/src/seed/tickers.ts` — curate and generate `tickers.json` with ~500 US stocks (symbol, name, exchange), ~30 major forex pairs (EURUSD, GBPUSD, etc.), ~20 top crypto pairs (BTC-USD, ETH-USD, etc.) from open-source data (rreichel3/US-Stock-Symbols, JerBouma/FinanceDatabase). Script reads JSON and bulk-inserts into Payload Tickers collection via local API. Add `seed:tickers` script to `backend/package.json`
- [x] T052 [US5] Create bundled ticker catalog for mobile in `frontend/static/data/tickers.json` — same curated data as seed script, formatted as `{ stocks: [...], forex: [...], crypto: [...] }` per research.md schema. SQLiteAdapter loads this on first launch to populate local tickers table
- [x] T053 [US5] Implement TickerSearch component in `frontend/src/lib/components/trade/TickerSearch.svelte` — autocomplete input field. On keystroke (debounced 200ms): search tickers via dataService.searchTickers(query) matching symbol or name (case-insensitive). Dropdown shows matching results: symbol (bold) + name + asset class badge. Recently used tickers shown when field is focused but empty (via dataService.getRecentTickers(5)). Selecting a result populates the field. Allow free-text entry for custom symbols not in catalog. Props: `value: string`, `onChange(symbol: string)`
- [x] T054 [US5] Integrate TickerSearch into TradeForm — update `frontend/src/lib/components/trade/TradeForm.svelte` to replace the plain text input for tickerSymbol with the TickerSearch component. Wire `onChange` to update the tickerSymbol field value

**Checkpoint**: User Story 5 complete. Ticker search works with autocomplete. Recent tickers appear. Custom symbols accepted. Integrated into trade entry flow.

---

## Phase 8: Data Export & Import

**Goal**: Export all data as JSON (full backup with images) or CSV (spreadsheet analysis). Import JSON to restore data on any device.

**Independent Test**: Add trades with images → export JSON → verify file contains all data + base64 images. Export CSV → open in spreadsheet → verify columns match. Import JSON on a fresh install → verify all data restored.

### Implementation for Data Export & Import

- [x] T055 [P] Implement JSON export endpoint in `backend/src/endpoints/export-json.ts` — `GET /api/export/json`. Fetch user, all accounts, all trades with images. Encode images as base64. Structure per data-model.md JSON export schema (version, exportedAt, user, accounts[].trades[].images[]). Return as downloadable JSON file with Content-Disposition header. Register in payload.config.ts endpoints array. **Web only** — mobile uses T058 frontend utils directly via DataService
- [x] T056 [P] Implement CSV export endpoint in `backend/src/endpoints/export-csv.ts` — `GET /api/export/csv?accountId={id}`. Fetch trades (optionally filtered by account). Generate CSV with columns per data-model.md: account_name, date, ticker, direction, entry_price, stop_loss, take_profit, position_size, exit_price, status, rr_ratio, pnl_amount, pnl_percent, notes. Return as downloadable CSV file. Register in payload.config.ts endpoints array. **Web only** — mobile uses T058 frontend utils directly via DataService
- [x] T057 [P] Implement JSON import endpoint in `backend/src/endpoints/import-json.ts` — `POST /api/import/json`. Accept JSON body. Validate version field. Clear existing data (user, accounts, trades, images). Restore user profile, accounts, trades. Decode base64 images and save to media dir. Return `{ success: true, imported: { accounts: N, trades: N } }`. Register in payload.config.ts endpoints array. **Web only** — mobile uses T058 frontend utils directly via DataService
- [x] T058 Implement export/import utility functions in `frontend/src/lib/utils/export.ts` — **platform-agnostic** functions that operate through the DataService interface (works with both PayloadAdapter on web and SQLiteAdapter on mobile): `exportJSON(dataService): Promise<Blob>` (fetches all data via dataService methods, structures as export schema, encodes images as base64), `exportCSV(dataService, accountId?): Promise<Blob>` (fetches trades via dataService, generates CSV string), `importJSON(dataService, file: File): Promise<{ accounts: number, trades: number }>` (parse JSON, validate version, restore via dataService methods), `downloadBlob(blob, filename)` (trigger browser download on web), `saveToFilesystem(blob, filename)` (use `@capacitor/filesystem` on mobile), `validateExportVersion(data): boolean`. On web, T055-T057 backend endpoints are available as an alternative fast path; on mobile, these frontend utils are the **only** export/import path
- [x] T059 Implement export/import UI in `frontend/src/routes/settings/+page.svelte` — add "Data Management" section to settings page. "Export JSON Backup" button: calls exportJSON(), downloads file. "Export CSV" button: shows account selector, calls exportCSV(), downloads file. "Import Backup" button: file picker for JSON, validate, show confirmation modal ("This will replace all existing data. Continue?"), call importJSON(), show success toast with counts. Progress indicator during export/import

**Checkpoint**: Export/import complete. JSON backup includes all data + images. CSV for spreadsheet analysis. Import restores full state with confirmation.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Production readiness, performance, accessibility, and platform-specific refinements.

- [x] T060 [P] Create Docker production compose in `docker-compose.prod.yml` — production overrides: no bind mounts, built images only, environment variables from Docker secrets or `.env`, restart policies, resource limits. Update Dockerfiles for production optimization (smaller base images, no dev dependencies)
- [x] T061 [P] Implement Capacitor mobile build pipeline — add `build:ios` and `build:android` scripts to `frontend/package.json` that run `pnpm build && npx cap sync`. Document in quickstart.md. Verify camera and filesystem plugins work on both platforms. Test SQLiteAdapter initialization with schema creation on first launch
- [x] T062 [P] Performance optimization — implement virtualized scrolling for trade lists exceeding 100 rows in `frontend/src/routes/trades/+page.svelte` (use a lightweight virtual list). Verify bundle size < 200KB gzipped. Lazy-load calendar and settings routes. Verify Lighthouse score ≥ 90
- [x] T063 [P] Accessibility audit and fixes — verify all interactive elements keyboard-navigable across all pages. Add `aria-label` attributes to icon buttons. Verify color contrast meets WCAG 2.1 AA. Ensure calendar day cells have `aria-label` with date and P&L. Test with screen reader on at least one platform
- [x] T064 Code cleanup and final validation — remove any TODO comments, unused imports, dead code across frontend and backend. Run `pnpm lint` and `pnpm check` in both projects with zero errors. Verify all TypeScript strict mode errors resolved. Run full test suite. Walk through quickstart.md steps end-to-end to verify accuracy

---

## Phase 10: Starting Capital & Auto-Calculate P&L %

**Purpose**: Add starting capital to accounts and auto-calculate P&L % from P&L amount on trade entry.

**Independent Test**: Create account with starting capital $10,000. Add a trade with P&L Amount $500 → verify P&L % auto-calculates to 5%. Manually override P&L % → verify override persists. Edit P&L Amount again → verify P&L % recalculates. Setup wizard creates default account with startingCapital: 0.

### Implementation for Starting Capital & Auto P&L %

- [x] T065 [US3] Add `startingCapital` field to TradingAccounts collection in `backend/src/collections/TradingAccounts.ts` — number field, required, min 0, defaultValue 0
- [x] T066 [US3] Create database migration for `starting_capital` column in `backend/src/migrations/20260228_120000_add_starting_capital.ts` — `ALTER TABLE trading_accounts ADD COLUMN starting_capital numeric DEFAULT 0 NOT NULL`. Register in `backend/src/migrations/index.ts`. Migration applied and verified
- [x] T067 [P] [US3] Add `startingCapital` to frontend type interfaces in `frontend/src/lib/types/account.ts` — add `startingCapital: number` to `TradingAccount`, `startingCapital: number` to `CreateAccountData`, `startingCapital?: number` to `UpdateAccountData`
- [x] T068 [P] [US3] Add Starting Capital input to AccountForm in `frontend/src/lib/components/account/AccountForm.svelte` — number input with min 0, validation (cannot be negative), included in submit data with `Number(startingCapital) || 0`
- [x] T069 [US1] Add `startingCapital: 0` default to setup wizard in `frontend/src/lib/stores/user.svelte.ts` — default "Default" account creation now includes `startingCapital: 0`
- [x] T070 [US2] Add auto-calculate P&L % to TradeForm in `frontend/src/lib/components/trade/TradeForm.svelte` — new `startingCapital` prop (default 0), `$effect` auto-fills `pnlPercent = pnlAmount / startingCapital * 100` when `startingCapital > 0` and `pnlAmount` is set. Manual override tracked via `pnlPercentManual` flag — typing in P&L Amount resets flag, typing in P&L % sets flag. Placeholder shows "Auto-calculated" when startingCapital > 0
- [x] T071 [US2] Pass `startingCapital` to TradeForm from parent pages — `frontend/src/routes/trades/new/+page.svelte` looks up active account's `startingCapital` from `accountsStore` and passes as prop. `frontend/src/routes/trades/[id]/edit/+page.svelte` looks up the trade's account and passes its `startingCapital`

**Checkpoint**: Starting capital field on accounts. P&L % auto-calculates from P&L amount and starting capital. Manual override still works. Setup wizard unchanged (default startingCapital: 0).

---

## Phase 11: Rich Text Editor for Trade Notes

**Purpose**: Replace plain textarea for trade notes with a rich text editor supporting formatted text, inline image uploads, and YouTube/Vimeo video embeds.

**Independent Test**: Open trade form → use toolbar for bold, headings, lists → submit → view on detail page → verify formatting renders. Upload image via editor → verify inline. Embed YouTube URL → verify iframe. View old plain-text notes → verify backward compatibility.

### Implementation for Rich Text Editor

- [x] T073 Install Tiptap v2 and DOMPurify dependencies in `frontend/` — `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-youtube`, `@tiptap/extension-placeholder`, `@tiptap/extension-link`, `@tiptap/extension-underline`, `dompurify`. DOMPurify v3 ships own types (no `@types/dompurify` needed)
- [x] T074 [P] Create RichTextEditor component in `frontend/src/lib/components/ui/RichTextEditor.svelte` — Tiptap editor with toolbar: Bold, Italic, Underline, Strike | H1, H2, H3 | Bullet List, Ordered List, Blockquote | Image Upload, Video Embed. Props: `content`, `placeholder`, `onchange(html)`, `uploadImage?(file) → url`. Toolbar buttons use `type="button"` to prevent form submission. Active state highlighting via `editorState.editor.isActive()`
- [x] T075 [P] Create RichTextDisplay component in `frontend/src/lib/components/ui/RichTextDisplay.svelte` — read-only HTML renderer using `{@html}` with DOMPurify sanitization (explicit allowlist for tags, attributes, URIs). Auto-detects plain text vs HTML for backward compatibility via `isHtmlContent()`. Same content CSS as editor
- [x] T076 [P] Add HTML detection helpers to `frontend/src/lib/utils/formatters.ts` — `isHtmlContent(str)` regex check for HTML tags, `plainTextToHtml(text)` converts newline-separated plain text to `<p>` elements
- [x] T077 Replace textarea with RichTextEditor in `frontend/src/lib/components/trade/TradeForm.svelte` — import RichTextEditor, add `handleNoteImageUpload(file)` using `dataService.uploadImage()` (only in edit mode), `isEmptyHtml()` helper to detect empty `<p></p>` on submission. Changed notes `<label>` to `<span class="notes-label">` to fix a11y warning
- [x] T078 Replace plain text notes with RichTextDisplay in `frontend/src/routes/trades/[id]/+page.svelte` — replaced `<p class="notes-text">{trade.notes}</p>` with `<RichTextDisplay content={trade.notes} />`

**Checkpoint**: Rich text editor works for trade notes. Formatted text, images, and video embeds render on detail page. Old plain-text notes display correctly.

---

## Phase 12: Dashboard Restructuring & Route Consolidation

**Purpose**: Merge trades list and calendar into a single /dashboard route. Remove standalone /calendar route. Reorder layout: Stat Cards → Calendar → Charts → Trades Table.

- [x] T079 Create unified dashboard page in `frontend/src/routes/dashboard/+page.svelte` — merged content from old `/trades` and `/calendar` pages. Layout order: Stat Cards → Calendar (monthly/yearly views) → P&L Over Time & Ticker Distribution charts → Trades Table. Separate closed trades loading for calendar data
- [x] T080 Delete old route files — removed `frontend/src/routes/trades/+page.svelte` and `frontend/src/routes/calendar/+page.svelte`
- [x] T081 Update navigation in `frontend/src/routes/+layout.svelte` — removed Calendar nav item, renamed Trades → Dashboard at `/dashboard`. Updated mobile bottom bar: single Dashboard link replacing Trades + Calendar. Updated all internal route references across setup page, root page, and trade sub-pages

**Checkpoint**: Single /dashboard route with calendar above charts. All navigation updated. No dead routes.

---

## Phase 13: Dark Mode & Calendar Fixes

**Purpose**: Fix dark mode contrast issues in calendar components and add trade count display.

- [x] T082 Fix dark mode colors in calendar components — replaced hardcoded light-mode colors (`#dcfce7`, `#166534`, etc.) with theme-aware CSS variables (`--positive-bg`, `--positive-text`, `--negative-bg`, `--negative-text`) in `DayCell.svelte`, `CalendarMonth.svelte`, `CalendarYear.svelte`, `DayDetail.svelte`
- [x] T083 Fix month names invisible in yearly calendar dark mode — added `color: var(--text-primary, #18181b)` to `.month-name` in `CalendarYear.svelte`
- [x] T084 Add trade count per day to `DayCell.svelte` — displays `{pnl.tradeCount} trade(s)` in each day cell

**Checkpoint**: Calendar fully readable in both light and dark modes. Daily trade counts visible.

---

## Phase 14: Realized R:R & Take Profit Validation Fixes

**Purpose**: Fix R:R calculation for stopped-out trades (should be negative) and make Take Profit optional for closed trades.

- [x] T085 Add `calculateRealizedRR()` function in `frontend/src/lib/utils/calculations.ts` — computes signed R:R based on direction and actual exit price: `actualMove / risk` where `actualMove = exitPrice - entryPrice` (long) or `entryPrice - exitPrice` (short). Returns negative values for losing trades
- [x] T086 Update trades store in `frontend/src/lib/stores/trades.svelte.ts` — `createTrade` and `updateTrade` now use realized R:R for closed trades, planned R:R for open trades
- [x] T087 Update `formatRRRatio()` in `frontend/src/lib/utils/formatters.ts` — handles negative values: displays as `−1.0R` for stopped-out trades
- [x] T088 Update `RRBadge.svelte` — added `ratio < 0` check → 'danger' variant before other thresholds
- [x] T089 Make Take Profit optional for closed trades in `TradeForm.svelte` — TP no longer required when status is "closed", placeholder shows "Optional". Updated `validatePriceRelationship()` in `validators.ts` to accept nullable TP and skip directional checks when null. On submission, empty TP falls back to stop loss value for backend compatibility

**Checkpoint**: R:R correctly shows negative for stopped-out trades. Closed trades no longer require Take Profit.

---

## Phase 15: Networking & Deployment Fixes

**Purpose**: Fix API connectivity for ngrok tunnels and Docker deployments. Fix backend build errors.

- [x] T090 Add Vite dev proxy for `/api` in `frontend/vite.config.ts` — proxies `/api` requests to `http://localhost:3000` during local development
- [x] T091 Add nginx `/api` reverse proxy in `Dockerfile.frontend` — proxies `/api/` to `http://backend:3000/api/` for Docker deployments
- [x] T092 Make frontend API URL dynamic in `frontend/src/lib/services/index.ts` — changed from hardcoded `http://localhost:3000/api` to `window.location.origin + '/api'`
- [x] T093 Make CORS env-driven in `backend/src/payload.config.ts` — reads `CORS_ORIGINS` environment variable, splits by comma, adds to CORS allowlist
- [x] T094 Fix missing `startingCapital` in backend export/import — added `startingCapital` to `backend/src/endpoints/export-json.ts` and `backend/src/endpoints/import-json.ts`. Also added to `frontend/src/lib/types/export.ts` and `frontend/src/lib/utils/export.ts`. Fixed all pre-existing type errors (4 → 0)

**Checkpoint**: App works through ngrok tunnels and Docker. CORS configurable via environment. Backend builds without errors.

---

## Phase 16: Dashboard Enhancements & Branding

**Purpose**: Replace Open Positions card with Current Fund Standing. Rename app to "Talaan" with logo.

- [x] T095 Replace Open Positions with Current Fund Standing in `frontend/src/routes/dashboard/+page.svelte` — replaced `openCount` with `fundStanding()` computing starting capital + total P&L across accounts. Stat card shows balance with color coding (green positive, red negative) and starting capital subtitle
- [x] T096 Rename app to "Talaan" across codebase — updated brand icon and name in `+layout.svelte`, title and subtitle in `setup/+page.svelte`, version text and export filenames in `settings/+page.svelte`, title in `LockScreen.svelte`, page title and favicon in `app.html`
- [x] T097 Create and apply "Talaan" logo — designed shield-shaped SVG logo (Option 4: dark slate shield with white "T", journal lines, and green chart line). Saved as `frontend/static/logo.svg`. Applied as navbar brand icon (28px), setup page logo (64px), lock screen logo (64px), and browser favicon

**Checkpoint**: Dashboard shows current fund standing. App fully branded as "Talaan" with logo across all screens.

---

## Phase 17: Account & Dashboard Bug Fixes

**Purpose**: Fix account-related bugs (ID type mismatches, foreign key errors, default selection) and add weekly trade count to calendar.

- [x] T098 Fix account switcher ID type mismatch across codebase — Payload CMS with PostgreSQL returns numeric IDs (e.g., `1`) but HTML `<select>` values are always strings (`"1"`). Fixed with `String(account.id)` normalization in `AccountSwitcher.svelte` option values, `accounts.svelte.ts` `setActiveAccount()` and `deleteAccount()`, `dashboard/+page.svelte` fund standing comparison, `trades/new/+page.svelte` active account lookup, `trades/[id]/edit/+page.svelte` trade account lookup
- [x] T099 Fix account creation foreign key error — creating a new account sent `user_id = 0` because `AccountForm.svelte` hardcoded `user: ''` and `PayloadAdapter.createAccount()` converted via `Number('') = 0`. Fixed by: (1) adding `userStore.loadUser()` to layout init in `+layout.svelte` so user data is available app-wide, (2) injecting `userStore.user?.id` in `accounts/+page.svelte` `handleCreate` before calling the store
- [x] T100 Add weekly trade count to calendar Total column in `frontend/src/lib/components/calendar/CalendarMonth.svelte` — updated `weekTotal()` to sum `pnl.tradeCount` across week days. Added `{wt.tradeCount} trade(s)` display below P&L amount/percent in `.week-total-cell`. Added `.week-total-trades` CSS (small muted text)
- [x] T101 Default account selection to first account instead of "All Accounts" — changed `accounts.svelte.ts` `loadAccounts()` to set `activeAccountId` to first account's ID when currently `'all'`. Updated `deleteAccount()` fallback to select first remaining account instead of `'all'`

**Checkpoint**: Account switching works correctly across all pages. New accounts can be created. Calendar shows weekly trade counts. Dashboard defaults to first account.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **User Story 2 (Phase 4)**: Depends on Phase 2 — can run parallel with US1 but uses auth guard from US1
- **User Story 3 (Phase 5)**: Depends on Phase 2 — integrates with US2 trade list (T042)
- **User Story 4 (Phase 6)**: Depends on Phase 2 + US2 (needs trade data for P&L)
- **User Story 5 (Phase 7)**: Depends on Phase 2 + US2 (integrates into TradeForm)
- **Data Export/Import (Phase 8)**: Depends on Phase 2 + US1 + US2 + US3 (exports all data)
- **Polish (Phase 9)**: Depends on all desired user stories being complete
- **Starting Capital & Auto P&L % (Phase 10)**: Depends on US2 (TradeForm) + US3 (TradingAccounts)
- **Rich Text Editor (Phase 11)**: Depends on US2 (TradeForm, trade detail page)
- **Dashboard Restructuring (Phase 12)**: Depends on US2 (trades page) + US4 (calendar page)
- **Dark Mode & Calendar Fixes (Phase 13)**: Depends on US4 (calendar components)
- **R:R & TP Validation Fixes (Phase 14)**: Depends on US2 (calculations, TradeForm, trades store)
- **Networking & Deployment Fixes (Phase 15)**: Depends on Phase 1 (Docker) + Phase 2 (services)
- **Dashboard Enhancements & Branding (Phase 16)**: Depends on Phase 12 (dashboard) + Phase 10 (starting capital)
- **Account & Dashboard Bug Fixes (Phase 17)**: Depends on Phase 5 (US3 accounts) + Phase 6 (US4 calendar) + Phase 16 (dashboard)

### Recommended Sequential Order

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (US5) → Phase 8 (Export/Import) → Phase 9 (Polish) → Phase 10 (Starting Capital & Auto P&L %) → Phase 11 (Rich Text Editor) → Phase 12 (Dashboard Restructuring) → Phase 13 (Dark Mode Fixes) → Phase 14 (R:R & TP Fixes) → Phase 15 (Networking Fixes) → Phase 16 (Branding) → Phase 17 (Account & Dashboard Bug Fixes)

### Within Each User Story

- Backend collection/hooks before frontend components
- Stores before pages
- Components before pages that use them
- Core implementation before integration tasks

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel (T003-T008)
- All Phase 2 tasks marked [P] can run in parallel (T009-T012, T017)
- Within US2: T030, T031, T032 (components) can run in parallel
- Within US3: T039, T040 (components) can run in parallel
- Within US4: T044, T045 (utilities + DayCell) can run in parallel
- Within Phase 8: T055, T056, T057 (backend endpoints) can run in parallel
- All Phase 9 tasks marked [P] can run in parallel

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch all independent foundation tasks together:
Task: "Define TypeScript interfaces in frontend/src/lib/types/"
Task: "Implement calculations.ts in frontend/src/lib/utils/"
Task: "Implement formatters.ts in frontend/src/lib/utils/"
Task: "Implement validators.ts in frontend/src/lib/utils/"
Task: "Create design system UI components in frontend/src/lib/components/ui/"
```

## Parallel Example: User Story 2

```bash
# Launch independent trade components together:
Task: "Implement RRBadge in frontend/src/lib/components/trade/"
Task: "Implement TradeForm in frontend/src/lib/components/trade/"
Task: "Implement ImageAttachment in frontend/src/lib/components/trade/"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (profile setup)
4. Complete Phase 4: User Story 2 (trade entry + R:R)
5. **STOP and VALIDATE**: Profile creation → trade entry → R:R display → P&L on close
6. This is a usable trading journal with a single "Default" account

### Incremental Delivery

1. Setup + Foundation → Skeleton ready
2. US1 + US2 → MVP trading journal (single account, trade entry, R:R)
3. US3 → Multi-account support
4. US4 → Calendar P&L visualization
5. US5 → Ticker search enhancement
6. Export/Import → Data portability between devices
7. Polish → Production ready for all platforms

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Constitution requires ≥80% test coverage — include tests with each implementation task
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are relative to repository root
