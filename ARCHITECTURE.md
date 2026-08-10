# Architecture

Locals Choice Awards is a single Next.js App Router application that serves multiple product surfaces through route groups, subdomain rewriting, and shared server-side services.

## System boundaries

| Boundary | Responsibility | Location |
| --- | --- | --- |
| Public central website | Marketing, discovery, and apex-domain experience for `localschoiceawards.com` | `app/(main)` |
| Public community websites | City-specific awards UX for `*.localschoiceawards.com` | `app/(community)` + `proxy.ts` |
| Account area | Authenticated voter and business owner tools | `app/(account)` |
| Administration area | Platform operators: communities, seasons, moderation | `app/(admin)` |
| Supplier area | Award product inventory and fulfillment operators | `app/(supplier)` |
| API & webhooks | Machine interfaces (health, Stripe webhooks, future public APIs) | `app/api` |
| Shared UI | Reusable presentation components | `components` |
| Server services | Business logic that must not live in page files | `lib/**` |
| Database access | Supabase browser, server, and service-role clients | `lib/database` |
| Validation | Zod schemas shared by forms and APIs | `lib/validation` |
| Email | Resend client, React Email templates, and event-driven notification queue | `lib/email`, `lib/notifications`, `emails/` |
| Payments | Stripe client and webhook verification | `lib/payments` |
| Security | Turnstile verification and related controls | `lib/security` |
| Analytics | PostHog browser/server capture | `lib/analytics` |
| Types | Domain and generated-database types | `types` |
| Migrations | PostgreSQL schema evolution | `supabase/migrations` |
| Tests | Unit (Vitest) and end-to-end (Playwright) | `tests` |

## Multi-tenant community model

One codebase, many communities:

1. Apex / www hosts (`localschoiceawards.com`, `www.localschoiceawards.com`, `localhost:3000`) serve the central site.
2. `proxy.ts` parses the hostname, classifies main / community / business / admin / supplier / unknown, and rewrites internally without changing the browser URL.
3. Community hosts such as `saultstemarie.localschoiceawards.com` and `saultstemarie.localhost:3000` resolve through `getCurrentCommunity()` using only hostname context.
4. Geography lives in `countries`, `administrative_regions`, `communities`, and `community_aliases` (see multi-tenant migrations).
5. Reserved system labels (`www`, `business`, `account`, `admin`, `supplier`, `api`, `app`, `support`, `partners`, `assets`, `static`, `mail`) are never community tenants.
6. Shared services remain central; community-scoped data must always be filtered by the hostname-resolved community ID — never by a browser-supplied community ID.
7. Campaigns are one-per-community-per-year. Schedules are stored as timestamptz values created in the community timezone. Public results stay hidden until `results_publish_at` / published results state (`lib/campaigns`).
8. Public discovery loads communities through `/api/communities/search` so the homepage HTML does not embed the full directory. Search supports aliases and punctuation-insensitive matching, with PostHog/server analytics for searches, zero results, and clicks.
9. Business directory data lives in `businesses` / `business_locations` (community-scoped) with category assignments, moderation states, duplicate fingerprints, full-text search, and private `business-media` storage (`lib/businesses`).
10. Business claiming and team management live on `business.localschoiceawards.com` (`app/(business)`), sharing the same Auth and database. Memberships are RLS-scoped; claims require admin review and never auto-approve from public email alone.
11. Nominations (`nominations`, `nomination_events`, `fraud_signals`) are accepted only during an active nomination phase for verified users, with Turnstile, rate limits, community isolation, soft invalidation, and privacy-conscious fraud metadata (`lib/nominations`). Public surfaces never expose exact nomination totals.
12. Finalists and votes (`finalists`, `votes`, `vote_events`) support admin proposal/review/publish, one active vote per user per category (changeable until close), Turnstile, rate limits, voting locks, and soft invalidation (`lib/voting`). Public surfaces never expose live rankings or exact vote totals before results publish.
13. Audited results (`result_runs`, `results`, `award_eligibilities`, `award_assets`) compute placements from valid votes only, freeze rules snapshots, require admin approval before publication, and create personalized award eligibilities with securely stored digital assets (`lib/results`). Revoking eligibility never deletes historical results.
14. Commerce foundation (`products`, `product_variants`, `carts`, `cart_items`, `shipping_*`) provides a persistent server-side cart (anonymous httpOnly token or user-owned), eligibility-bound personalization snapshots, CAD/USD isolation, and expiring server-calculated shipping quotes as a separate line item (`lib/commerce`).
15. Orders and Stripe Checkout (`orders`, `order_items`, `payments`, `refunds`, `webhook_events`) create pending orders with frozen snapshots, recalculate prices/shipping server-side before Checkout, collect addresses, enable Automatic Tax, and mark payment paid only after verified idempotent webhooks (`lib/orders`, `app/api/webhooks/stripe`). Success pages never authorize payment. Admin refunds never restore revoked award eligibility.
16. Supplier fulfillment (`suppliers`, `supplier_products`, `fulfillments`, `shipments`, …) routes paid orders to CA/US suppliers by destination/availability/cost, generates protected artwork, submits via portal/email (API reserved), enforces idempotent production orders with RLS-scoped supplier access, records costs/margins, and emails tracking to customers (`lib/fulfillment`). Stripe Connect payouts are not implemented yet.
17. Notifications (`notification_events`, `email_templates`, `email_deliveries`, `notification_preferences`) are event-driven: domain actions enqueue events; a processor sends via Resend with retries, dedupe keys, preference gates, unsubscribe for marketing, and webhook status updates (`lib/notifications`). Pages never send email directly. Scraped public directory emails are never used for campaigns without consent/legal basis. Winner sales sequences stop when an order is placed.

Local hostname setup: `docs/LOCAL_MULTITENANT_HOSTS.md`.

## Auth and secrets

- Browser clients use the Supabase anon key only (`lib/database/supabase/client.ts`).
- Server Components / Route Handlers use the cookie-aware server client (`server.ts`).
- Privileged operations use the service-role client (`admin.ts`), marked with `server-only`.
- Environment validation splits public (`lib/env/client.ts`) and private (`lib/env/server.ts`) variables so the service-role key cannot enter client bundles.
- Authentication lives in `lib/auth` (session, roles, guards, server actions) with pages under `app/(auth)` and `/auth/callback`.
- Account, admin, and supplier layouts enforce access with server-side `requireUser` / `requirePlatformRole` — never client-only redirects.
- Platform roles and profile RLS are defined in `supabase/migrations/20260325130000_auth_profiles_and_roles.sql`.
- Bootstrap the first super administrator with `docs/SEED_SUPER_ADMIN.md`.

## Rendering rules

- Server Components are the default.
- Client Components are reserved for interactivity (forms, dialogs, error boundaries).
- Pages compose layouts and call services; they do not own business rules.
- Named exports are preferred except where Next.js requires a default export (`page`, `layout`, `error`, `loading`, `not-found`, route handlers).

## External systems

- **Supabase** — PostgreSQL, Auth, Storage
- **Stripe** — payments and webhooks
- **Resend** — transactional and operational email via event queue + React Email templates
- **Cloudflare Turnstile** — bot protection
- **Sentry** — error monitoring
- **PostHog** — product analytics
