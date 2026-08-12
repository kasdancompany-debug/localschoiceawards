# Incident response

## Severity

| Level | Examples | Response |
| --- | --- | --- |
| SEV1 | Payment marking broken, data leak, auth bypass, RLS failure across tenants | Immediate page; stop deploy; fix or rollback |
| SEV2 | Email queue stalled, supplier portal down, partial checkout failures | Same-day fix; customer comms as needed |
| SEV3 | Analytics gaps, non-critical UI bugs | Next business day |

## First 15 minutes

1. Confirm blast radius via `/api/health`, Vercel logs, Sentry, Stripe/Resend dashboards.
2. Freeze deploys if SEV1.
3. Preserve evidence (event IDs, order numbers, webhook IDs) — do not scrub logs yet.
4. Assign: incident lead, comms, technical fixer.

## Failed Stripe webhooks

1. Identify orders stuck `awaiting_payment` / `pending` despite paid Checkout Sessions.
2. Stripe Dashboard → replay events.
3. Confirm `webhook_events.processing_status` moves to `processed`.
4. If stuck in `processing` >5 minutes, replay again (reclaim TTL allows re-entry).
5. Never mark paid from the success page or SQL unless dual-approved emergency with audit note.

## Failed emails

1. Check Resend dashboard for bounces/blocks.
2. Inspect `notification_events` / `email_deliveries` failure reasons.
3. Drain queue manually with Bearer cron secret.
4. Fix template/domain issues; re-queue failed events if safe (respect dedupe keys).

## Suspected security incident

1. Rotate exposed secrets (Supabase service role, Stripe, Resend, cron, unsubscribe).
2. Revoke suspicious sessions in Supabase Auth.
3. Review RLS policies and recent migrations.
4. Notify affected users if personal data may have been exposed (legal/counsel).

## Supplier outage

See `OPERATIONS.md`. Keep payments honest; delay fulfillment messaging.

## Rollback

Follow `DEPLOYMENT.md` rollback. Prefer Vercel instant rollback for app code. Schema issues use forward fixes.

## Post-incident

1. Timeline + root cause.
2. Customer impact count (orders, communities).
3. Action items with owners/dates.
4. Update this runbook if a gap was found.
