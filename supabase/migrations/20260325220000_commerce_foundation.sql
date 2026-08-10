-- Commerce foundation: catalog, carts, shipping.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  product_type text not null
    check (product_type in ('physical', 'digital', 'bundle')),
  active boolean not null default true,
  requires_award_eligibility boolean not null default true,
  requires_shipping boolean not null default true,
  featured boolean not null default false,
  max_quantity integer not null default 5 check (max_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_shipping_digital_check check (
    (product_type = 'digital' and requires_shipping = false)
    or (product_type <> 'digital')
  )
);

create index if not exists products_active_featured_idx
  on public.products (active, featured, name);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  price_cents integer not null check (price_cents >= 0),
  weight_grams integer not null default 0 check (weight_grams >= 0),
  length_mm integer not null default 0 check (length_mm >= 0),
  width_mm integer not null default 0 check (width_mm >= 0),
  height_mm integer not null default 0 check (height_mm >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, active, currency_code);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  product_variant_id uuid references public.product_variants (id) on delete set null,
  storage_path text not null,
  alt_text text not null default '',
  display_order integer not null default 0
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, display_order);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_token_hash text,
  currency_code text check (currency_code in ('CAD', 'USD') or currency_code is null),
  status text not null default 'open'
    check (status in ('open', 'converted', 'abandoned', 'merged')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (
    user_id is not null or anonymous_token_hash is not null
  )
);

create unique index if not exists carts_open_user_uidx
  on public.carts (user_id)
  where status = 'open' and user_id is not null;

create unique index if not exists carts_open_anon_uidx
  on public.carts (anonymous_token_hash)
  where status = 'open' and anonymous_token_hash is not null;

create index if not exists carts_expires_idx
  on public.carts (expires_at)
  where status = 'open';

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_variant_id uuid not null references public.product_variants (id) on delete restrict,
  award_eligibility_id uuid references public.award_eligibilities (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  personalization_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_cart_idx
  on public.cart_items (cart_id);

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null check (country_code in ('CA', 'US')),
  administrative_region_codes text[] not null default '{}',
  postal_code_patterns text[] not null default '{}',
  active boolean not null default true
);

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  shipping_zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  name text not null,
  description text not null default '',
  pricing_method text not null
    check (pricing_method in ('flat', 'per_item', 'flat_plus_per_item')),
  base_price_cents integer not null default 0 check (base_price_cents >= 0),
  price_per_item_cents integer not null default 0 check (price_per_item_cents >= 0),
  handling_fee_cents integer not null default 0 check (handling_fee_cents >= 0),
  estimated_min_days integer not null default 3 check (estimated_min_days >= 0),
  estimated_max_days integer not null default 7 check (estimated_max_days >= estimated_min_days),
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  active boolean not null default true
);

create index if not exists shipping_methods_zone_idx
  on public.shipping_methods (shipping_zone_id, active, currency_code);

create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  shipping_method_id uuid not null references public.shipping_methods (id) on delete restrict,
  destination_snapshot jsonb not null default '{}'::jsonb,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists shipping_quotes_cart_idx
  on public.shipping_quotes (cart_id, expires_at desc);

create or replace function public.set_commerce_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_commerce_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_commerce_updated_at();

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_commerce_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_commerce_updated_at();

-- RLS
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.shipping_quotes enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public can read active variants" on public.product_variants;
create policy "Public can read active variants"
  on public.product_variants for select
  to anon, authenticated
  using (
    active = true
    and exists (select 1 from public.products p where p.id = product_id and p.active = true)
  );

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.active = true)
  );

drop policy if exists "Users can read own carts" on public.carts;
create policy "Users can read own carts"
  on public.carts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read own cart items" on public.cart_items;
create policy "Users can read own cart items"
  on public.cart_items for select
  to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Public can read active shipping zones" on public.shipping_zones;
create policy "Public can read active shipping zones"
  on public.shipping_zones for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public can read active shipping methods" on public.shipping_methods;
create policy "Public can read active shipping methods"
  on public.shipping_methods for select
  to anon, authenticated
  using (active = true);

-- Cart writes go through service-role (anonymous token validation server-side).
