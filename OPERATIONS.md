# Operations

## Health

- Liveness + DB readiness: `GET /api/health`
- Healthy: HTTP 200, `{ ok: true, checks: { database: "ok" } }`
- Degraded: HTTP 503 when Supabase is unreachable

Wire this URL into uptime monitoring (e.g. Better Stack / Checkly).

## Logging & monitoring

- Prefer structured JSON logs in Route Handlers for webhooks, cron, and checkout failures.
- Sentry (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`) for exception tracking.
- PostHog for product analytics; first-party events also land in `analytics_events`.
- Never log secrets, auth cookies, webhook signing headers, or full PII payloads.

## Email queue

- Domain code emits `notification_events`; `/api/notifications/process` sends via Resend.
- Cron: every 5 minutes (`vercel.json`).
- Manual drain (staging):

```bash
curl -X POST "$APP_URL/api/notifications/process" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit":50}'
```

- Failed deliveries retry with backoff; inspect `email_deliveries` / admin notifications UI.
- Marketing sequences honor unsubscribe tokens (`UNSUBSCRIBE_TOKEN_SECRET`).

## Webhooks

### Stripe

- Idempotent via `webhook_events` unique `(provider, provider_event_id)`.
- Stuck `processing` rows reclaim after 5 minutes (`last_attempt_at`).
- Replay from Stripe Dashboard → Webhooks → event → Resend.

### Resend

- Unauthorized without `RESEND_WEBHOOK_SECRET` in production.
- Delivery/open/click updates feed analytics and preference state.

## Database backups

1. Enable Supabase automatic backups (Pro) or configure PITR.
2. Before risky migrations, take a manual backup / snapshot.
3. Document restore owner + RTO/RPO in the incident runbook.
4. Periodically test restore into a throwaway project.

## Supplier outage

1. Pause new fulfillment routing if needed (feature flag / admin pause — coordinate with ops).
2. Communicate ETA to customers with open fulfillments.
3. Keep Stripe payment capture online; delay production only.
4. When supplier recovers, process queued fulfillments from supplier portal.

## Stripe outage

1. Checkout will fail open with Stripe errors — show friendly retry messaging.
2. Do not manually mark orders paid.
3. When Stripe recovers, rely on webhook delivery + reclaim logic.
4. Use Stripe Dashboard replay for missed events.

## Personal data retention

- Prefer soft-invalidation for nominations/votes.
- Honor account deletion / privacy requests via support process (export + delete plan TBD with counsel).
- Analytics properties forbid voter-choice keys.

## Audit trail

- Nomination/vote event tables, result runs, webhook_events, email_deliveries, and platform role changes provide operational auditability.
- Admin financial CSVs are access-controlled to platform admins.
