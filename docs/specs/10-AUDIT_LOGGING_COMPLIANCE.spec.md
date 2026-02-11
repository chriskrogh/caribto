# 10 — Audit Logging & Compliance Artifacts

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 03-SUMSUB_KYC_INTEGRATION, 04-ORDER_STATE_MACHINE, 05-STRIPE_CHECKOUT, 06-CIRCLE_PAYOUT

---

## Overview

Implement immutable audit logging to satisfy FINTRAC MSB compliance requirements. Every significant event — webhook receipt, state transition, admin action, payout, KYC decision — is recorded in an append-only log with full context. This spec also covers Travel Rule data storage and record retention.

From PRD 6.1:
- FINTRAC MSB-aligned
- Record retention: 5 years
- STR-ready logging
- Travel Rule data stored internally (originator + beneficiary)

---

## Database Schema

### Table: `audit_logs`

An append-only table. No updates or deletes are permitted.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | uuid | `gen_random_uuid()` | NO | Primary key |
| `created_at` | timestamptz | `now()` | NO | Event timestamp |
| `event_type` | text | — | NO | Event category (see Event Types below) |
| `event_action` | text | — | NO | Specific action (e.g., `kyc.approved`, `order.created`) |
| `actor_type` | text | — | NO | `system`, `user`, `admin`, `webhook` |
| `actor_id` | text | — | YES | User ID or service name |
| `resource_type` | text | — | YES | `order`, `profile`, `wallet`, `payout` |
| `resource_id` | text | — | YES | ID of the affected resource |
| `metadata` | jsonb | `'{}'` | NO | Full event payload (webhook body, state change details) |
| `ip_address` | text | — | YES | Request IP (when applicable) |

### SQL Migration

```sql
CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    event_type text NOT NULL,
    event_action text NOT NULL,
    actor_type text NOT NULL CHECK (actor_type IN ('system', 'user', 'admin', 'webhook')),
    actor_id text,
    resource_type text,
    resource_id text,
    metadata jsonb DEFAULT '{}' NOT NULL,
    ip_address text,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- No one can read audit logs via RLS (admin reads through service role)
-- No update or delete policies — append-only by design

GRANT INSERT ON TABLE public.audit_logs TO service_role;
GRANT SELECT ON TABLE public.audit_logs TO service_role;
-- Explicitly no UPDATE or DELETE grants

-- Indexes for common queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_type, actor_id);
```

### Immutability enforcement

Add a trigger to prevent updates and deletes:

```sql
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not allowed.';
END;
$$;

CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_modification();

CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_modification();
```

---

## Event Types

### Taxonomy

Events follow a `{domain}.{action}` naming convention.

| Event Type | Event Action | Actor | Description |
|------------|-------------|-------|-------------|
| `auth` | `auth.signup` | user | User created an account |
| `auth` | `auth.login` | user | User logged in |
| `auth` | `auth.admin_login` | admin | Admin logged in |
| `kyc` | `kyc.started` | user | KYC verification initiated |
| `kyc` | `kyc.approved` | webhook | Sumsub approved the applicant |
| `kyc` | `kyc.rejected` | webhook | Sumsub rejected the applicant |
| `kyc` | `kyc.review` | webhook | Sumsub flagged for manual review |
| `order` | `order.created` | user | Order created |
| `order` | `order.checkout_started` | system | Stripe checkout session created |
| `order` | `order.payment_confirmed` | webhook | Stripe confirmed payment |
| `order` | `order.risk_review` | system | Risk checks initiated |
| `order` | `order.held` | system/admin | Order held (auto or manual) |
| `order` | `order.released` | admin | Admin released a held order |
| `order` | `order.cancelled` | user/admin/system | Order cancelled |
| `order` | `order.failed` | system | Order failed |
| `payout` | `payout.initiated` | system | Circle payout API called |
| `payout` | `payout.confirmed` | webhook | Circle confirmed on-chain delivery |
| `payout` | `payout.failed` | webhook/system | Payout failed |
| `payout` | `payout.retried` | system | Payout retry attempted |
| `admin` | `admin.hold_set` | admin | Admin toggled hold on an order |
| `admin` | `admin.order_cancelled` | admin | Admin cancelled an order |
| `admin` | `admin.config_updated` | admin | Admin updated limits config |
| `webhook` | `webhook.received` | webhook | Raw webhook payload logged |
| `webhook` | `webhook.verification_failed` | webhook | Webhook signature verification failed |

---

## Logging Utility

### Core logging function

