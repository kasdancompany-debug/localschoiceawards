-- Seed campaign template, category taxonomy, and SSM 2027 pilot campaign

insert into public.campaign_templates (name, description, default_nomination_days, default_review_days, default_voting_days, default_audit_days, active)
values (
  'Standard Annual Awards',
  'Default Locals Choice Awards schedule: nominations, finalist review, voting, and audit.',
  28, 14, 21, 10, true
)
on conflict (name) do update set
  description = excluded.description,
  default_nomination_days = excluded.default_nomination_days,
  default_review_days = excluded.default_review_days,
  default_voting_days = excluded.default_voting_days,
  default_audit_days = excluded.default_audit_days,
  active = excluded.active,
  updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Automotive", "automotive", "Dealers, repair, and auto lifestyle", 10, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Beauty and Wellness", "beauty-and-wellness", "Salons, spas, and personal care", 20, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Food and Drink", "food-and-drink", "Restaurants, cafes, and nightlife dining", 30, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Home and Contractors", "home-and-contractors", "Home services and trades", 40, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Health", "health", "Clinics, care providers, and wellness health", 50, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Professional Services", "professional-services", "Business and advisory professionals", 60, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Shopping", "shopping", "Retail and specialty stores", 70, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Entertainment", "entertainment", "Arts, nightlife, and leisure venues", 80, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Pets", "pets", "Pet care, supplies, and services", 90, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Sports and Recreation", "sports-and-recreation", "Fitness, teams, and outdoor recreation", 100, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Community Organizations", "community-organizations", "Nonprofits and civic groups", 110, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Education", "education", "Schools, tutoring, and learning", 120, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Hotels and Tourism", "hotels-and-tourism", "Lodging, travel, and visitor experiences", 130, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("People and Professionals", "people-and-professionals", "Standout local people and roles", 140, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Specialty Services", "specialty-services", "Niche local services", 150, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best New Car Dealership", "new-car-dealership", "Best New Car Dealership in your community.", true, 10
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Used Car Dealership", "used-car-dealership", "Best Used Car Dealership in your community.", true, 20
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Auto Repair Shop", "auto-repair-shop", "Best Auto Repair Shop in your community.", true, 30
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Oil Change", "oil-change", "Best Oil Change in your community.", true, 40
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tire Shop", "tire-shop", "Best Tire Shop in your community.", true, 50
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Auto Body Shop", "auto-body-shop", "Best Auto Body Shop in your community.", true, 60
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Car Wash", "car-wash", "Best Car Wash in your community.", true, 70
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Motorcycle Shop", "motorcycle-shop", "Best Motorcycle Shop in your community.", true, 80
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hair Salon", "hair-salon", "Best Hair Salon in your community.", true, 10
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Barber Shop", "barber-shop", "Best Barber Shop in your community.", true, 20
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Day Spa", "day-spa", "Best Day Spa in your community.", true, 30
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Nail Salon", "nail-salon", "Best Nail Salon in your community.", true, 40
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Med Spa", "med-spa", "Best Med Spa in your community.", true, 50
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Massage Therapy", "massage-therapy", "Best Massage Therapy in your community.", true, 60
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Brow and Lash Studio", "brow-and-lash-studio", "Best Brow and Lash Studio in your community.", true, 70
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fitness Studio", "fitness-studio", "Best Fitness Studio in your community.", true, 80
from public.category_groups g where g.slug = "beauty-and-wellness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fine Dining", "fine-dining", "Best Fine Dining in your community.", true, 10
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Casual Dining", "casual-dining", "Best Casual Dining in your community.", true, 20
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Breakfast Spot", "breakfast-spot", "Best Breakfast Spot in your community.", true, 30
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Burger", "burger", "Best Burger in your community.", true, 40
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pizza", "pizza", "Best Pizza in your community.", true, 50
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sushi", "sushi", "Best Sushi in your community.", true, 60
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Coffee Shop", "coffee-shop", "Best Coffee Shop in your community.", true, 70
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bakery", "bakery", "Best Bakery in your community.", true, 80
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pub", "pub", "Best Pub in your community.", true, 90
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Patio", "patio", "Best Patio in your community.", true, 100
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best General Contractor", "general-contractor", "Best General Contractor in your community.", true, 10
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Plumber", "plumber", "Best Plumber in your community.", true, 20
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Electrician", "electrician", "Best Electrician in your community.", true, 30
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best HVAC Company", "hvac-company", "Best HVAC Company in your community.", true, 40
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Roofing Company", "roofing-company", "Best Roofing Company in your community.", true, 50
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Landscaping", "landscaping", "Best Landscaping in your community.", true, 60
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Interior Designer", "interior-designer", "Best Interior Designer in your community.", true, 70
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Cleaning", "home-cleaning", "Best Home Cleaning in your community.", true, 80
from public.category_groups g where g.slug = "home-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Family Doctor Clinic", "family-doctor-clinic", "Best Family Doctor Clinic in your community.", true, 10
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dentist", "dentist", "Best Dentist in your community.", true, 20
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Orthodontist", "orthodontist", "Best Orthodontist in your community.", true, 30
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Optometrist", "optometrist", "Best Optometrist in your community.", true, 40
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chiropractor", "chiropractor", "Best Chiropractor in your community.", true, 50
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Physiotherapy Clinic", "physiotherapy-clinic", "Best Physiotherapy Clinic in your community.", true, 60
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pharmacy", "pharmacy", "Best Pharmacy in your community.", true, 70
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mental Health Clinic", "mental-health-clinic", "Best Mental Health Clinic in your community.", true, 80
from public.category_groups g where g.slug = "health"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Accountant", "accountant", "Best Accountant in your community.", true, 10
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lawyer", "lawyer", "Best Lawyer in your community.", true, 20
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Real Estate Agent", "real-estate-agent", "Best Real Estate Agent in your community.", true, 30
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mortgage Broker", "mortgage-broker", "Best Mortgage Broker in your community.", true, 40
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Insurance Broker", "insurance-broker", "Best Insurance Broker in your community.", true, 50
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Financial Advisor", "financial-advisor", "Best Financial Advisor in your community.", true, 60
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Marketing Agency", "marketing-agency", "Best Marketing Agency in your community.", true, 70
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best IT Services", "it-services", "Best IT Services in your community.", true, 80
from public.category_groups g where g.slug = "professional-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Clothing Boutique", "clothing-boutique", "Best Clothing Boutique in your community.", true, 10
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Jewelry Store", "jewelry-store", "Best Jewelry Store in your community.", true, 20
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bookstore", "bookstore", "Best Bookstore in your community.", true, 30
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Decor Store", "home-decor-store", "Best Home Decor Store in your community.", true, 40
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Electronics Store", "electronics-store", "Best Electronics Store in your community.", true, 50
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Gift Shop", "gift-shop", "Best Gift Shop in your community.", true, 60
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Thrift Store", "thrift-store", "Best Thrift Store in your community.", true, 70
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Farmers Market Vendor", "farmers-market-vendor", "Best Farmers Market Vendor in your community.", true, 80
from public.category_groups g where g.slug = "shopping"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Live Music Venue", "live-music-venue", "Best Live Music Venue in your community.", true, 10
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Movie Theatre", "movie-theatre", "Best Movie Theatre in your community.", true, 20
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Comedy Night", "comedy-night", "Best Comedy Night in your community.", true, 30
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Escape Room", "escape-room", "Best Escape Room in your community.", true, 40
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bowling Alley", "bowling-alley", "Best Bowling Alley in your community.", true, 50
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Arcade", "arcade", "Best Arcade in your community.", true, 60
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Festival", "festival", "Best Festival in your community.", true, 70
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local Theatre Company", "local-theatre-company", "Best Local Theatre Company in your community.", true, 80
from public.category_groups g where g.slug = "entertainment"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Veterinary Clinic", "veterinary-clinic", "Best Veterinary Clinic in your community.", true, 10
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Groomer", "pet-groomer", "Best Pet Groomer in your community.", true, 20
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Store", "pet-store", "Best Pet Store in your community.", true, 30
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dog Daycare", "dog-daycare", "Best Dog Daycare in your community.", true, 40
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Boarding", "pet-boarding", "Best Pet Boarding in your community.", true, 50
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dog Trainer", "dog-trainer", "Best Dog Trainer in your community.", true, 60
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Photographer", "pet-photographer", "Best Pet Photographer in your community.", true, 70
from public.category_groups g where g.slug = "pets"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Gym", "gym", "Best Gym in your community.", true, 10
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Yoga Studio", "yoga-studio", "Best Yoga Studio in your community.", true, 20
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Martial Arts School", "martial-arts-school", "Best Martial Arts School in your community.", true, 30
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Youth Sports Program", "youth-sports-program", "Best Youth Sports Program in your community.", true, 40
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Golf Course", "golf-course", "Best Golf Course in your community.", true, 50
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Outdoor Adventure Company", "outdoor-adventure-company", "Best Outdoor Adventure Company in your community.", true, 60
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sports Bar", "sports-bar", "Best Sports Bar in your community.", true, 70
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Recreation Centre", "recreation-centre", "Best Recreation Centre in your community.", true, 80
from public.category_groups g where g.slug = "sports-and-recreation"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Charity", "charity", "Best Charity in your community.", true, 10
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Service Club", "service-club", "Best Service Club in your community.", true, 20
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Youth Organization", "youth-organization", "Best Youth Organization in your community.", true, 30
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Arts Organization", "arts-organization", "Best Arts Organization in your community.", true, 40
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cultural Association", "cultural-association", "Best Cultural Association in your community.", true, 50
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Volunteer Program", "volunteer-program", "Best Volunteer Program in your community.", true, 60
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Community Event Organizer", "community-event-organizer", "Best Community Event Organizer in your community.", true, 70
from public.category_groups g where g.slug = "community-organizations"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tutoring Service", "tutoring-service", "Best Tutoring Service in your community.", true, 10
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Preschool", "preschool", "Best Preschool in your community.", true, 20
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dance School", "dance-school", "Best Dance School in your community.", true, 30
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Music School", "music-school", "Best Music School in your community.", true, 40
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Language School", "language-school", "Best Language School in your community.", true, 50
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Driving School", "driving-school", "Best Driving School in your community.", true, 60
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Adult Education Program", "adult-education-program", "Best Adult Education Program in your community.", true, 70
from public.category_groups g where g.slug = "education"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hotel", "hotel", "Best Hotel in your community.", true, 10
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Boutique Inn", "boutique-inn", "Best Boutique Inn in your community.", true, 20
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bed and Breakfast", "bed-and-breakfast", "Best Bed and Breakfast in your community.", true, 30
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tour Operator", "tour-operator", "Best Tour Operator in your community.", true, 40
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Visitor Attraction", "visitor-attraction", "Best Visitor Attraction in your community.", true, 50
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Campground", "campground", "Best Campground in your community.", true, 60
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Event Venue", "event-venue", "Best Event Venue in your community.", true, 70
from public.category_groups g where g.slug = "hotels-and-tourism"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local Chef", "local-chef", "Best Local Chef in your community.", true, 10
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local Musician", "local-musician", "Best Local Musician in your community.", true, 20
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local Artist", "local-artist", "Best Local Artist in your community.", true, 30
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Coach", "coach", "Best Coach in your community.", true, 40
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Teacher", "teacher", "Best Teacher in your community.", true, 50
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Server", "server", "Best Server in your community.", true, 60
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bartender", "bartender", "Best Bartender in your community.", true, 70
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Entrepreneur", "entrepreneur", "Best Entrepreneur in your community.", true, 80
from public.category_groups g where g.slug = "people-and-professionals"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Photographer", "photographer", "Best Photographer in your community.", true, 10
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wedding Planner", "wedding-planner", "Best Wedding Planner in your community.", true, 20
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Printing Company", "printing-company", "Best Printing Company in your community.", true, 30
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Moving Company", "moving-company", "Best Moving Company in your community.", true, 40
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Storage Facility", "storage-facility", "Best Storage Facility in your community.", true, 50
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Security Company", "security-company", "Best Security Company in your community.", true, 60
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dry Cleaner", "dry-cleaner", "Best Dry Cleaner in your community.", true, 70
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tailor", "tailor", "Best Tailor in your community.", true, 80
from public.category_groups g where g.slug = "specialty-services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

