# Feature Specification: Trading Journal Application

**Feature Branch**: `001-trading-journal`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Build an application that will be used as a
Trading Journal. The app will track the trading progress of the trader.
I will have a calendar display that tracks daily, monthly and yearly
progress based on P&L (exact amount, percentage, etc.). The app should
register a user, and that user can add multiple trading accounts/portfolio.
The application should also be able to display the tickers. As for the user
input for trading position, for now the users should be able to input the
date, ticker/pair, entry, stop loss, take profit. The app should have the
ability to calculate the Risk-to-reward ratio. I will add more features as
we progress."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration & Authentication (Priority: P1)

A new trader opens the installed application for the first time and
creates a local profile with a display name and optional password to
protect their data. Once set up, they can access their personal trading
journal. If a password is set, the app requires it on launch. The
trader can update their profile settings and change or remove their
password at any time.

**Why this priority**: Without a local profile, the app has no context
for storing preferences, accounts, or trades. This is the foundational
gate for all other features.

**Independent Test**: Can be fully tested by launching the app for the
first time, creating a profile, closing and reopening the app (data
persists), and verifying password protection works if enabled.

**Acceptance Scenarios**:

1. **Given** a first-time user opening the app, **When** they complete
   the setup flow with a display name, **Then** a local profile is
   created with a "Default" trading account and they see their
   dashboard ready for trade entry.
2. **Given** a user who set a password during setup, **When** they
   reopen the app, **Then** they are prompted for their password before
   accessing the dashboard.
3. **Given** a user who did not set a password, **When** they reopen the
   app, **Then** they go directly to their dashboard.
4. **Given** an existing user, **When** they navigate to profile
   settings, **Then** they can update their display name, timezone, and
   add/change/remove their password.
5. **Given** a user who forgot their local password, **When** they
   attempt recovery, **Then** they can reset via a security question or
   by clearing app data (with a warning that all local data will be
   lost if no export exists).

---

### User Story 2 - Trade Position Entry & Risk-Reward Calculation (Priority: P2)

A trader logs into their journal and records a new trade position. They
enter the date, ticker or pair, entry price, stop loss, and take profit.
The system automatically calculates the Risk-to-Reward (R:R) ratio based
on the distance between entry and stop loss (risk) versus entry and take
profit (reward). The trader can also record the position size, actual
exit price, and trade outcome to enable P&L tracking. Each trade
supports free-text notes for capturing rationale, lessons learned, and
emotions, plus the ability to attach screenshots or chart images.
Previously entered trades are listed and can be edited or deleted.

**Why this priority**: Trade entry is the core value proposition of a
trading journal. Without the ability to record trades, no other feature
(calendar, P&L, analytics) has data to work with.

**Independent Test**: Can be fully tested by adding a trade with all
required fields, verifying the R:R calculation is correct, editing the
trade, and deleting it. Delivers the fundamental journaling capability.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the trade entry form, **When** they
   submit a trade with date, ticker (e.g., AAPL), entry price ($150.00),
   stop loss ($145.00), and take profit ($165.00), **Then** the trade is
   saved and the R:R ratio is displayed as 1:3.
2. **Given** a trade with entry at 1.1000, stop loss at 1.0950, and take
   profit at 1.1200, **When** the system calculates R:R, **Then** the
   ratio is displayed as 1:4.
3. **Given** an authenticated user viewing their trade list, **When** they
   click edit on an existing trade, **Then** they can modify any field
   and the R:R ratio recalculates on save.
4. **Given** an authenticated user viewing their trade list, **When** they
   delete a trade, **Then** the trade is removed and no longer appears in
   the list or P&L calculations.
5. **Given** a user entering a trade, **When** the stop loss is set
   beyond the entry price in the wrong direction (e.g., stop loss above
   entry for a long position), **Then** the system warns the user of a
   potentially incorrect stop loss placement.
6. **Given** a completed trade, **When** the user records the actual exit
   price and marks the trade as closed, **Then** the system calculates
   the realized P&L in both absolute amount and percentage.

