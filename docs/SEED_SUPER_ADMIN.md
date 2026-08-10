# Creating the first super administrator

Do this only in a trusted environment. Never grant `super_administrator` through the public UI.

## Prerequisites

1. Apply migrations, including `20260325130000_auth_profiles_and_roles.sql`.
2. Create a normal account through `/register` (or the Supabase Auth dashboard).
3. Confirm the account email so Auth marks the user verified.

## Safe promotion steps

1. Open the Supabase SQL editor for the project.
2. Look up the user id:

```sql
select id, email
from auth.users
where email = 'you@example.com';
```

3. Grant `super_administrator` with an audited insert (run as a database owner / service role connection, not as the end user):

```sql
insert into public.user_platform_roles (user_id, platform_role_id, created_by)
select
  u.id,
  pr.id,
  u.id
from auth.users u
cross join public.platform_roles pr
where u.email = 'you@example.com'
  and pr.key = 'super_administrator'
on conflict do nothing;

insert into public.role_change_audit_log (
  actor_user_id,
  target_user_id,
  platform_role_key,
  action,
  metadata
)
select
  u.id,
  u.id,
  'super_administrator',
  'granted',
  jsonb_build_object('source', 'bootstrap_sql', 'note', 'Initial super administrator seed')
from auth.users u
where u.email = 'you@example.com';
```

4. Sign out and sign back in, then open `/admin`.
5. After the first super administrator exists, use `public.grant_platform_role(...)` for every later role change so self-escalation stays blocked and audit rows are written automatically.

## Notes

- Ordinary users receive the `user` role automatically from the `handle_new_user` trigger.
- Clients cannot insert into `user_platform_roles` directly under RLS.
- Prefer promoting a second administrator before rotating credentials on the bootstrap account.
