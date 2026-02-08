# Exchange Rates - Server Implementation Spec

**Last Updated:** February 8, 2026

## Overview

The Exchange Rates feature provides daily-updated foreign exchange rates used throughout the application for multi-currency support. Rates are fetched from an external API (ExchangeRate.host), stored in Supabase/Postgres, and consumed by various features to convert amounts between currencies.

All rates use **USD as the base/source currency**. When a direct conversion rate isn't available, the system uses USD as a bridge currency (convert source -> USD -> target).

## Database Schema

### Table: `exchange_rates`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | Primary key, auto-generated |
| `updated_at` | timestamptz | `now()` | Last update timestamp |
| `source` | text | `'USD'` | Source currency code (e.g., `USD`) |
| `target` | text | `''` | Target currency code (e.g., `EUR`, `GBP`, `CAD`) |
| `rate` | double precision | *(required)* | Exchange rate multiplier (e.g., `0.85` for USD->EUR) |

### SQL Definition

```sql
CREATE TABLE public.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    source text DEFAULT 'USD' NOT NULL,
    target text DEFAULT '' NOT NULL,
    rate double precision NOT NULL,
    CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);
```

### Row Level Security

- RLS is **enabled** on the table
- Policy: `Allow read access for all users` — allows `SELECT` for all roles (including anonymous)
- Grants: `SELECT` for `anon` and `authenticated`, `ALL` for `service_role`

```sql
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all users"
    ON public.exchange_rates
    FOR SELECT
    TO public
    USING (true);

GRANT SELECT ON TABLE public.exchange_rates TO anon;
GRANT SELECT ON TABLE public.exchange_rates TO authenticated;
GRANT ALL ON TABLE public.exchange_rates TO service_role;
```

### TypeScript Types (auto-generated)

```typescript
exchange_rates: {
  Row: {
    id: string;
    rate: number;
    source: string;
    target: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    rate: number;
    source?: string;
    target?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    rate?: number;
    source?: string;
    target?: string;
    updated_at?: string;
  };
  Relationships: [];
};
```

## External API Integration

### Provider: ExchangeRate.host

**Location:** `src/utils/exchange-rate.ts`

| Detail | Value |
|--------|-------|
| Endpoint | `https://api.exchangerate.host/live` |
| Auth | `access_key` query parameter |
| Env Variable | `EXCHANGE_RATE_API_KEY` |
| Response Format | `{ quotes: { "USDEUR": 0.85, "USDGBP": 0.75, ... } }` |

The response keys are concatenated currency pairs (e.g., `USDEUR`). The utility function parses these into `{ source: "USD", target: "EUR", rate: 0.85 }` objects.