---

### User Story 3 - Trading Account & Portfolio Management (Priority: P3)

A trader manages multiple trading accounts (e.g., a stocks brokerage
account and a forex account). They can create, rename, and delete
portfolios from their dashboard. Each trade entry is associated with a
specific account. The trader can switch between accounts to view trades
and performance specific to each one, or view an aggregate across all
accounts.

**Why this priority**: Multiple accounts allow traders to organize their
activity by broker, strategy, or asset class. This adds structure to the
journal but depends on trade entry (P2) existing first.

**Independent Test**: Can be fully tested by creating two accounts, adding
trades to each, switching between account views, verifying trades appear
only under the correct account, and viewing the aggregate view.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the dashboard, **When** they create
   a new trading account named "Forex - OANDA", **Then** the account
   appears in their account list and can be selected.
2. **Given** a user with multiple accounts, **When** they select a
   specific account, **Then** only trades belonging to that account are
   displayed.
3. **Given** a user with multiple accounts, **When** they select "All
   Accounts" view, **Then** trades from all accounts are displayed with
   an account label on each trade.
4. **Given** a user with an account that has no trades, **When** they
   delete that account, **Then** the account is removed from the list.
5. **Given** a user with an account that has existing trades, **When**
   they attempt to delete that account, **Then** they are warned that
   all associated trades will also be deleted and must confirm.

---

### User Story 4 - Calendar P&L Dashboard (Priority: P4)

A trader views a calendar-based dashboard that visualizes their trading
performance over time. The calendar displays daily P&L (profit and loss)
with color coding — green for profitable days and red for losing days.
The trader can toggle between daily, monthly, and yearly views. Each
view shows both the exact P&L amount and the percentage return. Monthly
and yearly views aggregate the daily results.

**Why this priority**: The calendar view is a high-value visualization
feature but depends on having trade data (P2) and ideally account
structure (P3) to be meaningful.

**Independent Test**: Can be fully tested by adding several trades across
different dates, navigating the calendar in daily/monthly/yearly views,
and verifying P&L amounts and percentages match manual calculations.

**Acceptance Scenarios**:

1. **Given** a user with trades recorded on multiple dates, **When** they
   view the monthly calendar, **Then** each day shows the net P&L amount
   and is color-coded green (profit) or red (loss).
2. **Given** a user viewing the monthly calendar, **When** they click on
   a specific day, **Then** they see a breakdown of all trades closed on
   that day with individual P&L per trade.
3. **Given** a user viewing the yearly calendar, **When** they view a
   specific year, **Then** each month displays the aggregated P&L amount
   and percentage for that month.
4. **Given** a user with multiple trading accounts, **When** they filter
   the calendar by a specific account, **Then** the P&L reflects only
   trades from that account.
5. **Given** a day with no closed trades, **When** displayed on the
   calendar, **Then** it appears neutral (no color, $0.00 / 0.00%).

---

### User Story 5 - Ticker Display & Selection (Priority: P5)

When entering a trade, the trader can search for and select ticker
symbols or currency pairs from a searchable list. The system maintains
a catalog of common tickers (stocks, forex pairs, crypto pairs) that the
trader can browse and search by name or symbol. Previously used tickers
appear as recent suggestions for faster entry.

**Why this priority**: Ticker display enhances the trade entry experience
with validated symbols and faster input but is not essential for core
journal functionality.

**Independent Test**: Can be fully tested by searching for a ticker by
name, selecting it, verifying it populates the trade entry form, and
checking that recent tickers appear on subsequent trade entries.

**Acceptance Scenarios**:

1. **Given** a user on the trade entry form, **When** they begin typing
   in the ticker field (e.g., "AA"), **Then** a dropdown shows matching
   tickers (AAPL, AAL, etc.) filtered in real time.
2. **Given** a user searching for "Euro", **When** results load, **Then**
   EUR/USD and other EUR pairs appear with their full names.
