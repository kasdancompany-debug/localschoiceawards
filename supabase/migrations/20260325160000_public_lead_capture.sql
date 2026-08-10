-- Public lead capture for discovery and community sites (no nominations/voting yet).

create table if not exists public.community_launch_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  community_name text not null,
  region text not null,
  country_code text not null check (country_code in ('CA', 'US')),
  notes text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_launch_requests_created_at_idx
  on public.community_launch_requests (created_at desc);
create index if not exists community_launch_requests_status_idx
  on public.community_launch_requests (status);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  source_path text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create table if not exists public.community_launch_list (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (community_id, email)
);

create index if not exists community_launch_list_community_id_idx
  on public.community_launch_list (community_id);

alter table public.community_launch_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.community_launch_list enable row level security;

-- Public may not read these tables. Inserts happen via service-role server actions.
create policy community_launch_requests_admin_read
  on public.community_launch_requests
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(
      array['administrator', 'super_administrator', 'operations']
    )
  );

create policy contact_messages_admin_read
  on public.contact_messages
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(
      array['administrator', 'super_administrator', 'operations']
    )
  );

create policy community_launch_list_admin_read
  on public.community_launch_list
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(
      array['administrator', 'super_administrator', 'operations']
    )
  );
