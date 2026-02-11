# PRD

## 1. Product Overview

**Product name:** Caribto

**Product type:** Fiat → Crypto onramp (consumer)

**Entity:** Canadian corporation (FINTRAC MSB)

**Stage:** MVP

**Risk posture:** Low

**Initial payout chain:** Base

**Asset:** USDC

**Goal:** Enable Caribbean consumers to convert local fiat currency into USDC on Base through a compliant, low-friction, non-custodial experience.

---

## 2. Problem Statement

Caribbean users face:

- Limited access to regulated crypto onramps
- High friction with international exchanges
- Reliance on informal P2P markets with poor UX and elevated risk

**Caribto solves this by**:

- Accepting local fiat via cards/banks
- Performing full KYC/AML upfront
- Paying out USDC directly to user wallets
- Remaining compliant under a Canadian MSB framework

---

## 3. Target Users

**Primary user**

- Individual consumer
- Resident of Trinidad & Tobago, Barbados, or Jamaica
- Owns a self-custodial wallet (e.g. MetaMask, Coinbase Wallet)
- Wants USD exposure or crypto access without complexity

**Explicitly out of scope (MVP)**

- Businesses
- High-volume traders
- Custodial wallet users
- On/off-ramping other crypto assets

---

## 4. Core User Flows (MVP)

### 4.1 Onboarding

1. Email signup
2. Country selection
3. Wallet address submission (Base-compatible)
4. KYC verification (mandatory before payout)

### 4.2 Purchase

1. User selects fiat amount
2. Redirect to **Stripe Link** checkout
3. Payment confirmation
4. Compliance checks pass
5. USDC payout initiated

### 4.3 Transaction History

- List of completed transactions
- Fiat amount
- USDC amount
- Timestamp
- Status
- Base transaction hash (clickable)

---

## 5. Functional Requirements

### 5.1 Payments (Fiat Intake)

- Provider: **Stripe**
- Payment methods:
  - Cards
  - Bank-based methods where supported
- Currency:
  - Local fiat accepted
  - Backend converts to USD-equivalent accounting value
- Stripe handles:
  - PCI compliance
  - Fraud tooling
  - Payment confirmation webhooks

**Out of scope:**

- Fiat custody
- Manual refunds
- FX optimization (basic Stripe FX only)

---

### 5.2 Identity, KYC & AML

- Provider: **Sumsub**
- Required before _any_ crypto payout

**Sumsub features used (MVP):**

- Identity verification (passport / national ID)
- Liveness checks
- Sanctions screening
- PEP screening
- Risk scoring
- Webhooks for status updates
- Evidence retention for audits

**Design decision:**

KYC is **always-on**, regardless of transaction size, to simplify compliance and reduce edge cases.

---

### 5.3 Crypto Payouts

- Asset: USDC
- Chain: **Base**
- Custody model:
  - Non-custodial
  - User-provided wallet address
  - One-way payout only

**Payout pipeline:**

1. **Stripe pays out USD** to our linked bank account (standard Stripe payout schedule)
2. **Circle Mint converts USD → USDC** — we deposit USD from our bank account into our Circle Mint account, which converts it 1:1 into USDC
3. **Circle Crypto Payouts API sends USDC to the customer's wallet** on Base

**Circle Mint details:**

- Provider: **Circle** (sole issuer of USDC)
- Product: **Circle Mint** — institutional platform for minting/redeeming USDC directly from Circle
- Circle Mint account is free; Crypto Payouts API access requires additional solutioning with Circle
- USD deposits from our bank account are converted 1:1 to USDC within the Circle Mint account
- The **Crypto Payouts API** (`/v1/payouts`) handles onchain sends to customer wallets
  - Recipient wallet addresses are registered in Circle's Address Book (`/v1/addressBook/recipients`)
  - Payouts include Travel Rule identity data for compliance (required for payouts >= $3,000)
  - Payout status tracked via webhooks or polling (pending → complete)
  - Circle returns an `externalRef` (onchain transaction hash) on completion
- Circle Mint supports Base as a payout chain for USDC
- Sandbox environment available for integration testing

**Requirements:**

- Validate Base-compatible addresses
- Register customer wallet addresses in Circle Address Book
- Generate and store onchain transaction hash (from Circle's `externalRef`)
- Associate payout with Stripe payment + Sumsub applicant ID
- Handle Circle webhook notifications for payout status updates
- Implement retry/fallback logic for failed payouts

---

### 5.4 Limits & Risk Controls

- Daily per-user cap (low, configurable)
- Weekly rolling cap
- One wallet address per user (MVP)
- Manual review toggle (admin-only)

---

## 6. Non-Functional Requirements

### 6.1 Compliance

- FINTRAC MSB-aligned
- Record retention: 5 years
- STR-ready logging
- Travel Rule data stored internally (originator + beneficiary)

### 6.2 Security

- No private key custody
- Webhook signature verification (Stripe + Sumsub + Circle)
- Encrypted PII at rest
- Least-privilege internal access

### 6.3 Performance

- KYC decision within minutes (async allowed)
- Payout SLA: same day (best effort)

---

## 7. Admin & Ops (Internal Only)

**Admin dashboard (very minimal):**

- User list
- KYC status
- Transaction list
- Flags / risk indicators
- Manual payout hold toggle

No reporting exports or advanced analytics in MVP.

---

## 8. UX Principles

- Mobile-first
- Minimal copy
- No crypto jargon
- Clear "What happens next" states
- Trust-forward language (compliance as a feature, not friction)

If Stripe Link is the airport security, Sumsub is the passport desk. The app itself should feel like the departure lounge.

---

## 9. Out of Scope (Explicitly)

- Custodial wallets
- Multiple chains
- Multiple assets
- Off-ramping (crypto → fiat)
- Enterprise accounts
- Advanced compliance analytics
- In-app wallet creation

---

## 10. Success Metrics (MVP)

**Product**

- % of users completing KYC
- % of users completing first purchase
- Time to first payout

**Compliance**

- Zero missed KYC before payout
- Zero failed audit artifacts
- Clean Stripe account standing

**Business**

- Cost per completed transaction
- Drop-off by step (onboarding → checkout → payout)

---

## 11. Open Dependencies & Risks

- Stripe crypto policy interpretation for onramps
- Circle Mint account approval timeline (requires institutional KYC/background checks, can take weeks)
- Circle Crypto Payouts API access and pricing (requires additional solutioning with Circle)
- Local card acceptance reliability by market
- ID document pass rates per country
- Base RPC reliability at scale (low risk early)

---

## 12. MVP Definition of "Done"

Caribto MVP is complete when:

- A user in T&T, Barbados, or Jamaica can
- Pay with local fiat via Stripe
- Complete Sumsub KYC
- Receive USDC on Base
- View the transaction history
- And all artifacts are audit-ready

---

Important:

[Mobile Considerations](./mobile-considerations.md)
