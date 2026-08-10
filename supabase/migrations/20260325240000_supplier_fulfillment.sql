-- Supplier drop-shipping fulfillment system.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null default '',
  country_code text not null check (country_code in ('CA', 'US')),
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  contact_email text not null,
  support_email text not null default '',
  fulfillment_method text not null
    check (fulfillment_method in ('portal', 'email', 'api')),
  api_base_url text,
  stripe_connected_account_id text,
  production_min_days integer not null default 5 check (production_min_days >= 0),
  production_max_days integer not null default 14 check (production_max_days >= production_min_days),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_active_country_idx
  on public.suppliers (active, country_code, currency_code);

create table if not exists public.supplier_users (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'manager', 'operator', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  unique (supplier_id, user_id)
);

create index if not exists supplier_users_user_idx
  on public.supplier_users (user_id, status);

create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  product_variant_id uuid not null references public.product_variants (id) on delete cascade,
  supplier_sku text not null,
  manufacturing_cost_cents integer not null check (manufacturing_cost_cents >= 0),
  setup_cost_cents integer not null default 0 check (setup_cost_cents >= 0),
  supplier_currency_code text not null check (supplier_currency_code in ('CAD', 'USD')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, product_variant_id),
  unique (supplier_id, supplier_sku)
);

create index if not exists supplier_products_variant_idx
  on public.supplier_products (product_variant_id, active);

create table if not exists public.supplier_shipping_rates (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  shipping_zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  supplier_product_id uuid references public.supplier_products (id) on delete cascade,
  shipping_method_name text not null,
  supplier_cost_cents integer not null check (supplier_cost_cents >= 0),
  customer_charge_cents integer not null check (customer_charge_cents >= 0),
  estimated_min_days integer not null default 3 check (estimated_min_days >= 0),
  estimated_max_days integer not null default 10 check (estimated_max_days >= estimated_min_days),
  active boolean not null default true
);

create index if not exists supplier_shipping_rates_lookup_idx
  on public.supplier_shipping_rates (supplier_id, shipping_zone_id, active);

create table if not exists public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  parent_fulfillment_id uuid references public.fulfillments (id) on delete set null,
  status text not null default 'pending_submission'
    check (status in (
      'pending_submission',
      'submission_failed',
      'submitted',
      'accepted',
      'rejected',
      'in_production',
      'ready_to_ship',
      'shipped',
      'completed',
      'cancelled',
      'remake_requested',
      'remake_in_progress'
    )),
  supplier_order_reference text,
  submission_idempotency_key text not null,
  manufacturing_cost_cents integer not null default 0 check (manufacturing_cost_cents >= 0),
  supplier_shipping_cost_cents integer not null default 0 check (supplier_shipping_cost_cents >= 0),
  supplier_payment_status text not null default 'unpaid'
    check (supplier_payment_status in ('unpaid', 'pending', 'paid', 'waived')),
  destination_country_code text check (destination_country_code in ('CA', 'US')),
  customer_snapshot jsonb not null default '{}'::jsonb,
  production_personalization jsonb not null default '{}'::jsonb,
  rejection_reason text not null default '',
  remake_reason text not null default '',
  submitted_at timestamptz,
  accepted_at timestamptz,
  production_started_at timestamptz,
  shipped_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_idempotency_key),
  unique (supplier_id, supplier_order_reference)
);

create unique index if not exists fulfillments_primary_order_uidx
  on public.fulfillments (order_id)
  where parent_fulfillment_id is null
    and status not in ('cancelled', 'rejected', 'submission_failed');

create index if not exists fulfillments_supplier_status_idx
  on public.fulfillments (supplier_id, status, created_at desc);

create index if not exists fulfillments_order_idx
  on public.fulfillments (order_id, created_at desc);

