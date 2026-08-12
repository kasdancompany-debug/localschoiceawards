# Launch checklist

Use this before any public pilot or production cutover.

## Accounts & config

- [ ] Supabase project provisioned; all migrations applied including production hardening
- [ ] Vercel project linked; Production + Preview env vars set (no `SKIP_ENV_VALIDATION` in prod)
- [ ] DNS: apex, www, wildcard community hosts
- [ ] Stripe webhooks verified (test then live)
- [ ] Resend domain + webhook secret
- [ ] Turnstile production keys
- [ ] Sentry project receiving events
- [ ] PostHog project (optional but recommended)
- [ ] Super admin seeded (`docs/SEED_SUPER_ADMIN.md`)
- [ ] `CRON_SECRET` / `NOTIFICATIONS_CRON_SECRET` set; cron running
- [ ] `UNSUBSCRIBE_TOKEN_SECRET` set

## Quality gates

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run test:integration`
- [ ] `npm run test:e2e`
- [ ] `npm run build`

## Security smoke

- [ ] `/api/webhooks/resend` without secret → 401 in production
- [ ] `/api/notifications/process` without Bearer → 401 in production
- [ ] Analytics track rejects non-allowlisted `eventName`
- [ ] Community A data not visible on community B host
- [ ] Business portal cannot edit another business
- [ ] Supplier cannot change manufacturing cost fields
- [ ] Checkout prices not client-authoritative (tamper attempt fails)

## Product smoke (pilot community)

- [ ] Register / login / magic link
- [ ] Community selection from central site
- [ ] Business search
- [ ] Nomination (open season) + Turnstile
- [ ] Voting (open season) + change vote
- [ ] Business claim submit
- [ ] Published winners visible; unpublished hidden
- [ ] Add award to cart → shipping quote → Stripe test checkout → order confirmation
- [ ] Supplier fulfillment status path
- [ ] `/api/health` green

## Pilot-launch procedure

1. Choose **one** community; keep others `planned` / non-public.
2. Load categories, businesses, and a short nomination window.
3. Invite internal testers + friendly local businesses.
4. Run nomination → voting → audited results publish on staging/preview first.
5. Enable Stripe **test** mode end-to-end; then switch live keys for the pilot only after success.
6. Monitor health, Sentry, Stripe, Resend, and notification cron for 72 hours.
7. Expand to additional communities only after checklist re-sign-off.
