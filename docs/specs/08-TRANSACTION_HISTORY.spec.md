# 08 — Transaction History (API + Native UI)

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 04-ORDER_STATE_MACHINE

---

## Overview

Provide users with a list of their completed (and in-progress) transactions, accessible from the native app's main screen. Each entry shows fiat amount, USDC amount, timestamp, status, and a clickable on-chain transaction hash linking to the Base block explorer.

From PRD 4.3:
- List of completed transactions
- Fiat amount
- USDC amount
- Timestamp
- Status
- Base transaction hash (clickable)

---

## API Endpoints (tRPC)

### Router: `order` (extends existing router from spec 04)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `order.list` | Query | `protectedProcedure` | Paginated list of user's orders |
| `order.get` | Query | `protectedProcedure` | Get a single order by ID |

### Procedure: `order.list`

```
Input: {
  cursor?: z.string().uuid(),     // For cursor-based pagination
  limit?: z.number().min(1).max(50).default(20),
  status?: z.enum([...all statuses]).optional()  // Optional filter
}
Output: {
  orders: Order[],
  nextCursor: string | null
}
```

### Logic

```
1. Query orders where user_id = ctx.user.id
2. Order by created_at DESC
3. If cursor provided, fetch orders created before that order's created_at
4. Limit to requested page size
5. Return orders + next cursor (last order's ID, or null if no more)
```

### SQL Query

```sql
SELECT
  id, created_at, status,
  fiat_amount, fiat_currency,
  usd_amount, usdc_amount,
  tx_hash, wallet_address,
  error_message
FROM public.orders
WHERE user_id = $1
  AND ($2::uuid IS NULL OR created_at < (SELECT created_at FROM orders WHERE id = $2))
ORDER BY created_at DESC
LIMIT $3;
```

### Procedure: `order.get`

```
Input: { id: z.string().uuid() }
Output: Order (full detail)
```

### Logic

```
1. Query order by ID
2. Verify order.user_id === ctx.user.id (RLS also enforces this)
3. Return full order object
```

---

## Order Response Shape

The API returns a sanitized order object (no internal fields like `circle_payout_id` or `stripe_payment_intent_id` to the client):

```typescript
type OrderResponse = {
  id: string;
  created_at: string;
  status: OrderStatus;
  fiat_amount: number;
  fiat_currency: string;
  usd_amount: number | null;
  usdc_amount: number | null;
  tx_hash: string | null;
  wallet_address: string;
  error_message: string | null;
};
```

### Status display mapping

| Internal Status | User-facing Label | Color |
|----------------|-------------------|-------|
| `created` | Pending | Gray |
| `checkout_started` | Awaiting Payment | Yellow |
| `payment_confirmed` | Processing | Yellow |
| `risk_review` | Processing | Yellow |
| `payout_initiated` | Sending USDC | Yellow |
| `payout_confirmed` | Sent | Green |
| `complete` | Complete | Green |
| `failed` | Failed | Red |
| `cancelled` | Cancelled | Gray |
| `held` | Under Review | Yellow |

Users don't need to see internal pipeline states. Multiple internal states map to a simpler "Processing" label.

---

## Native App: Transaction History Screen

### Tab: Transactions (`app/(tabs)/transactions.tsx`)

The Transactions tab is always accessible in the bottom tab bar regardless of auth state. Its content adapts based on the user's state:

#### State-dependent content

| User State | Content |
|------------|---------|
| **No auth** | Empty state illustration + "Sign in to see your transactions" + "Sign in" CTA (opens auth sheet) |
| **Auth, no KYC** | Empty state illustration + "Verify your identity to start buying" + "Verify" CTA (launches Sumsub SDK) |
| **Auth + KYC, no transactions** | Empty state illustration + "You haven't made any purchases yet" + "Buy USDC" CTA (navigates to Home tab) |
| **Auth + KYC, has transactions** | Transaction list (see below) |

The empty states use the **same prompt-and-CTA pattern** as the Home tab, keeping the app consistent and always guiding the user to the next step.

### Transaction list component