```typescript
// src/utils/audit.ts
import { supabaseAdmin } from "./supabase";

type AuditLogEntry = {
  event_type: string;
  event_action: string;
  actor_type: "system" | "user" | "admin" | "webhook";
  actor_id?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
};

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const { error } = await supabaseAdmin
    .from("audit_logs")
    .insert({
      event_type: entry.event_type,
      event_action: entry.event_action,
      actor_type: entry.actor_type,
      actor_id: entry.actor_id ?? null,
      resource_type: entry.resource_type ?? null,
      resource_id: entry.resource_id ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip_address ?? null,
    });

  if (error) {
    // Log to console as fallback — never fail silently on audit logging
    console.error("Failed to write audit log:", error, entry);
  }
}
```

### Usage example: Webhook receipt

```typescript
// In Stripe webhook handler
await logAuditEvent({
  event_type: "webhook",
  event_action: "webhook.received",
  actor_type: "webhook",
  actor_id: "stripe",
  resource_type: "order",
  resource_id: orderId,
  metadata: {
    provider: "stripe",
    event_type: event.type,
    event_id: event.id,
    payload: event.data.object,  // Full Stripe event payload
  },
});
```

### Usage example: Admin action

```typescript
// In admin hold toggle handler
await logAuditEvent({
  event_type: "admin",
  event_action: "admin.hold_set",
  actor_type: "admin",
  actor_id: adminProfile.id,
  resource_type: "order",
  resource_id: orderId,
  metadata: {
    hold: true,
    previous_status: order.status,
  },
});
```

---

## Where to Log

Every significant action in the system should call `logAuditEvent`. Here's where logging hooks into existing flows:

| Flow | Log Point | Spec |
|------|-----------|------|
| User signup | After profile creation trigger | 01 |
| KYC status change | In Sumsub webhook handler | 03 |
| Order creation | After order inserted | 04 |
| Order state transition | In `transitionOrder()` function | 04 |
| Stripe webhook received | In Stripe webhook handler (all events) | 05 |
| Circle webhook received | In Circle webhook handler (all events) | 06 |
| Payout initiated | Before Circle API call | 06 |
| Payout confirmed/failed | After Circle status update | 06 |
| Risk check result | After risk gate evaluation | 07 |
| Admin hold/release | In admin order actions | 09 |
| Admin config change | In limits config update | 09 |

---

## Webhook Receipt Logging

All incoming webhooks (Stripe, Sumsub, Circle) must be logged in full, regardless of whether processing succeeds:

```typescript
// Pattern for all webhook handlers
export async function POST(request: Request) {
  const body = await request.text();

  // Log the raw webhook receipt FIRST
  await logAuditEvent({
    event_type: "webhook",
    event_action: "webhook.received",
    actor_type: "webhook",
    actor_id: "stripe", // or "sumsub" or "circle"
    metadata: {
      headers: Object.fromEntries(request.headers.entries()),
      body: JSON.parse(body),
      received_at: new Date().toISOString(),
    },
  });

  // Then verify signature and process
  // ...
}
```

If signature verification fails, log that too:

```typescript
await logAuditEvent({
  event_type: "webhook",
  event_action: "webhook.verification_failed",
  actor_type: "webhook",
  actor_id: "stripe",
  metadata: { error: "Signature mismatch" },
  ip_address: request.headers.get("x-forwarded-for"),
});
```

---

## Travel Rule Data

### Requirements (PRD 6.1)

For transactions that may meet Travel Rule thresholds ($3,000 USD per the limits config), store originator and beneficiary data internally.

### Table: `travel_rule_records`

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | uuid | `gen_random_uuid()` | NO | Primary key |
| `created_at` | timestamptz | `now()` | NO | Record creation time |
| `order_id` | uuid | — | NO | References `orders(id)` |
| `originator_name` | text | — | NO | Our business name: "Caribto Inc." |
| `originator_country` | text | — | NO | "CA" |
| `originator_account_ref` | text | — | YES | Internal reference (Circle wallet ID) |
| `beneficiary_name` | text | — | YES | User's name (from KYC if available) |
| `beneficiary_wallet` | text | — | NO | Destination wallet address |
| `beneficiary_country` | text | — | NO | User's country |
| `beneficiary_kyc_ref` | text | — | NO | Sumsub applicant ID |
| `amount_usd` | numeric(12,2) | — | NO | Transaction amount in USD |

### SQL Migration

