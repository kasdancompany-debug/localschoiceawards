-- Multi-tenant geography and communities (replaces the Phase 0 communities stub)

create extension if not exists "pgcrypto";

-- Replace the early stub table if present.
drop table if exists public.communities cascade;

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  iso_code text not null unique check (char_length(iso_code) = 2),
  name text not null unique,
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  default_locale text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.administrative_regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete restrict,
  code text not null,
  name text not null,
  region_type text not null check (
    region_type in ('province', 'territory', 'state', 'district')
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, code)
);

create index if not exists administrative_regions_country_id_idx
  on public.administrative_regions (country_id);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete restrict,
  administrative_region_id uuid not null references public.administrative_regions (id) on delete restrict,
  name text not null,
  display_name text not null,
  subdomain text not null,
  slug text not null,
  community_type text not null check (
    community_type in (
      'city',
      'town',
      'township',
      'village',
      'municipality',
      'county',
      'region',
      'district',
      'borough',
      'neighbourhood',
      'metro',
      'association'
    )
  ),
  timezone text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  population integer check (population is null or population >= 0),
  market_status text not null check (
    market_status in (
      'planned',
      'preparing',
      'nominations',
      'voting',
      'auditing',
      'results',
      'archived',
      'paused'
    )
  ),
  is_public boolean not null default false,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_subdomain_format check (subdomain ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint communities_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint communities_subdomain_not_reserved check (
    subdomain not in (
      'www',
      'business',
      'account',
      'admin',
      'supplier',
      'api',
      'app',
      'support',
      'partners',
      'assets',
      'static',
      'mail'
    )
  )
);

create unique index if not exists communities_subdomain_unique_idx
  on public.communities (lower(subdomain));

create unique index if not exists communities_slug_unique_idx
  on public.communities (lower(slug));

create index if not exists communities_country_id_idx on public.communities (country_id);
create index if not exists communities_region_id_idx on public.communities (administrative_region_id);
create index if not exists communities_market_status_idx on public.communities (market_status);

create table if not exists public.community_aliases (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  constraint community_aliases_normalized_format check (
    normalized_alias ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint community_aliases_not_reserved check (
    normalized_alias not in (
      'www',
      'business',
      'account',
      'admin',
      'supplier',
      'api',
      'app',
      'support',
      'partners',
      'assets',
      'static',
      'mail'
    )
  )
);

create unique index if not exists community_aliases_normalized_unique_idx
  on public.community_aliases (lower(normalized_alias));

create index if not exists community_aliases_community_id_idx
  on public.community_aliases (community_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists countries_set_updated_at on public.countries;
create trigger countries_set_updated_at
  before update on public.countries
  for each row execute function public.set_updated_at();

drop trigger if exists administrative_regions_set_updated_at on public.administrative_regions;
create trigger administrative_regions_set_updated_at
  before update on public.administrative_regions
  for each row execute function public.set_updated_at();

drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

create or replace function public.normalize_community_label()
returns trigger
language plpgsql
as $$
begin
  new.subdomain := lower(trim(new.subdomain));
  new.slug := lower(trim(new.slug));
  return new;
end;
$$;

drop trigger if exists communities_normalize_label on public.communities;
create trigger communities_normalize_label
  before insert or update on public.communities
  for each row execute function public.normalize_community_label();

create or replace function public.normalize_community_alias()
returns trigger
language plpgsql
as $$
begin
  new.normalized_alias := lower(trim(new.normalized_alias));
  return new;
end;
$$;

drop trigger if exists community_aliases_normalize on public.community_aliases;
create trigger community_aliases_normalize
  before insert or update on public.community_aliases
  for each row execute function public.normalize_community_alias();

alter table public.countries enable row level security;
alter table public.administrative_regions enable row level security;
alter table public.communities enable row level security;
alter table public.community_aliases enable row level security;

drop policy if exists "Public can read active countries" on public.countries;
create policy "Public can read active countries"
  on public.countries
  for select
  using (active = true);

drop policy if exists "Public can read active regions" on public.administrative_regions;
create policy "Public can read active regions"
  on public.administrative_regions
  for select
  using (active = true);

drop policy if exists "Public can read public communities" on public.communities;
create policy "Public can read public communities"
  on public.communities
  for select
  using (
    is_public = true
    and market_status not in ('archived')
  );

drop policy if exists "Admins can read all communities" on public.communities;
create policy "Admins can read all communities"
  on public.communities
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(
      array['administrator', 'super_administrator', 'operations', 'support']
    )
  );

drop policy if exists "Public can read aliases for public communities" on public.community_aliases;
create policy "Public can read aliases for public communities"
  on public.community_aliases
  for select
  using (
    exists (
      select 1
      from public.communities c
      where c.id = community_id
        and c.is_public = true
        and c.market_status not in ('archived')
    )
  );
