-- Campaign and category engine

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Templates & campaigns
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  default_nomination_days integer not null check (default_nomination_days > 0),
  default_review_days integer not null check (default_review_days > 0),
  default_voting_days integer not null check (default_voting_days > 0),
  default_audit_days integer not null check (default_audit_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete restrict,
  campaign_template_id uuid references public.campaign_templates (id) on delete set null,
  year integer not null check (year >= 2000 and year <= 2100),
  name text not null,
  status text not null check (
    status in (
      'draft',
      'scheduled',
      'nominations_open',
      'nominations_closed',
      'finalist_review',
      'voting_open',
      'voting_closed',
      'auditing',
      'results_scheduled',
      'results_published',
      'archived',
      'cancelled'
    )
  ),
  nomination_opens_at timestamptz not null,
  nomination_closes_at timestamptz not null,
  finalist_review_closes_at timestamptz not null,
  voting_opens_at timestamptz not null,
  voting_closes_at timestamptz not null,
  results_publish_at timestamptz not null,
  timezone text not null,
  exact_vote_totals_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint campaigns_community_year_unique unique (community_id, year),
  constraint campaigns_date_order check (
    nomination_opens_at < nomination_closes_at
    and nomination_closes_at <= finalist_review_closes_at
    and finalist_review_closes_at <= voting_opens_at
    and voting_opens_at < voting_closes_at
    and voting_closes_at <= results_publish_at
  )
);

create index if not exists campaigns_community_id_idx on public.campaigns (community_id);
create index if not exists campaigns_year_idx on public.campaigns (year);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_community_year_status_idx
  on public.campaigns (community_id, year, status);

