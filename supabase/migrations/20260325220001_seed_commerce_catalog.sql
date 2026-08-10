-- Seed award products (CAD + USD variants) and shipping zones/methods.

insert into public.products (
  id, name, slug, description, product_type, active,
  requires_award_eligibility, requires_shipping, featured, max_quantity
) values
  (
    'a1000001-0000-4000-8000-000000000001',
    'Premium Glass Award',
    'premium-glass-award',
    'Made-to-order personalized glass award for published Locals Choice winners. Shipping is charged separately at checkout.',
    'physical', true, true, true, true, 3
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'Premium Wall Plaque',
    'premium-wall-plaque',
    'Made-to-order premium wall plaque with winner personalization. Shipping is an additional checkout cost.',
    'physical', true, true, true, true, 5
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'Classic Wall Plaque',
    'classic-wall-plaque',
    'Classic personalized wall plaque for award-eligible businesses. Shipping is billed separately.',
    'physical', true, true, true, false, 5
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'Window Decal',
    'window-decal',
    'Personalized window decal celebrating a published win. Shipping is charged separately.',
    'physical', true, true, true, false, 10
  ),
  (
    'a1000001-0000-4000-8000-000000000005',
    'Recognition Bundle',
    'recognition-bundle',
    'Bundle including plaque and decal options for a published win. Shipping is a separate checkout line item.',
    'bundle', true, true, true, true, 2
  )
on conflict (id) do nothing;

insert into public.product_variants (
  id, product_id, name, sku, currency_code, price_cents,
  weight_grams, length_mm, width_mm, height_mm, active
) values
  -- Premium Glass Award
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', 'CAD', 'PGA-CAD', 'CAD', 15900, 1800, 200, 150, 80, true),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000001', 'USD', 'PGA-USD', 'USD', 15900, 1800, 200, 150, 80, true),
  -- Premium Wall Plaque
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000002', 'CAD', 'PWP-CAD', 'CAD', 10900, 900, 300, 230, 20, true),
  ('b1000001-0000-4000-8000-000000000004', 'a1000001-0000-4000-8000-000000000002', 'USD', 'PWP-USD', 'USD', 10900, 900, 300, 230, 20, true),
  -- Classic Wall Plaque
  ('b1000001-0000-4000-8000-000000000005', 'a1000001-0000-4000-8000-000000000003', 'CAD', 'CWP-CAD', 'CAD', 6900, 700, 280, 210, 18, true),
  ('b1000001-0000-4000-8000-000000000006', 'a1000001-0000-4000-8000-000000000003', 'USD', 'CWP-USD', 'USD', 6900, 700, 280, 210, 18, true),
  -- Window Decal
  ('b1000001-0000-4000-8000-000000000007', 'a1000001-0000-4000-8000-000000000004', 'CAD', 'WD-CAD', 'CAD', 3900, 80, 200, 150, 2, true),
  ('b1000001-0000-4000-8000-000000000008', 'a1000001-0000-4000-8000-000000000004', 'USD', 'WD-USD', 'USD', 3900, 80, 200, 150, 2, true),
  -- Recognition Bundle
  ('b1000001-0000-4000-8000-000000000009', 'a1000001-0000-4000-8000-000000000005', 'CAD', 'RB-CAD', 'CAD', 24900, 1600, 320, 250, 80, true),
  ('b1000001-0000-4000-8000-00000000000a', 'a1000001-0000-4000-8000-000000000005', 'USD', 'RB-USD', 'USD', 24900, 1600, 320, 250, 80, true)
on conflict (id) do nothing;

insert into public.shipping_zones (id, name, country_code, administrative_region_codes, postal_code_patterns, active)
values
  (
    'c1000001-0000-4000-8000-000000000001',
    'Canada',
    'CA',
    '{}',
    array['^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$'],
    true
  ),
  (
    'c1000001-0000-4000-8000-000000000002',
    'United States',
    'US',
    '{}',
    array['^\\d{5}(-\\d{4})?$'],
    true
  )
on conflict (id) do nothing;

insert into public.shipping_methods (
  id, shipping_zone_id, name, description, pricing_method,
  base_price_cents, price_per_item_cents, handling_fee_cents,
  estimated_min_days, estimated_max_days, currency_code, active
) values
  (
    'd1000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000001',
    'Canada Standard',
    'Tracked ground shipping within Canada. Charged separately from product price.',
    'flat_plus_per_item',
    1200, 400, 300, 3, 8, 'CAD', true
  ),
  (
    'd1000001-0000-4000-8000-000000000002',
    'c1000001-0000-4000-8000-000000000001',
    'Canada Express',
    'Faster tracked shipping within Canada.',
    'flat_plus_per_item',
    2200, 500, 300, 1, 3, 'CAD', true
  ),
  (
    'd1000001-0000-4000-8000-000000000003',
    'c1000001-0000-4000-8000-000000000002',
    'US Standard',
    'Tracked ground shipping within the United States. Charged separately from product price.',
    'flat_plus_per_item',
    1400, 450, 350, 3, 9, 'USD', true
  ),
  (
    'd1000001-0000-4000-8000-000000000004',
    'c1000001-0000-4000-8000-000000000002',
    'US Express',
    'Faster tracked shipping within the United States.',
    'flat_plus_per_item',
    2600, 550, 350, 1, 3, 'USD', true
  )
on conflict (id) do nothing;