```
TransactionList
├── TransactionItem (repeating)
│   ├── Left: currency icon + fiat amount + fiat currency
│   ├── Center: status badge (colored)
│   ├── Right: USDC amount (if available)
│   └── Bottom: relative timestamp ("2 hours ago")
└── Load more (cursor pagination)
```

### Transaction detail screen: `app/transaction/[id].tsx`

Tapping a transaction opens a detail view:

| Field | Display |
|-------|---------|
| Status | Colored badge with label |
| Fiat amount | e.g., "1,500.00 TTD" |
| USD equivalent | e.g., "≈ $220.50 USD" |
| USDC received | e.g., "220.50 USDC" (if payout complete) |
| Wallet | Truncated address: `0x1234...abcd` |
| Date | Full date + time: "Feb 10, 2026 at 3:45 PM" |
| Transaction hash | Clickable link → `https://basescan.org/tx/{hash}` |
| Error | Shown only if status is `failed` |

### Transaction hash link

```typescript
const explorerUrl = `https://basescan.org/tx/${txHash}`;
// Opens in external browser
Linking.openURL(explorerUrl);
```

---

## Real-time Status Updates

Orders can change status asynchronously (webhooks from Stripe/Circle). The app should reflect these changes without requiring the user to manually refresh.

### Strategy: Polling with refetch interval

```typescript
const { data } = trpc.order.get.useQuery(
  { id: orderId },
  {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when order reaches a terminal state
      if (["complete", "failed", "cancelled"].includes(status)) {
        return false;
      }
      return 5000; // Poll every 5 seconds for active orders
    },
  }
);
```

### Strategy: Refetch on app foreground

When the user returns to the app from the external browser (after Stripe checkout), refetch the order to pick up any status changes from webhooks:

```typescript
import { useCallback } from "react";
import { AppState } from "react-native";

// Refetch when app comes to foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    queryClient.invalidateQueries({ queryKey: ["order"] });
  }
});
```

### Post-MVP: Supabase Realtime

For a more efficient solution post-MVP, subscribe to order status changes via Supabase Realtime:

```typescript
supabase
  .channel("orders")
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "orders",
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Update local state with new order status
  })
  .subscribe();
```

---

## Empty States

| Scenario | Display |
|----------|---------|
| Not signed in | Illustration + "Sign in to see your transactions" + "Sign in" CTA |
| Signed in, no KYC | Illustration + "Verify your identity to start buying" + "Verify" CTA |
| Signed in + KYC, no transactions | Illustration + "You haven't made any purchases yet" + "Buy USDC" CTA |
| All transactions failed/cancelled | Show them normally in the list |
| Loading | Skeleton list items |
| Error fetching | "Couldn't load transactions. Pull to retry." |

The empty state CTAs mirror the Home tab behavior — "Sign in" opens the auth sheet, "Verify" launches Sumsub, and "Buy USDC" switches to the Home tab.

---

## Pull-to-Refresh

The transaction list should support pull-to-refresh:

```typescript
const { refetch, isRefetching } = trpc.order.list.useQuery(...);

<FlatList
  refreshing={isRefetching}
  onRefresh={refetch}
  ...
/>
```

---

## File Structure

```
packages/server/
├── src/
│   └── views/order/
│       └── procedures/
│           ├── list.ts                    # Paginated order list
│           └── get.ts                     # Single order detail

packages/native/
├── app/
│   ├── (tabs)/
│   │   └── transactions.tsx               # Transactions tab (state-dependent content)
│   └── transaction/
│       └── [id].tsx                        # Transaction detail screen (modal/push)
├── lib/
│   └── components/
│       ├── TransactionList.tsx             # List component
│       ├── TransactionItem.tsx             # Individual transaction row
│       └── TransactionEmptyState.tsx       # State-dependent empty state with CTA
```

---

## Environment Variables

No new environment variables required.

---

## Open Questions

1. Should we show pending/in-progress orders on the home screen separately from completed ones (e.g., a "Current activity" section at the top)?
2. Do we want push notifications when a transaction completes? (Separate feature, but related.)
3. Should the detail screen show the exchange rate used for the conversion?
4. Is cursor-based pagination sufficient, or do users need date-range filtering?
