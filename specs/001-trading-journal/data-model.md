# Data Model: Trading Journal Application

**Branch**: `001-trading-journal` | **Date**: 2026-02-28 | **Updated**: 2026-03-01

## Entity Relationship Diagram

```text
┌──────────────┐       ┌───────────────────┐       ┌───────────────────┐
│     User     │ 1───* │  TradingAccount   │ 1───* │  TradePosition    │
│              │       │                   │       │                   │
│ id           │       │ id                │       │ id                │
│ displayName  │       │ userId        (FK)│       │ accountId     (FK)│
│ passwordHash │       │ name              │       │ date              │
│ timezone     │       │ description       │       │ tickerSymbol      │
│ securityQ    │       │ currency          │       │ direction         │
│ securityA    │       │ createdAt         │       │ entryPrice        │
│ createdAt    │       │ updatedAt         │       │ stopLoss          │
│ updatedAt    │       │                   │       │ takeProfit        │
└──────────────┘       └───────────────────┘       │ positionSize      │
                                                   │ exitPrice         │
                                                   │ status            │
┌──────────────┐                                   │ rrRatio           │
│    Ticker    │                                   │ pnlAmount         │
│              │                                   │ pnlPercent        │
│ symbol       │ *·····1 (referenced by            │ notes             │
│ name         │        tickerSymbol)               │ createdAt         │
│ assetClass   │                                   │ updatedAt         │
│ exchange     │                                   └────────┬──────────┘
│ baseCurrency │                                            │ 1
│ quoteCurrency│                                            │
└──────────────┘                                            │ *
                                                   ┌────────┴──────────┐
                                                   │   TradeImage      │
                                                   │                   │
                                                   │ id                │
                                                   │ tradeId       (FK)│
                                                   │ fileName          │
                                                   │ mimeType          │
                                                   │ filePath          │
                                                   │ sortOrder         │
                                                   │ createdAt         │
                                                   └───────────────────┘
```

## Entity Definitions

### User

Represents the local trader profile. Single-user per device.

| Field        | Type     | Constraints                          |
|--------------|----------|--------------------------------------|
| id           | UUID     | Primary key, auto-generated          |
| displayName  | string   | Required, max 100 chars              |
| passwordHash | string   | Nullable (password is optional)      |
| timezone     | string   | Required, default "UTC", IANA format |
| securityQ    | string   | Nullable, max 200 chars              |
| securityA    | string   | Nullable, hashed                     |
| createdAt    | datetime | Auto-set on creation                 |
| updatedAt    | datetime | Auto-set on update                   |

**Validation rules**:
- If `passwordHash` is set, password MUST meet strength requirements
  (min 8 chars, 1 uppercase, 1 number, 1 special char) before hashing.
- `timezone` MUST be a valid IANA timezone string (e.g., "America/New_York").
- If `securityQ` is set, `securityA` MUST also be set (and vice versa).

**State transitions**: None (no lifecycle states).

### TradingAccount

Represents a brokerage account or portfolio grouping.

| Field           | Type     | Constraints                         |
|-----------------|----------|-------------------------------------|
| id              | UUID     | Primary key, auto-generated         |
| userId          | UUID     | Foreign key → User.id, required     |
| name            | string   | Required, max 100 chars             |
| description     | string   | Nullable, max 500 chars             |
| currency        | string   | Required, default "USD", max 10     |
| startingCapital | decimal  | Required, min 0, default 0          |
| createdAt       | datetime | Auto-set on creation                |
| updatedAt       | datetime | Auto-set on update                  |

**Validation rules**:
- `name` MUST be unique per user (no two accounts with the same name).
- `currency` MUST be a recognized currency code (e.g., "USD", "EUR",
  "BTC").
- `startingCapital` MUST be ≥ 0. Used for fund standing calculation
  and P&L % auto-calculation on trade entry.

**Uniqueness**: (userId, name) is unique.

**Cascade rules**: Deleting a TradingAccount deletes all associated
TradePositions and their TradeImages (with user confirmation at the
application layer).

### TradePosition

Represents a single trade entry with all associated data.

| Field        | Type     | Constraints                            |
|--------------|----------|----------------------------------------|
| id           | UUID     | Primary key, auto-generated            |
| accountId    | UUID     | Foreign key → TradingAccount.id, req.  |
| date         | date     | Required, trade execution date         |
| tickerSymbol | string   | Required, max 20 chars                 |
| direction    | enum     | "long" or "short", required            |
| entryPrice   | decimal  | Required, > 0, precision 10 scale 6    |
| stopLoss     | decimal  | Required, > 0, precision 10 scale 6    |
| takeProfit   | decimal  | Required, > 0, precision 10 scale 6    |
| positionSize | decimal  | Nullable, > 0, precision 15 scale 6    |
| exitPrice    | decimal  | Nullable, > 0, precision 10 scale 6    |
| status       | enum     | "open" or "closed", default "open"     |
| rrRatio      | decimal  | Computed, precision 8 scale 4          |
| pnlAmount    | decimal  | Computed when closed, precision 15 sc6 |
| pnlPercent   | decimal  | Computed when closed, precision 8 sc4  |
| notes        | text     | Nullable, free-text                    |
| createdAt    | datetime | Auto-set on creation                   |
| updatedAt    | datetime | Auto-set on update                     |