3. **Given** a user who has previously traded AAPL and TSLA, **When**
   they open the ticker field on a new trade, **Then** AAPL and TSLA
   appear as recent suggestions before they type.
4. **Given** a user entering a ticker not in the catalog, **When** they
   type a custom symbol (e.g., a niche crypto pair), **Then** they can
   still submit it as a free-text entry.

---

### Edge Cases

- What happens when a user enters a stop loss equal to the entry price?
  The R:R ratio is undefined (division by zero) — the system MUST display
  a clear message that risk cannot be zero.
- What happens when a user enters a take profit equal to the entry price?
  The reward is zero — the system MUST display the R:R as 1:0.
- What happens when a user closes a trade at exactly the entry price?
  P&L is $0.00 / 0.00% — the day should show neutral on the calendar.
- How does the calendar handle timezone differences? All dates MUST be
  based on the user's configured timezone.
- What happens when a user has trades in different currencies across
  accounts? P&L aggregation in the "All Accounts" view MUST display
  amounts in each account's native currency with no automatic conversion
  (currency conversion is out of scope for this version).
- What happens when a user enters a negative price? The system MUST
  reject negative values for entry, stop loss, and take profit fields.
- What happens when a user imports a file from a newer app version? The
  system MUST detect the version mismatch and display a message asking
  the user to update the app before importing.
- What happens when a user imports a file that is corrupted or invalid?
  The system MUST reject the file with a clear error message and leave
  existing data untouched.
- What happens when a user deletes a trade that has attached images?
  The images MUST be deleted from local storage along with the trade.
- What happens when local storage is running low? The system MUST warn
  the user before image attachment if available storage is critically
  low.

## Requirements *(mandatory)*

### Functional Requirements

**User Management**

- **FR-001**: System MUST allow users to create a local profile with a
  display name and optional password on first launch.
- **FR-002**: If a password is set, the system MUST require it on every
  app launch before granting access to data.
- **FR-003**: System MUST allow users to update their display name,
  timezone, and password from profile settings.
- **FR-004**: If a password is set, the system MUST enforce minimum
  strength requirements (minimum 8 characters, at least one uppercase
  letter, one number, and one special character).

**Trading Accounts**

- **FR-005**: The system MUST auto-create a "Default" trading account
  during initial profile setup. Users MUST be able to rename this
  account and create additional accounts/portfolios with custom names.
- **FR-006**: Users MUST be able to rename and delete trading accounts.
- **FR-007**: Deleting an account with existing trades MUST require
  explicit user confirmation.
- **FR-008**: System MUST support an "All Accounts" aggregate view.

**Trade Position Entry**

- **FR-009**: Users MUST be able to create a trade position with the
  following fields: date, ticker/pair, entry price, stop loss price,
  take profit price.
- **FR-010**: Users MUST be able to optionally record: position size
  (quantity/lots), trade direction (long/short), actual exit price,
  and trade status (open/closed).
- **FR-010a**: Users MUST be able to add free-text notes to a trade
  for capturing rationale, lessons learned, and observations.
- **FR-010b**: Users MUST be able to attach one or more screenshots or
  chart images to a trade. Images MUST be stored locally on-device.
- **FR-010c**: On mobile, the system MUST allow attaching images from
  the device camera or photo library. On desktop/web, the system MUST
  allow attaching images via file picker or clipboard paste.
- **FR-011**: Users MUST be able to edit and delete existing trade
  positions, including their notes and attached images.
- **FR-012**: Each trade MUST be associated with exactly one trading
  account.

**Risk-to-Reward Calculation**

- **FR-013**: System MUST automatically calculate the Risk-to-Reward
  ratio as: R:R = 1 : (|take profit - entry| / |entry - stop loss|).
- **FR-014**: R:R MUST update in real time as the user modifies entry,
  stop loss, or take profit values.
- **FR-015**: System MUST handle edge cases: zero risk (stop loss =
  entry) by displaying an error, and zero reward (take profit = entry)
  by displaying 1:0.

