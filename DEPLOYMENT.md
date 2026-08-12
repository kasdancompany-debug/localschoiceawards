# Deployment

## Prerequisites

1. GitHub repository connected to Vercel.
2. Supabase project with all migrations applied (`supabase/migrations`).
3. Stripe account (test → live).
4. Resend domain verified.
5. Cloudflare Turnstile site keys.
6. Optional: Sentry + PostHog projects.

## Environment variables

Copy `.env.example`. Set values in Vercel for **Production** and **Preview**.

Critical production values:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical apex URL (`https://localschoiceawards.com`) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `localschoiceawards.com` (no protocol) |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| Stripe publishable + secret + webhook secret | Live keys only on Production |
| `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_WEBHOOK_SECRET` | Verified sending domain |
| `NOTIFICATIONS_CRON_SECRET` | Match Vercel `CRON_SECRET` |
| `UNSUBSCRIBE_TOKEN_SECRET` | Long random |
| Turnstile site + secret | Production widgets |

Do **not** set `SKIP_ENV_VALIDATION=true` in Production.

## Database

```bash
# From a machine with Supabase CLI linked to the project
supabase db push
# or apply migration files in order in the SQL editor
```

After deploy, confirm migration `20260325270000_production_hardening.sql` is applied (eligibility RLS, fulfillment immutability trigger, indexes, webhook `last_attempt_at`).

## DNS / multi-tenant hosts

1. Apex + `www` → Vercel.
2. Wildcard `*.localschoiceawards.com` → Vercel.
3. Reserved labels (`admin`, `business`, `supplier`, `account`, …) must not collide with community subdomains.

## Vercel cron

`vercel.json` schedules `GET/POST /api/notifications/process` every 5 minutes. Vercel sends `Authorization: Bearer $CRON_SECRET`. Set `CRON_SECRET` (and optionally mirror into `NOTIFICATIONS_CRON_SECRET`).

## Stripe webhooks

Endpoint: `https://<app>/api/webhooks/stripe`

Events to enable at minimum:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.refunded` / `refund.updated`

## Resend webhooks

Endpoint: `https://<app>/api/webhooks/resend`  
Configure signing secret → `RESEND_WEBHOOK_SECRET`.

## Deploy checklist

1. Merge to the production branch.
2. Confirm Vercel build succeeds (typecheck embedded in `next build`).
3. Hit `/api/health` — expect `ok: true` and `checks.database: ok`.
4. Smoke: central home, one community subdomain, login page, cart page.
5. Place a Stripe **test** checkout on Preview before promoting live keys.
6. Confirm cron invocation appears in Vercel logs within 10 minutes.

## Rollback

1. In Vercel → Deployments → promote the previous healthy production deployment.
2. If a migration is unsafe to leave applied, prepare a forward-fix migration (prefer additive schema). Avoid destructive rollbacks on production data without a backup restore plan (see `OPERATIONS.md`).
3. Revert app config/env changes that shipped with the bad deploy.
4. Re-run `/api/health` and a Stripe test webhook replay if payments were affected.