create table if not exists public.fulfillment_items (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid not null references public.fulfillments (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete restrict,
  supplier_product_id uuid not null references public.supplier_products (id) on delete restrict,
  artwork_storage_path text,
  production_notes text not null default '',
  personalization_record jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in (
      'pending',
      'artwork_ready',
      'in_production',
      'completed',
      'remake'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fulfillment_id, order_item_id)
);

create index if not exists fulfillment_items_fulfillment_idx
  on public.fulfillment_items (fulfillment_id);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid not null references public.fulfillments (id) on delete cascade,
  carrier text not null,
  service text not null default '',
  tracking_number text not null,
  tracking_url text not null default '',
  shipped_at timestamptz not null default now(),
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  status text not null default 'shipped'
    check (status in ('pending', 'shipped', 'in_transit', 'delivered', 'exception')),
  tracking_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_fulfillment_idx
  on public.shipments (fulfillment_id, created_at desc);

create table if not exists public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  fulfillment_id uuid not null references public.fulfillments (id) on delete cascade,
  invoice_number text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'void')),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (supplier_id, invoice_number),
  unique (fulfillment_id)
);

create table if not exists public.fulfillment_audit_log (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid references public.fulfillments (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  summary text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists fulfillment_audit_log_fulfillment_idx
  on public.fulfillment_audit_log (fulfillment_id, created_at desc);
create index if not exists fulfillment_audit_log_supplier_idx
  on public.fulfillment_audit_log (supplier_id, created_at desc);

create or replace function public.set_fulfillment_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_fulfillment_updated_at();

drop trigger if exists supplier_products_set_updated_at on public.supplier_products;
create trigger supplier_products_set_updated_at
  before update on public.supplier_products
  for each row execute function public.set_fulfillment_updated_at();

drop trigger if exists fulfillments_set_updated_at on public.fulfillments;
create trigger fulfillments_set_updated_at
  before update on public.fulfillments
  for each row execute function public.set_fulfillment_updated_at();

drop trigger if exists fulfillment_items_set_updated_at on public.fulfillment_items;
create trigger fulfillment_items_set_updated_at
  before update on public.fulfillment_items
  for each row execute function public.set_fulfillment_updated_at();

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_fulfillment_updated_at();

create or replace function public.has_active_supplier_membership(p_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.supplier_users su
    where su.supplier_id = p_supplier_id
      and su.user_id = auth.uid()
      and su.status = 'active'
  );
$$;

revoke all on function public.has_active_supplier_membership(uuid) from public;
grant execute on function public.has_active_supplier_membership(uuid) to authenticated;

create or replace function public.is_supplier_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.supplier_users su
    where su.user_id = auth.uid()
      and su.status = 'active'
  );
$$;

revoke all on function public.is_supplier_member() from public;
grant execute on function public.is_supplier_member() to authenticated;

-- Storage for protected production artwork
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fulfillment-artwork',
  'fulfillment-artwork',
  false,
  10485760,
  array['image/png', 'image/svg+xml', 'application/pdf', 'application/json']
)
on conflict (id) do nothing;

-- RLS
alter table public.suppliers enable row level security;
alter table public.supplier_users enable row level security;
alter table public.supplier_products enable row level security;
alter table public.supplier_shipping_rates enable row level security;
alter table public.fulfillments enable row level security;
alter table public.fulfillment_items enable row level security;
alter table public.shipments enable row level security;
alter table public.supplier_invoices enable row level security;
alter table public.fulfillment_audit_log enable row level security;

drop policy if exists "Admins manage suppliers" on public.suppliers;
create policy "Admins manage suppliers"
  on public.suppliers for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']));

drop policy if exists "Supplier users read own supplier" on public.suppliers;
create policy "Supplier users read own supplier"
  on public.suppliers for select
  to authenticated
  using (public.has_active_supplier_membership(id));

drop policy if exists "Admins manage supplier users" on public.supplier_users;
create policy "Admins manage supplier users"
  on public.supplier_users for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations']));

drop policy if exists "Supplier users read team" on public.supplier_users;
create policy "Supplier users read team"
  on public.supplier_users for select
  to authenticated
  using (public.has_active_supplier_membership(supplier_id) or user_id = auth.uid());

drop policy if exists "Admins manage supplier products" on public.supplier_products;
create policy "Admins manage supplier products"
  on public.supplier_products for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']));

drop policy if exists "Supplier users read products" on public.supplier_products;
create policy "Supplier users read products"
  on public.supplier_products for select
  to authenticated
  using (public.has_active_supplier_membership(supplier_id));

drop policy if exists "Admins manage supplier shipping rates" on public.supplier_shipping_rates;
create policy "Admins manage supplier shipping rates"
  on public.supplier_shipping_rates for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']));