```typescript
// src/utils/exchange-rate.ts
export const fetchExchangeRates = async () => {
  const response = await fetch(
    `https://api.exchangerate.host/live?access_key=${process.env.EXCHANGE_RATE_API_KEY}`
  );
  const data = await response.json();
  const quotes = data.quotes as Record<string, number>;
  return Object.entries(quotes).map(([key, rate]) => ({
    source: key.slice(0, 3),
    target: key.slice(3),
    rate,
  }));
};
```

## Cron Job

### Vercel Cron: Daily Exchange Rate Sync

**Location:** `packages/web/app/api/cron/exchange-rates/route.ts`

| Detail | Value |
|--------|-------|
| Path | `/api/cron/exchange-rates` |
| Schedule | `0 0 * * *` (daily at midnight UTC) |
| Method | `GET` |
| Auth | `Bearer ${CRON_SECRET}` header |
| Configured In | `packages/web/vercel.json` |

#### Vercel Cron Config

```json
{
  "crons": [
    {
      "path": "/api/cron/exchange-rates",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Cron Logic

1. Verify the `Authorization` header matches `Bearer ${CRON_SECRET}`
2. Fetch existing rates from the database (using admin client)
3. Fetch new rates from ExchangeRate.host API
4. **If no existing rates:** insert all new rates directly
5. **If existing rates:** map over existing records, updating the `rate` field from new data while preserving the existing `id` (important for upsert)
6. Upsert the updated rates to the database
7. Return a JSON response with `{ success, processedCount, totalRates, hasExistingRates }`

#### Error Handling

- Failed syncs return a 500 response with the error message
- The cron job does not retry on failure; it will run again at the next scheduled time

### Manual Sync Script

**Location:** `packages/server/scripts/syncExchangeRates.ts`

A standalone script that performs the same sync logic as the cron job. Can be run manually via:

```bash
bun packages/server/scripts/syncExchangeRates.ts
```

## API Endpoints (tRPC Router)

### Router: `exchangeRate`

**Location:** `src/views/exchange-rate/router.ts`

| Procedure | Type | Description |
|-----------|------|-------------|
| `getQuotesFromExchangeRatesQuery` | Query | Returns all exchange rates as a quotes lookup object |

### Procedure: `getQuotesFromExchangeRatesQuery`

**Location:** `src/views/exchange-rate/procedures/getQuotesFromExchangeRates.ts`

- **Input:** None
- **Output:** `Record<string, number>` — keys in `"SOURCE-TARGET"` format (e.g., `"USD-EUR"`), values are the rate
- **Auth:** Authenticated user (standard tRPC procedure)

## Models

### `getExchangeRates`

**Location:** `src/models/exchange-rate/get.ts`

```typescript
type Options = { admin?: boolean };
export const getExchangeRates = async (options?: Options) => { ... }
```

- Fetches all rows from the `exchange_rates` table
- Uses admin Supabase client when `admin: true` (bypasses RLS)
- Uses regular authenticated client otherwise

### `setExchangeRates`

**Location:** `src/models/exchange-rate/set.ts`

```typescript
type ExchangeRate = Database["public"]["Tables"]["exchange_rates"]["Insert"];
export const setExchangeRates = async (rates: ExchangeRate[]) => { ... }
```

- Upserts exchange rate records using the admin Supabase client
- Always runs with admin privileges (service role)

## Controllers

### `getQuotesFromExchangeRates`

**Location:** `src/controllers/exchange-rate/quotes.ts`

```typescript
export const getQuotesFromExchangeRates = cache(async (admin?: true) => {
  const exchangeRates = await getExchangeRates({ admin });
  const quotes = exchangeRates.reduce((acc, exchangeRate) => {
    acc[`${exchangeRate.source}-${exchangeRate.target}`] = exchangeRate.rate;
    return acc;
  }, {} as Record<string, number>);
  return quotes;
});
```

- Transforms database records into a lookup object: `{ "USD-EUR": 0.85, "USD-GBP": 0.75, ... }`
- Wrapped with React `cache()` for request-level deduplication (prevents multiple DB queries in the same server request)

## Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `EXCHANGE_RATE_API_KEY` | API key for ExchangeRate.host | `fetchExchangeRates()` utility |
| `CRON_SECRET` | Bearer token for authenticating Vercel cron requests | Cron route handler |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase client |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key | Supabase client |
| `SUPABASE_SECRET_KEY` | Supabase service role key (admin) | Supabase admin client |

## File Structure

```
packages/server/
├── src/
│   ├── database.types.ts              # Auto-generated Supabase types
│   ├── models/exchange-rate/
│   │   ├── get.ts                     # Read exchange rates from DB
│   │   └── set.ts                     # Upsert exchange rates to DB
│   ├── controllers/exchange-rate/
│   │   └── quotes.ts                  # Transform DB records → quotes lookup
│   ├── views/exchange-rate/
│   │   ├── router.ts                  # tRPC router definition
│   │   └── procedures/
│   │       └── getQuotesFromExchangeRates.ts  # tRPC query procedure
│   └── utils/
│       ├── supabase.ts                # Supabase client + admin client
│       └── exchange-rate.ts           # External API fetch utility
├── scripts/
│   └── syncExchangeRates.ts           # Manual sync script
├── supabase/
│   ├── config.toml                    # Supabase local dev config
│   └── migrations/
│       ├── 20260208180646_create_exchange_rates.sql
│       └── 20260208182000_update_exchange_rates_rls.sql

packages/web/
├── app/
│   └── api/cron/exchange-rates/
│       └── route.ts                   # Vercel cron job endpoint
└── vercel.json                        # Cron schedule configuration
```

## Key Design Decisions

1. **Snake_case identifiers:** Table and column names use lowercase snake_case (`exchange_rates`, `source`, `target`) to avoid quoting issues and follow Postgres best practices.
2. **USD as base currency:** All rates are stored as USD-to-X. Cross-currency conversion uses USD as an intermediary bridge.
3. **Upsert with preserved IDs:** The cron job preserves existing record UUIDs when updating rates, ensuring stable row identifiers.
4. **Request-level caching:** `React.cache()` wraps the quotes controller to deduplicate DB calls within a single server request.
5. **Read-public, write-admin:** Exchange rates are readable by all users including anonymous (RLS policy allows public SELECT), but writes always go through the admin/service-role client.
6. **Quote format:** Rates are stored as individual rows in the DB but transformed into a flat `Record<string, number>` lookup (key: `"SOURCE-TARGET"`) for efficient consumption.
7. **Minimal grants:** Only `SELECT` is granted to `anon` and `authenticated`; `ALL` is granted only to `service_role`, following the principle of least privilege.
