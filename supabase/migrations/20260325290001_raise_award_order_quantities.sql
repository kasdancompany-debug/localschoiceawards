-- Raise per-line quantity caps so businesses can order multiple trophies/plaques per win.

update public.products
set max_quantity = 20
where slug in (
  'premium-glass-award',
  'premium-wall-plaque',
  'classic-wall-plaque',
  'window-decal',
  'recognition-bundle'
);
