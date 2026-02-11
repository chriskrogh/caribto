# 06 — Circle Payout Integration + Webhooks

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 02-WALLET_ADDRESS_MANAGEMENT, 04-ORDER_STATE_MACHINE, 05-STRIPE_CHECKOUT

---

## Overview

Integrate Circle Mint's Crypto Payouts API to send USDC on Base to the customer's wallet after a successful Stripe payment and risk check. Circle Mint is the institutional platform for minting/redeeming USDC directly from Circle. The Crypto Payouts API handles the on-chain transfer.

### Payout pipeline (from PRD 5.3)

1. **Stripe pays out USD** to our linked bank account
2. **Circle Mint converts USD → USDC** — we deposit USD from our bank into Circle Mint (1:1 conversion)
3. **Crypto Payouts API sends USDC** to the customer's wallet on Base

Step 2 is a manual operational process in the MVP. Step 3 is what this spec automates.

---

## Circle Mint Setup

### Account requirements

- Circle Mint account (institutional, requires Circle's KYC/onboarding)
- Crypto Payouts API access (requires additional solutioning with Circle)
- Sandbox environment for integration testing
- USD balance funded from the linked bank account

### API authentication

All Circle API requests require a Bearer token:

```
Authorization: Bearer {CIRCLE_API_KEY}
```

### Base URL

| Environment | URL |
|-------------|-----|
| Sandbox | `https://api-sandbox.circle.com` |
| Production | `https://api.circle.com` |

---

## Address Book: Recipient Registration

Before sending a payout, the recipient's wallet address must be registered in Circle's Address Book.

### API: Create Recipient

```
POST /v1/addressBook/recipients
{
  "chain": "BASE",
  "address": "0x...",
  "metadata": {
    "nickname": "user-{user_id}",
    "email": "{user_email}"
  },
  "idempotencyKey": "{uuid}"
}
```

### Response

```json
{
  "data": {
    "id": "recipient-uuid",
    "chain": "BASE",
    "address": "0x...",
    "status": "pending" | "active",
    "metadata": { "nickname": "...", "email": "..." }
  }
}
```

### Recipient status

Recipients start as `pending` and move to `active` once Circle processes them. Payouts can only be sent to `active` recipients.

### When to register

Register the recipient **at payout initiation time**, not when the user submits their wallet address. This avoids pre-registering addresses for users who may never purchase.

### Caching

Store the Circle recipient ID in a new column on the `wallets` table:

```sql
ALTER TABLE public.wallets
    ADD COLUMN circle_recipient_id text;
```

If a wallet already has a `circle_recipient_id`, skip registration and use the existing one. If the user changes their wallet address, clear the recipient ID so a new one is registered on next payout.

---

## Payout Creation

### API: Create Payout

```
POST /v1/payouts
{
  "idempotencyKey": "{order_id}",
  "source": {
    "type": "wallet",
    "id": "{circle_wallet_id}"
  },
  "destination": {
    "type": "address_book",
    "id": "{circle_recipient_id}"
  },
  "amount": {
    "amount": "100.00",
    "currency": "USD"
  },
  "toAmount": {
    "currency": "USDC"
  },
  "beneficiaryEmail": "{user_email}"
}
```

### Response

```json
{
  "data": {
    "id": "payout-uuid",
    "status": "pending",
    "amount": { "amount": "100.00", "currency": "USD" },
    "toAmount": { "amount": "100.00", "currency": "USDC" },
    "sourceWalletId": "...",
    "destination": { "type": "address_book", "id": "..." },
    "externalRef": null,
    "createDate": "..."
  }
}
```

### Idempotency

Use the `order_id` as the `idempotencyKey`. This ensures that if the payout creation request is retried (network error, timeout), Circle will not create a duplicate payout.

---

## Payout Status Tracking

### Status values

| Status | Meaning |
|--------|---------|
| `pending` | Payout created, being processed |
| `complete` | USDC sent on-chain, `externalRef` contains tx hash |
| `failed` | Payout failed |

### Polling (primary strategy for MVP)

After creating a payout, poll for status updates:

```
GET /v1/payouts/{payout_id}
```

### Webhook notifications (recommended addition)

Set up a notification subscription for real-time status updates:

```
POST /v1/notifications/subscriptions
{
  "endpoint": "https://{domain}/api/webhooks/circle"
}
```

Circle uses AWS SNS for webhook delivery. The endpoint must handle SNS subscription confirmation.

---

## Payout Orchestration Flow

### Triggered after risk review passes (spec 07)

```
1. Order status is 'risk_review' and all checks pass
2. Check if wallet has a circle_recipient_id
   a. If not: create recipient in Circle Address Book
   b. Wait for recipient status = 'active' (poll or wait)
3. Create payout via Circle API:
   - idempotencyKey = order.id
   - amount = order.usd_amount
   - destination = circle_recipient_id
4. Store circle_payout_id on the order
5. Transition order to 'payout_initiated'
6. Start polling for payout completion (or await webhook)
7. On payout complete:
   - Store tx_hash from externalRef
   - Store usdc_amount from toAmount
   - Transition order to 'payout_confirmed' → 'complete'
8. On payout failed:
   - Increment retry counter
   - If retries < MAX_RETRIES (3): retry payout
   - If retries exhausted: transition order to 'failed'
```

### Travel Rule compliance

For payouts >= $3,000 USD, Circle may require Travel Rule data. Include originator and beneficiary information:

```json
{
  "beneficiaries": [{
    "name": "{user full name}",
    "email": "{user email}"
  }],
  "originators": [{
    "name": "Caribto Inc.",
    "address": { "country": "CA" }
  }]
}
```

This data comes from the user's KYC profile (Sumsub) and our business entity details.

---

## Webhook Handler

### Endpoint

```
POST /api/webhooks/circle
```

### SNS subscription confirmation

Circle webhooks are delivered via AWS SNS. On first setup, SNS sends a `SubscriptionConfirmation` message that must be acknowledged:

```typescript
if (messageType === "SubscriptionConfirmation") {
  const subscribeUrl = body.SubscribeURL;
  await fetch(subscribeUrl); // Confirm the subscription
  return new Response("OK", { status: 200 });
}
```

### Notification processing

```
1. Parse SNS message
2. If messageType === 'Notification':
   a. Parse the message body (JSON)
   b. Extract payout status and payout ID
   c. Look up order by circle_payout_id
   d. If status === 'complete':
      - Store tx_hash from externalRef
      - Transition order to 'payout_confirmed' → 'complete'
   e. If status === 'failed':
      - Attempt retry or transition to 'failed'
3. Log full payload to audit_logs (spec 10)
4. Return 200 OK
```

---

## Retry Logic

| Scenario | Strategy |
|----------|----------|
| Recipient registration fails | Retry up to 3 times with exponential backoff |
| Payout creation fails (network) | Idempotency key ensures safe retry |
| Payout status = 'failed' | Re-create payout up to 3 times, then mark order as failed |
| Insufficient USDC balance | Alert admin, hold order until balance is funded |

### Retry implementation

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 45000]; // 5s, 15s, 45s

