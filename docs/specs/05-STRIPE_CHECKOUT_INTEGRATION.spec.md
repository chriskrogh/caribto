# 05 — Stripe Checkout Integration + Webhooks

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 04-ORDER_STATE_MACHINE

---

## Overview

Integrate Stripe as the fiat payment rail. Users pay via Stripe Checkout (hosted payment page) in an **external browser** — not embedded in the mobile app — to comply with Apple App Store guidelines (see `docs/mobile-considerations.md`). Stripe handles PCI compliance, fraud tooling, and FX.

The purchase flow is triggered from the **Home tab CTA** ("Buy") after the user has passed auth and KYC. The full flow:

1. User enters USDC amount in the calculator on the Home tab and taps "Buy"
2. If no wallet address set, a bottom sheet prompts for it (spec 02)
3. Backend creates an order (spec 04) and a Stripe Checkout Session
4. Mobile app opens the checkout URL in the external browser (Safari/Chrome)
5. User completes payment on Stripe's hosted page
6. Stripe sends a webhook to our backend confirming payment
7. User is redirected back to the app via deep link

---

## Stripe Configuration

### Account requirements

- Stripe account registered under the Canadian MSB entity
- Enable Stripe Link for streamlined checkout
- Configure supported payment methods: cards (Visa, Mastercard), bank-based methods where available
- Enable webhook events in the Stripe Dashboard

### Supported currencies

| Currency | Countries | Notes |
|----------|-----------|-------|
| TTD | Trinidad & Tobago | Stripe handles FX to USD |
| BBD | Barbados | Stripe handles FX to USD |
| JMD | Jamaica | Stripe handles FX to USD |
| BSD | The Bahamas | Pegged 1:1 to USD |
| XCD | Antigua & Barbuda, Dominica, Grenada, Saint Kitts & Nevis, Saint Lucia, Saint Vincent & Grenadines, Anguilla, Montserrat | East Caribbean Dollar; Stripe handles FX to USD |
| AWG | Aruba | Stripe handles FX to USD |
| XCG | Curaçao, Sint Maarten | Caribbean Guilder; Stripe handles FX to USD |

All Caribbean countries supported by Stripe are included (15 countries, 7 currencies). Stripe converts the local currency to USD at their FX rate. We record both the fiat amount and the USD-equivalent amount.

---

## Checkout Session Creation

### API Endpoint

```
protectedProcedure: order.createCheckout
  Input: { orderId: z.string().uuid() }
  Output: { checkoutUrl: string }
```

### Logic

```
1. Look up the order by ID
2. Verify order belongs to the authenticated user
3. Verify order.status === 'created'
4. Create a Stripe Checkout Session:
   - mode: 'payment'
   - currency: order.fiat_currency.toLowerCase()
   - line_items: [{
       price_data: {
         currency: order.fiat_currency.toLowerCase(),
         unit_amount: order.fiat_amount * 100,  // Stripe uses cents
         product_data: {
           name: 'USDC Purchase',
           description: `Convert ${order.fiat_amount} ${order.fiat_currency} to USDC`
         }
       },
       quantity: 1
     }]
   - success_url: 'caribto://checkout/success?order_id={order.id}'
   - cancel_url: 'caribto://checkout/cancel?order_id={order.id}'
   - metadata: { order_id: order.id, user_id: order.user_id }
   - payment_intent_data: {
       metadata: { order_id: order.id, user_id: order.user_id }
     }
   - expires_after: 1800  // 30 minutes
5. Update order:
   - status = 'checkout_started'
   - stripe_checkout_session_id = session.id
6. Return { checkoutUrl: session.url }
```

### Deep link URLs

The `success_url` and `cancel_url` use the app's deep link scheme (`caribto://`) so that after checkout, the browser redirects back into the mobile app.

| URL | Purpose |
|-----|---------|
| `caribto://checkout/success?order_id={id}` | Payment completed, return to app |
| `caribto://checkout/cancel?order_id={id}` | User cancelled checkout |

These deep links must be configured in the Expo app (see Native App section below).

---

## Webhook Handler

### Endpoint

```
POST /api/webhooks/stripe
```

Next.js API route (not tRPC). Must receive the raw request body for signature verification.

### Webhook events to handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Payment confirmed → transition order |
| `checkout.session.expired` | Checkout timed out → cancel order |
| `payment_intent.payment_failed` | Payment failed → fail order |

### Webhook processing: `checkout.session.completed`

```
1. Verify webhook signature using Stripe's constructEvent()
2. Extract session object from the event
3. Get order_id from session.metadata
4. Look up the order
5. Verify order.status === 'checkout_started'
6. Extract payment details:
   - payment_intent ID
   - amount_total (in cents)
   - currency
7. Update order:
   - status = 'payment_confirmed'
   - stripe_payment_intent_id = payment_intent.id
   - usd_amount = calculated from Stripe's charge (amount in USD after FX)
8. Immediately trigger risk review (spec 07):
   - If risk checks pass → transition to 'payout_initiated'
   - If risk checks fail → transition to 'held' or 'failed'
9. Log webhook payload to audit_logs (spec 10)
10. Return 200 OK
```

