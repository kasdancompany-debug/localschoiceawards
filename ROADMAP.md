# Roadmap

Phased delivery plan for Locals Choice Awards after the production foundation.

## Phase 0 — Foundation (complete)

- Single Next.js application with route groups
- Env validation, Supabase clients, shadcn/ui, tooling, docs
- Placeholder layouts for public, account, admin, and supplier surfaces

## Phase 1 — Identity and communities

- [x] Supabase Auth (email/password, magic link, Google OAuth, password reset, email verification)
- [x] Platform roles with RLS, audit log, and server-side route guards
- [x] Profile auto-provisioning for new auth users
- [x] Hostname-aware multi-tenant routing with wildcard community subdomains
- [x] Countries, regions, communities, aliases, and pilot market seed
- [ ] Community CRUD in admin
- [ ] Community memberships beyond platform roles

## Phase 2 — Campaigns and categories

- [x] Campaign templates, campaigns, phases, and category taxonomy
- [x] One campaign per community per year with timezone-aware schedules
- [x] Server-side campaign state resolver (status + dates)
- [x] Local category overrides per campaign
- [x] Starter taxonomy seed (~15 groups / 100+ master categories) and SSM 2027 pilot
- [x] Polished public main-domain and community-domain interfaces
- [x] Business directory (locations, categories, search, submissions, CSV import)
- [x] Business claiming, memberships, invitations, and business portal
- [x] Nominations workflow (public nominate UX, business campaign tools, admin moderation)
- [x] Voting workflow (finalist selection, secure ballots, business/admin tools)
- [x] Business claim / ownership tooling

## Phase 3 — Voting

- [x] Ballot creation and submission
- [x] One-person / anti-fraud controls with Turnstile
- [x] Vote tallies and audit trails
- [x] Results publishing workflow

## Phase 4 — Commerce and sponsorships

- [x] Commerce foundation: catalog, persistent carts (anonymous + authenticated), eligibility-bound personalization, server-side shipping quotes
- [x] Stripe Checkout for award products with pending orders, webhook-confirmed payment, admin refunds
- [x] Webhook-driven order state machine (idempotent Stripe events)
- [x] Event-driven notifications via Resend (queue, retries, dedupe, preferences, unsubscribe, delivery webhooks)
- Invoices and receipts PDF generation (future)

## Phase 5 — Fulfillment

- [x] Supplier portal order queue (accept/reject/production/ship + remakes)
- [x] Drop-ship routing, protected artwork, structured email + portal submission
- [x] Tracking updates and customer notifications
- Shipping carrier label APIs (future)

## Phase 6 — Operations and scale

- [x] Admin notification dashboard (queue, retries, bounces, template preview)
- Admin moderation queues and audit logs
- PostHog funnels and Sentry release health
- Performance budgets for thousands of communities
- CDN / image / storage hardening

## Phase 7 — Expansion

- Bulk community onboarding tools
- Localization (EN/FR) for Canadian markets
- Partner and media reporting exports
