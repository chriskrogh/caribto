# 01 — Auth + User Profiles + Server Context

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** None (foundational)

---

## Overview

Implement Google OAuth authentication using Supabase Auth, create a `profiles` table to store user-specific data (country, KYC status, role), and wire the authenticated user into the tRPC server context so that all downstream procedures can identify and authorize the caller.

This is the foundational layer — every subsequent feature (KYC, orders, payouts, admin) depends on having an authenticated user with a profile.

---

## Native App Architecture: Unified Shell

The native app uses a **single tab-based layout** that is the same whether the user is logged in or not. There are no separate `(logged-in)` / `(logged-out)` route groups. Instead, the app always shows three tabs — **Home**, **Transactions**, and **Settings** — and the content within each tab adapts based on the user's state.

### User states (progressive)

| State | Home tab | Transactions tab | Settings tab |
|-------|----------|-----------------|--------------|
| **No auth** | Calculator + "Sign in to Continue" CTA | Empty state: "Sign in to see your transactions" | Basic app info + "Sign in" prompt |
| **Auth, no KYC** | Calculator + "Verify your identity" CTA | Empty state: "Verify your identity to start buying" | Profile info, wallet address, country, sign out |
| **Auth + KYC** | Calculator + "Buy" CTA | Transaction list (or empty + "Make your first purchase") | Full settings (profile, wallet, country, sign out) |

### Design principles

- The **calculator is always visible** on the Home tab regardless of auth state. Users can explore exchange rates and see what they'd receive before committing.
- Auth and KYC are triggered **from the CTA button**, not from separate onboarding screens. This means the app feels identical to first-time visitors and returning users — only the CTA label changes.
- There is **no separate onboarding flow**. Country selection happens via the currency picker on the calculator. Wallet address is set in Settings (and prompted before first checkout if missing).

### Tab layout structure

```
app/
├── _layout.tsx                            # Root layout (Providers, splash screen)
└── (tabs)/
    ├── _layout.tsx                        # Tab navigator (Home, Transactions, Settings)
    ├── index.tsx                          # Home tab (calculator + CTA)
    ├── transactions.tsx                   # Transactions tab
    └── settings.tsx                       # Settings tab
```

The root `_layout.tsx` no longer uses `Stack.Protected` guards. Instead, it wraps the app in Providers and renders the tab navigator directly. Auth state is read from the Zustand store and used **within each screen** to conditionally render content.

---

## Database Schema

### Table: `profiles`

Created automatically via a trigger when a new Supabase Auth user is created.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | uuid | — | NO | Primary key, references `auth.users(id)` |
| `created_at` | timestamptz | `now()` | NO | Account creation timestamp |
| `updated_at` | timestamptz | `now()` | NO | Last profile update |
| `email` | text | — | NO | User email (denormalized from auth) |
| `country` | text | — | YES | ISO 3166-1 alpha-2 country code (e.g., `TT`, `BB`, `JM`) |
| `role` | text | `'user'` | NO | `user` or `admin` |

### SQL Migration

```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    email text NOT NULL,
    country text,
    role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin can read all profiles (enforced at app level via role check)
CREATE POLICY "Admin can read all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Service role has full access
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
```

### Auto-create profile on signup (database trigger)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.raw_user_meta_data->>'email')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

## Supported Countries (MVP)

All Caribbean countries supported by Stripe are included. Only users in the following countries can proceed past onboarding:

| Code | Country | Currency |
|------|---------|----------|
| `TT` | Trinidad & Tobago | TTD |
| `BB` | Barbados | BBD |
| `JM` | Jamaica | JMD |
| `BS` | The Bahamas | BSD |
| `AG` | Antigua & Barbuda | XCD |
| `DM` | Dominica | XCD |
| `GD` | Grenada | XCD |
| `KN` | Saint Kitts & Nevis | XCD |
| `LC` | Saint Lucia | XCD |
| `VC` | Saint Vincent & Grenadines | XCD |
| `AI` | Anguilla | XCD |
| `MS` | Montserrat | XCD |
| `AW` | Aruba | AWG |
| `CW` | Curaçao | XCG |
| `SX` | Sint Maarten | XCG |

Country validation happens at the application layer when the user sets their country, and is enforced again at order creation.

---

## Server Context (tRPC)

### Current state

`createContext` returns an empty object `{}`. Procedures have no access to the authenticated user.