**P&L Tracking**

- **FR-016**: System MUST calculate realized P&L for closed trades as:
  (exit price - entry price) x position size for long trades, and
  (entry price - exit price) x position size for short trades.
- **FR-017**: System MUST calculate P&L percentage as: (P&L amount /
  (entry price x position size)) x 100.
- **FR-018**: System MUST aggregate daily P&L as the sum of all closed
  trades on that date.

**Calendar Dashboard**

- **FR-019**: System MUST display a calendar view with daily P&L amounts
  and percentages.
- **FR-020**: System MUST color-code calendar days: green for net
  profitable days, red for net losing days, neutral for zero or no
  trades.
- **FR-021**: System MUST provide monthly and yearly aggregate views
  showing total P&L amount and percentage per period.
- **FR-022**: System MUST allow filtering calendar by specific trading
  account or all accounts.
- **FR-023**: Clicking a calendar day MUST show a breakdown of
  individual trades closed on that day.

**Ticker Display**

- **FR-024**: System MUST provide a searchable ticker catalog for stocks,
  forex pairs, and cryptocurrency pairs.
- **FR-025**: Ticker search MUST filter results in real time as the user
  types.
- **FR-026**: System MUST display recently used tickers as suggestions.
- **FR-027**: Users MUST be able to enter custom ticker symbols not in
  the catalog.

**Platform & Multi-Device**

- **FR-028**: The application MUST be available as an installable app
  on web (desktop), iOS, and Android.
- **FR-029**: All features (trade entry, calendar dashboard, account
  management, ticker search) MUST be available on all three platforms
  with equivalent functionality.
- **FR-030**: The application MUST operate fully offline. All data MUST
  be stored locally on the device. No internet connection is required
  for any core functionality.
- **FR-031**: The user interface MUST follow platform-appropriate design
  conventions (e.g., native navigation patterns on iOS and Android)
  while maintaining visual consistency in branding and data presentation.

**Data Export & Import**

- **FR-032**: Users MUST be able to export all their data (profile,
  accounts, trades, notes, and attached images) in JSON format for
  full backup and restore. Images MUST be embedded or bundled with
  the export file.
- **FR-033**: Users MUST be able to export trade data in CSV format
  for spreadsheet analysis. CSV export MUST include all trade fields
  with account name as a column.
- **FR-034**: Users MUST be able to import a previously exported JSON
  file on any device running the application, restoring all accounts
  and trades.
- **FR-035**: On import, the system MUST warn the user if the import
  will overwrite existing local data and require confirmation.
- **FR-036**: Export files MUST include a version identifier so the
  system can handle format changes in future versions.
- **FR-037**: Export files MUST preserve `createdAt` and `updatedAt`
  timestamps on all entities to support future cloud sync
  (last-write-wins conflict resolution).

### Key Entities

- **User**: Represents the local trader profile. Has display name,
  optional password (hashed), timezone preference. Owns zero or more
  Trading Accounts.
- **Trading Account**: Represents a brokerage account or portfolio.
  Has name, optional description, currency label. Belongs to one User.
  Contains zero or more Trade Positions.
- **Trade Position**: Represents a single trade entry. Has date,
  ticker/pair, direction (long/short), entry price, stop loss, take
  profit, position size, exit price (optional), status (open/closed),
  calculated R:R ratio, calculated P&L (when closed), free-text notes
  (optional), attached images (zero or more). Belongs to one Trading
  Account.
- **Ticker**: Represents a tradeable instrument. Has symbol, full name,
  asset class (stock/forex/crypto). Used for search and auto-complete
  during trade entry.

## Assumptions

- **Application model**: Standalone, installable, offline-first
  application with single-user per device. All data is stored locally
  on-device. No cloud backend or server is required for the current
  version. Data portability between devices is handled via explicit
  export/import. **Future plan**: Cloud-based database where users can
  save data to an online server and load it on any device; current
  architecture should anticipate this (e.g., DataService abstraction).
  Conflict resolution strategy: last-write-wins.
