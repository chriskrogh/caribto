# 04 — Order State Machine + DB Schema

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 02-WALLET_ADDRESS_MANAGEMENT, 03-SUMSUB_KYC_INTEGRATION

---

## Overview

The order is the central entity that ties together a user's purchase request, payment, compliance checks, and crypto payout. This spec defines the `orders` table, the state machine that governs an order's lifecycle, and the transitions triggered by external events (Stripe webhooks, Circle webhooks, risk checks).

The architecture doc describes the backend as the "metronome" that keeps three clocks (user, compliance, settlement) in rhythm. The order state machine is that metronome.

---

## Database Schema

### Table: `orders`

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | uuid | `gen_random_uuid()` | NO | Primary key |
| `created_at` | timestamptz | `now()` | NO | Order creation time |
| `updated_at` | timestamptz | `now()` | NO | Last state change |
| `user_id` | uuid | — | NO | References `profiles(id)` |
| `status` | text | `'created'` | NO | Current state (see state machine below) |
| `fiat_amount` | numeric(12,2) | — | NO | Amount in local fiat currency |
| `fiat_currency` | text | — | NO | ISO 4217 currency code (e.g., `TTD`, `BBD`, `JMD`) |
| `usd_amount` | numeric(12,2) | — | YES | Converted USD equivalent (set after payment) |
| `usdc_amount` | numeric(18,6) | — | YES | USDC amount to send (set during payout) |
| `exchange_rate` | numeric(18,8) | — | YES | FX rate used (fiat → USD) |
| `fee_amount` | numeric(12,2) | `0` | NO | Fee charged (USD) |
| `wallet_address` | text | — | NO | Destination wallet (snapshot at order time) |
| `stripe_checkout_session_id` | text | — | YES | Stripe checkout session ID |
| `stripe_payment_intent_id` | text | — | YES | Stripe payment intent ID |
| `circle_payout_id` | text | — | YES | Circle payout ID |
| `tx_hash` | text | — | YES | On-chain transaction hash |
| `country` | text | — | NO | User's country at order time |
| `kyc_applicant_id` | text | — | NO | Sumsub applicant ID at order time |
| `error_message` | text | — | YES | Error details if failed |
| `manual_hold` | boolean | `false` | NO | Admin manual hold flag |

### SQL Migration

```sql
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    status text DEFAULT 'created' NOT NULL
        CHECK (status IN (
            'created',
            'checkout_started',
            'payment_confirmed',
            'risk_review',
            'payout_initiated',
            'payout_confirmed',
            'complete',
            'failed',
            'cancelled',
            'held'
        )),
    fiat_amount numeric(12,2) NOT NULL,
    fiat_currency text NOT NULL,
    usd_amount numeric(12,2),
    usdc_amount numeric(18,6),
    exchange_rate numeric(18,8),
    fee_amount numeric(12,2) DEFAULT 0 NOT NULL,
    wallet_address text NOT NULL,
    stripe_checkout_session_id text,
    stripe_payment_intent_id text,
    circle_payout_id text,
    tx_hash text,
    country text NOT NULL,
    kyc_applicant_id text NOT NULL,
    error_message text,
    manual_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id)
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Only service role can insert/update (all mutations go through the server)
GRANT ALL ON TABLE public.orders TO service_role;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- Indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_stripe_checkout_session_id ON public.orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_circle_payout_id ON public.orders(circle_payout_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
```

### Key design decisions

- **Snapshot fields:** `wallet_address`, `country`, `kyc_applicant_id` are snapshots taken at order creation time. Even if the user later changes their wallet, the order retains the original destination for auditability.
- **Write-through-server:** Users can only read orders via RLS. All inserts and updates go through the service role (admin client) to enforce the state machine server-side.
- **Numeric types:** `fiat_amount` and `usd_amount` use `numeric(12,2)` for financial precision. `usdc_amount` uses `numeric(18,6)` to match USDC's 6-decimal precision.

---

## State Machine

### States

| State | Description |
|-------|-------------|
| `created` | Order created, awaiting checkout |
| `checkout_started` | Stripe checkout session created, user redirected |
| `payment_confirmed` | Stripe webhook confirmed payment success |
| `risk_review` | Automated risk checks running (limits, flags) |
| `payout_initiated` | Circle payout API called, awaiting confirmation |
| `payout_confirmed` | Circle confirmed payout, tx hash received |
| `complete` | Final state, visible in transaction history |
| `failed` | Terminal failure (payment failed, payout failed, etc.) |
| `cancelled` | User or system cancelled the order |
| `held` | Admin placed a manual hold |