drop policy if exists "Supplier users read shipping rates" on public.supplier_shipping_rates;
create policy "Supplier users read shipping rates"
  on public.supplier_shipping_rates for select
  to authenticated
  using (public.has_active_supplier_membership(supplier_id));

drop policy if exists "Admins read fulfillments" on public.fulfillments;
create policy "Admins read fulfillments"
  on public.fulfillments for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance', 'support']));

drop policy if exists "Supplier users read assigned fulfillments" on public.fulfillments;
create policy "Supplier users read assigned fulfillments"
  on public.fulfillments for select
  to authenticated
  using (public.has_active_supplier_membership(supplier_id));

drop policy if exists "Supplier users update assigned fulfillments" on public.fulfillments;
create policy "Supplier users update assigned fulfillments"
  on public.fulfillments for update
  to authenticated
  using (public.has_active_supplier_membership(supplier_id))
  with check (public.has_active_supplier_membership(supplier_id));

drop policy if exists "Admins read fulfillment items" on public.fulfillment_items;
create policy "Admins read fulfillment items"
  on public.fulfillment_items for select
  to authenticated
  using (
    public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance', 'support'])
  );

drop policy if exists "Supplier users read assigned fulfillment items" on public.fulfillment_items;
create policy "Supplier users read assigned fulfillment items"
  on public.fulfillment_items for select
  to authenticated
  using (
    exists (
      select 1 from public.fulfillments f
      where f.id = fulfillment_id
        and public.has_active_supplier_membership(f.supplier_id)
    )
  );

drop policy if exists "Supplier users update assigned fulfillment items" on public.fulfillment_items;
create policy "Supplier users update assigned fulfillment items"
  on public.fulfillment_items for update
  to authenticated
  using (
    exists (
      select 1 from public.fulfillments f
      where f.id = fulfillment_id
        and public.has_active_supplier_membership(f.supplier_id)
    )
  )
  with check (
    exists (
      select 1 from public.fulfillments f
      where f.id = fulfillment_id
        and public.has_active_supplier_membership(f.supplier_id)
    )
  );

drop policy if exists "Admins read shipments" on public.shipments;
create policy "Admins read shipments"
  on public.shipments for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance', 'support']));

drop policy if exists "Supplier users manage assigned shipments" on public.shipments;
create policy "Supplier users manage assigned shipments"
  on public.shipments for all
  to authenticated
  using (
    exists (
      select 1 from public.fulfillments f
      where f.id = fulfillment_id
        and public.has_active_supplier_membership(f.supplier_id)
    )
  )
  with check (
    exists (
      select 1 from public.fulfillments f
      where f.id = fulfillment_id
        and public.has_active_supplier_membership(f.supplier_id)
    )
  );

drop policy if exists "Admins manage supplier invoices" on public.supplier_invoices;
create policy "Admins manage supplier invoices"
  on public.supplier_invoices for all
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']))
  with check (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance']));

drop policy if exists "Supplier users read invoices" on public.supplier_invoices;
create policy "Supplier users read invoices"
  on public.supplier_invoices for select
  to authenticated
  using (public.has_active_supplier_membership(supplier_id));

drop policy if exists "Admins read fulfillment audit" on public.fulfillment_audit_log;
create policy "Admins read fulfillment audit"
  on public.fulfillment_audit_log for select
  to authenticated
  using (public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations', 'finance', 'support']));

drop policy if exists "Supplier users read own fulfillment audit" on public.fulfillment_audit_log;
create policy "Supplier users read own fulfillment audit"
  on public.fulfillment_audit_log for select
  to authenticated
  using (
    supplier_id is not null
    and public.has_active_supplier_membership(supplier_id)
  );

drop policy if exists "Admins manage fulfillment artwork" on storage.objects;
create policy "Admins manage fulfillment artwork"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'fulfillment-artwork'
    and public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations'])
  )
  with check (
    bucket_id = 'fulfillment-artwork'
    and public.current_user_has_platform_role(array['administrator', 'super_administrator', 'operations'])
  );

drop policy if exists "Supplier users read fulfillment artwork" on storage.objects;
create policy "Supplier users read fulfillment artwork"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fulfillment-artwork'
    and public.is_supplier_member()
  );
