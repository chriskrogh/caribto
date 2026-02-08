# Architecture

Below is a **high-level MVP architecture** that matches your stack (Next.js on Vercel + React Native/Expo), your compliance posture (FINTRAC MSB-aligned, always-on KYC), and the **mobile constraint**: **crypto purchase must occur outside the app** via an external browser checkout.

---

## High-level architecture diagram (MVP)

```mermaid
flowchart TB
  %% CLIENTS
  subgraph U["Users"]
    M["Mobile App (React Native + Expo)"]
    W["External Wallet\n(MetaMask / Coinbase Wallet)\nBase address"]
  end

  subgraph V["Vercel"]
    FE["Next.js Web Frontend\n- Landing/Marketing/Policy (logged out)\n- Admin Portal (Google Auth)"]
    API["Next.js Backend API\n(BFF for Mobile)\n- Auth/session\n- Orchestration + state machine\n- Limits/risk checks\n- Audit logging"]
  end

  subgraph P["3rd-Party Providers"]
    S["Stripe + Link\nHosted Checkout Page"]
    K["Sumsub\nKYC + AML screening\n(webhooks)"]
    B["Base Network\nUSDC transfer"]
    R["RPC Provider\n(Base RPC)"]
  end

  subgraph D["Data + Ops (MVP)"]
    DB["App DB\nUsers, Wallets, Orders,\nKYC status, Limits,\nTransaction ledger"]
    VAULT["Secrets/Keys\n(Stripe/Sumsub secrets,\nUSDC hot signer or custody provider creds)"]
    LOG["Audit Log Store\n(immutable-ish)\nPII access logs,\nwebhook receipts,\ntravel-rule fields"]
  end

  %% MAIN FLOWS
  M -->|"Login / Onboarding\n(country, wallet addr)\ncreate Order"| API
  FE <--> API

  %% KYC
  M -->|"Start KYC (in-app)\nSDK/redirect"| K
  K -->|"KYC decision webhook\n(pass/fail/review)"| API

  %% CHECKOUT OUTSIDE APP
  M -->|"Open external browser\n(Safari/Chrome)\nCheckout URL"| S
  S -->|"Payment confirmation\nwebhook"| API
  S -->|"Return URL / deep link\nback to app"| M

  %% ORCHESTRATION + PAYOUT
  API -->|"Risk checks\n(daily/weekly caps,\nflags/manual hold)"| DB
  API -->|"Persist state + artifacts\n(order, KYC, payment)"| DB
  API -->|"Write audit artifacts\n(webhooks, decisions,\ntravel-rule fields)"| LOG

  API -->|"Initiate payout\nUSDC on Base"| R
  R -->|"Broadcast tx"| B
  B -->|"Tx hash / receipt"| R
  R -->|"Tx status"| API

  API -->|"Store tx hash + status\nlink to payment + KYC applicant"| DB
  API -->|"Show status + history"| M

  %% ADMIN
  FE -->|"Google Auth\n(Admin only)"| API
  API -->|"Admin views\nusers, KYC, tx,\nmanual hold toggle"| DB

  %% SECURITY LINKS
  API --- VAULT

```

---

## What each box is responsible for

### 1) Mobile app (React Native + Expo)

- **Owns the user experience**: onboarding, wallet address capture, KYC initiation, transaction history.
- **Does not process the payment inside the app**. It only *launches* the checkout in the device’s external browser (Safari/Chrome), then returns via redirect/deep link.

### 2) Next.js on Vercel (frontend + backend)

- **Marketing/policy site** (logged out): important for trust and app review (“right paperwork, stamped”).
- **Admin portal** (logged in via Google auth): minimal ops surface, manual hold toggle, user/tx/KYC views.
- **Backend API (BFF for mobile)**: the “conductor” that ties everything together:
    - creates “orders”
    - receives Stripe and Sumsub webhooks
    - enforces limits + risk gates
    - triggers USDC payout
    - stores audit-ready artifacts (FINTRAC posture)

### 3) Stripe + Link (external hosted checkout)

- Checkout is **outside the mobile app** to reduce app store risk (no embedded WebView checkout).
- Stripe sends **webhooks** to your backend; the backend treats Stripe as the **fiat rail**, not the compliance perimeter.

### 4) Sumsub (KYC + AML)

- **Always-on KYC before payout**, regardless of amount, to simplify compliance and reduce edge cases.
- Sumsub sends **status webhooks** (pass/fail/review) to the backend.

### 5) USDC payout on Base

