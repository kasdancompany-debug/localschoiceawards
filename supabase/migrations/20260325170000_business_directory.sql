-- Business directory: profiles, locations, media, category assignments, submissions, imports.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.normalize_business_text(input text)
returns text
language sql
immutable
as $$
  select trim(both ' ' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.normalize_phone_digits(input text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(input, ''), '\D', '', 'g'), '');
$$;

create or replace function public.normalize_website_domain(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        lower(coalesce(input, '')),
        '^https?://',
        ''
      ),
      '^www\.',
      ''
    ),
    ''
  );
$$;

create or replace function public.is_business_admin()
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

revoke all on function public.is_business_admin() from public;
grant execute on function public.is_business_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  public_name text not null,
  slug text not null,
  description text not null default '',
  website_url text,
  primary_phone text,
  primary_email text,
  logo_url text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'suspended')),
  normalized_name text generated always as (public.normalize_business_text(public_name)) stored,
  normalized_phone text generated always as (public.normalize_phone_digits(primary_phone)) stored,
  normalized_website_domain text generated always as (public.normalize_website_domain(website_url)) stored,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists businesses_slug_active_uidx
  on public.businesses (lower(slug))
  where deleted_at is null;

create index if not exists businesses_status_idx on public.businesses (status)
  where deleted_at is null;
create index if not exists businesses_normalized_name_idx on public.businesses (normalized_name)
  where deleted_at is null;
create index if not exists businesses_normalized_phone_idx on public.businesses (normalized_phone)
  where deleted_at is null and normalized_phone is not null;
create index if not exists businesses_normalized_domain_idx on public.businesses (normalized_website_domain)
  where deleted_at is null and normalized_website_domain is not null;
create index if not exists businesses_search_vector_idx on public.businesses using gin (search_vector);

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete restrict,
  location_name text not null,
  slug text not null,
  address_line_1 text,
  address_line_2 text,
  city text,
  administrative_region_code text,
  country_code text check (country_code is null or country_code in ('CA', 'US')),
  postal_code text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website_url text,
  service_area_business boolean not null default false,
  active boolean not null default true,
  normalized_name text generated always as (public.normalize_business_text(location_name)) stored,
  normalized_phone text generated always as (public.normalize_phone_digits(phone)) stored,
  normalized_website_domain text generated always as (public.normalize_website_domain(website_url)) stored,
  normalized_address text generated always as (
    public.normalize_business_text(
      concat_ws(' ', address_line_1, address_line_2, city, administrative_region_code, postal_code, country_code)
    )
  ) stored,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists business_locations_business_slug_uidx
  on public.business_locations (business_id, lower(slug))
  where deleted_at is null;

create index if not exists business_locations_community_idx
  on public.business_locations (community_id)
  where deleted_at is null and active = true;
create index if not exists business_locations_business_idx
  on public.business_locations (business_id)
  where deleted_at is null;
create index if not exists business_locations_name_idx
  on public.business_locations (normalized_name)
  where deleted_at is null;
create index if not exists business_locations_phone_idx
  on public.business_locations (normalized_phone)
  where deleted_at is null and normalized_phone is not null;
create index if not exists business_locations_domain_idx
  on public.business_locations (normalized_website_domain)
  where deleted_at is null and normalized_website_domain is not null;
create index if not exists business_locations_address_idx
  on public.business_locations (normalized_address)
  where deleted_at is null;
create index if not exists business_locations_search_vector_idx
  on public.business_locations using gin (search_vector);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_location_id uuid not null references public.business_locations (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  appointment_only boolean not null default false,
  unique (business_location_id, day_of_week)
);

create table if not exists public.business_social_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  platform text not null check (
    platform in ('facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'other')
  ),
  url text not null,
  unique (business_id, platform)
);

create table if not exists public.business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  business_location_id uuid references public.business_locations (id) on delete cascade,
  media_type text not null check (media_type in ('logo', 'photo', 'cover')),
  storage_path text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists business_media_business_idx on public.business_media (business_id);
create index if not exists business_media_location_idx on public.business_media (business_location_id);

create table if not exists public.business_category_assignments (
  id uuid primary key default gen_random_uuid(),
  business_location_id uuid not null references public.business_locations (id) on delete cascade,
  campaign_category_id uuid not null references public.campaign_categories (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_location_id, campaign_category_id)
);

create index if not exists business_category_assignments_category_idx
  on public.business_category_assignments (campaign_category_id, status);
create index if not exists business_category_assignments_location_idx
  on public.business_category_assignments (business_location_id, status);

create table if not exists public.business_submission_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  submitted_by_user_id uuid references auth.users (id) on delete set null,
  business_name text not null,
  category_id uuid references public.campaign_categories (id) on delete set null,
  address text,
  website_url text,
  phone text,
  submitter_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_info')),
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists business_submission_requests_campaign_idx
  on public.business_submission_requests (campaign_id, status);
create index if not exists business_submission_requests_status_idx
  on public.business_submission_requests (status, created_at desc);

create table if not exists public.business_import_batches (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  imported_by uuid references auth.users (id) on delete set null,
  filename text not null,
  status text not null default 'preview'
    check (status in ('preview', 'completed', 'cancelled', 'failed')),
  row_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  duplicate_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.business_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.business_import_batches (id) on delete cascade,
  row_number integer not null,
  payload jsonb not null default '{}'::jsonb,
  validation_errors text[] not null default '{}',
  duplicate_candidates jsonb not null default '[]'::jsonb,
  resolution text not null default 'pending'
    check (resolution in ('pending', 'import', 'skip', 'merge_manual')),
  resulting_business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index if not exists business_import_batches_community_idx
  on public.business_import_batches (community_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Search vector maintenance
-- ---------------------------------------------------------------------------

create or replace function public.refresh_business_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.public_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.legal_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$;

drop trigger if exists businesses_search_vector on public.businesses;
create trigger businesses_search_vector
  before insert or update of public_name, legal_name, description
  on public.businesses
  for each row execute function public.refresh_business_search_vector();

create or replace function public.refresh_business_location_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.location_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.address_line_1, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.postal_code, '')), 'C');
  return new;
