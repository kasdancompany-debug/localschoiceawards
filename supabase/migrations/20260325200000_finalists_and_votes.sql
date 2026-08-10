-- Finalists and secure voting.

-- Optional voting lock (admin can close ballots early without deleting history).
alter table public.campaigns
  add column if not exists voting_locked_at timestamptz;

-- Extend fraud_signals entity types for votes/finalists.
alter table public.fraud_signals
  drop constraint if exists fraud_signals_entity_type_check;

alter table public.fraud_signals
  add constraint fraud_signals_entity_type_check
  check (entity_type in (
    'nomination',
    'user',
    'business_location',
    'submission',
    'vote',
    'finalist'
  ));

create table if not exists public.finalists (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  business_location_id uuid not null references public.business_locations (id) on delete restrict,
  nomination_count_snapshot integer
    check (nomination_count_snapshot is null or nomination_count_snapshot >= 0),
  selection_method text not null
    check (selection_method in ('automatic', 'manual')),
  status text not null default 'proposed'
    check (status in ('proposed', 'approved', 'published', 'removed')),
  selected_at timestamptz,
  selected_by uuid references auth.users (id) on delete set null,
  admin_notes text,
  removal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finalists_removal_check check (
    (status = 'removed' and removal_reason is not null)
    or (status <> 'removed')
  )
);

create unique index if not exists finalists_unique_active_uidx
  on public.finalists (campaign_id, campaign_category_id, business_location_id)
  where status in ('proposed', 'approved', 'published');

create index if not exists finalists_campaign_status_idx
  on public.finalists (campaign_id, status, campaign_category_id);

create index if not exists finalists_location_idx
  on public.finalists (business_location_id, status);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  finalist_id uuid not null references public.finalists (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_email_hash text not null,
  status text not null default 'active'
    check (status in ('active', 'invalidated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invalidated_at timestamptz,
  invalidated_by uuid references auth.users (id) on delete set null,
  invalidation_reason text,
  constraint votes_invalidation_check check (
    (status = 'invalidated' and invalidated_at is not null)
    or (status = 'active' and invalidated_at is null)
  )
);

-- One active vote per user per category per campaign.
create unique index if not exists votes_unique_active_uidx
  on public.votes (campaign_id, campaign_category_id, user_id)
  where status = 'active';

create index if not exists votes_campaign_idx
  on public.votes (campaign_id, status, created_at desc);
create index if not exists votes_finalist_idx
  on public.votes (finalist_id, status);
create index if not exists votes_user_idx
  on public.votes (user_id, created_at desc);

create table if not exists public.vote_events (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created',
      'changed',
      'invalidated',
      'restored',
      'fraud_flagged',
      'exported'
    )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vote_events_vote_idx
  on public.vote_events (vote_id, created_at);

create or replace function public.set_finalists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists finalists_set_updated_at on public.finalists;
create trigger finalists_set_updated_at
  before update on public.finalists
  for each row execute function public.set_finalists_updated_at();

create or replace function public.set_votes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists votes_set_updated_at on public.votes;
create trigger votes_set_updated_at
  before update on public.votes
  for each row execute function public.set_votes_updated_at();

create or replace function public.is_voting_admin()
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

revoke all on function public.is_voting_admin() from public;
grant execute on function public.is_voting_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.finalists enable row level security;
alter table public.votes enable row level security;
alter table public.vote_events enable row level security;

drop policy if exists "Public can read published finalists" on public.finalists;
create policy "Public can read published finalists"
  on public.finalists for select
  to anon, authenticated
  using (status = 'published' or public.is_voting_admin());

drop policy if exists "Admins manage finalists" on public.finalists;
create policy "Admins manage finalists"
  on public.finalists for all
  to authenticated
  using (public.is_voting_admin())
  with check (public.is_voting_admin());

drop policy if exists "Business members can read finalists for their locations" on public.finalists;
create policy "Business members can read finalists for their locations"
  on public.finalists for select
  to authenticated
  using (
    exists (
      select 1
      from public.business_locations bl
      join public.business_memberships bm on bm.business_id = bl.business_id
      where bl.id = finalists.business_location_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

drop policy if exists "Users can read own votes" on public.votes;
create policy "Users can read own votes"
  on public.votes for select
  to authenticated
  using (user_id = auth.uid() or public.is_voting_admin());

drop policy if exists "Users can insert own votes" on public.votes;
create policy "Users can insert own votes"
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own active votes" on public.votes;
create policy "Users can update own active votes"
  on public.votes for update
  to authenticated
  using (user_id = auth.uid() and status = 'active')
  with check (user_id = auth.uid());

drop policy if exists "Admins manage votes" on public.votes;
create policy "Admins manage votes"
  on public.votes for all
  to authenticated
  using (public.is_voting_admin())
  with check (public.is_voting_admin());

drop policy if exists "Users can read own vote events" on public.vote_events;
create policy "Users can read own vote events"
  on public.vote_events for select
  to authenticated
  using (
    public.is_voting_admin()
    or exists (
      select 1 from public.votes v
      where v.id = vote_id and v.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert vote events for own votes" on public.vote_events;
create policy "Users can insert vote events for own votes"
  on public.vote_events for insert
  to authenticated
  with check (
    public.is_voting_admin()
    or exists (
      select 1 from public.votes v
      where v.id = vote_id and v.user_id = auth.uid()
    )
  );

drop policy if exists "Admins manage vote events" on public.vote_events;
create policy "Admins manage vote events"
  on public.vote_events for all
  to authenticated
  using (public.is_voting_admin())
  with check (public.is_voting_admin());
