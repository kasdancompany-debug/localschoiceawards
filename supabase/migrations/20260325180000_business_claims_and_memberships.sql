-- Business claiming, memberships, invitations, and claim audit trail.

create table if not exists public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  business_location_id uuid references public.business_locations (id) on delete set null,
  requested_by_user_id uuid not null references auth.users (id) on delete cascade,
  verification_method text not null
    check (verification_method in ('domain_email', 'manual_evidence', 'admin_assisted')),
  submitted_email text not null,
  evidence_storage_path text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'email_verification',
      'evidence_required',
      'under_review',
      'approved',
      'rejected',
      'cancelled',
      'expired'
    )),
  reviewer_id uuid references auth.users (id) on delete set null,
  reviewer_notes text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  domain_email_matched boolean not null default false
);

create index if not exists business_claims_business_idx
  on public.business_claims (business_id, status);
create index if not exists business_claims_requester_idx
  on public.business_claims (requested_by_user_id, status);
create index if not exists business_claims_status_idx
  on public.business_claims (status, requested_at desc);

create table if not exists public.business_claim_status_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.business_claims (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists business_claim_status_events_claim_idx
  on public.business_claim_status_events (claim_id, created_at);

create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'administrator', 'manager', 'marketing', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'revoked')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_memberships_user_idx
  on public.business_memberships (user_id, status);
create index if not exists business_memberships_business_idx
  on public.business_memberships (business_id, status);

