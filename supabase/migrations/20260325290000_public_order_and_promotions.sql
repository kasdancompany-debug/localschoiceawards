-- Public order funnel + optional guest checkout + business promotion subscriptions.

alter table public.products
  add column if not exists billing_interval text
    check (billing_interval is null or billing_interval in ('month', 'year'));

comment on column public.products.billing_interval is
  'Null for one-time products. month/year for subscription catalog items (e.g. business promotion).';

-- Guest checkout: orders may be placed without an auth user.
alter table public.orders
  alter column user_id drop not null;

-- Seed Business Promotion ($49/mo). Not eligibility-bound; sold via Stripe Subscription Checkout.
insert into public.products (
  id, name, slug, description, product_type, active,
  requires_award_eligibility, requires_shipping, featured, max_quantity, billing_interval
) values (
  'a1000001-0000-4000-8000-000000000006',
  'Business Promotion',
  'business-promotion',
  'Featured directory placement, profile boost, and ongoing visibility for your business listing. Billed monthly. Cancel anytime from the receipt email or support.',
  'digital', true, false, false, true, 1, 'month'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  product_type = excluded.product_type,
  active = excluded.active,
  requires_award_eligibility = excluded.requires_award_eligibility,
  requires_shipping = excluded.requires_shipping,
  featured = excluded.featured,
  max_quantity = excluded.max_quantity,
  billing_interval = excluded.billing_interval;

insert into public.product_variants (
  id, product_id, name, sku, currency_code, price_cents,
  weight_grams, length_mm, width_mm, height_mm, active
) values
  (
    'b1000001-0000-4000-8000-00000000000b',
    'a1000001-0000-4000-8000-000000000006',
    'CAD monthly',
    'PROMO-CAD-MO',
    'CAD',
    4900,
    0, 0, 0, 0,
    true
  ),
  (
    'b1000001-0000-4000-8000-00000000000c',
    'a1000001-0000-4000-8000-000000000006',
    'USD monthly',
    'PROMO-USD-MO',
    'USD',
    4900,
    0, 0, 0, 0,
    true
  )
on conflict (id) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  sku = excluded.sku,
  currency_code = excluded.currency_code,
  price_cents = excluded.price_cents,
  active = excluded.active;

create table if not exists public.business_promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  customer_email text not null,
  user_id uuid references auth.users (id) on delete set null,
  currency_code text not null check (currency_code in ('CAD', 'USD')),
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'incomplete'
    check (status in ('incomplete', 'active', 'past_due', 'canceled', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_promotions_business_status_idx
  on public.business_promotions (business_id, status);

create index if not exists business_promotions_community_status_idx
  on public.business_promotions (community_id, status);

create index if not exists business_promotions_subscription_idx
  on public.business_promotions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create or replace function public.set_business_promotions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_promotions_set_updated_at on public.business_promotions;
create trigger business_promotions_set_updated_at
  before update on public.business_promotions
  for each row execute function public.set_business_promotions_updated_at();

alter table public.business_promotions enable row level security;

drop policy if exists "Admins can read business promotions" on public.business_promotions;
create policy "Admins can read business promotions"
  on public.business_promotions for select
  to authenticated
  using (
    public.current_user_has_platform_role(
      array['administrator', 'super_administrator', 'operations', 'support']
    )
  );

drop policy if exists "Business members can read own promotions" on public.business_promotions;
create policy "Business members can read own promotions"
  on public.business_promotions for select
  to authenticated
  using (
    exists (
      select 1 from public.business_memberships m
      where m.business_id = business_promotions.business_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
