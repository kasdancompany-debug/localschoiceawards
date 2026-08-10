-- Orders, payments, refunds, and Stripe webhook idempotency.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete restrict,
  business_id uuid references public.businesses (id) on delete set null,
  cart_id uuid references public.carts (id) on delete set null,
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  status text not null default 'pending'
    check (status in (
      'pending',
      'awaiting_payment',
      'paid',
      'fulfilled',
      'cancelled',
      'refunded',
      'partially_refunded'
    )),
  payment_status text not null default 'unpaid'
    check (payment_status in (
      'unpaid',
      'pending',
      'paid',
      'failed',
      'refunded',
      'partially_refunded'
    )),
  fulfillment_status text not null default 'not_started'
    check (fulfillment_status in (
      'not_started',
      'queued',
      'in_progress',
      'shipped',
      'cancelled'
    )),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_method_snapshot jsonb not null default '{}'::jsonb,
  shipping_address_snapshot jsonb not null default '{}'::jsonb,
  billing_address_snapshot jsonb not null default '{}'::jsonb,
  customer_email text not null,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  fraud_flags text[] not null default '{}',
  fraud_notes text not null default '',
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_check check (
    total_cents = subtotal_cents + shipping_cents + tax_cents - discount_cents
  ),
  constraint orders_fulfillment_payment_check check (
    fulfillment_status = 'not_started'
    or fulfillment_status = 'cancelled'
    or payment_status in ('paid', 'partially_refunded', 'refunded')
  )
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_status_payment_idx
  on public.orders (status, payment_status, created_at desc);

create index if not exists orders_business_idx
  on public.orders (business_id)
  where business_id is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_variant_id uuid not null references public.product_variants (id) on delete restrict,
  award_eligibility_id uuid references public.award_eligibilities (id) on delete restrict,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  sku_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  personalization_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe')),
  provider_payment_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  status text not null
    check (status in ('pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index if not exists payments_order_idx
  on public.payments (order_id, created_at desc);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete restrict,
  provider_refund_id text,
  amount_cents integer not null check (amount_cents > 0),
  reason text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'canceled')),
  requested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (provider_refund_id)
);

create index if not exists refunds_order_idx
  on public.refunds (order_id, created_at desc);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe' check (provider in ('stripe')),
  provider_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processing', 'processed', 'ignored', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index if not exists webhook_events_status_idx
  on public.webhook_events (processing_status, received_at desc);

create or replace function public.set_orders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_orders_updated_at();

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'LCA-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = candidate);
  end loop;
  return candidate;
end;
$$;

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own order payments" on public.payments;
create policy "Users can read own order payments"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own order refunds" on public.refunds;
create policy "Users can read own order refunds"
  on public.refunds for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders"
  on public.orders for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'finance', 'operations', 'support']));

drop policy if exists "Admins can read all order items" on public.order_items;
create policy "Admins can read all order items"
  on public.order_items for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'finance', 'operations', 'support']));

drop policy if exists "Admins can read all payments" on public.payments;
create policy "Admins can read all payments"
  on public.payments for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'finance', 'operations', 'support']));

drop policy if exists "Admins can read all refunds" on public.refunds;
create policy "Admins can read all refunds"
  on public.refunds for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'finance', 'operations', 'support']));

-- Mutations go through service role only.
