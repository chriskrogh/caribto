# 03 — Sumsub KYC Integration

**Last Updated:** February 10, 2026
**Status:** Planned
**Dependencies:** 01-AUTH_USER_PROFILES

---

## Overview

Integrate Sumsub for mandatory KYC/AML verification. Every user must pass identity verification before any crypto payout is initiated. The integration uses Sumsub's React Native SDK for the mobile app and their webhooks for status updates. KYC is **always-on** regardless of transaction size (PRD 5.2).

---

## Sumsub Features Used (MVP)

| Feature | Purpose |
|---------|---------|
| Identity verification | Passport / national ID document check |
| Liveness checks | Selfie + liveness detection |
| Sanctions screening | OFAC, UN, EU sanctions lists |
| PEP screening | Politically Exposed Persons check |
| Risk scoring | Automated risk assessment |
| Webhooks | Real-time status notifications |
| Evidence retention | Audit-ready document storage (5-year retention) |

---

## Database Schema

### Additions to `profiles` table

Add KYC status tracking columns to the existing `profiles` table:

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `kyc_status` | text | `'none'` | NO | `none`, `pending`, `approved`, `rejected`, `review` |
| `kyc_applicant_id` | text | — | YES | Sumsub applicant ID |
| `kyc_reviewed_at` | timestamptz | — | YES | When KYC decision was made |
| `kyc_reject_reason` | text | — | YES | Rejection reason (if rejected) |

### SQL Migration

```sql
ALTER TABLE public.profiles
    ADD COLUMN kyc_status text DEFAULT 'none' NOT NULL
        CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected', 'review')),
    ADD COLUMN kyc_applicant_id text,
    ADD COLUMN kyc_reviewed_at timestamptz,
    ADD COLUMN kyc_reject_reason text;

CREATE INDEX idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX idx_profiles_kyc_applicant_id ON public.profiles(kyc_applicant_id);
```

---

## KYC Flow

KYC is triggered **from the Home tab CTA**, not from a dedicated KYC screen. When an authenticated user without KYC approval taps "Verify your identity", the Sumsub SDK launches directly.

### Sequence

```
1. User taps "Verify your identity" CTA on the Home tab
2. App calls server: kyc.createAccessToken
3. Server creates Sumsub applicant (if not exists) and generates an SDK access token
4. Server returns the access token to the app
5. App launches Sumsub React Native SDK with the token (full-screen overlay)
6. User completes document upload + liveness check inside the SDK
7. SDK closes, user returns to the Home tab
8. Home tab CTA shows "Verification in progress" (pending state)
9. Sumsub processes the verification (async, minutes to hours)
10. Sumsub sends webhook to our backend: applicantReviewed
11. Backend updates profile.kyc_status based on the webhook payload
12. Next time the user opens the app / refetches, the CTA updates to "Buy"
```

### KYC status state machine

```
none → pending (user started verification)
pending → approved (Sumsub: reviewAnswer = GREEN)
pending → rejected (Sumsub: reviewAnswer = RED, rejectType = FINAL)
pending → review (Sumsub: reviewAnswer = RED, rejectType = RETRY or manual review)
review → approved (after re-review)
review → rejected (after re-review, final)
rejected → pending (user retries, new applicant flow)
```

---

## Server Implementation

### Access Token Generation

Sumsub requires a server-generated access token to initialize the SDK. The token is short-lived and scoped to a specific applicant.

```
POST https://api.sumsub.com/resources/accessTokens
  ?userId={user_id}
  &levelName={verification_level}
  &ttlInSecs=600
```

**Authentication:** Sumsub uses HMAC-SHA256 request signing with your app token and secret key.

### API Endpoints (tRPC)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `kyc.getStatus` | Query | `protectedProcedure` | Get user's current KYC status |
| `kyc.createAccessToken` | Mutation | `protectedProcedure` | Create Sumsub applicant + generate SDK token |

### Procedure: `kyc.createAccessToken`

```
Input: none
Output: { accessToken: string, applicantId: string }
Logic:
  1. Check if user already has a kyc_applicant_id
  2. If not, create a Sumsub applicant:
     POST /resources/applicants
     Body: {
       externalUserId: user.id,
       email: profile.email,
       info: { country: profile.country }
     }
  3. Store the applicant ID in profile.kyc_applicant_id
  4. Generate access token:
     POST /resources/accessTokens?userId={user.id}&levelName=basic-kyc-level&ttlInSecs=600
  5. Update profile.kyc_status = 'pending'
  6. Return { accessToken, applicantId }
```

### Procedure: `kyc.getStatus`

```
Input: none
Output: { status, reviewedAt, rejectReason }
Logic:
  1. Return profile.kyc_status, kyc_reviewed_at, kyc_reject_reason
```

---

## Webhook Handler

### Endpoint

```
POST /api/webhooks/sumsub
```

This is a Next.js API route (not a tRPC procedure) since Sumsub calls it directly.

### Webhook events handled

| Event | Action |
|-------|--------|
| `applicantReviewed` | Update KYC status based on `reviewResult.reviewAnswer` |
| `applicantPending` | Update status to `pending` (confirmation) |
| `applicantOnHold` | Update status to `review` |

### Webhook payload (applicantReviewed)

```json
{
  "applicantId": "...",
  "inspectionId": "...",
  "externalUserId": "user-uuid",
  "type": "applicantReviewed",
  "reviewResult": {
    "reviewAnswer": "GREEN" | "RED",
    "rejectLabels": ["FORGERY", "DOCUMENT_DAMAGED", ...],
    "rejectType": "FINAL" | "RETRY"
  },
  "createdAtMs": "..."
}
```