-- 2027 pilot campaign for Sault Ste. Marie
do $$
declare
  v_community_id uuid;
  v_template_id uuid;
  v_campaign_id uuid;
begin
  select id into v_community_id from public.communities where subdomain = 'saultstemarie' limit 1;
  select id into v_template_id from public.campaign_templates where name = 'Standard Annual Awards' limit 1;
  if v_community_id is null or v_template_id is null then
    raise notice 'Skipping SSM 2027 campaign seed; community or template missing';
    return;
  end if;

  insert into public.campaigns (
    community_id, campaign_template_id, year, name, status,
    nomination_opens_at, nomination_closes_at, finalist_review_closes_at,
    voting_opens_at, voting_closes_at, results_publish_at,
    timezone, exact_vote_totals_public, published_at
  )
  values (
    v_community_id, v_template_id, 2027,
    'Sault Ste. Marie Locals Choice Awards 2027', 'scheduled',
    timestamptz '2027-01-12 09:00:00 America/Toronto',
    timestamptz '2027-02-09 23:59:59 America/Toronto',
    timestamptz '2027-02-23 23:59:59 America/Toronto',
    timestamptz '2027-02-24 09:00:00 America/Toronto',
    timestamptz '2027-03-17 23:59:59 America/Toronto',
    timestamptz '2027-03-27 12:00:00 America/Toronto',
    'America/Toronto', false, now()
  )
  on conflict (community_id, year) do update set
    name = excluded.name,
    status = excluded.status,
    nomination_opens_at = excluded.nomination_opens_at,
    nomination_closes_at = excluded.nomination_closes_at,
    finalist_review_closes_at = excluded.finalist_review_closes_at,
    voting_opens_at = excluded.voting_opens_at,
    voting_closes_at = excluded.voting_closes_at,
    results_publish_at = excluded.results_publish_at,
    timezone = excluded.timezone,
    published_at = coalesce(public.campaigns.published_at, excluded.published_at),
    updated_at = now()
  returning id into v_campaign_id;

  if v_campaign_id is null then
    select id into v_campaign_id from public.campaigns where community_id = v_community_id and year = 2027;
  end if;

  delete from public.campaign_phases where campaign_id = v_campaign_id;
  insert into public.campaign_phases (campaign_id, phase, starts_at, ends_at, status) values
    (v_campaign_id, 'nomination', timestamptz '2027-01-12 09:00:00 America/Toronto', timestamptz '2027-02-09 23:59:59 America/Toronto', 'scheduled'),
    (v_campaign_id, 'finalist_review', timestamptz '2027-02-10 00:00:00 America/Toronto', timestamptz '2027-02-23 23:59:59 America/Toronto', 'scheduled'),
    (v_campaign_id, 'voting', timestamptz '2027-02-24 09:00:00 America/Toronto', timestamptz '2027-03-17 23:59:59 America/Toronto', 'scheduled'),
    (v_campaign_id, 'audit', timestamptz '2027-03-18 00:00:00 America/Toronto', timestamptz '2027-03-27 11:59:59 America/Toronto', 'scheduled'),
    (v_campaign_id, 'results', timestamptz '2027-03-27 12:00:00 America/Toronto', timestamptz '2027-12-31 23:59:59 America/Toronto', 'scheduled');

  insert into public.campaign_categories (campaign_id, master_category_id, local_name, local_slug, local_description, finalist_limit, minimum_nomination_count, active, display_order)
  select v_campaign_id, mc.id, null, null, null, 5, 3, true, mc.display_order
  from public.master_categories mc
  join public.category_groups cg on cg.id = mc.category_group_id
  where mc.active = true and cg.active = true
  on conflict (campaign_id, master_category_id) do update set
    active = excluded.active,
    display_order = excluded.display_order,
    minimum_nomination_count = excluded.minimum_nomination_count,
    updated_at = now();
end $$;
