-- Seed countries, regions, and pilot communities

insert into public.countries (iso_code, name, currency_code, default_locale, active)
values
  ('CA', 'Canada', 'CAD', 'en-CA', true),
  ('US', 'United States', 'USD', 'en-US', true)
on conflict (iso_code) do update
set
  name = excluded.name,
  currency_code = excluded.currency_code,
  default_locale = excluded.default_locale,
  active = excluded.active,
  updated_at = now();

insert into public.administrative_regions (country_id, code, name, region_type, active)
select c.id, v.code, v.name, v.region_type, true
from public.countries c
cross join (
  values
    ('AB', 'Alberta', 'province'),
    ('BC', 'British Columbia', 'province'),
    ('MB', 'Manitoba', 'province'),
    ('NB', 'New Brunswick', 'province'),
    ('NL', 'Newfoundland and Labrador', 'province'),
    ('NS', 'Nova Scotia', 'province'),
    ('NT', 'Northwest Territories', 'territory'),
    ('NU', 'Nunavut', 'territory'),
    ('ON', 'Ontario', 'province'),
    ('PE', 'Prince Edward Island', 'province'),
    ('QC', 'Quebec', 'province'),
    ('SK', 'Saskatchewan', 'province'),
    ('YT', 'Yukon', 'territory')
) as v(code, name, region_type)
where c.iso_code = 'CA'
on conflict (country_id, code) do update
set
  name = excluded.name,
  region_type = excluded.region_type,
  active = excluded.active,
  updated_at = now();

insert into public.administrative_regions (country_id, code, name, region_type, active)
select c.id, v.code, v.name, v.region_type, true
from public.countries c
cross join (
  values
    ('AL', 'Alabama', 'state'),
    ('AK', 'Alaska', 'state'),
    ('AZ', 'Arizona', 'state'),
    ('AR', 'Arkansas', 'state'),
    ('CA', 'California', 'state'),
    ('CO', 'Colorado', 'state'),
    ('CT', 'Connecticut', 'state'),
    ('DE', 'Delaware', 'state'),
    ('DC', 'District of Columbia', 'district'),
    ('FL', 'Florida', 'state'),
    ('GA', 'Georgia', 'state'),
    ('HI', 'Hawaii', 'state'),
    ('ID', 'Idaho', 'state'),
    ('IL', 'Illinois', 'state'),
    ('IN', 'Indiana', 'state'),
    ('IA', 'Iowa', 'state'),
    ('KS', 'Kansas', 'state'),
    ('KY', 'Kentucky', 'state'),
    ('LA', 'Louisiana', 'state'),
    ('ME', 'Maine', 'state'),
    ('MD', 'Maryland', 'state'),
    ('MA', 'Massachusetts', 'state'),
    ('MI', 'Michigan', 'state'),
    ('MN', 'Minnesota', 'state'),
    ('MS', 'Mississippi', 'state'),
    ('MO', 'Missouri', 'state'),
    ('MT', 'Montana', 'state'),
    ('NE', 'Nebraska', 'state'),
    ('NV', 'Nevada', 'state'),
    ('NH', 'New Hampshire', 'state'),
    ('NJ', 'New Jersey', 'state'),
    ('NM', 'New Mexico', 'state'),
    ('NY', 'New York', 'state'),
    ('NC', 'North Carolina', 'state'),
    ('ND', 'North Dakota', 'state'),
    ('OH', 'Ohio', 'state'),
    ('OK', 'Oklahoma', 'state'),
    ('OR', 'Oregon', 'state'),
    ('PA', 'Pennsylvania', 'state'),
    ('RI', 'Rhode Island', 'state'),
    ('SC', 'South Carolina', 'state'),
    ('SD', 'South Dakota', 'state'),
    ('TN', 'Tennessee', 'state'),
    ('TX', 'Texas', 'state'),
    ('UT', 'Utah', 'state'),
    ('VT', 'Vermont', 'state'),
    ('VA', 'Virginia', 'state'),
    ('WA', 'Washington', 'state'),
    ('WV', 'West Virginia', 'state'),
    ('WI', 'Wisconsin', 'state'),
    ('WY', 'Wyoming', 'state')
) as v(code, name, region_type)
where c.iso_code = 'US'
on conflict (country_id, code) do update
set
  name = excluded.name,
  region_type = excluded.region_type,
  active = excluded.active,
  updated_at = now();

insert into public.communities (
  country_id,
  administrative_region_id,
  name,
  display_name,
  subdomain,
  slug,
  community_type,
  timezone,
  latitude,
  longitude,
  population,
  market_status,
  is_public,
  launched_at
)
select
  c.id,
  r.id,
  v.name,
  v.display_name,
  v.subdomain,
  v.slug,
  v.community_type,
  v.timezone,
  v.latitude,
  v.longitude,
  v.population,
  'preparing',
  true,
  now()
from (
  values
    ('CA', 'ON', 'Sault Ste. Marie', 'Sault Ste. Marie Locals Choice Awards', 'saultstemarie', 'sault-ste-marie', 'city', 'America/Toronto', 46.521900, -84.346100, 72000),
    ('CA', 'ON', 'Greater Sudbury', 'Greater Sudbury Locals Choice Awards', 'sudbury', 'greater-sudbury', 'city', 'America/Toronto', 46.491700, -80.993000, 166000),
    ('CA', 'MB', 'Winnipeg', 'Winnipeg Locals Choice Awards', 'winnipeg', 'winnipeg', 'city', 'America/Winnipeg', 49.895100, -97.138400, 750000),
    ('US', 'MI', 'Marquette', 'Marquette Locals Choice Awards', 'marquette', 'marquette', 'city', 'America/Detroit', 46.543600, -87.395400, 21000),
    ('US', 'MI', 'Detroit', 'Detroit Locals Choice Awards', 'detroit', 'detroit', 'city', 'America/Detroit', 42.331400, -83.045800, 630000)
) as v(
  country_code,
  region_code,
  name,
  display_name,
  subdomain,
  slug,
  community_type,
  timezone,
  latitude,
  longitude,
  population
)
join public.countries c on c.iso_code = v.country_code
join public.administrative_regions r
  on r.country_id = c.id
 and r.code = v.region_code
where not exists (
  select 1 from public.communities existing where lower(existing.subdomain) = lower(v.subdomain)
);

insert into public.community_aliases (community_id, alias, normalized_alias)
select com.id, a.alias, a.normalized_alias
from public.communities com
join (
  values
    ('saultstemarie', 'Sault Ste Marie', 'sault-ste-marie'),
    ('saultstemarie', 'The Soo', 'the-soo'),
    ('sudbury', 'Sudbury', 'sudbury-city'),
    ('winnipeg', 'Peg', 'peg'),
    ('detroit', 'Motor City', 'motor-city')
) as a(subdomain, alias, normalized_alias)
  on com.subdomain = a.subdomain
where not exists (
  select 1
  from public.community_aliases existing
  where lower(existing.normalized_alias) = lower(a.normalized_alias)
);
