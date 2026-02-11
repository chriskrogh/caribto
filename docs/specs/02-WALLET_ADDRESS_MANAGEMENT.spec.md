# 02 — Wallet Address Management

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES

---

## Overview

Allow authenticated users to submit and manage a single Base-compatible wallet address. This address is the destination for all USDC payouts. The MVP enforces one wallet per user. Addresses are validated as valid EVM addresses before storage.

---

## Database Schema

### Table: `wallets`

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | uuid | `gen_random_uuid()` | NO | Primary key |
| `created_at` | timestamptz | `now()` | NO | When the wallet was added |
| `updated_at` | timestamptz | `now()` | NO | Last update timestamp |
| `user_id` | uuid | — | NO | References `profiles(id)`, unique constraint |
| `address` | text | — | NO | EVM wallet address (0x-prefixed, 42 chars) |
| `is_verified` | boolean | `false` | NO | Reserved for future address verification |

### SQL Migration

```sql
CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    address text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT wallets_pkey PRIMARY KEY (id),
    CONSTRAINT wallets_user_id_key UNIQUE (user_id),
    CONSTRAINT wallets_address_check CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own wallet
CREATE POLICY "Users can insert own wallet"
    ON public.wallets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet"
    ON public.wallets FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role has full access
GRANT ALL ON TABLE public.wallets TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.wallets TO authenticated;
```

### Key constraints

- **`UNIQUE (user_id)`** — enforces one wallet per user (MVP requirement from PRD 5.4)
- **`CHECK` on address** — ensures the address matches a valid EVM hex format (0x + 40 hex chars)

---

## Address Validation

### Server-side validation (Zod)

```typescript
import { z } from "zod";

export const evmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address")
  .transform((addr) => addr.toLowerCase()); // normalize to lowercase
```

### Validation rules

1. Must start with `0x`
2. Must be exactly 42 characters long
3. Must contain only hexadecimal characters after the prefix
4. Stored in lowercase (normalized)
5. Cannot be the zero address (`0x0000000000000000000000000000000000000000`)

### Client-side validation

The native app should perform the same regex check before submitting to provide instant feedback. Use a shared validation utility in `packages/shared`.

---

## API Endpoints (tRPC)

### Router: `wallet`

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `get` | Query | `protectedProcedure` | Get the user's wallet |
| `set` | Mutation | `protectedProcedure` | Create or update the user's wallet address |

### Procedure: `wallet.get`

```
Input: none
Output: { id, address, is_verified, created_at } | null
Logic:
  1. Query wallets table where user_id = ctx.user.id
  2. Return the wallet or null if not set
```

### Procedure: `wallet.set`

```
Input: { address: evmAddressSchema }
Output: { id, address }
Logic:
  1. Validate address format via Zod schema
  2. Reject the zero address
  3. Upsert into wallets table (insert if no existing, update if exists)
  4. Return the wallet record
```

### Wallet update restrictions (future consideration)

In the MVP, users can update their wallet address freely. Post-MVP, consider:
- Requiring re-verification after address change
- Cooling-off period after address change before next payout
- Admin notification on address change

---

## Native App UI

There is no separate onboarding wallet screen. Wallet management lives in **Settings**, and the user is prompted to set a wallet address before their first checkout if they haven't already.

### Settings wallet section

Visible in the **Settings tab** for authenticated users. Part of the settings screen, not a separate route.

- If no wallet set: "Add wallet address" input field with CTA
- If wallet set: shows the current address (truncated: `0x1234...abcd`) with a "Change" button
- Text input for the wallet address
- Paste button for clipboard convenience
- Real-time validation feedback (green check / red error)
- "What is a wallet address?" expandable helper text
- Submit button calls `wallet.set` mutation

### Pre-checkout wallet gate

When a user taps "Buy" on the Home tab and has no wallet address set, the app presents a **bottom sheet or modal** prompting them to enter their wallet address before proceeding to checkout. This is the same UI as the Settings wallet input, but contextual to the purchase flow.

```
User taps "Buy" →
  Has wallet? → Create order → Stripe checkout
  No wallet? → Show wallet input sheet → On success → Create order → Stripe checkout
```

---

## Integration with Circle Address Book

When a wallet address is set or updated, it will need to be registered in Circle's Address Book (spec 06). This does **not** happen at wallet submission time in the MVP — it happens during payout initiation. The wallet table is purely our internal record.

---

## File Structure

```
packages/server/
├── src/
│   ├── models/wallet/
│   │   ├── get.ts                          # Get wallet by user ID
│   │   └── set.ts                          # Upsert wallet address
│   └── views/wallet/
│       ├── router.ts                       # Wallet tRPC router
│       └── procedures/
│           ├── get.ts                      # Get wallet query
│           └── set.ts                      # Set wallet mutation
├── supabase/migrations/
│   └── YYYYMMDD_create_wallets.sql

packages/shared/
├── src/
│   └── validation/
│       └── wallet.ts                       # Shared EVM address schema

packages/native/
├── app/(tabs)/
│   └── settings.tsx                        # Settings tab (includes wallet section)
├── lib/
│   └── components/
│       ├── WalletInput.tsx                 # Reusable wallet input component
│       └── WalletSheet.tsx                 # Bottom sheet for pre-checkout wallet prompt
```

---

## Environment Variables

No new environment variables required.

---

## Open Questions

1. Should we allow users to change their wallet address after their first payout, or lock it?
2. Do we want to verify address ownership (e.g., sign a message) in the MVP, or defer?
3. Should we show the user which chain (Base) their address is on, or keep it implicit?