async function retryPayout(orderId: string, attempt: number = 0): Promise<void> {
  if (attempt >= MAX_RETRIES) {
    await transitionOrder(orderId, "failed", {
      error_message: "Payout failed after max retries"
    });
    return;
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));

  try {
    await createCirclePayout(orderId);
  } catch (error) {
    await retryPayout(orderId, attempt + 1);
  }
}
```

---

## File Structure

```
packages/server/
├── src/
│   ├── utils/
│   │   └── circle.ts                      # Circle API client + auth headers
│   ├── models/wallet/
│   │   └── set.ts                         # Updated: clear circle_recipient_id on address change
│   ├── controllers/payout/
│   │   ├── registerRecipient.ts           # Register in Circle Address Book
│   │   ├── createPayout.ts               # Create Circle payout
│   │   ├── checkPayoutStatus.ts          # Poll payout status
│   │   └── orchestrate.ts                # Full payout orchestration flow
│   └── views/order/
│       └── procedures/
│           └── (existing - no new procedures; payouts are server-initiated)

packages/web/
├── app/api/webhooks/circle/
│   └── route.ts                           # Circle webhook handler (SNS)
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CIRCLE_API_KEY` | Circle API key (Bearer token) |
| `CIRCLE_WALLET_ID` | Circle Mint wallet ID (source of payouts) |
| `CIRCLE_API_BASE_URL` | `https://api-sandbox.circle.com` or `https://api.circle.com` |

---

## Monitoring & Alerts

| Condition | Action |
|-----------|--------|
| Payout fails after 3 retries | Alert admin via email/Slack |
| USDC balance below threshold | Alert admin to fund Circle Mint |
| Recipient stuck in 'pending' > 10 min | Alert admin |
| Any webhook processing error | Log error, alert if repeated |

---

## Open Questions

1. What is the Circle Mint account approval timeline? (Can take weeks — critical path item.)
2. Is the Crypto Payouts API available in sandbox for Base chain, or only production?
3. What is Circle's fee for USDC payouts on Base? (Typically very low, but confirm.)
4. Should we implement a polling job (cron) for payout status as a fallback to webhooks?
5. How do we handle the manual USD → USDC funding step operationally? (Frequency, alerts for low balance.)
