# 09 — Admin Dashboard (Web)

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES, 03-SUMSUB_KYC_INTEGRATION, 04-ORDER_STATE_MACHINE, 07-LIMITS_RISK_CONTROLS

---

## Overview

Build a minimal admin dashboard on the Next.js web app for internal operations. Admins can view users, KYC statuses, transactions, and risk indicators. They can toggle manual holds and review flagged orders. The admin portal is explicitly minimal for MVP — no reporting exports or advanced analytics (PRD 7).

From PRD 7:
- User list
- KYC status
- Transaction list
- Flags / risk indicators
- Manual payout hold toggle

---

## Authentication

### Admin access control

- Admins sign in via **Google OAuth** through Supabase Auth
- After OAuth, the server checks `profile.role === 'admin'`
- Non-admin users are redirected to the landing page
- Admin routes are protected by the `adminProcedure` middleware (spec 01)

### Admin role assignment

In the MVP, admin roles are assigned manually by updating the `profiles` table:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@caribto.com';
```

Post-MVP, consider an invite flow or role management UI.

---

## Route Structure

All admin routes live under `(admin)` route group:

```
packages/web/app/
├── (admin)/
│   ├── layout.tsx                 # Admin layout with sidebar + auth guard
│   ├── login/
│   │   └── page.tsx               # Google OAuth login page
│   ├── dashboard/
│   │   └── page.tsx               # Overview / summary
│   ├── users/
│   │   ├── page.tsx               # User list
│   │   └── [id]/
│   │       └── page.tsx           # User detail
│   ├── orders/
│   │   ├── page.tsx               # Order list
│   │   └── [id]/
│   │       └── page.tsx           # Order detail
│   └── settings/
│       └── page.tsx               # Limits configuration
```

---

## Admin Layout

### Sidebar navigation

| Item | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Summary metrics |
| Users | `/users` | User list + KYC statuses |
| Orders | `/orders` | Transaction list + statuses |
| Settings | `/settings` | Limits config + global review toggle |

### Auth guard

The admin layout checks `profile.role === 'admin'` on mount. If not admin, redirect to `/`.

```typescript
// (admin)/layout.tsx
export default async function AdminLayout({ children }) {
  // Server component — check role via tRPC or direct DB query
  const profile = await getAdminProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

---

## Pages

### 1. Dashboard (`/dashboard`)

Summary cards showing key metrics:

| Card | Value | Source |
|------|-------|--------|
| Total Users | Count of profiles | `SELECT COUNT(*) FROM profiles` |
| KYC Approved | Count where `kyc_status = 'approved'` | profiles table |
| KYC Pending | Count where `kyc_status = 'pending'` | profiles table |
| Orders Today | Count of orders created today | orders table |
| Pending Payouts | Count where status = `payout_initiated` | orders table |
| Held Orders | Count where status = `held` | orders table |
| Total Volume (USD) | Sum of `usd_amount` for complete orders | orders table |

### 2. Users List (`/users`)

| Column | Description |
|--------|-------------|
| Email | User email |
| Country | Country code |
| KYC Status | Badge: approved/pending/rejected/review/none |
| Wallet | Truncated address |
| Orders | Count of orders |
| Joined | Relative date |

**Features:**
- Search by email
- Filter by KYC status
- Filter by country
- Paginated (server-side)

### 3. User Detail (`/users/[id]`)

Full user profile with:
- Profile information (email, country, joined date)
- KYC status + Sumsub applicant ID (link to Sumsub dashboard)
- Wallet address
- Order history for this user
- Manual actions: none in MVP (post-MVP: suspend user, force KYC re-check)

### 4. Orders List (`/orders`)

| Column | Description |
|--------|-------------|
| ID | Truncated UUID |
| User | Email |
| Amount | Fiat amount + currency |
| USD | USD equivalent |
| Status | Colored badge |
| Created | Relative date |
| Actions | Hold/Release button (for eligible statuses) |

**Features:**
- Filter by status
- Filter by date range
- Search by user email or order ID
- Paginated (server-side)

### 5. Order Detail (`/orders/[id]`)

Full order details:

| Section | Fields |
|---------|--------|
| Order Info | ID, created_at, status, fiat_amount, fiat_currency, usd_amount, usdc_amount, fee_amount, exchange_rate |
| User | Email, country, KYC status, Sumsub applicant ID |
| Wallet | Full address, link to BaseScan |
| Stripe | Checkout session ID, payment intent ID (link to Stripe Dashboard) |
| Circle | Payout ID, transaction hash (link to BaseScan) |
| Error | Error message (if failed) |

**Admin actions on this page:**
- **Hold order** — set `manual_hold = true` (only if in `risk_review`)
- **Release hold** — set `manual_hold = false` and re-run risk checks (only if in `held`)
- **Cancel order** — transition to `cancelled` (only if in `created`, `checkout_started`, or `held`)

### 6. Settings (`/settings`)

Editable limits configuration:

| Field | Type | Description |
|-------|------|-------------|
| Daily limit (USD) | Number input | Per-user daily maximum |
| Weekly limit (USD) | Number input | Per-user weekly maximum |
| Min order (USD) | Number input | Minimum order amount |
| Max order (USD) | Number input | Maximum single order |
| Global manual review | Toggle | Hold all orders for review |

Save button calls `adminProcedure: limits.updateConfig`.

---

## API Endpoints (tRPC — admin procedures)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `admin.dashboard` | Query | `adminProcedure` | Dashboard summary metrics |
| `admin.users.list` | Query | `adminProcedure` | Paginated user list with filters |
| `admin.users.get` | Query | `adminProcedure` | User detail by ID |
| `admin.orders.list` | Query | `adminProcedure` | Paginated order list with filters |
| `admin.orders.get` | Query | `adminProcedure` | Order detail by ID |
| `admin.orders.setHold` | Mutation | `adminProcedure` | Toggle manual hold on an order |
| `admin.orders.cancel` | Mutation | `adminProcedure` | Cancel an order |
| `admin.limits.getConfig` | Query | `adminProcedure` | Get current limits config |
| `admin.limits.updateConfig` | Mutation | `adminProcedure` | Update limits config |

### Example: `admin.users.list`

```
Input: {
  cursor?: string,
  limit?: number (default 25),
  search?: string,
  kyc_status?: KycStatus,
  country?: string
}
Output: {
  users: (Profile & { wallet_address: string | null, order_count: number })[],
  nextCursor: string | null
}
```

### Example: `admin.orders.list`

```
Input: {
  cursor?: string,
  limit?: number (default 25),
  status?: OrderStatus,
  search?: string,
  date_from?: string (ISO date),
  date_to?: string (ISO date)
}
Output: {
  orders: (Order & { user_email: string })[],
  nextCursor: string | null
}
```

---

## UI Components

The admin dashboard uses existing UI primitives from `packages/web/app/_components/ui/`:

| Component | Usage |
|-----------|-------|
| `Card` | Dashboard metric cards |
| `Button` | Actions (hold, release, cancel) |
| `Input` | Search fields, config inputs |
| `Select` | Status/country filters |
| `Skeleton` | Loading states |
| `Typography` | Headings, labels |

Additional components needed:
- `DataTable` — server-side paginated table with sorting/filtering
- `Badge` — colored status badges
- `Sidebar` — admin navigation sidebar

---

## File Structure

```
packages/web/
├── app/
│   └── (admin)/
│       ├── layout.tsx                     # Auth guard + sidebar layout
│       ├── _components/
│       │   ├── AdminSidebar.tsx           # Navigation sidebar
│       │   ├── DataTable.tsx              # Reusable paginated table
│       │   ├── StatusBadge.tsx            # Colored status badge
│       │   └── MetricCard.tsx             # Dashboard summary card
│       ├── login/
│       │   └── page.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       ├── users/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       └── settings/
│           └── page.tsx

packages/server/
├── src/
│   └── views/admin/
│       ├── router.ts                      # Admin tRPC router
│       └── procedures/
│           ├── dashboard.ts
│           ├── usersList.ts
│           ├── usersGet.ts
│           ├── ordersList.ts
│           ├── ordersGet.ts
│           ├── ordersSetHold.ts
│           ├── ordersCancel.ts
│           ├── limitsGetConfig.ts
│           └── limitsUpdateConfig.ts
```

---

## Environment Variables

No new environment variables. Google OAuth is configured in the Supabase dashboard.

---

## Open Questions

1. Should the admin dashboard be on a separate subdomain (e.g., `admin.caribto.com`) or a route group on the main domain?
2. Do we want real-time updates on the dashboard (e.g., WebSocket/Supabase Realtime), or is manual refresh sufficient for MVP?
3. Should admins receive email/Slack notifications for held orders, or is the dashboard sufficient?
4. Do we need audit logging for admin actions (e.g., who released a hold)? (Recommend: yes, covered in spec 10.)
