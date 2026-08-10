# Cursor rules — Locals Choice Awards

Follow these rules in every future coding session for this repository.

## Product context

- Platform: Locals Choice Awards
- Model: one Next.js app, many North American communities via subdomains
- Do not split into multiple repositories without an explicit product decision

## Stack

- Next.js App Router (current stable), TypeScript strict mode, Tailwind CSS, shadcn/ui
- Supabase (PostgreSQL, Auth, Storage), Zod, React Hook Form
- Stripe, Resend, Cloudflare Turnstile, Sentry, PostHog
- Vitest (unit), Playwright (e2e), ESLint, Prettier

## Architecture

- Prefer Server Components; add `"use client"` only for browser interactivity
- Keep business logic in `lib/**` services — not inside `page.tsx` files
- Put validation in `lib/validation`
- Put database access behind `lib/database` clients
- Route groups stay focused: `(main)`, `(community)`, `(account)`, `(admin)`, `(supplier)`, `api`

## Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` (or any secret) to client code
- Import privileged helpers only from modules marked `server-only`
- Never use mock authentication; integrate real Supabase Auth
- Protect account/admin/supplier routes with server-side `requireUser` / `requirePlatformRole`
- Do not treat client redirects as a security boundary
- Resolve community tenancy from hostname via `getCurrentCommunity` — never trust a browser-supplied community ID
- Validate all external input with Zod
- Rate-limit login, registration, and password-reset attempts
- Verify Stripe webhooks with the signing secret
- Verify Turnstile tokens server-side before accepting public forms
- Change platform roles only through audited `grant_platform_role` / `revoke_platform_role` paths

## TypeScript and linting

- `strict` remains enabled
- Do not use `any`
- Do not silence TypeScript or ESLint with broad ignores or `eslint-disable` unless the reason is documented and narrowly scoped
- Prefer named exports except where the framework requires default exports

## UI

- Reuse shared components in `components/` and shadcn primitives in `components/ui`
- Match existing visual language; avoid introducing a second design system
- Keep placeholders honest — no fake authenticated state

## Data and migrations

- Schema changes go in `supabase/migrations`
- Update `types/database.ts` (or regenerate types) when the schema changes
- Assume RLS is required for every user-facing table

## Testing and quality gates

- Add Vitest coverage for pure domain helpers and schemas
- Add Playwright coverage for critical user journeys when features ship
- Before finishing substantial work: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when relevant

## Comments and docs

- Comment only non-obvious decisions
- Keep README / ARCHITECTURE / ROADMAP accurate when boundaries change
- Do not commit secrets; update `.env.example` when new env vars are introduced

## Next.js version notes

This project may include Next.js agent guidance in `AGENTS.md`. When APIs differ from older training data, read the bundled docs under `node_modules/next/dist/docs/` before implementing.
