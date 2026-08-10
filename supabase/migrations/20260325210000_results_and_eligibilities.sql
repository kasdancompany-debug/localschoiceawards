-- Audited results, winner eligibility, and secure award assets.

create table if not exists public.result_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  status text not null default 'draft'
    check (status in (
      'draft',
      'computing',
      'pending_approval',
      'approved',
      'published',
      'superseded',
      'cancelled'
    )),
  rules_snapshot jsonb not null default '{}'::jsonb,
  started_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one published run per campaign.
create unique index if not exists result_runs_one_published_uidx
  on public.result_runs (campaign_id)
  where status = 'published';

create index if not exists result_runs_campaign_idx
  on public.result_runs (campaign_id, status, started_at desc);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  result_run_id uuid not null references public.result_runs (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  finalist_id uuid not null references public.finalists (id) on delete restrict,
  business_location_id uuid not null references public.business_locations (id) on delete restrict,
  valid_vote_count integer not null check (valid_vote_count >= 0),
  placement text not null
    check (placement in ('platinum', 'gold', 'silver', 'bronze')),
  tied boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists results_run_finalist_uidx
  on public.results (result_run_id, finalist_id);

create index if not exists results_campaign_published_idx
  on public.results (campaign_id, published, campaign_category_id);

create index if not exists results_location_idx
  on public.results (business_location_id, published);

create table if not exists public.award_eligibilities (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  business_location_id uuid not null references public.business_locations (id) on delete restrict,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  placement text not null
    check (placement in ('platinum', 'gold', 'silver', 'bronze')),
  eligibility_status text not null default 'active'
    check (eligibility_status in ('active', 'revoked')),
  personalized_business_name text not null,
  personalized_community_name text not null,
  personalized_category_name text not null,
  personalized_campaign_year integer not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revocation_reason text,
  constraint award_eligibilities_revocation_check check (
    (eligibility_status = 'revoked' and revoked_at is not null and revocation_reason is not null)
    or (eligibility_status = 'active' and revoked_at is null)
  )
);

create unique index if not exists award_eligibilities_active_result_uidx
  on public.award_eligibilities (result_id)
  where eligibility_status = 'active';

create index if not exists award_eligibilities_business_idx
  on public.award_eligibilities (business_id, eligibility_status, created_at desc);

create table if not exists public.result_run_events (
  id uuid primary key default gen_random_uuid(),
  result_run_id uuid not null references public.result_runs (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'started',
      'computed',
      'approved',
      'published',
      'superseded',
      'cancelled',
      'eligibility_created',
      'eligibility_revoked',
      'assets_generated'
    )),
  actor_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists result_run_events_run_idx
  on public.result_run_events (result_run_id, created_at);

create table if not exists public.award_assets (
  id uuid primary key default gen_random_uuid(),
  award_eligibility_id uuid not null references public.award_eligibilities (id) on delete cascade,
  asset_type text not null
    check (asset_type in (
      'badge_png',
      'square_svg',
      'story_svg',
      'certificate_pdf',
      'qr_png'
    )),
  storage_path text not null,
  content_type text not null,
  created_at timestamptz not null default now(),
  unique (award_eligibility_id, asset_type)
);

create index if not exists award_assets_eligibility_idx
  on public.award_assets (award_eligibility_id);

-- Private storage for award digital assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'award-assets',
  'award-assets',
  false,
  10485760,
  array['image/png', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do nothing;

create or replace function public.set_result_runs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists result_runs_set_updated_at on public.result_runs;
create trigger result_runs_set_updated_at
  before update on public.result_runs
  for each row execute function public.set_result_runs_updated_at();

create or replace function public.set_results_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists results_set_updated_at on public.results;
create trigger results_set_updated_at
  before update on public.results
  for each row execute function public.set_results_updated_at();

create or replace function public.is_results_admin()
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

revoke all on function public.is_results_admin() from public;
grant execute on function public.is_results_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.result_runs enable row level security;
alter table public.results enable row level security;
alter table public.award_eligibilities enable row level security;
alter table public.result_run_events enable row level security;
alter table public.award_assets enable row level security;

drop policy if exists "Admins manage result runs" on public.result_runs;
create policy "Admins manage result runs"
  on public.result_runs for all
  to authenticated
  using (public.is_results_admin())
  with check (public.is_results_admin());

drop policy if exists "Public can read published results" on public.results;
create policy "Public can read published results"
  on public.results for select
  to anon, authenticated
  using (published = true or public.is_results_admin());

drop policy if exists "Admins manage results" on public.results;
create policy "Admins manage results"
  on public.results for all
  to authenticated
  using (public.is_results_admin())
  with check (public.is_results_admin());

drop policy if exists "Public can read active award eligibilities" on public.award_eligibilities;
create policy "Public can read active award eligibilities"
  on public.award_eligibilities for select
  to anon, authenticated
  using (
    eligibility_status = 'active'
    or public.is_results_admin()
    or exists (
      select 1 from public.business_memberships bm
      where bm.business_id = award_eligibilities.business_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

drop policy if exists "Admins manage award eligibilities" on public.award_eligibilities;
create policy "Admins manage award eligibilities"
  on public.award_eligibilities for all
  to authenticated
  using (public.is_results_admin())
  with check (public.is_results_admin());

drop policy if exists "Admins manage result run events" on public.result_run_events;
create policy "Admins manage result run events"
  on public.result_run_events for all
  to authenticated
  using (public.is_results_admin())
  with check (public.is_results_admin());

drop policy if exists "Members can read own award assets metadata" on public.award_assets;
create policy "Members can read own award assets metadata"
  on public.award_assets for select
  to authenticated
  using (
    public.is_results_admin()
    or exists (
      select 1
      from public.award_eligibilities ae
      join public.business_memberships bm on bm.business_id = ae.business_id
      where ae.id = award_assets.award_eligibility_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

drop policy if exists "Admins manage award assets" on public.award_assets;
create policy "Admins manage award assets"
  on public.award_assets for all
  to authenticated
  using (public.is_results_admin())
  with check (public.is_results_admin());

drop policy if exists "Award assets storage admin read" on storage.objects;
-- Storage policies for award-assets bucket
drop policy if exists "Admins manage award-assets objects" on storage.objects;
create policy "Admins manage award-assets objects"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'award-assets'
    and public.is_results_admin()
  )
  with check (
    bucket_id = 'award-assets'
    and public.is_results_admin()
  );