- **Non-custodial payout**: user provides a Base-compatible address; you send USDC one-way.
- Backend stores **tx hash** and links it to Stripe payment + Sumsub applicant for auditability/travel-rule-style association.

---

## MVP “state machine” (how the backend thinks)

This is the simple spine that keeps everything sane:

1. **Order Created** (user + wallet + amount + country)
2. **KYC Pending**
3. **KYC Passed** (or Failed / Review)
4. **Checkout Started** (checkout session created)
5. **Payment Confirmed** (Stripe webhook)
6. **Risk Gate** (limits, flags, manual hold)
7. **Payout Initiated**
8. **Payout Confirmed** (tx hash stored)
9. **Complete** (shown in transaction history)

This aligns cleanly with your PRD flow and compliance needs.

---

## Key design choices driven by mobile considerations

- **External browser checkout** is the big unlock: Mobile app triggers purchase → user pays in Safari/Chrome → deep link back.
- Keep wording and UX consistent with “financial transaction / on-ramp” rather than “in-app digital goods purchase.”
- “Compliance pages” live on the logged-out site and are linked from app metadata if needed.

---

Perfect. Let’s turn the architecture into a **time-ordered story**. Below is a **high-level sequence diagram** for the MVP that shows how control, money, and compliance signals move through the system. No code, no implementation trivia, just the choreography.

---

## MVP happy-path sequence diagram (primary flow)

```mermaid
sequenceDiagram
  autonumber

  participant U as User
  participant M as Mobile App (React Native / Expo)
  participant API as Next.js Backend (Vercel)
  participant KYC as Sumsub
  participant STR as Stripe + Link (External Browser)
  participant CH as Blockchain (Base / USDC)

  %% Onboarding
  U->>M: Open app
  M->>API: Create session / fetch config
  API-->>M: Limits, supported countries, status

  %% KYC
  U->>M: Start KYC
  M->>KYC: Launch KYC flow (SDK / redirect)
  KYC-->>API: Webhook: KYC PASSED
  API->>API: Update user KYC status

  %% Order creation
  U->>M: Enter amount + wallet address
  M->>API: Create Order
  API->>API: Validate limits + country rules
  API-->>M: Order created (pending payment)

  %% Checkout outside app
  M->>STR: Open external browser checkout URL
  U->>STR: Complete payment
  STR-->>API: Webhook: Payment confirmed
  API->>API: Link payment to order

  %% Risk + payout
  API->>API: Final risk checks
  API->>CH: Send USDC on Base
  CH-->>API: Tx hash + confirmation

  %% Completion
  API->>API: Mark order complete
  API-->>M: Order status = Complete
  M-->>U: Show success + tx hash

```

---

## What this diagram is quietly doing right

- **KYC before money movement**
    
    No ambiguity. If KYC fails, the system never even offers checkout.
    
- **Payment outside the app**
    
    The mobile app never embeds checkout. It *hands the user off*, then waits for webhooks. This keeps you aligned with app store rules and reduces reviewer friction.
    
- **Backend as the single source of truth**
    
    The Next.js backend is the only component allowed to:
    
    - interpret Stripe webhooks
    - interpret KYC outcomes
    - initiate blockchain payouts
    
    The mobile app is a narrator, not an executor.
    

---

## Failure & edge-case sequences (compressed but important)

### 1) KYC fails or needs review

```mermaid
sequenceDiagram
  participant KYC as Sumsub
  participant API as Backend
  participant M as Mobile App

  KYC-->>API: Webhook: FAILED / REVIEW
  API->>API: Lock payouts
  API-->>M: KYC failed / under review
  M-->>User: Show retry or support message

```

**Design intent:**

No partial states. A failed KYC cleanly halts the funnel.

---

### 2) Blockchain send fails or is delayed

```mermaid
sequenceDiagram
  participant API as Backend
  participant CH as Base Network

  API->>CH: Send USDC
  CH-->>API: Network error / delayed confirmation
  API->>API: Retry / mark as pending

```

**Design intent:**

Blockchain is asynchronous by nature. The user experience must tolerate “processing” states without panic.

---

## Conceptual takeaway (important)

Think of the MVP as **three clocks running at different speeds**:

1. **User clock** – taps, forms, confirmations (seconds)
2. **Compliance clock** – KYC decisions, limits, reviews (minutes to hours)
3. **Settlement clock** – card payments + blockchain finality (minutes)

Your backend is the **metronome** keeping those clocks in rhythm.

---