- **Authentication method**: Optional local password protection (not
  server-based). No email, OAuth, or cloud authentication.
- **Position sizing**: Users input position size (number of shares, lots,
  or contracts) to enable dollar P&L calculation. If position size is
  omitted, only pip/point movement and R:R ratio are displayed.
- **Trade direction**: System supports both long and short positions. If
  not specified, the system infers direction from the relative position
  of entry vs. stop loss (entry > stop loss = long, entry < stop loss
  = short).
- **Currency handling**: Each trading account operates in a single
  currency. Cross-account currency conversion is out of scope.
- **Ticker catalog**: Seeded with common US stocks, major forex pairs,
  and top cryptocurrency pairs. Users can add custom symbols. Live
  price feeds are out of scope.
- **Timezone**: All trade dates are stored in the user's configured
  timezone. Default timezone is UTC until the user sets a preference.
- **Multi-platform**: The application targets web (modern browsers),
  iOS, and Android with full feature parity. All features — trade
  entry, calendar dashboard, account management, and ticker search —
  MUST be available on all platforms with a consistent user experience.
  Architecture: hybrid backend — Payload CMS with PostgreSQL for web,
  SQLite via Capacitor for mobile. Shared frontend codebase with
  DataService abstraction (PayloadAdapter / SQLiteAdapter).

## Clarifications

### Session 2026-02-28

- Q: Should the mobile app (iOS/Android) have full feature parity with the web version, or a reduced feature set? → A: Full parity — all features on all platforms.
- Q: Should the app work offline, require cloud sync, or be read-only offline? → A: Standalone installable app, fully offline. Data portability via export/import (no cloud sync).
- Q: What export format should be used for data portability? → A: Both JSON (full backup/restore) and CSV (spreadsheet analysis).
- Q: Should trades support notes and annotations beyond numerical data? → A: Rich notes — free-text notes plus screenshot/chart image attachments per trade.
- Q: Should a default trading account be auto-created, or must the user create one first? → A: Auto-create a "Default" account on setup so users can trade immediately.

### Session 2026-03-01

- Q: Should the app support multiple users on a single device? → A: No — single-user per device. Future plan: cloud-based database where users can save data to an online server and load it on any device (cloud sync is out of scope for the current version but should be architecturally anticipated).
- Q: Should the app add email/password registration now to prepare for future cloud sync? → A: No — keep local-only password model. Rely on existing DataService abstraction layer to plug in a cloud adapter later without changing the rest of the app.
- Q: When cloud sync is added, how should conflicts be handled if data is edited on two devices? → A: Last-write-wins — most recent edit overwrites older data. Simple, predictable, no complex merge logic.
- Q: Should all entities track `updatedAt` timestamps to support future last-write-wins sync? → A: Yes — ensure `updatedAt` is tracked on all entities (already present via Payload CMS) and preserved through export/import.
- Q: Should mobile apps use the same Payload CMS backend or a local database? → A: Hybrid — Payload CMS for web, SQLite for mobile via Capacitor. Current DataService abstraction (PayloadAdapter + SQLiteAdapter) already supports this.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete registration and first trade entry in
  under 3 minutes.
- **SC-002**: Risk-to-Reward ratio displays correctly for 100% of valid
  trade inputs as verified by automated tests.
- **SC-003**: Calendar P&L totals match the sum of individual closed
  trade P&L values with zero discrepancy.
- **SC-004**: Users can navigate between daily, monthly, and yearly
  calendar views in under 1 second per transition.
- **SC-005**: Ticker search returns matching results within 500ms of
  user input.
- **SC-006**: The system supports at least 10 trading accounts per user
  and at least 10,000 trade positions per account without performance
  degradation.
- **SC-007**: 90% of users can add a trade position without consulting
  help documentation on their first attempt.
- **SC-008**: All P&L calculations (daily, monthly, yearly aggregates)
  are accurate to two decimal places.