### Webhook processing logic

```
1. Verify webhook signature (HMAC-SHA1 with secret key)
2. Extract externalUserId (our user.id)
3. Look up profile by id
4. If reviewAnswer === "GREEN":
     → Set kyc_status = 'approved', kyc_reviewed_at = now()
5. If reviewAnswer === "RED" && rejectType === "FINAL":
     → Set kyc_status = 'rejected', kyc_reject_reason = rejectLabels.join(', ')
6. If reviewAnswer === "RED" && rejectType === "RETRY":
     → Set kyc_status = 'review' (user can retry)
7. Log the full webhook payload to audit_logs (spec 10)
8. Return 200 OK
```

### Webhook signature verification

Sumsub signs webhooks using HMAC-SHA1. Verify with:

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const hmac = crypto.createHmac("sha1", secretKey);
  hmac.update(payload);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}
```

The signature is sent in the `x-payload-digest` header.

---

## Native App Integration

### Package

```
bun add @sumsub/react-native-mobilesdk-module
```

### iOS requirements (Info.plist)

- `NSCameraUsageDescription` — for document capture and liveness
- `NSMicrophoneUsageDescription` — for liveness video
- `NSPhotoLibraryUsageDescription` — for document upload

### Android requirements

- Kotlin 1.9.25+
- Min API 23 (Android 5.0)
- Add Sumsub Maven repository to `android/build.gradle`

### Native SDK launch

```typescript
import SNSMobileSDK from "@sumsub/react-native-mobilesdk-module";

const launchKYC = async (accessToken: string) => {
  const snsMobileSDK = SNSMobileSDK.init(accessToken, () => {
    // Token expiration handler — fetch a new token from our server
    const { accessToken: newToken } = await trpc.kyc.createAccessToken.mutate();
    return newToken;
  })
    .withHandlers({
      onStatusChanged: (event) => {
        // Handle SDK status changes (optional UI updates)
      },
    })
    .build();

  const result = await snsMobileSDK.launch();
  // result contains the final SDK status
  return result;
};
```

### KYC in the native app

There is **no dedicated KYC screen**. KYC state is reflected in the Home tab CTA and in the Settings tab:

#### Home tab CTA (in `app/(tabs)/index.tsx`)

| KYC Status | CTA Label | CTA Action |
|------------|-----------|------------|
| `none` | "Verify your identity" | Launch Sumsub SDK |
| `pending` | "Verification in progress" | Disabled, shows spinner |
| `approved` | "Buy" | Proceed to checkout flow |
| `rejected` | "Verification failed — Retry" | Re-launch Sumsub SDK |
| `review` | "Under review" | Disabled, shows message |

#### Settings tab (in `app/(tabs)/settings.tsx`)

- Shows KYC status badge (approved / pending / rejected / under review)
- If `rejected`: shows rejection reason + "Retry verification" button
- If `approved`: shows green "Verified" badge

#### Transactions tab (in `app/(tabs)/transactions.tsx`)

- If user is authenticated but KYC not approved: empty state with "Verify your identity to start buying" prompt + CTA that launches Sumsub SDK

---

## Sumsub Dashboard Configuration

These must be configured in the Sumsub dashboard (not code):

1. **Verification level:** Create a `basic-kyc-level` with:
   - Document verification (passport, national ID)
   - Liveness check
   - Sanctions screening
   - PEP screening
2. **Webhook URL:** Set to `https://{domain}/api/webhooks/sumsub`
3. **Supported countries:** TT, BB, JM, BS, AG, DM, GD, KN, LC, VC, AI, MS, AW, CW, SX
4. **Supported document types:** Passport, National ID

---

## File Structure

```
packages/server/
├── src/
│   ├── models/kyc/
│   │   ├── updateStatus.ts                # Update KYC status on profile
│   │   └── createApplicant.ts             # Create Sumsub applicant
│   ├── controllers/kyc/
│   │   └── accessToken.ts                 # Generate Sumsub access token
│   ├── views/kyc/
│   │   ├── router.ts                      # KYC tRPC router
│   │   └── procedures/
│   │       ├── getStatus.ts               # Get KYC status
│   │       └── createAccessToken.ts       # Create access token procedure
│   └── utils/
│       └── sumsub.ts                      # Sumsub API client + HMAC signing

packages/web/
├── app/api/webhooks/sumsub/
│   └── route.ts                           # Sumsub webhook handler

packages/native/
├── app/(tabs)/
│   ├── index.tsx                          # Home tab (CTA triggers KYC launch)
│   ├── transactions.tsx                   # Transactions tab (KYC empty state)
│   └── settings.tsx                       # Settings tab (KYC status badge)
├── lib/
│   └── hooks/
│       └── useKYC.ts                      # Hook: KYC status + launch Sumsub SDK
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUMSUB_APP_TOKEN` | Sumsub application token |
| `SUMSUB_SECRET_KEY` | Sumsub secret key (for HMAC signing) |
| `SUMSUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures |
| `SUMSUB_LEVEL_NAME` | Verification level name (e.g., `basic-kyc-level`) |

---

## Open Questions

1. What is the retry policy for users whose KYC is rejected with `RETRY`? Unlimited attempts?
2. Do we need a Sumsub Web SDK integration for admin-initiated re-verification, or is the dashboard sufficient?
3. While KYC is `pending`, should we poll the server for status updates, or only check on app foreground?
