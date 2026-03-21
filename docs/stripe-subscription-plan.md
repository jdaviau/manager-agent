# Stripe Subscription Feature

## Context

The app needs a monetization model. Users will subscribe to either a **Core** or **Pro** plan (both paid, monthly billing). Everything built so far ships as Core. Pro features will be added later. Stripe is the payment processor; all Stripe calls are proxied through Next.js API routes so the client never touches Stripe directly. Subscription state is stored in Supabase and checked server-side on every protected API call.

---

## Decisions

| Decision | Choice |
|---|---|
| Payment processor | Stripe |
| Tiers | Core (paid) · Pro (paid, higher price) |
| Billing | Monthly only |
| Prices | TBD — use placeholder Stripe Price IDs for now |
| Enforcement | Hard block — Pro UI is hidden; Core users see upgrade prompt |
| Subscription scope | Per **user** (owner), not per team |
| API layer | Next.js API routes only — frontend never calls Stripe |
| Tax | Add Stripe Tax later; skip for now (US/Canada startup) |

---

## Architecture Overview

```
Frontend
  └── /api/billing/checkout    → creates Stripe Checkout Session → returns URL
  └── /api/billing/portal      → creates Stripe Customer Portal session → returns URL
  └── /api/billing/subscription → returns current plan + status for UI

Stripe
  └── POST /api/webhooks/stripe → verifies signature → updates subscriptions table

DB (Supabase)
  └── subscriptions table: user_id, stripe_customer_id, stripe_subscription_id,
                           plan, status, current_period_end, cancel_at_period_end
```

---

## Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CORE_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SUPABASE_SERVICE_ROLE_KEY=...   # only used in webhook handler

# Monthly prompt limits per tier (tune without code changes)
PROMPT_LIMIT_CORE=50
PROMPT_LIMIT_PRO=200

# App base URL (used for Stripe redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/0004_subscriptions.sql` | `subscriptions` + `prompt_usage` tables + RLS |
| `src/lib/stripe.ts` | Stripe singleton client (API version `2026-02-25.clover`) |
| `src/types/subscription.ts` | `SubscriptionPlan`, `SubscriptionStatus`, `SubscriptionUsage` types |
| `src/app/api/billing/checkout/route.ts` | Create Checkout Session |
| `src/app/api/billing/portal/route.ts` | Create Customer Portal session |
| `src/app/api/billing/subscription/route.ts` | Return plan + current month usage; reconciles with Stripe |
| `src/app/api/webhooks/stripe/route.ts` | Handle Stripe webhook events (service role key only here) |
| `src/hooks/useSubscription.ts` | Client hook — plan, status, usage, isAtLimit, isNearLimit |
| `src/components/billing/UpgradePrompt.tsx` | Reusable "Upgrade to Pro" CTA component |
| `src/app/(app)/billing/page.tsx` | Billing management page |

## Files Modified

| File | Change |
|---|---|
| `src/types/database.ts` | Added `Subscription` + `PromptUsage` interfaces |
| `src/types/agent.ts` | Added `usage_warning` SSE event type |
| `src/app/api/agent/route.ts` | Check + increment prompt usage before agent loop; 429 at limit; `usage_warning` SSE event at ≥80% |
| `src/hooks/useChat.ts` | Handles `usage_warning` SSE event; returns `usageWarning` state |
| `src/components/chat/ChatPanel.tsx` | Slim usage bar with color coding (green → amber → red) |
| `src/components/chat/ChatInput.tsx` | Blocked state with billing link when at limit |
| `src/app/(app)/dashboard/page.tsx` | Billing link in header |
| `.env.local.example` | Added 7 new env vars |
| `package.json` | Added `stripe` package |

---

## DB Schema

### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'core' CHECK (plan IN ('core', 'pro')),
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX subscriptions_user_id_idx ON subscriptions (user_id);
```

### `prompt_usage`
```sql
CREATE TABLE prompt_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL,  -- e.g. '2026-03'
  count        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year_month)
);
```

Both tables have RLS enabled with `user_id = auth.uid()` policies and `set_updated_at` triggers.

---

## Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert subscription row: set `stripe_customer_id`, `stripe_subscription_id`, `plan` from metadata, `status: active` |
| `customer.subscription.updated` | Update `status`, `current_period_end` (from `items.data[0].current_period_end`), `cancel_at_period_end` |
| `customer.subscription.deleted` | Set `status: canceled` |
| `invoice.payment_failed` | Set `status: past_due` (looked up via `stripe_customer_id`) |

> **Reliability:** Stripe retries failed webhooks up to 5 times over ~8 hours. The `/api/billing/subscription` GET endpoint does a live `stripe.subscriptions.retrieve()` on every load to reconcile any missed events — no cron job needed.

> **Note on `current_period_end`:** In Stripe v20 (API `2026-02-25.clover`) this field moved from the Subscription root to `subscription.items.data[0].current_period_end`.

---

## Prompt Limiting Logic (agent route)

1. Fetch `subscriptions.plan` for the user (defaults to `"core"`)
2. Resolve limit from env: `PROMPT_LIMIT_CORE` (default 50) or `PROMPT_LIMIT_PRO` (default 200)
3. Query `prompt_usage` for current `year_month`
4. If `count >= limit` → return HTTP 429 with `{ error, limit, count, year_month }`
5. Upsert `count + 1` into `prompt_usage` before running the agent loop
6. If `(count + 1) / limit >= 0.8` → emit `{ type: "usage_warning", count, limit }` as first SSE event

---

## Feature Gating Pattern (for future Pro features)

**UI gating:**
```tsx
const { isPro } = useSubscription();
if (!isPro) return <UpgradePrompt feature="Feature Name" />;
```

**Agent route gating (Pro-only tools):**
```ts
const sub = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle();
if (toolRequiresPro && sub.data?.plan !== "pro") {
  return Response.json({ error: "Pro subscription required" }, { status: 403 });
}
```

---

## Stripe Dashboard Setup (manual, before testing)

1. Create two Products: "Core Plan" and "Pro Plan"
2. Add a monthly recurring Price to each → copy Price IDs to `.env.local`
3. Enable Customer Portal: Stripe Dashboard → Billing → Customer Portal
4. Set up webhook endpoint pointing to `/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. For local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Verification Checklist

1. Run migration in Supabase Dashboard SQL Editor
2. `npm run dev` → visit `/billing` → see "No active plan" state
3. Click "Subscribe to Core" → redirected to Stripe Checkout
4. Complete test payment (card `4242 4242 4242 4242`) → webhook fires → subscription row created
5. Revisit `/billing` → shows active Core plan, usage "0 / 50 prompts"
6. Send prompts in chat → usage counter increments in billing page and chat panel
7. Set `PROMPT_LIMIT_CORE=3` temporarily → send 3 prompts → 4th shows warning bar; send at limit → chat input disables
8. Click "Manage billing" → Stripe Customer Portal opens
9. Cancel subscription → webhook fires → status updated to `canceled`
10. `npx tsc --noEmit` passes clean
