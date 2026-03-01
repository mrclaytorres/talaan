# Payload CMS Collection Contracts

**Branch**: `001-trading-journal` | **Date**: 2026-02-28 | **Updated**: 2026-03-01

These contracts define the Payload CMS collection configurations that
auto-generate the REST API endpoints for the backend.

## Collection: users

**Slug**: `users`
**Auth**: Disabled (local-only app, no server-side auth)
**API endpoint**: `/api/users`

| Field        | Type      | Required | Notes                      |
|--------------|-----------|----------|----------------------------|
| displayName  | text      | Yes      | max 100                    |
| passwordHash | text      | No       | Hashed locally before send |
| timezone     | text      | Yes      | Default "UTC"              |
| securityQ    | text      | No       | max 200                    |
| securityA    | text      | No       | Hashed                     |

**Access control**: All operations allowed (single-user local app).

**Endpoints**:
- `GET /api/users` — list (returns single user)
- `POST /api/users` — create profile on first launch
- `PATCH /api/users/{id}` — update profile settings

## Collection: trading-accounts

**Slug**: `trading-accounts`
**API endpoint**: `/api/trading-accounts`

| Field           | Type         | Required | Notes                 |
|-----------------|--------------|----------|-----------------------|
| user            | relationship | Yes      | → users collection    |
| name            | text         | Yes      | max 100               |
| description     | textarea     | No       | max 500               |
| currency        | text         | Yes      | Default "USD", max 10 |
| startingCapital | number       | Yes      | min 0, default 0      |

**Access control**: All operations allowed.
**Sort default**: `createdAt` ascending.

**Endpoints**:
- `GET /api/trading-accounts` — list all accounts
- `GET /api/trading-accounts?where[user][equals]={userId}` — by user
- `POST /api/trading-accounts` — create new account
- `PATCH /api/trading-accounts/{id}` — rename, update
- `DELETE /api/trading-accounts/{id}` — delete (cascade handled by app)

## Collection: trade-positions

**Slug**: `trade-positions`
**API endpoint**: `/api/trade-positions`

| Field        | Type         | Required | Notes                    |
|--------------|--------------|----------|--------------------------|
| account      | relationship | Yes      | → trading-accounts       |
| date         | date         | Yes      | Trade execution date     |
| tickerSymbol | text         | Yes      | max 20                   |
| direction    | select       | Yes      | Options: long, short     |
| entryPrice   | number       | Yes      | min 0 (exclusive)        |
| stopLoss     | number       | Yes      | min 0 (exclusive)        |
| takeProfit   | number       | Yes      | min 0 (exclusive)        |
| positionSize | number       | No       | min 0 (exclusive)        |
| exitPrice    | number       | No       | min 0 (exclusive)        |
| status       | select       | Yes      | Options: open, closed    |
| rrRatio      | number       | No       | Computed by frontend     |
| pnlAmount    | number       | No       | Computed when closed     |
| pnlPercent   | number       | No       | Computed when closed     |
| notes        | richText     | No       | Free-text trade notes    |

**Hooks**:
- `beforeChange`: Validate price relationships (warn on direction
  mismatch with SL/TP). Reject stopLoss == entryPrice.
- `beforeChange`: If status == "closed", require exitPrice.

**Access control**: All operations allowed.
**Sort default**: `date` descending.

**Query patterns**:
- By account: `?where[account][equals]={accountId}`
- By date range: `?where[date][greater_than_equal]=YYYY-MM-DD&where[date][less_than_equal]=YYYY-MM-DD`
- By status: `?where[status][equals]=open`
- Pagination: `?limit=50&page=1`

## Collection: trade-images

**Slug**: `trade-images`
**Upload**: Enabled (Payload's built-in file upload)
**API endpoint**: `/api/trade-images`

| Field     | Type         | Required | Notes                  |
|-----------|--------------|----------|------------------------|
| trade     | relationship | Yes      | → trade-positions      |
| sortOrder | number       | Yes      | Default 0              |

**Upload config**:
- `mimeTypes`: ["image/png", "image/jpeg", "image/webp", "image/gif"]
- `staticDir`: `./media/trade-images`
- `imageSizes`: Thumbnail (200x200), Medium (800x600)

**Access control**: All operations allowed.

**Endpoints**:
- `POST /api/trade-images` — upload with multipart form data
- `GET /api/trade-images?where[trade][equals]={tradeId}` — by trade
- `DELETE /api/trade-images/{id}` — delete (removes file from disk)

## Collection: tickers

**Slug**: `tickers`
**API endpoint**: `/api/tickers`

| Field         | Type   | Required | Notes                    |
|---------------|--------|----------|--------------------------|
| symbol        | text   | Yes      | Unique, max 20           |
| name          | text   | Yes      | Full instrument name     |
| assetClass    | select | Yes      | Options: stock, forex, crypto |
| exchange      | text   | No       | e.g., "NASDAQ"           |
| baseCurrency  | text   | No       | For forex/crypto pairs   |
| quoteCurrency | text   | No       | For forex/crypto pairs   |

**Access control**: Read-only for API consumers. Seeded via migration
script.

**Query patterns**:
- Search by symbol or name: `?where[or][0][symbol][contains]=AA&where[or][1][name][contains]=AA`
- Filter by asset class: `?where[assetClass][equals]=stock`
- Pagination: `?limit=20&page=1`

## Custom Endpoints

### Export (JSON)

**Path**: `GET /api/export/json`
**Response**: Full JSON export per schema in data-model.md.
Images are base64-encoded in the response. Content-Type:
`application/json`. Content-Disposition: attachment.

### Export (CSV)

**Path**: `GET /api/export/csv`
**Query params**: `?accountId={id}` (optional, defaults to all)
**Response**: CSV file with trade data. Content-Type: `text/csv`.
Content-Disposition: attachment.

### Import (JSON)

**Path**: `POST /api/import/json`
**Body**: JSON export file (multipart or raw JSON body).
**Behavior**: Validates version, prompts overwrite confirmation
(handled by frontend), replaces all data if confirmed.
**Response**: `{ success: true, imported: { accounts: N, trades: N } }`
