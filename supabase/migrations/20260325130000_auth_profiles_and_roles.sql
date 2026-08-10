-- Auth foundation: profiles, platform roles, memberships, audit, rate limits

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  preferred_locale text not null default 'en-CA',
  preferred_currency text not null default 'CAD'
    check (preferred_currency in ('CAD', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_display_name_idx on public.profiles (display_name);

-- ---------------------------------------------------------------------------
-- Platform roles
-- ---------------------------------------------------------------------------

create table if not exists public.platform_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_platform_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  platform_role_id uuid not null references public.platform_roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  primary key (user_id, platform_role_id)
);

create index if not exists user_platform_roles_role_id_idx
  on public.user_platform_roles (platform_role_id);

insert into public.platform_roles (key, name, description)
values
  ('user', 'User', 'Standard community member account'),
  ('moderator', 'Moderator', 'Community content and nomination moderation'),
  ('support', 'Support', 'Customer support tooling'),
  ('operations', 'Operations', 'Season and community operations'),
  ('finance', 'Finance', 'Payments, refunds, and financial reporting'),
  ('administrator', 'Administrator', 'Platform administration'),
  ('super_administrator', 'Super Administrator', 'Full platform control including role management'),
  ('supplier_user', 'Supplier User', 'Award product fulfillment portal access')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Role change audit log
-- ---------------------------------------------------------------------------

create table if not exists public.role_change_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  platform_role_key text not null,
  action text not null check (action in ('granted', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists role_change_audit_log_target_idx
  on public.role_change_audit_log (target_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Auth rate-limit attempts
-- ---------------------------------------------------------------------------

create table if not exists public.auth_rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('login', 'register', 'password_reset')),
  identifier text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists auth_rate_limit_attempts_lookup_idx
  on public.auth_rate_limit_attempts (action, identifier, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create or replace function public.current_user_has_platform_role(role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_platform_roles upr
    join public.platform_roles pr on pr.id = upr.platform_role_id
    where upr.user_id = auth.uid()
      and pr.key = any (role_keys)
  );
$$;

revoke all on function public.current_user_has_platform_role(text[]) from public;
grant execute on function public.current_user_has_platform_role(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + default "user" role
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
  derived_display_name text;
begin
  derived_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(concat_ws(
      ' ',
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'last_name'
    )), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    avatar_url,
    preferred_locale,
    preferred_currency
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    derived_display_name,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'preferred_locale'), ''), 'en-CA'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'preferred_currency'), ''), 'CAD')
  );

  select id into default_role_id
  from public.platform_roles
  where key = 'user'
  limit 1;

  if default_role_id is not null then
    insert into public.user_platform_roles (user_id, platform_role_id, created_by)
    values (new.id, default_role_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileged role grant/revoke (blocks self-escalation; writes audit log)
-- ---------------------------------------------------------------------------

create or replace function public.grant_platform_role(
  target_user_id uuid,
  role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  role_id uuid;
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  if actor = target_user_id then
    raise exception 'Users cannot assign roles to themselves';
  end if;

  if not public.current_user_has_platform_role(array['administrator', 'super_administrator']) then
    raise exception 'Not authorized to grant platform roles';
  end if;

  if role_key = 'super_administrator'
     and not public.current_user_has_platform_role(array['super_administrator']) then
    raise exception 'Only super administrators may grant super_administrator';
  end if;

  select id into role_id from public.platform_roles where key = role_key;
  if role_id is null then
    raise exception 'Unknown platform role: %', role_key;
  end if;

  insert into public.user_platform_roles (user_id, platform_role_id, created_by)
  values (target_user_id, role_id, actor)
  on conflict do nothing;

  insert into public.role_change_audit_log (
    actor_user_id,
    target_user_id,
    platform_role_key,
    action
  )
  values (actor, target_user_id, role_key, 'granted');
end;
$$;

create or replace function public.revoke_platform_role(
  target_user_id uuid,
  role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  role_id uuid;
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  if actor = target_user_id then
    raise exception 'Users cannot revoke their own roles through this function';
  end if;

  if not public.current_user_has_platform_role(array['administrator', 'super_administrator']) then
    raise exception 'Not authorized to revoke platform roles';
  end if;

  if role_key = 'super_administrator'
     and not public.current_user_has_platform_role(array['super_administrator']) then
    raise exception 'Only super administrators may revoke super_administrator';
  end if;

  select id into role_id from public.platform_roles where key = role_key;
  if role_id is null then
    raise exception 'Unknown platform role: %', role_key;
  end if;

  delete from public.user_platform_roles
  where user_id = target_user_id
    and platform_role_id = role_id;

  insert into public.role_change_audit_log (
    actor_user_id,
    target_user_id,
    platform_role_key,
    action
  )
  values (actor, target_user_id, role_key, 'revoked');
end;
$$;

revoke all on function public.grant_platform_role(uuid, text) from public;
revoke all on function public.revoke_platform_role(uuid, text) from public;
grant execute on function public.grant_platform_role(uuid, text) to authenticated;
grant execute on function public.revoke_platform_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.platform_roles enable row level security;
alter table public.user_platform_roles enable row level security;
alter table public.role_change_audit_log enable row level security;
alter table public.auth_rate_limit_attempts enable row level security;

-- Profiles: users read/update only themselves
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(array['administrator', 'super_administrator', 'support'])
  );

-- Platform roles catalog is readable by authenticated users
drop policy if exists "Authenticated users can read platform roles" on public.platform_roles;
create policy "Authenticated users can read platform roles"
  on public.platform_roles
  for select
  to authenticated
  using (true);

-- Memberships: users read own; admins manage via SECURITY DEFINER functions only
drop policy if exists "Users can read own platform roles" on public.user_platform_roles;
create policy "Users can read own platform roles"
  on public.user_platform_roles
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.current_user_has_platform_role(array['administrator', 'super_administrator', 'support'])
  );

-- No direct insert/update/delete policies for user_platform_roles:
-- role changes go through grant_platform_role / revoke_platform_role.

drop policy if exists "Admins can read role audit log" on public.role_change_audit_log;
create policy "Admins can read role audit log"
  on public.role_change_audit_log
  for select
  to authenticated
  using (
    public.current_user_has_platform_role(array['administrator', 'super_administrator'])
  );

-- Rate-limit table is service-role only (no policies for authenticated/anon)
