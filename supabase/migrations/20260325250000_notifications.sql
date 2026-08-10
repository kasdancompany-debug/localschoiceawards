-- Event-driven notifications and Resend email delivery.

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled', 'skipped')),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists notification_events_dedupe_uidx
  on public.notification_events (dedupe_key)
  where dedupe_key is not null;

create index if not exists notification_events_queue_idx
  on public.notification_events (status, available_at)
  where status in ('queued', 'failed');

create index if not exists notification_events_aggregate_idx
  on public.notification_events (aggregate_type, aggregate_id, created_at desc);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  subject_template text not null,
  category text not null
    check (category in ('transactional', 'operational', 'marketing')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null references public.notification_events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null,
  template_key text not null references public.email_templates (key) on delete restrict,
  provider_message_id text,
  status text not null default 'queued'
    check (status in (
      'queued',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'complained',
      'failed',
      'skipped'
    )),
  dedupe_key text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists email_deliveries_dedupe_uidx
  on public.email_deliveries (dedupe_key)
  where dedupe_key is not null;

create index if not exists email_deliveries_status_idx
  on public.email_deliveries (status, created_at desc);

create index if not exists email_deliveries_recipient_idx
  on public.email_deliveries (recipient_email, created_at desc);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  campaign_updates boolean not null default true,
  business_updates boolean not null default true,
  order_updates boolean not null default true,
  marketing_emails boolean not null default false,
  winner_sales_emails boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function public.set_notification_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_notification_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_notification_updated_at();

alter table public.notification_events enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Admins manage notification events" on public.notification_events;
create policy "Admins manage notification events"
  on public.notification_events for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));

drop policy if exists "Admins read email templates" on public.email_templates;
create policy "Admins read email templates"
  on public.email_templates for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));

drop policy if exists "Admins manage email templates" on public.email_templates;
create policy "Admins manage email templates"
  on public.email_templates for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations']));

drop policy if exists "Admins read email deliveries" on public.email_deliveries;
create policy "Admins read email deliveries"
  on public.email_deliveries for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));

drop policy if exists "Users read own deliveries" on public.email_deliveries;
create policy "Users read own deliveries"
  on public.email_deliveries for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins read notification preferences" on public.notification_preferences;
create policy "Admins read notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'support']));