end;
$$;

drop trigger if exists business_locations_search_vector on public.business_locations;
create trigger business_locations_search_vector
  before insert or update of location_name, city, address_line_1, postal_code
  on public.business_locations
  for each row execute function public.refresh_business_location_search_vector();

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

drop trigger if exists business_locations_set_updated_at on public.business_locations;
create trigger business_locations_set_updated_at
  before update on public.business_locations
  for each row execute function public.set_updated_at();

drop trigger if exists business_category_assignments_set_updated_at on public.business_category_assignments;
create trigger business_category_assignments_set_updated_at
  before update on public.business_category_assignments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for business media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.business_locations enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_social_links enable row level security;
alter table public.business_media enable row level security;
alter table public.business_category_assignments enable row level security;
alter table public.business_submission_requests enable row level security;
alter table public.business_import_batches enable row level security;
alter table public.business_import_rows enable row level security;

-- Public read: approved, not soft-deleted businesses
drop policy if exists "Public can read approved businesses" on public.businesses;
create policy "Public can read approved businesses"
  on public.businesses for select
  using (
    (status = 'approved' and deleted_at is null)
    or public.is_business_admin()
  );

drop policy if exists "Admins manage businesses" on public.businesses;
create policy "Admins manage businesses"
  on public.businesses for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Public can read active locations of approved businesses" on public.business_locations;
create policy "Public can read active locations of approved businesses"
  on public.business_locations for select
  using (
    (
      active = true
      and deleted_at is null
      and exists (
        select 1
        from public.businesses b
        where b.id = business_id
          and b.status = 'approved'
          and b.deleted_at is null
      )
    )
    or public.is_business_admin()
  );

drop policy if exists "Admins manage business locations" on public.business_locations;
create policy "Admins manage business locations"
  on public.business_locations for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Public can read hours for visible locations" on public.business_hours;
create policy "Public can read hours for visible locations"
  on public.business_hours for select
  using (
    exists (
      select 1
      from public.business_locations bl
      join public.businesses b on b.id = bl.business_id
      where bl.id = business_location_id
        and bl.active = true
        and bl.deleted_at is null
        and b.status = 'approved'
        and b.deleted_at is null
    )
    or public.is_business_admin()
  );

drop policy if exists "Admins manage business hours" on public.business_hours;
create policy "Admins manage business hours"
  on public.business_hours for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Public can read social links for approved businesses" on public.business_social_links;
create policy "Public can read social links for approved businesses"
  on public.business_social_links for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'approved' and b.deleted_at is null
    )
    or public.is_business_admin()
  );

drop policy if exists "Admins manage business social links" on public.business_social_links;
create policy "Admins manage business social links"
  on public.business_social_links for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Public can read approved business media" on public.business_media;
create policy "Public can read approved business media"
  on public.business_media for select
  using (
    (
      approved = true
      and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.status = 'approved' and b.deleted_at is null
      )
    )
    or public.is_business_admin()
  );

drop policy if exists "Admins manage business media" on public.business_media;
create policy "Admins manage business media"
  on public.business_media for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Public can read approved category assignments" on public.business_category_assignments;
create policy "Public can read approved category assignments"
  on public.business_category_assignments for select
  using (
    status = 'approved'
    or public.is_business_admin()
  );

drop policy if exists "Admins manage category assignments" on public.business_category_assignments;
create policy "Admins manage category assignments"
  on public.business_category_assignments for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

-- Submissions: anyone authenticated can insert their own; public insert via service role in app
drop policy if exists "Admins manage submission requests" on public.business_submission_requests;
create policy "Admins manage submission requests"
  on public.business_submission_requests for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Users can read own submission requests" on public.business_submission_requests;
create policy "Users can read own submission requests"
  on public.business_submission_requests for select
  to authenticated
  using (submitted_by_user_id = auth.uid() or public.is_business_admin());

drop policy if exists "Authenticated users can create submission requests" on public.business_submission_requests;
create policy "Authenticated users can create submission requests"
  on public.business_submission_requests for insert
  to authenticated
  with check (
    submitted_by_user_id = auth.uid()
    or public.is_business_admin()
  );

drop policy if exists "Admins manage import batches" on public.business_import_batches;
create policy "Admins manage import batches"
  on public.business_import_batches for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Admins manage import rows" on public.business_import_rows;
create policy "Admins manage import rows"
  on public.business_import_rows for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

-- Storage policies
drop policy if exists "Public can read approved business media objects" on storage.objects;
create policy "Public can read approved business media objects"
  on storage.objects for select
  using (
    bucket_id = 'business-media'
    and (
      public.is_business_admin()
      or exists (
        select 1
        from public.business_media bm
        join public.businesses b on b.id = bm.business_id
        where bm.storage_path = name
          and bm.approved = true
          and b.status = 'approved'
          and b.deleted_at is null
      )
    )
  );

drop policy if exists "Admins can upload business media objects" on storage.objects;
create policy "Admins can upload business media objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'business-media' and public.is_business_admin());

drop policy if exists "Admins can update business media objects" on storage.objects;
create policy "Admins can update business media objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'business-media' and public.is_business_admin())
  with check (bucket_id = 'business-media' and public.is_business_admin());

drop policy if exists "Admins can delete business media objects" on storage.objects;
create policy "Admins can delete business media objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'business-media' and public.is_business_admin());