### Webhook processing: `checkout.session.expired`

```
1. Verify signature
2. Get order_id from metadata
3. Transition order status to 'cancelled'
4. Return 200 OK
```

### Webhook signature verification

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text(); // raw body required
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // Process event...
  return new Response("OK", { status: 200 });
}
```

**Important:** The webhook route must NOT parse the body as JSON before signature verification. In Next.js App Router, use `request.text()` to get the raw body.

---

## Native App: External Browser Checkout

### Opening checkout in external browser

The mobile app must open the Stripe checkout URL in the device's external browser (Safari on iOS, Chrome on Android), **not** in an embedded WebView.

```typescript
import * as Linking from "expo-linking";
// OR
import * as WebBrowser from "expo-web-browser";

// Option A: Full external browser (Safari/Chrome)
const openCheckout = async (checkoutUrl: string) => {
  await Linking.openURL(checkoutUrl);
};

// Option B: SFSafariViewController / Chrome Custom Tab (in-app browser sheet)
const openCheckout = async (checkoutUrl: string) => {
  await WebBrowser.openBrowserAsync(checkoutUrl);
};
```

**Recommendation:** Use `expo-web-browser` (`WebBrowser.openBrowserAsync`) for a better UX — it opens an in-app browser sheet (SFSafariViewController on iOS) which is still considered "external" by Apple and keeps the user in the app's context.

### Deep link configuration (Expo)

Add the `caribto://` scheme to `app.json` / `app.config.ts`:

```json
{
  "expo": {
    "scheme": "caribto",
    "ios": {
      "associatedDomains": ["applinks:caribto.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "caribto" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Handling deep link return

When the user returns to the app via deep link after checkout, the app navigates to the Home tab and shows the latest order status. There is no separate checkout success/cancel screen — the Home tab and Transactions tab reflect the order state.

```typescript
// In root _layout.tsx or a deep link handler
import { useURL } from "expo-linking";
import { router } from "expo-router";

// Listen for deep links
const url = useURL();
if (url?.includes("checkout/success")) {
  // Navigate to Home tab (already default) and invalidate order queries
  queryClient.invalidateQueries({ queryKey: ["order"] });
}
if (url?.includes("checkout/cancel")) {
  // Stay on Home tab, order will be cancelled via webhook or timeout
}
```

---

## Stripe Checkout → App Flow Summary

```
Mobile App                  External Browser              Backend
    |                            |                           |
    |-- createCheckout(orderId)->|                           |
    |                            |                           |
    |<--- checkoutUrl -----------|                           |
    |                            |                           |
    |-- openBrowserAsync(url) -->|                           |
    |                            |                           |
    |                     User completes payment             |
    |                            |                           |
    |                            |--- webhook ------------->|
    |                            |                           |-- update order
    |                            |                           |-- trigger risk review
    |                            |                           |
    |<-- deep link (caribto://) -|                           |
    |                            |                           |
    |-- fetch order status ----->|                           |
    |<-- order.status updated ---|                           |
```

---

## Stripe Payout to Bank Account

Stripe automatically pays out collected funds to the linked bank account on a standard schedule (typically T+2 for card payments). This is configured in the Stripe Dashboard, not in code. The funds in the bank account are then used to fund Circle Mint (spec 06).

This is a manual operational step in the MVP. No automation needed.

---

## File Structure

```
packages/server/
├── src/
│   ├── utils/
│   │   └── stripe.ts                      # Stripe client initialization
│   ├── controllers/order/
│   │   └── createCheckout.ts              # Create Stripe Checkout Session
│   └── views/order/
│       └── procedures/
│           └── createCheckout.ts          # tRPC procedure

packages/web/
├── app/api/webhooks/stripe/
│   └── route.ts                           # Stripe webhook handler

packages/native/
├── app/(tabs)/
│   └── index.tsx                          # Home tab (calculator + "Buy" CTA triggers checkout)
├── lib/
│   └── hooks/
│       └── useDeepLink.ts                 # Handle checkout return deep links
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret (starts with `whsec_`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (if needed for client-side, unlikely for checkout) |

---

## Idempotency

Stripe webhooks may be delivered more than once. The webhook handler must be idempotent:

- Before processing `checkout.session.completed`, check that the order status is `checkout_started`
- If the order is already in a later state, return 200 OK without re-processing
- Use `stripe_checkout_session_id` as a deduplication key

---

## Open Questions

1. Should we use Stripe's `payment_method_types: ['card']` explicitly, or let Stripe auto-select based on the customer's country?
2. Do we want to store the Stripe customer ID on the profile for returning customers, or create a new session each time?
3. What is the fee markup on top of Stripe's FX rate? (This affects `fee_amount` on the order.)
4. Should the checkout session include a custom branding theme (logo, colors) for trust?