**Validation rules**:
- All price fields MUST be > 0.
- If `direction` is "long": `stopLoss` SHOULD be < `entryPrice` and
  `takeProfit` SHOULD be > `entryPrice`. Warn if violated (soft check).
- If `direction` is "short": `stopLoss` SHOULD be > `entryPrice` and
  `takeProfit` SHOULD be < `entryPrice`. Warn if violated (soft check).
- `stopLoss` MUST NOT equal `entryPrice` (division by zero in R:R).
- `status` can only transition from "open" → "closed" (not reversed).
- When `status` = "closed", `exitPrice` MUST be set.

**Computed fields**:
- `rrRatio` = |takeProfit - entryPrice| / |entryPrice - stopLoss|
- `pnlAmount` (long) = (exitPrice - entryPrice) * positionSize
- `pnlAmount` (short) = (entryPrice - exitPrice) * positionSize
- `pnlPercent` = (pnlAmount / (entryPrice * positionSize)) * 100

**Direction inference**: If not explicitly set by user, inferred as:
- `entryPrice` > `stopLoss` → "long"
- `entryPrice` < `stopLoss` → "short"

**Cascade rules**: Deleting a TradePosition deletes all associated
TradeImages (files removed from local storage).

### TradeImage

Represents a screenshot or chart image attached to a trade.

| Field     | Type     | Constraints                          |
|-----------|----------|--------------------------------------|
| id        | UUID     | Primary key, auto-generated          |
| tradeId   | UUID     | Foreign key → TradePosition.id, req. |
| fileName  | string   | Required, original filename          |
| mimeType  | string   | Required, e.g. "image/png"           |
| filePath  | string   | Required, local storage path         |
| sortOrder | integer  | Required, default 0                  |
| createdAt | datetime | Auto-set on creation                 |

**Validation rules**:
- `mimeType` MUST be one of: image/png, image/jpeg, image/webp,
  image/gif.
- `filePath` points to the image file in local storage (device
  filesystem on mobile, Payload media storage on web).

### Ticker

Represents a tradeable instrument in the search catalog. Read-only
reference data seeded from static JSON.

| Field         | Type   | Constraints                         |
|---------------|--------|-------------------------------------|
| symbol        | string | Primary key, unique, max 20 chars   |
| name          | string | Required, full instrument name      |
| assetClass    | enum   | "stock", "forex", "crypto"          |
| exchange      | string | Nullable, e.g. "NASDAQ", "NYSE"     |
| baseCurrency  | string | Nullable, for forex/crypto pairs    |
| quoteCurrency | string | Nullable, for forex/crypto pairs    |

**Notes**:
- This entity is pre-seeded and read-only. Users do not modify tickers.
- Custom ticker symbols entered by users are stored directly in
  TradePosition.tickerSymbol — they do not create new Ticker records.
- Recent tickers are derived by querying distinct tickerSymbol values
  from TradePosition, ordered by most recent trade date.

## Export Schema

### JSON Export Format

```json
{
  "version": "1.0.0",
  "exportedAt": "2026-02-28T12:00:00Z",
  "user": {
    "displayName": "string",
    "timezone": "string"
  },
  "accounts": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "currency": "string",
      "startingCapital": "number",
      "createdAt": "ISO 8601 datetime",
      "updatedAt": "ISO 8601 datetime",
      "trades": [
        {
          "id": "uuid",
          "date": "YYYY-MM-DD",
          "tickerSymbol": "string",
          "direction": "long | short",
          "entryPrice": "number",
          "stopLoss": "number",
          "takeProfit": "number",
          "positionSize": "number | null",
          "exitPrice": "number | null",
          "status": "open | closed",
          "rrRatio": "number",
          "pnlAmount": "number | null",
          "pnlPercent": "number | null",
          "notes": "string | null",
          "createdAt": "ISO 8601 datetime",
          "updatedAt": "ISO 8601 datetime",
          "images": [
            {
              "fileName": "string",
              "mimeType": "string",
              "data": "base64-encoded string",
              "createdAt": "ISO 8601 datetime"
            }
          ]
        }
      ]
    }
  ]
}
```

**Note on timestamps (FR-037)**: `createdAt` and `updatedAt` are preserved
in exports to support future cloud sync with last-write-wins conflict
resolution.

### CSV Export Format

One row per trade. Columns:

```
account_name, date, ticker, direction, entry_price, stop_loss,
take_profit, position_size, exit_price, status, rr_ratio,
pnl_amount, pnl_percent, notes
```

Images are not included in CSV exports.
