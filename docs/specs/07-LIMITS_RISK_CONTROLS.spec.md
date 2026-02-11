# 07 — Limits & Risk Controls

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 04-ORDER_STATE_MACHINE

---

## Overview

Implement per-user transaction limits and automated risk checks that gate the transition from `payment_confirmed` to `payout_initiated`. These controls are the "risk gate" described in the architecture doc — they sit between fiat intake and crypto payout to prevent abuse, enforce regulatory caps, and allow manual intervention.

From PRD 5.4:
- Daily per-user cap (low, configurable)
- Weekly rolling cap
- One wallet address per user (enforced in spec 02)
- Manual review toggle (admin-only)

---

## Database Schema

### Table: `limits_config`

A single-row configuration table for global limit settings. Managed by admins.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | text | `'global'` | NO | Primary key (always `'global'`) |
| `updated_at` | timestamptz | `now()` | NO | Last config update |
| `daily_limit_usd` | numeric(12,2) | `500.00` | NO | Per-user daily max in USD |
| `weekly_limit_usd` | numeric(12,2) | `2000.00` | NO | Per-user weekly max in USD |
| `min_order_usd` | numeric(12,2) | `10.00` | NO | Minimum order amount in USD |
| `max_order_usd` | numeric(12,2) | `500.00` | NO | Maximum single order amount in USD |
| `travel_rule_threshold_usd` | numeric(12,2) | `3000.00` | NO | Threshold for travel rule data |
| `require_manual_review` | boolean | `false` | NO | Global manual review toggle |

### SQL Migration

```sql
CREATE TABLE public.limits_config (
    id text DEFAULT 'global' NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    daily_limit_usd numeric(12,2) DEFAULT 500.00 NOT NULL,
    weekly_limit_usd numeric(12,2) DEFAULT 2000.00 NOT NULL,
    min_order_usd numeric(12,2) DEFAULT 10.00 NOT NULL,
    max_order_usd numeric(12,2) DEFAULT 500.00 NOT NULL,
    travel_rule_threshold_usd numeric(12,2) DEFAULT 3000.00 NOT NULL,
    require_manual_review boolean DEFAULT false NOT NULL,
    CONSTRAINT limits_config_pkey PRIMARY KEY (id)
);

-- Insert default config row
INSERT INTO public.limits_config (id) VALUES ('global');

ALTER TABLE public.limits_config ENABLE ROW LEVEL SECURITY;

-- Readable by all authenticated users (limits are displayed in UI)
CREATE POLICY "Allow read access for authenticated users"
    ON public.limits_config FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can update
GRANT ALL ON TABLE public.limits_config TO service_role;
GRANT SELECT ON TABLE public.limits_config TO authenticated;
```

---

## Risk Gate: Automated Checks

The risk gate runs automatically after `payment_confirmed` and determines whether the order proceeds to payout or is held/failed.

### Check sequence

```
1. KYC still valid?
   - Verify profile.kyc_status === 'approved'
   - If not: fail order ("KYC no longer valid")

2. Daily limit check
   - Sum all orders for this user in the last 24 hours where
     status IN ('payment_confirmed', 'risk_review', 'payout_initiated', 'payout_confirmed', 'complete')
   - If (running_total + current_order.usd_amount) > daily_limit_usd: fail

3. Weekly limit check
   - Same as above but rolling 7-day window
   - If (running_total + current_order.usd_amount) > weekly_limit_usd: fail

4. Single order limit
   - If order.usd_amount > max_order_usd: fail
   - If order.usd_amount < min_order_usd: fail

5. Manual hold check
   - If order.manual_hold === true: hold order
   - If limits_config.require_manual_review === true: hold order

6. All checks pass → proceed to payout
```

### Implementation