create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role text not null
    check (role in ('owner', 'administrator', 'manager', 'marketing', 'viewer')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists business_invitations_business_idx
  on public.business_invitations (business_id, created_at desc);
create index if not exists business_invitations_email_idx
  on public.business_invitations (lower(email));

drop trigger if exists business_memberships_set_updated_at on public.business_memberships;
create trigger business_memberships_set_updated_at
  before update on public.business_memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Membership helpers
-- ---------------------------------------------------------------------------

create or replace function public.has_active_business_membership(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke all on function public.has_active_business_membership(uuid) from public;
grant execute on function public.has_active_business_membership(uuid) to authenticated;

create or replace function public.business_member_role(p_business_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.business_memberships m
  where m.business_id = p_business_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.business_member_role(uuid) from public;
grant execute on function public.business_member_role(uuid) to authenticated;

create or replace function public.can_manage_business_profile(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_business_admin()
    or exists (
      select 1
      from public.business_memberships m
      where m.business_id = p_business_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role in ('owner', 'administrator', 'manager', 'marketing')
    );
$$;

revoke all on function public.can_manage_business_profile(uuid) from public;
grant execute on function public.can_manage_business_profile(uuid) to authenticated;

create or replace function public.record_business_claim_status_change(
  p_claim_id uuid,
  p_from_status text,
  p_to_status text,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_claim_status_events (
    claim_id,
    from_status,
    to_status,
    actor_user_id,
    notes
  )
  values (
    p_claim_id,
    p_from_status,
    p_to_status,
    auth.uid(),
    p_notes
  );
end;
$$;

revoke all on function public.record_business_claim_status_change(uuid, text, text, text) from public;
grant execute on function public.record_business_claim_status_change(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage for claim evidence (reuse business-media bucket path prefix claims/)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.business_claims enable row level security;
alter table public.business_claim_status_events enable row level security;
alter table public.business_memberships enable row level security;
alter table public.business_invitations enable row level security;

drop policy if exists "Users can read own claims" on public.business_claims;
create policy "Users can read own claims"
  on public.business_claims for select
  to authenticated
  using (
    requested_by_user_id = auth.uid()
    or public.is_business_admin()
    or public.has_active_business_membership(business_id)
  );

drop policy if exists "Users can create own claims" on public.business_claims;
create policy "Users can create own claims"
  on public.business_claims for insert
  to authenticated
  with check (requested_by_user_id = auth.uid());

drop policy if exists "Users can update own open claims" on public.business_claims;
create policy "Users can update own open claims"
  on public.business_claims for update
  to authenticated
  using (
    public.is_business_admin()
    or (
      requested_by_user_id = auth.uid()
      and status in ('pending', 'email_verification', 'evidence_required')
    )
  )
  with check (
    public.is_business_admin()
    or requested_by_user_id = auth.uid()
  );

drop policy if exists "Admins manage all claims" on public.business_claims;
create policy "Admins manage all claims"
  on public.business_claims for all
  to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

drop policy if exists "Users can read claim events for visible claims" on public.business_claim_status_events;
create policy "Users can read claim events for visible claims"
  on public.business_claim_status_events for select
  to authenticated
  using (
    public.is_business_admin()
    or exists (
      select 1 from public.business_claims c
      where c.id = claim_id
        and (
          c.requested_by_user_id = auth.uid()
          or public.has_active_business_membership(c.business_id)
        )
    )
  );

drop policy if exists "Authenticated can insert claim events via helper" on public.business_claim_status_events;
create policy "Authenticated can insert claim events via helper"
  on public.business_claim_status_events for insert
  to authenticated
  with check (
    public.is_business_admin()
    or exists (
      select 1 from public.business_claims c
      where c.id = claim_id and c.requested_by_user_id = auth.uid()
    )
  );

drop policy if exists "Members can read memberships for their businesses" on public.business_memberships;
create policy "Members can read memberships for their businesses"
  on public.business_memberships for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_business_admin()
    or public.has_active_business_membership(business_id)
  );

drop policy if exists "Owners and admins manage memberships" on public.business_memberships;
create policy "Owners and admins manage memberships"
  on public.business_memberships for all
  to authenticated
  using (
    public.is_business_admin()
    or exists (
      select 1 from public.business_memberships actor
      where actor.business_id = business_memberships.business_id
        and actor.user_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'administrator')
    )
  )
  with check (
    public.is_business_admin()
    or exists (
      select 1 from public.business_memberships actor
      where actor.business_id = business_memberships.business_id
        and actor.user_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'administrator')
    )
  );

drop policy if exists "Members can read invitations for their businesses" on public.business_invitations;
create policy "Members can read invitations for their businesses"
  on public.business_invitations for select
  to authenticated
  using (
    public.is_business_admin()
    or public.has_active_business_membership(business_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Owners and admins manage invitations" on public.business_invitations;
create policy "Owners and admins manage invitations"
  on public.business_invitations for all
  to authenticated
  using (
    public.is_business_admin()
    or exists (
      select 1 from public.business_memberships actor
      where actor.business_id = business_invitations.business_id
        and actor.user_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'administrator')
    )
  )
  with check (
    public.is_business_admin()
    or exists (
      select 1 from public.business_memberships actor
      where actor.business_id = business_invitations.business_id
        and actor.user_id = auth.uid()
        and actor.status = 'active'
        and actor.role in ('owner', 'administrator')
    )
  );

-- Allow business members to update their business profile fields
drop policy if exists "Members can update managed businesses" on public.businesses;
create policy "Members can update managed businesses"
  on public.businesses for update
  to authenticated
  using (public.can_manage_business_profile(id))
  with check (public.can_manage_business_profile(id));

drop policy if exists "Members can update managed locations" on public.business_locations;
create policy "Members can update managed locations"
  on public.business_locations for update
  to authenticated
  using (public.can_manage_business_profile(business_id))
  with check (public.can_manage_business_profile(business_id));

drop policy if exists "Members can manage hours for managed locations" on public.business_hours;
create policy "Members can manage hours for managed locations"
  on public.business_hours for all
  to authenticated
  using (
    public.is_business_admin()
    or exists (
      select 1 from public.business_locations bl
      where bl.id = business_location_id
        and public.can_manage_business_profile(bl.business_id)
    )
  )
  with check (
    public.is_business_admin()
    or exists (
      select 1 from public.business_locations bl
      where bl.id = business_location_id
        and public.can_manage_business_profile(bl.business_id)
    )
  );

drop policy if exists "Members can manage social links" on public.business_social_links;
create policy "Members can manage social links"
  on public.business_social_links for all
  to authenticated
  using (public.can_manage_business_profile(business_id))
  with check (public.can_manage_business_profile(business_id));

drop policy if exists "Members can manage business media" on public.business_media;
create policy "Members can manage business media"
  on public.business_media for all
  to authenticated
  using (public.can_manage_business_profile(business_id))
  with check (public.can_manage_business_profile(business_id));
