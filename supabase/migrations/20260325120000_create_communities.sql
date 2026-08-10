-- Locals Choice Awards — initial schema placeholder
-- Apply with the Supabase CLI once a project is linked:
--   supabase db push
--
-- This migration establishes the communities table that underpins
-- subdomain routing (e.g. sudbury.localschoiceawards.com).

create extension if not exists "pgcrypto";

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null check (country in ('CA', 'US')),
  region text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communities_slug_idx on public.communities (slug);
create index if not exists communities_country_idx on public.communities (country);

alter table public.communities enable row level security;

create policy "Public can read active communities"
  on public.communities
  for select
  using (is_active = true);