```typescript
type RiskCheckResult =
  | { pass: true }
  | { pass: false; reason: string; action: "fail" | "hold" };

async function runRiskChecks(order: Order): Promise<RiskCheckResult> {
  const config = await getLimitsConfig();
  const profile = await getProfile(order.user_id);

  // 1. KYC check
  if (profile.kyc_status !== "approved") {
    return { pass: false, reason: "KYC not approved", action: "fail" };
  }

  // 2. Daily limit
  const dailyTotal = await getUserOrderTotal(order.user_id, "24h");
  if (dailyTotal + order.usd_amount > config.daily_limit_usd) {
    return { pass: false, reason: "Daily limit exceeded", action: "fail" };
  }

  // 3. Weekly limit
  const weeklyTotal = await getUserOrderTotal(order.user_id, "7d");
  if (weeklyTotal + order.usd_amount > config.weekly_limit_usd) {
    return { pass: false, reason: "Weekly limit exceeded", action: "fail" };
  }

  // 4. Single order limits
  if (order.usd_amount > config.max_order_usd) {
    return { pass: false, reason: "Order exceeds maximum", action: "fail" };
  }
  if (order.usd_amount < config.min_order_usd) {
    return { pass: false, reason: "Order below minimum", action: "fail" };
  }

  // 5. Manual hold
  if (order.manual_hold || config.require_manual_review) {
    return { pass: false, reason: "Manual review required", action: "hold" };
  }

  return { pass: true };
}
```

### Helper: `getUserOrderTotal`

```sql
SELECT COALESCE(SUM(usd_amount), 0) as total
FROM public.orders
WHERE user_id = $1
  AND status IN ('payment_confirmed', 'risk_review', 'payout_initiated', 'payout_confirmed', 'complete')
  AND created_at >= now() - $2::interval;
```

---

## Limit Checks at Order Creation (Pre-flight)

Limits are checked at two points:

1. **At order creation** (pre-flight) — to prevent the user from starting a checkout they can't complete
2. **At risk gate** (post-payment) — the authoritative check before payout

The pre-flight check is advisory. The post-payment check is enforcing.

### Pre-flight API

```
protectedProcedure: limits.check
  Input: { usd_amount: z.number().positive() }
  Output: {
    allowed: boolean,
    daily_remaining: number,
    weekly_remaining: number,
    min_order: number,
    max_order: number,
    reason?: string
  }
```

This is called by the native app's purchase screen to show the user their available limits before they enter an amount.

---

## Admin: Manual Hold Toggle

### Per-order hold

Admins can place a hold on a specific order via the admin dashboard (spec 09):

```
adminProcedure: order.setHold
  Input: { orderId: z.string().uuid(), hold: z.boolean() }
  Output: { success: boolean }
  Logic:
    1. Set order.manual_hold = hold
    2. If hold === true and order is in 'risk_review': transition to 'held'
    3. If hold === false and order is in 'held': re-run risk checks → proceed
```

### Global review toggle

Admins can enable/disable global manual review for all orders:

```
adminProcedure: limits.setGlobalReview
  Input: { enabled: z.boolean() }
  Output: { success: boolean }
  Logic: Update limits_config.require_manual_review
```

When enabled, all orders are held at the risk gate for manual admin approval.

---

## User-facing Limit Display

The native app purchase screen should show:

- Current daily remaining limit (e.g., "$350 of $500 remaining today")
- Current weekly remaining limit
- Min/max per transaction
- These values come from the `limits.check` procedure

---

## File Structure

```
packages/server/
├── src/
│   ├── models/limits/
│   │   ├── getConfig.ts                   # Fetch limits_config
│   │   └── updateConfig.ts               # Update limits_config (admin)
│   ├── models/order/
│   │   └── getUserTotal.ts               # Sum user's orders in time window
│   ├── controllers/risk/
│   │   └── runChecks.ts                   # Risk gate check sequence
│   └── views/limits/
│       ├── router.ts                      # Limits tRPC router
│       └── procedures/
│           ├── check.ts                   # Pre-flight limit check (user)
│           ├── getConfig.ts               # Get current config (admin)
│           └── setGlobalReview.ts         # Toggle global review (admin)
├── supabase/migrations/
│   └── YYYYMMDD_create_limits_config.sql
```

---

## Environment Variables

No new environment variables. Limits are stored in the database and configurable via the admin dashboard.

---

## Open Questions

1. What are the initial daily/weekly limits? ($500/$2000 are placeholders. Should they be lower for MVP launch?)
2. Should limits be per-country or global? (Recommend: global for MVP, per-country post-MVP.)
3. When a payment is confirmed but risk checks fail (e.g., limit exceeded), do we refund via Stripe automatically, or handle manually?
4. Should we send push notifications when the user approaches their limit?
5. How are "held" orders communicated to the user? (Status screen or push notification?)
