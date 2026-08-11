# Locals Choice Awards

North American community voting and business awards platform. One Next.js application serves the central site, community subdomains, account area, administration, supplier portal, and APIs.

## Prerequisites

- Node.js 22+ (Node 24 works)
- npm 11+
- A Supabase project (PostgreSQL, Auth, Storage)
- Stripe, Resend, Cloudflare Turnstile accounts
- Optional: Sentry and PostHog projects

## Local installation

1. Clone the repository and enter the project directory:

```bash
cd LocalsChoice
```

2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers (first time only):

```bash
npx playwright install chromium
```

4. Create your local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

5. Edit `.env.local` and replace every placeholder with real project values. At minimum you need Supabase, Stripe, Resend, and Turnstile keys for full runtime features.

6. Apply database migrations in your Supabase project (SQL editor or Supabase CLI):

```bash
# After linking a Supabase project
npx supabase db push
```

Or run these SQL files in order in the Supabase SQL editor:

1. `supabase/migrations/20260325120000_create_communities.sql` (legacy stub; superseded later)
2. `supabase/migrations/20260325130000_auth_profiles_and_roles.sql`
3. `supabase/migrations/20260325140000_multi_tenant_communities.sql`
4. `supabase/migrations/20260325140001_seed_geography_and_pilots.sql`
5. `supabase/migrations/20260325150000_campaigns_and_categories.sql`
6. `supabase/migrations/20260325150001_seed_campaigns_and_categories.sql`
7. `supabase/migrations/20260325160000_public_lead_capture.sql`
8. `supabase/migrations/20260325170000_business_directory.sql`
9. `supabase/migrations/20260325180000_business_claims_and_memberships.sql`
10. `supabase/migrations/20260325190000_nominations.sql`
11. `supabase/migrations/20260325200000_finalists_and_votes.sql`
12. `supabase/migrations/20260325210000_results_and_eligibilities.sql`
13. `supabase/migrations/20260325220000_commerce_foundation.sql`
14. `supabase/migrations/20260325220001_seed_commerce_catalog.sql`
15. `supabase/migrations/20260325230000_orders_and_payments.sql`
16. `supabase/migrations/20260325240000_supplier_fulfillment.sql`
17. `supabase/migrations/20260325240001_seed_suppliers.sql`
18. `supabase/migrations/20260325250000_notifications.sql`
19. `supabase/migrations/20260325250001_seed_email_templates.sql`

7. In the Supabase dashboard, enable Email, Magic Link, and Google providers. Add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://localschoiceawards.com/auth/callback`

8. Start the development server:

```bash
npm run dev
```

9. Open [http://localhost:3000](http://localhost:3000) and try pilot community hosts such as [http://saultstemarie.localhost:3000](http://saultstemarie.localhost:3000). See [`docs/LOCAL_MULTITENANT_HOSTS.md`](docs/LOCAL_MULTITENANT_HOSTS.md) for wildcard and hosts-file options.

10. After creating your first account, promote it safely with [`docs/SEED_SUPER_ADMIN.md`](docs/SEED_SUPER_ADMIN.md).

## Package scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript (`tsc --noEmit`) |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run format` | Format with Prettier |

## Project map

- `app/(main)` — public central website
- `app/(auth)` — login, register, password reset, email verification
- `app/(community)` — public community websites (hostname-resolved)
- `app/(business)` — reserved business host surface
- `app/(account)` — authenticated user and business account area
- `app/(admin)` — administration area (platform role required)
- `app/(supplier)` — supplier area (platform role required)
- `app/api` — API routes and webhooks
- `app/auth/callback` — Supabase OAuth / magic-link callback
- `components` — shared UI
- `lib` — server services, clients, validation
- `types` — shared TypeScript types
- `supabase/migrations` — database migrations
- `docs` — operational runbooks (including super-admin seed)
- `tests` — unit and e2e tests

See `ARCHITECTURE.md`, `ROADMAP.md`, and `CURSOR_RULES.md` for system boundaries, upcoming phases, and coding rules.

## Build without secrets

CI or local production builds can set `SKIP_ENV_VALIDATION=true` when secrets are intentionally unavailable. Do not use that flag in production deployments.

On Vercel, add the variables from `.env.example` under **Project → Settings → Environment Variables** for Production and Preview (at minimum all `NEXT_PUBLIC_*` keys plus server secrets). `NEXT_PUBLIC_*` values are baked in at build time — a redeploy is required after changing them.