create table if not exists public.campaign_phases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  phase text not null check (
    phase in ('nomination', 'finalist_review', 'voting', 'audit', 'results')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (
    status in ('scheduled', 'active', 'completed', 'skipped', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_phases_unique unique (campaign_id, phase),
  constraint campaign_phases_date_order check (starts_at < ends_at)
);

create index if not exists campaign_phases_campaign_id_idx on public.campaign_phases (campaign_id);
create index if not exists campaign_phases_status_idx on public.campaign_phases (status);

-- ---------------------------------------------------------------------------
-- Category taxonomy
-- ---------------------------------------------------------------------------

create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_groups_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists category_groups_display_order_idx
  on public.category_groups (display_order);

create table if not exists public.master_categories (
  id uuid primary key default gen_random_uuid(),
  category_group_id uuid not null references public.category_groups (id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null default '',
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint master_categories_group_slug_unique unique (category_group_id, slug)
);

create index if not exists master_categories_group_id_idx
  on public.master_categories (category_group_id);
create index if not exists master_categories_slug_idx on public.master_categories (slug);
create index if not exists master_categories_active_idx on public.master_categories (active);

create table if not exists public.campaign_categories (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  master_category_id uuid not null references public.master_categories (id) on delete restrict,
  local_name text,
  local_slug text,
  local_description text,
  finalist_limit integer not null default 5 check (finalist_limit > 0),
  minimum_nomination_count integer not null default 1 check (minimum_nomination_count >= 0),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_categories_unique_master unique (campaign_id, master_category_id),
  constraint campaign_categories_local_slug_format check (
    local_slug is null or local_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create unique index if not exists campaign_categories_local_slug_unique_idx
  on public.campaign_categories (campaign_id, lower(local_slug))
  where local_slug is not null;

create index if not exists campaign_categories_campaign_id_idx
  on public.campaign_categories (campaign_id);
create index if not exists campaign_categories_master_id_idx
  on public.campaign_categories (master_category_id);
create index if not exists campaign_categories_active_idx
  on public.campaign_categories (campaign_id, active);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_change_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  community_id uuid references public.communities (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  entity_type text not null check (
    entity_type in (
      'campaign_template',
      'campaign',
      'campaign_phase',
      'category_group',
      'master_category',
      'campaign_category'
    )
  ),
  entity_id uuid,
  action text not null check (action in ('created', 'updated', 'deleted', 'published', 'archived', 'status_changed')),
  summary text not null default '',
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaign_change_audit_log_campaign_idx
  on public.campaign_change_audit_log (campaign_id, created_at desc);
create index if not exists campaign_change_audit_log_community_idx
  on public.campaign_change_audit_log (community_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists campaign_templates_set_updated_at on public.campaign_templates;
create trigger campaign_templates_set_updated_at
  before update on public.campaign_templates
  for each row execute function public.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists campaign_phases_set_updated_at on public.campaign_phases;
create trigger campaign_phases_set_updated_at
  before update on public.campaign_phases
  for each row execute function public.set_updated_at();

drop trigger if exists category_groups_set_updated_at on public.category_groups;
create trigger category_groups_set_updated_at
  before update on public.category_groups
  for each row execute function public.set_updated_at();

drop trigger if exists master_categories_set_updated_at on public.master_categories;
create trigger master_categories_set_updated_at
  before update on public.master_categories
  for each row execute function public.set_updated_at();

drop trigger if exists campaign_categories_set_updated_at on public.campaign_categories;
create trigger campaign_categories_set_updated_at
  before update on public.campaign_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_campaign_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_platform_role(
    array['administrator', 'super_administrator', 'operations']
  );
$$;

revoke all on function public.is_campaign_admin() from public;
grant execute on function public.is_campaign_admin() to authenticated;

create or replace function public.record_campaign_audit(
  p_community_id uuid,
  p_campaign_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_summary text,
  p_before jsonb default '{}'::jsonb,
  p_after jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_campaign_admin() then
    raise exception 'Not authorized to write campaign audit events';
  end if;

  insert into public.campaign_change_audit_log (
    actor_user_id,
    community_id,
    campaign_id,
    entity_type,
    entity_id,
    action,
    summary,
    before_data,
    after_data
  )
  values (
    auth.uid(),
    p_community_id,
    p_campaign_id,
    p_entity_type,
    p_entity_id,
    p_action,
    coalesce(p_summary, ''),
    coalesce(p_before, '{}'::jsonb),
    coalesce(p_after, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.record_campaign_audit(uuid, uuid, text, uuid, text, text, jsonb, jsonb) from public;
grant execute on function public.record_campaign_audit(uuid, uuid, text, uuid, text, text, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.campaign_templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_phases enable row level security;
alter table public.category_groups enable row level security;
alter table public.master_categories enable row level security;
alter table public.campaign_categories enable row level security;
alter table public.campaign_change_audit_log enable row level security;

-- Templates
drop policy if exists "Public can read active campaign templates" on public.campaign_templates;
create policy "Public can read active campaign templates"
  on public.campaign_templates for select
  using (active = true or public.is_campaign_admin());

drop policy if exists "Admins manage campaign templates" on public.campaign_templates;
create policy "Admins manage campaign templates"
  on public.campaign_templates for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

-- Campaigns: public may read published campaign info (not draft/cancelled)
drop policy if exists "Public can read published campaigns" on public.campaigns;
create policy "Public can read published campaigns"
  on public.campaigns for select
  using (
    public.is_campaign_admin()
    or (
      published_at is not null
      and status not in ('draft', 'cancelled')
      and exists (
        select 1 from public.communities c
        where c.id = community_id
          and c.is_public = true
          and c.market_status <> 'archived'
      )
    )
  );

drop policy if exists "Admins manage campaigns" on public.campaigns;
create policy "Admins manage campaigns"
  on public.campaigns for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

-- Phases follow campaign visibility
drop policy if exists "Public can read phases for published campaigns" on public.campaign_phases;
create policy "Public can read phases for published campaigns"
  on public.campaign_phases for select
  using (
    public.is_campaign_admin()
    or exists (
      select 1 from public.campaigns camp
      where camp.id = campaign_id
        and camp.published_at is not null
        and camp.status not in ('draft', 'cancelled')
    )
  );

drop policy if exists "Admins manage campaign phases" on public.campaign_phases;
create policy "Admins manage campaign phases"
  on public.campaign_phases for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

-- Category groups & master categories
drop policy if exists "Public can read active category groups" on public.category_groups;
create policy "Public can read active category groups"
  on public.category_groups for select
  using (active = true or public.is_campaign_admin());

drop policy if exists "Admins manage category groups" on public.category_groups;
create policy "Admins manage category groups"
  on public.category_groups for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

drop policy if exists "Public can read active master categories" on public.master_categories;
create policy "Public can read active master categories"
  on public.master_categories for select
  using (active = true or public.is_campaign_admin());

drop policy if exists "Admins manage master categories" on public.master_categories;
create policy "Admins manage master categories"
  on public.master_categories for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

-- Campaign categories: public only for published campaigns; local labels OK
drop policy if exists "Public can read active campaign categories" on public.campaign_categories;
create policy "Public can read active campaign categories"
  on public.campaign_categories for select
  using (
    public.is_campaign_admin()
    or (
      active = true
      and exists (
        select 1 from public.campaigns camp
        where camp.id = campaign_id
          and camp.published_at is not null
          and camp.status not in ('draft', 'cancelled')
      )
    )
  );

drop policy if exists "Admins manage campaign categories" on public.campaign_categories;
create policy "Admins manage campaign categories"
  on public.campaign_categories for all
  to authenticated
  using (public.is_campaign_admin())
  with check (public.is_campaign_admin());

-- Audit log: admins only
drop policy if exists "Admins can read campaign audit log" on public.campaign_change_audit_log;
create policy "Admins can read campaign audit log"
  on public.campaign_change_audit_log for select
  to authenticated
  using (public.is_campaign_admin());