```sql
CREATE TABLE public.travel_rule_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    order_id uuid NOT NULL REFERENCES public.orders(id),
    originator_name text NOT NULL,
    originator_country text NOT NULL,
    originator_account_ref text,
    beneficiary_name text,
    beneficiary_wallet text NOT NULL,
    beneficiary_country text NOT NULL,
    beneficiary_kyc_ref text NOT NULL,
    amount_usd numeric(12,2) NOT NULL,
    CONSTRAINT travel_rule_records_pkey PRIMARY KEY (id),
    CONSTRAINT travel_rule_records_order_id_key UNIQUE (order_id)
);

ALTER TABLE public.travel_rule_records ENABLE ROW LEVEL SECURITY;

-- Only service role can access
GRANT ALL ON TABLE public.travel_rule_records TO service_role;

CREATE INDEX idx_travel_rule_order ON public.travel_rule_records(order_id);
```

### When to create

A travel rule record is created at payout initiation time (spec 06), for **all** orders (not just those above the threshold). Storing it for all orders simplifies compliance and avoids threshold-edge-case issues.

---

## Record Retention

### 5-year retention policy (PRD 6.1)

All audit logs and travel rule records must be retained for at least 5 years.

### Strategy (MVP)

- Supabase/Postgres stores all records
- No automatic deletion or archival in the MVP
- Table partitioning by month can be added post-MVP for performance if the table grows large

### Post-MVP considerations

- Archive old records to cold storage (S3, GCS) after 1 year
- Maintain a retention policy job that flags records approaching the 5-year mark
- Ensure PII in archived records remains encrypted

---

## PII Protection

### Encrypted PII at rest (PRD 6.2)

Supabase encrypts data at rest by default (AES-256). For additional protection of sensitive fields:

- **Travel rule records** contain PII (name, wallet, country) — encrypted at rest via Supabase
- **Audit log metadata** may contain PII from webhook payloads — same encryption
- **Application-level encryption** of specific fields (e.g., `beneficiary_name`) can be added post-MVP using `pgcrypto` if required by audit

### Access control

- Audit logs are **not readable via RLS** — no authenticated user policies
- Only `service_role` can read/write, ensuring all access goes through the server
- Admin dashboard reads audit logs through admin procedures (service role)

---

## STR-Ready Logging

### Suspicious Transaction Reports (STR)

FINTRAC may require Suspicious Transaction Reports. The system must be able to produce:

1. **User profile** — email, country, KYC status, Sumsub applicant ID
2. **Transaction details** — all order fields, including timestamps and amounts
3. **Travel rule data** — originator + beneficiary information
4. **Full audit trail** — all events related to the user and their orders

### Admin query for STR data

```
adminProcedure: admin.getSTRData
  Input: { userId: z.string().uuid() }
  Output: {
    profile: Profile,
    wallet: Wallet,
    orders: Order[],
    travelRuleRecords: TravelRuleRecord[],
    auditLogs: AuditLog[]
  }
```

This procedure collects all compliance-relevant data for a user, suitable for producing an STR filing.

---

## File Structure

```
packages/server/
├── src/
│   ├── utils/
│   │   └── audit.ts                       # logAuditEvent() utility
│   ├── models/audit/
│   │   ├── create.ts                      # Insert audit log entry
│   │   └── query.ts                       # Query audit logs (admin)
│   ├── models/travel-rule/
│   │   ├── create.ts                      # Create travel rule record
│   │   └── get.ts                         # Get by order ID
│   └── views/admin/
│       └── procedures/
│           ├── getAuditLogs.ts            # Admin: query audit logs
│           └── getSTRData.ts              # Admin: compile STR data
├── supabase/migrations/
│   ├── YYYYMMDD_create_audit_logs.sql
│   └── YYYYMMDD_create_travel_rule_records.sql
```

---

## Environment Variables

No new environment variables required. All audit functionality uses the existing Supabase admin client.

---

## Integration Checklist

When implementing other specs, add `logAuditEvent()` calls at these points:

- [ ] Spec 01: User signup, login, admin login
- [ ] Spec 03: KYC status changes (all webhook events)
- [ ] Spec 04: Order creation, all state transitions
- [ ] Spec 05: Stripe webhook receipts (all events)
- [ ] Spec 06: Circle webhook receipts, payout initiation, payout status changes
- [ ] Spec 07: Risk check results
- [ ] Spec 09: Admin actions (hold, release, cancel, config changes)

---

## Open Questions

1. Should we log PII (user email, name) directly in audit logs, or use references (user ID) only?
2. Do we need a separate "compliance export" feature for regulators, or is the STR data query sufficient?
3. Should audit logs be queryable from the admin dashboard, or only accessible via direct DB queries?
4. What is the threshold for generating Travel Rule records? (Spec says all orders, but confirm.)
5. Do we need to log read access to PII (e.g., admin viewing a user profile) for privacy compliance?
