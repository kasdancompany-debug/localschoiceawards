# Security

Locals Choice Awards security model for operators and reviewers.

## Authentication

- Supabase Auth issues sessions; server layouts use `requireUser` / cookie-aware clients.
- Browser clients never receive the service-role key (`lib/env/client.ts` vs `lib/env/server.ts`).
- Auth endpoints are rate-limited (`login`, `register`, `password_reset`).
- Cloudflare Turnstile protects nominations, votes, and other public writes.

## Authorization & tenancy

| Boundary | Enforcement |
| --- | --- |
| Platform admin | `requirePlatformRole` + RLS helpers such as `is_results_admin` / `current_user_has_platform_role` |
| Community isolation | Hostname → `getCurrentCommunity()`; never trust client-supplied community IDs for writes |
| Business isolation | `business_memberships` + RLS; portal actions call `requireBusinessMembership` |
| Supplier isolation | Supplier memberships + RLS; immutable cost/routing columns blocked by trigger |
| Award eligibility | Public SELECT limited to rows tied to **published** results |

## Payments & webhooks

- Stripe Checkout line items are built server-side from catalog prices and shipping quotes.
- Orders are marked paid only from verified Stripe webhooks (`STRIPE_WEBHOOK_SECRET`).
- Success pages never authorize payment.
- Webhook processing is idempotent; stuck `processing` events reclaim after 5 minutes.
- Resend webhooks require `RESEND_WEBHOOK_SECRET` in production (shared secret or Svix HMAC).
- Notification cron accepts Bearer `NOTIFICATIONS_CRON_SECRET` / `CRON_SECRET` only in production (no query-string secrets).

## Uploads & XSS

- Business media uploads require allowed content-type at signed-URL creation.
- Registration verifies object size and decoded image format via Sharp (MIME is not trusted alone).
- Storage paths must be under `{businessId}/`.
- User-facing strings should remain escaped by React; avoid `dangerouslySetInnerHTML` for untrusted content.

## Analytics

- Public `/api/analytics/track` accepts an allowlisted event set only.
- Server-only events (`funnel.order_paid`, email delivery, etc.) cannot be forged from the browser.
- Endpoint is rate-limited; properties strip voter-choice keys.

## Secrets

Required production secrets (never commit):

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`
- `NOTIFICATIONS_CRON_SECRET` / `CRON_SECRET`
- `UNSUBSCRIBE_TOKEN_SECRET`
- `TURNSTILE_SECRET_KEY`

Unsubscribe tokens are HMAC-signed; production refuses hardcoded fallbacks.

## Data protection

- Prefer soft-invalidation over hard deletes for nominations/votes/results history.
- Refunds never restore revoked award eligibility.
- Scraped directory emails must not receive marketing without consent/legal basis.
- Do not log raw payment payloads, passwords, magic-link tokens, or full card data.

## Reporting issues

Email security findings to the platform operators. Do not open public GitHub issues for active vulnerabilities until fixed.