### Target state

The context should extract the authenticated Supabase user and their profile, making them available to all tRPC procedures.

```typescript
// src/context.ts
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createClient } from "./utils/supabase";

export const createContext = async (_opts: FetchCreateContextFnOptions) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return { user, profile, supabase };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Authenticated procedure middleware

```typescript
// src/trpc.ts
import { TRPCError } from "@trpc/server";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.profile) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      profile: ctx.profile,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

---

## Auth Flows

### Google login / signup (native app)

Auth is triggered when an unauthenticated user taps the "Sign in to Continue" CTA on the Home tab.

1. User taps the CTA, which presents a sign-in bottom sheet or modal
2. User taps "Sign in with Google"
3. Native app initiates Google OAuth via `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })` using the Google ID token obtained from `@react-native-google-signin/google-signin`
4. If this is a new user, Supabase creates the `auth.users` row and the DB trigger auto-creates the `profiles` row
5. Session is stored in Zustand auth store via `onAuthStateChange`
6. The Home tab CTA reactively updates to the next state ("Verify your identity" or "Buy")

There is **no navigation to a separate login screen**. The user stays on the Home tab throughout.

### Admin login (web)

1. Admin navigates to `/admin/login`
2. Signs in with Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Server context checks `profile.role === 'admin'`
4. Non-admin users are redirected away

### Session management (native — already partially built)

The existing `useAuthSession` hook handles:
- Session validity checking
- Token refresh
- Logout with query cache clearing
- Session expiry alerts

This is already functional and does not need changes.

---

## Country / Currency Selection

There is **no separate onboarding flow** for country selection. Instead, the user's country is inferred from the currency they select in the calculator on the Home tab.

### How it works

1. The calculator has a "Your currency" dropdown (already exists on the web landing page)
2. When an authenticated user selects a currency, the app resolves the country from the currency code and saves it to their profile
3. For currencies shared by multiple countries (e.g., XCD), the app uses geolocation or a secondary country picker to disambiguate
4. The country is saved to the profile via the `profile.setCountry` procedure

### API

```
protectedProcedure: profile.setCountry
  Input: { country: z.enum(["TT", "BB", "JM", "BS", "AG", "DM", "GD", "KN", "LC", "VC", "AI", "MS", "AW", "CW", "SX"]) }
  Output: { success: boolean }
  Logic: Updates the profile's country field
```

For unauthenticated users, the currency selection is purely local (stored in app state). It is persisted to the profile only after sign-in.

---

## File Structure

```
packages/server/
├── src/
│   ├── context.ts                          # Updated: extract user + profile
│   ├── trpc.ts                             # Updated: protectedProcedure, adminProcedure
│   ├── models/profile/
│   │   ├── get.ts                          # Get profile by user ID
│   │   └── update.ts                       # Update profile fields
│   └── views/profile/
│       ├── router.ts                       # Profile tRPC router
│       └── procedures/
│           └── setCountry.ts               # Set country procedure
├── supabase/migrations/
│   └── YYYYMMDD_create_profiles.sql        # Profiles table + trigger

packages/native/
├── app/
│   ├── _layout.tsx                         # Root layout (Providers, splash)
│   └── (tabs)/
│       ├── _layout.tsx                     # Tab navigator (Home, Transactions, Settings)
│       ├── index.tsx                       # Home tab (calculator + progressive CTA)
│       ├── transactions.tsx                # Transactions tab
│       └── settings.tsx                    # Settings tab
├── lib/
│   └── components/
│       └── AuthSheet.tsx                   # Sign-in bottom sheet / modal

packages/web/
├── app/
│   └── (admin)/
│       └── login/
│           └── page.tsx                    # Admin Google OAuth login
```

---

## Environment Variables

Google OAuth requires:
- Enabling the Google provider in the Supabase dashboard
- A Google Cloud project with OAuth 2.0 credentials (web client ID and iOS/Android client IDs)
- `@react-native-google-signin/google-signin` package installed in the native app
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` environment variable for the native app

---

## Open Questions

1. Should the admin role be assigned manually in the database, or through an invite flow?
2. Should we restrict Google login to specific email domains, or allow any Google account?
3. For shared currencies (XCD covers 8 countries), should we auto-detect country via geolocation or show a secondary picker?
4. Should the sign-in flow be a bottom sheet, a modal, or a full-screen overlay?
