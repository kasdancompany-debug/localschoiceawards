-- Nomination system: nominations, events, fraud signals.

create table if not exists public.nominations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  business_location_id uuid references public.business_locations (id) on delete restrict,
  business_submission_request_id uuid references public.business_submission_requests (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_email_hash text not null,
  status text not null default 'valid'
    check (status in ('valid', 'pending_business_moderation', 'invalidated')),
  source text not null default 'web'
    check (source in ('web', 'admin', 'import')),
  created_at timestamptz not null default now(),
  invalidated_at timestamptz,
  invalidated_by uuid references auth.users (id) on delete set null,
  invalidation_reason text,
  constraint nominations_target_check check (
    business_location_id is not null
    or business_submission_request_id is not null
  ),
  constraint nominations_invalidation_check check (
    (status = 'invalidated' and invalidated_at is not null)
    or (status <> 'invalidated' and invalidated_at is null)
  )
);

-- One active nomination per user + location + category + campaign
create unique index if not exists nominations_unique_active_location_uidx
  on public.nominations (campaign_id, campaign_category_id, business_location_id, user_id)
  where business_location_id is not null
    and status in ('valid', 'pending_business_moderation');

create unique index if not exists nominations_unique_active_submission_uidx
  on public.nominations (campaign_id, campaign_category_id, business_submission_request_id, user_id)
  where business_submission_request_id is not null
    and status in ('valid', 'pending_business_moderation');

create index if not exists nominations_campaign_idx
  on public.nominations (campaign_id, status, created_at desc);
create index if not exists nominations_category_idx
  on public.nominations (campaign_category_id, status);
create index if not exists nominations_user_idx
  on public.nominations (user_id, created_at desc);
create index if not exists nominations_location_idx
  on public.nominations (business_location_id, status)
  where business_location_id is not null;

create table if not exists public.nomination_events (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references public.nominations (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created',
      'invalidated',
      'restored',
      'business_moderated',
      'fraud_flagged',
      'exported'
    )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nomination_events_nomination_idx
  on public.nomination_events (nomination_id, created_at);

create table if not exists public.fraud_signals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('nomination', 'user', 'business_location', 'submission')),
  entity_id uuid not null,
  signal_type text not null
    check (signal_type in (
      'rapid_fire',
      'duplicate_attempt',
      'turnstile_failure',
      'closed_phase_attempt',
      'cross_community_attempt',
      'unverified_user',
      'manual_review'
    )),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed', 'confirmed')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists fraud_signals_campaign_idx
  on public.fraud_signals (campaign_id, status, created_at desc);
create index if not exists fraud_signals_entity_idx
  on public.fraud_signals (entity_type, entity_id);

-- Reuse rate-limit table for nomination actions (action is free text).
-- Helpers

create or replace function public.is_nomination_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_platform_role(
    array['administrator', 'super_administrator', 'operations', 'moderator']
  );
$$;

revoke all on function public.is_nomination_admin() from public;
grant execute on function public.is_nomination_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.nominations enable row level security;
alter table public.nomination_events enable row level security;
alter table public.fraud_signals enable row level security;

drop policy if exists "Users can read own nominations" on public.nominations;
create policy "Users can read own nominations"
  on public.nominations for select
  to authenticated
  using (user_id = auth.uid() or public.is_nomination_admin());

drop policy if exists "Users can create own nominations" on public.nominations;
create policy "Users can create own nominations"
  on public.nominations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Admins manage nominations" on public.nominations;
create policy "Admins manage nominations"
  on public.nominations for all
  to authenticated
  using (public.is_nomination_admin())
  with check (public.is_nomination_admin());

-- Business members can see whether their location has been nominated (no totals)
drop policy if exists "Business members can read nominations for their locations" on public.nominations;
create policy "Business members can read nominations for their locations"
  on public.nominations for select
  to authenticated
  using (
    business_location_id is not null
    and exists (
      select 1
      from public.business_locations bl
      join public.business_memberships bm on bm.business_id = bl.business_id
      where bl.id = nominations.business_location_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

drop policy if exists "Users can read own nomination events" on public.nomination_events;
create policy "Users can read own nomination events"
  on public.nomination_events for select
  to authenticated
  using (
    public.is_nomination_admin()
    or exists (
      select 1 from public.nominations n
      where n.id = nomination_id and n.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage nomination events" on public.nomination_events;
create policy "Admins manage nomination events"
  on public.nomination_events for all
  to authenticated
  using (public.is_nomination_admin())
  with check (public.is_nomination_admin());

drop policy if exists "System can insert nomination events" on public.nomination_events;
create policy "Authenticated can insert nomination events for own nominations"
  on public.nomination_events for insert
  to authenticated
  with check (
    public.is_nomination_admin()
    or exists (
      select 1 from public.nominations n
      where n.id = nomination_id and n.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage fraud signals" on public.fraud_signals;
create policy "Admins manage fraud signals"
  on public.fraud_signals for all
  to authenticated
  using (public.is_nomination_admin())
  with check (public.is_nomination_admin());
