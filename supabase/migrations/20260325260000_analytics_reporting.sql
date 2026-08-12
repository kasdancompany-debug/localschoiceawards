-- First-party analytics events and daily metric rollups.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  community_id uuid references public.communities (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  business_id uuid references public.businesses (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  anonymous_id text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists analytics_events_occurred_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_name_occurred_idx
  on public.analytics_events (event_name, occurred_at desc);

create index if not exists analytics_events_business_occurred_idx
  on public.analytics_events (business_id, occurred_at desc)
  where business_id is not null;

create index if not exists analytics_events_community_occurred_idx
  on public.analytics_events (community_id, occurred_at desc)
  where community_id is not null;

create table if not exists public.business_profile_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  business_location_id uuid references public.business_locations (id) on delete set null,
  date date not null,
  profile_views integer not null default 0 check (profile_views >= 0),
  website_clicks integer not null default 0 check (website_clicks >= 0),
  phone_clicks integer not null default 0 check (phone_clicks >= 0),
  direction_clicks integer not null default 0 check (direction_clicks >= 0),
  nomination_link_clicks integer not null default 0 check (nomination_link_clicks >= 0),
  voting_link_clicks integer not null default 0 check (voting_link_clicks >= 0),
  asset_downloads integer not null default 0 check (asset_downloads >= 0)
);

create unique index if not exists business_profile_daily_metrics_biz_date_null_loc_uidx
  on public.business_profile_daily_metrics (business_id, date)
  where business_location_id is null;

create unique index if not exists business_profile_daily_metrics_biz_loc_date_uidx
  on public.business_profile_daily_metrics (business_id, business_location_id, date)
  where business_location_id is not null;

create index if not exists business_profile_daily_metrics_business_date_idx
  on public.business_profile_daily_metrics (business_id, date desc);

create table if not exists public.community_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  date date not null,
  visitors integer not null default 0 check (visitors >= 0),
  registered_users integer not null default 0 check (registered_users >= 0),
  nominations integer not null default 0 check (nominations >= 0),
  voters integer not null default 0 check (voters >= 0),
  votes integer not null default 0 check (votes >= 0),
  claimed_businesses integer not null default 0 check (claimed_businesses >= 0),
  orders integer not null default 0 check (orders >= 0),
  revenue_cents bigint not null default 0 check (revenue_cents >= 0),
  unique (community_id, campaign_id, date)
);

create index if not exists community_daily_metrics_community_date_idx
  on public.community_daily_metrics (community_id, date desc);

alter table public.payments
  add column if not exists fee_cents integer check (fee_cents is null or fee_cents >= 0);

create or replace function public.bump_business_profile_daily_metric(
  p_business_id uuid,
  p_business_location_id uuid,
  p_date date,
  p_column text,
  p_delta integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_views integer := case when p_column = 'profile_views' then p_delta else 0 end;
  v_website_clicks integer := case when p_column = 'website_clicks' then p_delta else 0 end;
  v_phone_clicks integer := case when p_column = 'phone_clicks' then p_delta else 0 end;
  v_direction_clicks integer := case when p_column = 'direction_clicks' then p_delta else 0 end;
  v_nomination_link_clicks integer := case when p_column = 'nomination_link_clicks' then p_delta else 0 end;
  v_voting_link_clicks integer := case when p_column = 'voting_link_clicks' then p_delta else 0 end;
  v_asset_downloads integer := case when p_column = 'asset_downloads' then p_delta else 0 end;
begin
  if p_column not in (
    'profile_views',
    'website_clicks',
    'phone_clicks',
    'direction_clicks',
    'nomination_link_clicks',
    'voting_link_clicks',
    'asset_downloads'
  ) then
    raise exception 'Invalid business metric column: %', p_column;
  end if;

  if p_business_location_id is null then
    insert into public.business_profile_daily_metrics (
      business_id, business_location_id, date,
      profile_views, website_clicks, phone_clicks, direction_clicks,
      nomination_link_clicks, voting_link_clicks, asset_downloads
    ) values (
      p_business_id, null, p_date,
      v_profile_views, v_website_clicks, v_phone_clicks, v_direction_clicks,
      v_nomination_link_clicks, v_voting_link_clicks, v_asset_downloads
    )
    on conflict (business_id, date) where business_location_id is null do update set
      profile_views = public.business_profile_daily_metrics.profile_views + excluded.profile_views,
      website_clicks = public.business_profile_daily_metrics.website_clicks + excluded.website_clicks,
      phone_clicks = public.business_profile_daily_metrics.phone_clicks + excluded.phone_clicks,
      direction_clicks = public.business_profile_daily_metrics.direction_clicks + excluded.direction_clicks,
      nomination_link_clicks =
        public.business_profile_daily_metrics.nomination_link_clicks + excluded.nomination_link_clicks,
      voting_link_clicks =
        public.business_profile_daily_metrics.voting_link_clicks + excluded.voting_link_clicks,
      asset_downloads = public.business_profile_daily_metrics.asset_downloads + excluded.asset_downloads;
  else
    insert into public.business_profile_daily_metrics (
      business_id, business_location_id, date,
      profile_views, website_clicks, phone_clicks, direction_clicks,
      nomination_link_clicks, voting_link_clicks, asset_downloads
    ) values (
      p_business_id, p_business_location_id, p_date,
      v_profile_views, v_website_clicks, v_phone_clicks, v_direction_clicks,
      v_nomination_link_clicks, v_voting_link_clicks, v_asset_downloads
    )
    on conflict (business_id, business_location_id, date)
      where business_location_id is not null do update set
      profile_views = public.business_profile_daily_metrics.profile_views + excluded.profile_views,
      website_clicks = public.business_profile_daily_metrics.website_clicks + excluded.website_clicks,
      phone_clicks = public.business_profile_daily_metrics.phone_clicks + excluded.phone_clicks,
      direction_clicks = public.business_profile_daily_metrics.direction_clicks + excluded.direction_clicks,
      nomination_link_clicks =
        public.business_profile_daily_metrics.nomination_link_clicks + excluded.nomination_link_clicks,
      voting_link_clicks =
        public.business_profile_daily_metrics.voting_link_clicks + excluded.voting_link_clicks,
      asset_downloads = public.business_profile_daily_metrics.asset_downloads + excluded.asset_downloads;
  end if;
end;
$$;

revoke all on function public.bump_business_profile_daily_metric(uuid, uuid, date, text, integer) from public;
grant execute on function public.bump_business_profile_daily_metric(uuid, uuid, date, text, integer) to service_role;

alter table public.analytics_events enable row level security;
alter table public.business_profile_daily_metrics enable row level security;
alter table public.community_daily_metrics enable row level security;

drop policy if exists "Admins read analytics events" on public.analytics_events;
create policy "Admins read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));

drop policy if exists "Business members read own analytics events" on public.analytics_events;
create policy "Business members read own analytics events"
  on public.analytics_events for select
  to authenticated
  using (
    business_id is not null
    and public.has_active_business_membership(business_id)
  );

drop policy if exists "Admins read business daily metrics" on public.business_profile_daily_metrics;
create policy "Admins read business daily metrics"
  on public.business_profile_daily_metrics for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));

drop policy if exists "Business members read own daily metrics" on public.business_profile_daily_metrics;
create policy "Business members read own daily metrics"
  on public.business_profile_daily_metrics for select
  to authenticated
  using (public.has_active_business_membership(business_id));

drop policy if exists "Admins manage community daily metrics" on public.community_daily_metrics;
create policy "Admins manage community daily metrics"
  on public.community_daily_metrics for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));
