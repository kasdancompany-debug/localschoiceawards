-- Seed CA/US suppliers, product cost mappings, and shipping rates.

insert into public.suppliers (
  id, name, legal_name, country_code, currency_code,
  contact_email, support_email, fulfillment_method,
  production_min_days, production_max_days, active
) values
  (
    'e1000001-0000-4000-8000-000000000001',
    'Maple Recognition Studio',
    'Maple Recognition Studio Inc.',
    'CA',
    'CAD',
    'orders@maple-recognition.example',
    'support@maple-recognition.example',
    'portal',
    5, 12, true
  ),
  (
    'e1000001-0000-4000-8000-000000000002',
    'Frontier Awards Co.',
    'Frontier Awards Company LLC',
    'US',
    'USD',
    'orders@frontier-awards.example',
    'support@frontier-awards.example',
    'email',
    5, 14, true
  )
on conflict (id) do nothing;

-- CAD variants → Canadian supplier
insert into public.supplier_products (
  id, supplier_id, product_variant_id, supplier_sku,
  manufacturing_cost_cents, setup_cost_cents, supplier_currency_code, active
) values
  ('f1000001-0000-4000-8000-000000000001', 'e1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000001', 'MRS-PGA-CAD', 7200, 500, 'CAD', true),
  ('f1000001-0000-4000-8000-000000000002', 'e1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000003', 'MRS-PWP-CAD', 4800, 400, 'CAD', true),
  ('f1000001-0000-4000-8000-000000000003', 'e1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000005', 'MRS-CWP-CAD', 2800, 300, 'CAD', true),
  ('f1000001-0000-4000-8000-000000000004', 'e1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000007', 'MRS-WD-CAD', 900, 150, 'CAD', true),
  ('f1000001-0000-4000-8000-000000000005', 'e1000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000009', 'MRS-RB-CAD', 11000, 600, 'CAD', true),
  -- USD variants → US supplier
  ('f1000001-0000-4000-8000-000000000006', 'e1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000002', 'FAC-PGA-USD', 7200, 500, 'USD', true),
  ('f1000001-0000-4000-8000-000000000007', 'e1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000004', 'FAC-PWP-USD', 4800, 400, 'USD', true),
  ('f1000001-0000-4000-8000-000000000008', 'e1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000006', 'FAC-CWP-USD', 2800, 300, 'USD', true),
  ('f1000001-0000-4000-8000-000000000009', 'e1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000008', 'FAC-WD-USD', 900, 150, 'USD', true),
  ('f1000001-0000-4000-8000-00000000000a', 'e1000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-00000000000a', 'FAC-RB-USD', 11000, 600, 'USD', true)
on conflict (id) do nothing;

insert into public.supplier_shipping_rates (
  id, supplier_id, shipping_zone_id, supplier_product_id,
  shipping_method_name, supplier_cost_cents, customer_charge_cents,
  estimated_min_days, estimated_max_days, active
) values
  (
    'g1000001-0000-4000-8000-000000000001',
    'e1000001-0000-4000-8000-000000000001',
    'c1000001-0000-4000-8000-000000000001',
    null,
    'Canada Ground',
    900, 1500, 3, 8, true
  ),
  (
    'g1000001-0000-4000-8000-000000000002',
    'e1000001-0000-4000-8000-000000000002',
    'c1000001-0000-4000-8000-000000000002',
    null,
    'US Ground',
    800, 1400, 3, 9, true
  )
on conflict (id) do nothing;