### State transitions

```
created
  → checkout_started    (Stripe checkout session created)
  → cancelled           (user cancels, or session expires)

checkout_started
  → payment_confirmed   (Stripe webhook: checkout.session.completed)
  → failed              (Stripe webhook: payment failed)
  → cancelled           (checkout session expired)

payment_confirmed
  → risk_review         (automatic, immediate)

risk_review
  → payout_initiated    (all checks pass)
  → held                (admin hold flag or risk flag triggered)
  → failed              (limits exceeded, KYC no longer valid)

held
  → payout_initiated    (admin releases hold)
  → cancelled           (admin cancels)

payout_initiated
  → payout_confirmed    (Circle webhook: payout complete, tx hash received)
  → failed              (Circle webhook: payout failed, after retries exhausted)

payout_confirmed
  → complete            (automatic, immediate)
```

### Transition enforcement

All state transitions are enforced in a single server-side function:

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  created: ["checkout_started", "cancelled"],
  checkout_started: ["payment_confirmed", "failed", "cancelled"],
  payment_confirmed: ["risk_review"],
  risk_review: ["payout_initiated", "held", "failed"],
  held: ["payout_initiated", "cancelled"],
  payout_initiated: ["payout_confirmed", "failed"],
  payout_confirmed: ["complete"],
};

function assertValidTransition(from: string, to: string): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}
```

---

## Order Creation Flow

### API

```
protectedProcedure: order.create
  Input: {
    fiat_amount: z.number().positive().max(MAX_ORDER_AMOUNT),
    fiat_currency: z.enum(["TTD", "BBD", "JMD", "BSD", "XCD", "AWG", "XCG"]),
  }
  Output: { id, status, fiat_amount, fiat_currency, usd_amount }
```

### Logic

```
1. Verify user has KYC status = 'approved'
2. Verify user has a wallet address set
3. Verify user's country is supported
4. Look up current exchange rate for fiat_currency → USD
5. Calculate usd_amount = fiat_amount * exchange_rate
6. Apply fee calculation (if any)
7. Check daily/weekly limits (spec 07)
8. Snapshot wallet_address, country, kyc_applicant_id from user's profile
9. Insert order with status = 'created'
10. Return the order
```

### Pre-conditions enforced at creation

| Check | Failure |
|-------|---------|
| KYC not approved | 400: "KYC verification required" |
| No wallet address | 400: "Wallet address required" |
| Country not supported | 400: "Country not supported" |
| Amount exceeds daily limit | 400: "Daily limit exceeded" |
| Amount exceeds weekly limit | 400: "Weekly limit exceeded" |

---

## Updated_at Trigger

Automatically update `updated_at` on every row change:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
```

---

## File Structure

```
packages/server/
├── src/
│   ├── models/order/
│   │   ├── create.ts                      # Insert new order
│   │   ├── get.ts                         # Get order(s) by ID / user
│   │   ├── transition.ts                  # State machine transition logic
│   │   └── update.ts                      # Update order fields
│   ├── controllers/order/
│   │   ├── create.ts                      # Order creation with validations
│   │   └── transition.ts                  # Orchestrate state transitions
│   └── views/order/
│       ├── router.ts                      # Order tRPC router
│       └── procedures/
│           ├── create.ts                  # Create order procedure
│           ├── get.ts                     # Get order by ID
│           └── list.ts                    # List user's orders
├── supabase/migrations/
│   └── YYYYMMDD_create_orders.sql
```

---

## Environment Variables

No new environment variables required. Fee configuration and limit thresholds will be defined in spec 07.

---

## Open Questions

1. Should we calculate and lock the exchange rate at order creation or at payment confirmation? (Locking at creation is simpler but exposes us to rate volatility during checkout.)
2. What is the fee structure? Flat fee, percentage, or tiered? This affects the order creation calculation.
3. Should cancelled/failed orders be soft-deleted or retained for audit purposes? (Recommend: retain for audit.)
4. How long should a Stripe checkout session remain valid before auto-cancelling the order? (Recommend: 30 minutes.)
