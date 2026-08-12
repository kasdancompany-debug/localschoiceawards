-- CommunityVotes-ported category catalog expansion
-- Source: CommunityVotes Sault Ste. Marie category/list (2026-08-12)
-- 15 groups · 377 master categories
-- Idempotent upserts by slug; attaches missing categories to campaigns.

insert into public.category_groups (name, slug, description, display_order, active)
values ("Automotive", "automotive", "Dealers, repair, detailing, and auto lifestyle", 10, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Education, Lessons and Courses", "education-lessons-and-courses", "Schools, tutors, lessons, and training", 20, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Financial", "financial", "Banks, advisors, tax, and lending", 30, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Food and Drink", "food-and-drink", "Restaurants, cafes, groceries, and nightlife dining", 40, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Healthcare", "healthcare", "Clinics, dentists, therapy, and medical services", 50, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Home, Builders and Contractors", "home-builders-and-contractors", "Trades, builders, and home services", 60, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Parenting and Childcare", "parenting-and-childcare", "Childcare, kids activities, and family services", 70, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Pet and Pet Care", "pet-and-pet-care", "Vets, groomers, boarding, and pet supplies", 80, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Retail Stores", "retail-stores", "Shopping and specialty retail", 90, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Services", "services", "Local professional and household services", 100, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Sports, Recreation and Fitness", "sports-recreation-and-fitness", "Gyms, sports, outdoors, and recreation", 110, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Wellness, Hair and Beauty", "wellness-hair-and-beauty", "Salons, spas, and personal care", 120, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Hotels and Tourism", "hotels-and-tourism", "Lodging, travel, and visitor experiences", 130, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("Community Organizations", "community-organizations", "Nonprofits and civic groups", 140, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.category_groups (name, slug, description, display_order, active)
values ("People and Professionals", "people-and-professionals", "Standout local people and roles", 150, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Auto Detailing", "auto-detailing", "Best Auto Detailing in your community.", true, 10
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Auto Rental", "auto-rental", "Best Auto Rental in your community.", true, 20
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Autobody and Interior Repair", "autobody-and-interior-repair", "Best Autobody and Interior Repair in your community.", true, 30
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Brakes", "brakes", "Best Brakes in your community.", true, 40
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Car Parts and Accessories", "car-parts-and-accessories", "Best Car Parts and Accessories in your community.", true, 50
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Car Wash", "car-wash", "Best Car Wash in your community.", true, 60
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Glass Repair", "glass-repair", "Best Glass Repair in your community.", true, 70
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Inspection", "inspection", "Best Inspection in your community.", true, 80
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best New Car Dealers", "new-car-dealers", "Best New Car Dealers in your community.", true, 90
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Oil Change", "oil-change", "Best Oil Change in your community.", true, 100
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Racing and Autosports Parts", "racing-and-autosports-parts", "Best Racing and Autosports Parts in your community.", true, 110
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Repair and Maintenance", "repair-and-maintenance", "Best Repair and Maintenance in your community.", true, 120
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Rust Proofing and Undercoating", "rust-proofing-and-undercoating", "Best Rust Proofing and Undercoating in your community.", true, 130
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tire Retailers", "tire-retailers", "Best Tire Retailers in your community.", true, 140
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Towing", "towing", "Best Towing in your community.", true, 150
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Truck Accessories", "truck-accessories", "Best Truck Accessories in your community.", true, 160
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Used Car Dealers", "used-car-dealers", "Best Used Car Dealers in your community.", true, 170
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Used Parts and Accessories", "used-parts-and-accessories", "Best Used Parts and Accessories in your community.", true, 180
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Window Tinting", "window-tinting", "Best Window Tinting in your community.", true, 190
from public.category_groups g where g.slug = "automotive"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Art Lessons", "art-lessons", "Best Art Lessons in your community.", true, 10
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Commercial Driver Training", "commercial-driver-training", "Best Commercial Driver Training in your community.", true, 20
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Driving School", "driving-school", "Best Driving School in your community.", true, 30
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best First Aid Courses", "first-aid-courses", "Best First Aid Courses in your community.", true, 40
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Music Lessons", "music-lessons", "Best Music Lessons in your community.", true, 50
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Performing Arts", "performing-arts", "Best Performing Arts in your community.", true, 60
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tutors", "tutors", "Best Tutors in your community.", true, 70
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Youth Music Lessons", "youth-music-lessons", "Best Youth Music Lessons in your community.", true, 80
from public.category_groups g where g.slug = "education-lessons-and-courses"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Accountants", "accountants", "Best Accountants in your community.", true, 10
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Accounting Firms", "accounting-firms", "Best Accounting Firms in your community.", true, 20
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Banks", "banks", "Best Banks in your community.", true, 30
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bookkeeping", "bookkeeping", "Best Bookkeeping in your community.", true, 40
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Credit Unions", "credit-unions", "Best Credit Unions in your community.", true, 50
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Financial Advisors", "financial-advisors", "Best Financial Advisors in your community.", true, 60
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Income Tax Preparation", "income-tax-preparation", "Best Income Tax Preparation in your community.", true, 70
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Loans", "loans", "Best Loans in your community.", true, 80
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mortgages and Brokers", "mortgages-and-brokers", "Best Mortgages and Brokers in your community.", true, 90
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mutual Funds", "mutual-funds", "Best Mutual Funds in your community.", true, 100
from public.category_groups g where g.slug = "financial"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Restaurant Overall", "restaurant-overall", "Best Restaurant Overall in your community.", true, 10
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best American Restaurants", "american-restaurants", "Best American Restaurants in your community.", true, 20
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Asian Restaurants", "asian-restaurants", "Best Asian Restaurants in your community.", true, 30
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bagels", "bagels", "Best Bagels in your community.", true, 40
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bakeries", "bakeries", "Best Bakeries in your community.", true, 50
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bars & Pubs", "bars-and-pubs", "Best Bars & Pubs in your community.", true, 60
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Breakfast Restaurant", "breakfast-restaurant", "Best Breakfast Restaurant in your community.", true, 70
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Brunch", "brunch", "Best Brunch in your community.", true, 80
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Burgers", "burgers", "Best Burgers in your community.", true, 90
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Butcher Shops", "butcher-shops", "Best Butcher Shops in your community.", true, 100
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cafes and Coffee Shops", "cafes-and-coffee-shops", "Best Cafes and Coffee Shops in your community.", true, 110
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cakes", "cakes", "Best Cakes in your community.", true, 120
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Caterers", "caterers", "Best Caterers in your community.", true, 130
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chicken Restaurants", "chicken-restaurants", "Best Chicken Restaurants in your community.", true, 140
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chinese Restaurants", "chinese-restaurants", "Best Chinese Restaurants in your community.", true, 150
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chocolate Shop", "chocolate-shop", "Best Chocolate Shop in your community.", true, 160
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cookies", "cookies", "Best Cookies in your community.", true, 170
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Delis", "delis", "Best Delis in your community.", true, 180
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dessert", "dessert", "Best Dessert in your community.", true, 190
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Donuts", "donuts", "Best Donuts in your community.", true, 200
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fast Food", "fast-food", "Best Fast Food in your community.", true, 210
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fine Dining", "fine-dining", "Best Fine Dining in your community.", true, 220
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fish and Chips", "fish-and-chips", "Best Fish and Chips in your community.", true, 230
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Food Trucks", "food-trucks", "Best Food Trucks in your community.", true, 240
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fries", "fries", "Best Fries in your community.", true, 250
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Gourmet Food Shops", "gourmet-food-shops", "Best Gourmet Food Shops in your community.", true, 260
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Grocery Stores", "grocery-stores", "Best Grocery Stores in your community.", true, 270
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Health Food Stores", "health-food-stores", "Best Health Food Stores in your community.", true, 280
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Ice Cream", "ice-cream", "Best Ice Cream in your community.", true, 290
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Indian Restaurants", "indian-restaurants", "Best Indian Restaurants in your community.", true, 300
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best International Food", "international-food", "Best International Food in your community.", true, 310
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Italian Restaurants", "italian-restaurants", "Best Italian Restaurants in your community.", true, 320
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Japanese Restaurants", "japanese-restaurants", "Best Japanese Restaurants in your community.", true, 330
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Juice", "juice", "Best Juice in your community.", true, 340
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mexican Restaurants", "mexican-restaurants", "Best Mexican Restaurants in your community.", true, 350
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pasta", "pasta", "Best Pasta in your community.", true, 360
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pastry", "pastry", "Best Pastry in your community.", true, 370
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pizza", "pizza", "Best Pizza in your community.", true, 380
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Poutine", "poutine", "Best Poutine in your community.", true, 390
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sandwiches and Subs", "sandwiches-and-subs", "Best Sandwiches and Subs in your community.", true, 400
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Seafood", "seafood", "Best Seafood in your community.", true, 410
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Soup", "soup", "Best Soup in your community.", true, 420
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Specialty Coffee", "specialty-coffee", "Best Specialty Coffee in your community.", true, 430
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Specialty Foods", "specialty-foods", "Best Specialty Foods in your community.", true, 440
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Steakhouses", "steakhouses", "Best Steakhouses in your community.", true, 450
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Take Out", "take-out", "Best Take Out in your community.", true, 460
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Thai Restaurants", "thai-restaurants", "Best Thai Restaurants in your community.", true, 470
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Vegetarian Restaurants", "vegetarian-restaurants", "Best Vegetarian Restaurants in your community.", true, 480
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wings", "wings", "Best Wings in your community.", true, 490
from public.category_groups g where g.slug = "food-and-drink"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Acupuncture", "acupuncture", "Best Acupuncture in your community.", true, 10
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Audiologists and Hearing Aids", "audiologists-and-hearing-aids", "Best Audiologists and Hearing Aids in your community.", true, 20
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chiropodist", "chiropodist", "Best Chiropodist in your community.", true, 30
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Chiropractic Clinic", "chiropractic-clinic", "Best Chiropractic Clinic in your community.", true, 40
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Contact Lenses", "contact-lenses", "Best Contact Lenses in your community.", true, 50
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Custom Foot Orthotics", "custom-foot-orthotics", "Best Custom Foot Orthotics in your community.", true, 60
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dental Clinic", "dental-clinic", "Best Dental Clinic in your community.", true, 70
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dental Hygiene Clinic", "dental-hygiene-clinic", "Best Dental Hygiene Clinic in your community.", true, 80
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dentists", "dentists", "Best Dentists in your community.", true, 90
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dentures", "dentures", "Best Dentures in your community.", true, 100
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Eyeglasses", "eyeglasses", "Best Eyeglasses in your community.", true, 110
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Foot Care Clinic", "foot-care-clinic", "Best Foot Care Clinic in your community.", true, 120
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Holistic Wellness", "holistic-wellness", "Best Holistic Wellness in your community.", true, 130
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Health Care", "home-health-care", "Best Home Health Care in your community.", true, 140
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Medical Equipment", "home-medical-equipment", "Best Home Medical Equipment in your community.", true, 150
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Support Services", "home-support-services", "Best Home Support Services in your community.", true, 160
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Laser Eye Correction", "laser-eye-correction", "Best Laser Eye Correction in your community.", true, 170
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Massages", "massages", "Best Massages in your community.", true, 180
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Naturopaths", "naturopaths", "Best Naturopaths in your community.", true, 190
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Optometrists", "optometrists", "Best Optometrists in your community.", true, 200
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Orthodontics", "orthodontics", "Best Orthodontics in your community.", true, 210
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pedorthics and Orthotics", "pedorthics-and-orthotics", "Best Pedorthics and Orthotics in your community.", true, 220
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pharmacies and Drug Stores", "pharmacies-and-drug-stores", "Best Pharmacies and Drug Stores in your community.", true, 230
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Physicians and Surgeons", "physicians-and-surgeons", "Best Physicians and Surgeons in your community.", true, 240
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Physiotherapists and Rehab Clinics", "physiotherapists-and-rehab-clinics", "Best Physiotherapists and Rehab Clinics in your community.", true, 250
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Therapy and Counselling", "therapy-and-counselling", "Best Therapy and Counselling in your community.", true, 260
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Weight Loss and Nutrition", "weight-loss-and-nutrition", "Best Weight Loss and Nutrition in your community.", true, 270
from public.category_groups g where g.slug = "healthcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Architecture and Design", "architecture-and-design", "Best Architecture and Design in your community.", true, 10
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bathroom Specialists", "bathroom-specialists", "Best Bathroom Specialists in your community.", true, 20
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cabinets and Cabinet Makers", "cabinets-and-cabinet-makers", "Best Cabinets and Cabinet Makers in your community.", true, 30
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Carpentry & Woodworking", "carpentry-and-woodworking", "Best Carpentry & Woodworking in your community.", true, 40
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Carpet Cleaning", "carpet-cleaning", "Best Carpet Cleaning in your community.", true, 50
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cement, Concrete, Masonry", "cement-concrete-masonry", "Best Cement, Concrete, Masonry in your community.", true, 60
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Doors and Windows", "doors-and-windows", "Best Doors and Windows in your community.", true, 70
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Drywall and Insulation", "drywall-and-insulation", "Best Drywall and Insulation in your community.", true, 80
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Eavestroughs", "eavestroughs", "Best Eavestroughs in your community.", true, 90
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Electrician", "electrician", "Best Electrician in your community.", true, 100
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Engineers", "engineers", "Best Engineers in your community.", true, 110
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Excavation", "excavation", "Best Excavation in your community.", true, 120
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fences", "fences", "Best Fences in your community.", true, 130
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Floor Installation and Refinishing", "floor-installation-and-refinishing", "Best Floor Installation and Refinishing in your community.", true, 140
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Gas Fitting and Piping", "gas-fitting-and-piping", "Best Gas Fitting and Piping in your community.", true, 150
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best General Contractors", "general-contractors", "Best General Contractors in your community.", true, 160
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Heating and Cooling", "heating-and-cooling", "Best Heating and Cooling in your community.", true, 170
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Cleaners", "home-cleaners", "Best Home Cleaners in your community.", true, 180
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Improvements and Renovations", "home-improvements-and-renovations", "Best Home Improvements and Renovations in your community.", true, 190
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best House Inspection", "house-inspection", "Best House Inspection in your community.", true, 200
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Interior Decorator", "interior-decorator", "Best Interior Decorator in your community.", true, 210
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Interior Design", "interior-design", "Best Interior Design in your community.", true, 220
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Kitchen Specialists", "kitchen-specialists", "Best Kitchen Specialists in your community.", true, 230
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Landscaping and Lawn Design", "landscaping-and-lawn-design", "Best Landscaping and Lawn Design in your community.", true, 240
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lawn Care and Maintenance", "lawn-care-and-maintenance", "Best Lawn Care and Maintenance in your community.", true, 250
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Painting", "painting", "Best Painting in your community.", true, 260
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Paving and Driveways", "paving-and-driveways", "Best Paving and Driveways in your community.", true, 270
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Plumbers and Plumbing", "plumbers-and-plumbing", "Best Plumbers and Plumbing in your community.", true, 280
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pool Service", "pool-service", "Best Pool Service in your community.", true, 290
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Roofing", "roofing", "Best Roofing in your community.", true, 300
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Roofing, Siding and Soffits", "roofing-siding-and-soffits", "Best Roofing, Siding and Soffits in your community.", true, 310
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Siding and Soffits", "siding-and-soffits", "Best Siding and Soffits in your community.", true, 320
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tile Installer", "tile-installer", "Best Tile Installer in your community.", true, 330
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tree Services", "tree-services", "Best Tree Services in your community.", true, 340
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Waste Bin Rental", "waste-bin-rental", "Best Waste Bin Rental in your community.", true, 350
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Water Services", "water-services", "Best Water Services in your community.", true, 360
from public.category_groups g where g.slug = "home-builders-and-contractors"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best After School Programs", "after-school-programs", "Best After School Programs in your community.", true, 10
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Art and Enrichment Programs", "art-and-enrichment-programs", "Best Art and Enrichment Programs in your community.", true, 20
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Baby Furniture", "baby-furniture", "Best Baby Furniture in your community.", true, 30
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Baby Products", "baby-products", "Best Baby Products in your community.", true, 40
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Child Play Places", "child-play-places", "Best Child Play Places in your community.", true, 50
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Childcare Services", "childcare-services", "Best Childcare Services in your community.", true, 60
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Children's Clothing Stores", "children-s-clothing-stores", "Best Children's Clothing Stores in your community.", true, 70
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Children's Entertainer", "children-s-entertainer", "Best Children's Entertainer in your community.", true, 80
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Childrens' Activities", "childrens-activities", "Best Childrens' Activities in your community.", true, 90
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Daycare", "daycare", "Best Daycare in your community.", true, 100
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Indoor Playground", "indoor-playground", "Best Indoor Playground in your community.", true, 110
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Maternity Clothes", "maternity-clothes", "Best Maternity Clothes in your community.", true, 120
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Youth Swimming Lessons", "youth-swimming-lessons", "Best Youth Swimming Lessons in your community.", true, 130
from public.category_groups g where g.slug = "parenting-and-childcare"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Kennels", "kennels", "Best Kennels in your community.", true, 10
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Food", "pet-food", "Best Pet Food in your community.", true, 20
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Grooming", "pet-grooming", "Best Pet Grooming in your community.", true, 30
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Shops", "pet-shops", "Best Pet Shops in your community.", true, 40
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pet Training", "pet-training", "Best Pet Training in your community.", true, 50
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Vet Clinics", "vet-clinics", "Best Vet Clinics in your community.", true, 60
from public.category_groups g where g.slug = "pet-and-pet-care"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Antique Dealers", "antique-dealers", "Best Antique Dealers in your community.", true, 10
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Appliances", "appliances", "Best Appliances in your community.", true, 20
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Art & Craft Supplies", "art-and-craft-supplies", "Best Art & Craft Supplies in your community.", true, 30
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Beauty Supplies", "beauty-supplies", "Best Beauty Supplies in your community.", true, 40
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bicycle Shop", "bicycle-shop", "Best Bicycle Shop in your community.", true, 50
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Blinds and Window Coverings", "blinds-and-window-coverings", "Best Blinds and Window Coverings in your community.", true, 60
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Book Stores", "book-stores", "Best Book Stores in your community.", true, 70
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Boots", "boots", "Best Boots in your community.", true, 80
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Boutiques", "boutiques", "Best Boutiques in your community.", true, 90
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bridal Shops", "bridal-shops", "Best Bridal Shops in your community.", true, 100
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Building Supplies", "building-supplies", "Best Building Supplies in your community.", true, 110
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bulk Foods", "bulk-foods", "Best Bulk Foods in your community.", true, 120
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cameras", "cameras", "Best Cameras in your community.", true, 130
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Camping & Outdoors Equipment", "camping-and-outdoors-equipment", "Best Camping & Outdoors Equipment in your community.", true, 140
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Candy", "candy", "Best Candy in your community.", true, 150
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cannabis", "cannabis", "Best Cannabis in your community.", true, 160
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Carpets and Rugs", "carpets-and-rugs", "Best Carpets and Rugs in your community.", true, 170
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cell Phone Services", "cell-phone-services", "Best Cell Phone Services in your community.", true, 180
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Ceramic Tiles", "ceramic-tiles", "Best Ceramic Tiles in your community.", true, 190
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Comic Books", "comic-books", "Best Comic Books in your community.", true, 200
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Computer Stores", "computer-stores", "Best Computer Stores in your community.", true, 210
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Convenience Stores", "convenience-stores", "Best Convenience Stores in your community.", true, 220
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Counter Tops", "counter-tops", "Best Counter Tops in your community.", true, 230
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Crafts Store", "crafts-store", "Best Crafts Store in your community.", true, 240
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Department Stores", "department-stores", "Best Department Stores in your community.", true, 250
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Discount Store", "discount-store", "Best Discount Store in your community.", true, 260
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Electronics Store", "electronics-store", "Best Electronics Store in your community.", true, 270
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Exercise Equipment", "exercise-equipment", "Best Exercise Equipment in your community.", true, 280
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fabric, Wool and Yarn", "fabric-wool-and-yarn", "Best Fabric, Wool and Yarn in your community.", true, 290
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fireplaces and Gas Stoves", "fireplaces-and-gas-stoves", "Best Fireplaces and Gas Stoves in your community.", true, 300
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fishing Supplies", "fishing-supplies", "Best Fishing Supplies in your community.", true, 310
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Florists and Flower Shops", "florists-and-flower-shops", "Best Florists and Flower Shops in your community.", true, 320
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Furniture", "furniture", "Best Furniture in your community.", true, 330
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Garden Centres", "garden-centres", "Best Garden Centres in your community.", true, 340
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best General Stores", "general-stores", "Best General Stores in your community.", true, 350
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Gift Shops", "gift-shops", "Best Gift Shops in your community.", true, 360
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hardware Store", "hardware-store", "Best Hardware Store in your community.", true, 370
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Health Food Store", "health-food-store", "Best Health Food Store in your community.", true, 380
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Health Supplements", "health-supplements", "Best Health Supplements in your community.", true, 390
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hobby and Craft", "hobby-and-craft", "Best Hobby and Craft in your community.", true, 400
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hobby, Toy, and Game Stores", "hobby-toy-and-game-stores", "Best Hobby, Toy, and Game Stores in your community.", true, 410
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Decor", "home-decor", "Best Home Decor in your community.", true, 420
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Jewellers and Jewellery Stores", "jewellers-and-jewellery-stores", "Best Jewellers and Jewellery Stores in your community.", true, 430
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Kitchen Supplies", "kitchen-supplies", "Best Kitchen Supplies in your community.", true, 440
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lighting", "lighting", "Best Lighting in your community.", true, 450
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lingerie Stores", "lingerie-stores", "Best Lingerie Stores in your community.", true, 460
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Malls and Shopping Centres", "malls-and-shopping-centres", "Best Malls and Shopping Centres in your community.", true, 470
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mattresses", "mattresses", "Best Mattresses in your community.", true, 480
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Men's Clothing", "men-s-clothing", "Best Men's Clothing in your community.", true, 490
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Monuments", "monuments", "Best Monuments in your community.", true, 500
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Music", "music", "Best Music in your community.", true, 510
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Musical Instruments", "musical-instruments", "Best Musical Instruments in your community.", true, 520
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Office Supplies", "office-supplies", "Best Office Supplies in your community.", true, 530
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Party Supplies", "party-supplies", "Best Party Supplies in your community.", true, 540
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Patio Furniture", "patio-furniture", "Best Patio Furniture in your community.", true, 550
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Plant Store", "plant-store", "Best Plant Store in your community.", true, 560
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Second Hand Clothing & Consignment", "second-hand-clothing-and-consignment", "Best Second Hand Clothing & Consignment in your community.", true, 570
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Shoes", "shoes", "Best Shoes in your community.", true, 580
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sporting Goods", "sporting-goods", "Best Sporting Goods in your community.", true, 590
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sports Memorabilia and Sports Cards", "sports-memorabilia-and-sports-cards", "Best Sports Memorabilia and Sports Cards in your community.", true, 600
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Stereo and Hifi", "stereo-and-hifi", "Best Stereo and Hifi in your community.", true, 610
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Sunglasses", "sunglasses", "Best Sunglasses in your community.", true, 620
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Thrift Stores", "thrift-stores", "Best Thrift Stores in your community.", true, 630
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Toys", "toys", "Best Toys in your community.", true, 640
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Vacuums", "vacuums", "Best Vacuums in your community.", true, 650
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Video Game Stores", "video-game-stores", "Best Video Game Stores in your community.", true, 660
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wine and Spirits", "wine-and-spirits", "Best Wine and Spirits in your community.", true, 670
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Women's Clothing and Accessories", "women-s-clothing-and-accessories", "Best Women's Clothing and Accessories in your community.", true, 680
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Work Wear and Uniforms", "work-wear-and-uniforms", "Best Work Wear and Uniforms in your community.", true, 690
from public.category_groups g where g.slug = "retail-stores"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Administrative Services", "administrative-services", "Best Administrative Services in your community.", true, 10
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Advertising", "advertising", "Best Advertising in your community.", true, 20
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Air Conditioning Cleaning & Repair", "air-conditioning-cleaning-and-repair", "Best Air Conditioning Cleaning & Repair in your community.", true, 30
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Alarm and Security Systems", "alarm-and-security-systems", "Best Alarm and Security Systems in your community.", true, 40
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Appliance Repair", "appliance-repair", "Best Appliance Repair in your community.", true, 50
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cleaning Services", "cleaning-services", "Best Cleaning Services in your community.", true, 60
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Commercial Cleaning", "commercial-cleaning", "Best Commercial Cleaning in your community.", true, 70
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Community Organization", "community-organization", "Best Community Organization in your community.", true, 80
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Computer Repair and Service", "computer-repair-and-service", "Best Computer Repair and Service in your community.", true, 90
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Courier Service", "courier-service", "Best Courier Service in your community.", true, 100
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Criminal Law and Lawyers", "criminal-law-and-lawyers", "Best Criminal Law and Lawyers in your community.", true, 110
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Decks", "decks", "Best Decks in your community.", true, 120
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Deliveries", "deliveries", "Best Deliveries in your community.", true, 130
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Digital Marketing", "digital-marketing", "Best Digital Marketing in your community.", true, 140
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dry Cleaners", "dry-cleaners", "Best Dry Cleaners in your community.", true, 150
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Duct Cleaning", "duct-cleaning", "Best Duct Cleaning in your community.", true, 160
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Electronics Repair", "electronics-repair", "Best Electronics Repair in your community.", true, 170
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Estate Lawyers", "estate-lawyers", "Best Estate Lawyers in your community.", true, 180
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Event and Party Planning", "event-and-party-planning", "Best Event and Party Planning in your community.", true, 190
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Funeral Homes", "funeral-homes", "Best Funeral Homes in your community.", true, 200
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Furnace Repair & Maintenance", "furnace-repair-and-maintenance", "Best Furnace Repair & Maintenance in your community.", true, 210
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Graphic Design", "graphic-design", "Best Graphic Design in your community.", true, 220
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Home Cleaning", "home-cleaning", "Best Home Cleaning in your community.", true, 230
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hotels, Inns and Bed-and-Breakfasts", "hotels-inns-and-bed-and-breakfasts", "Best Hotels, Inns and Bed-and-Breakfasts in your community.", true, 240
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best HR Services", "hr-services", "Best HR Services in your community.", true, 250
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Immigration Lawyer and Lawyers", "immigration-lawyer-and-lawyers", "Best Immigration Lawyer and Lawyers in your community.", true, 260
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Insurance Agents and Brokers", "insurance-agents-and-brokers", "Best Insurance Agents and Brokers in your community.", true, 270
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Internet Service Providers", "internet-service-providers", "Best Internet Service Providers in your community.", true, 280
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Junk Removal", "junk-removal", "Best Junk Removal in your community.", true, 290
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Laundromat", "laundromat", "Best Laundromat in your community.", true, 300
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Laundry Services", "laundry-services", "Best Laundry Services in your community.", true, 310
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lawyers", "lawyers", "Best Lawyers in your community.", true, 320
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local DJs", "local-djs", "Best Local DJs in your community.", true, 330
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Locksmiths", "locksmiths", "Best Locksmiths in your community.", true, 340
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Marketing and Advertisement", "marketing-and-advertisement", "Best Marketing and Advertisement in your community.", true, 350
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mediation Services", "mediation-services", "Best Mediation Services in your community.", true, 360
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Moving Services", "moving-services", "Best Moving Services in your community.", true, 370
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Non-Profit", "non-profit", "Best Non-Profit in your community.", true, 380
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Optician", "optician", "Best Optician in your community.", true, 390
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Organization Services", "organization-services", "Best Organization Services in your community.", true, 400
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Paralegals", "paralegals", "Best Paralegals in your community.", true, 410
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Personal Injury Law and Lawyers", "personal-injury-law-and-lawyers", "Best Personal Injury Law and Lawyers in your community.", true, 420
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pest Exterminator", "pest-exterminator", "Best Pest Exterminator in your community.", true, 430
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Phone and Tablet Repair", "phone-and-tablet-repair", "Best Phone and Tablet Repair in your community.", true, 440
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Photographers", "photographers", "Best Photographers in your community.", true, 450
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Picture Framing", "picture-framing", "Best Picture Framing in your community.", true, 460
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Piercing and Tattoos", "piercing-and-tattoos", "Best Piercing and Tattoos in your community.", true, 470
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Printers", "printers", "Best Printers in your community.", true, 480
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Professional Coaching", "professional-coaching", "Best Professional Coaching in your community.", true, 490
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Promotional Products", "promotional-products", "Best Promotional Products in your community.", true, 500
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Property Management", "property-management", "Best Property Management in your community.", true, 510
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Psychology Clinic", "psychology-clinic", "Best Psychology Clinic in your community.", true, 520
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Real Estate Agents", "real-estate-agents", "Best Real Estate Agents in your community.", true, 530
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Real Estate Appraiser", "real-estate-appraiser", "Best Real Estate Appraiser in your community.", true, 540
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Real Estate Brokers", "real-estate-brokers", "Best Real Estate Brokers in your community.", true, 550
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Real Estate Law and Lawyers", "real-estate-law-and-lawyers", "Best Real Estate Law and Lawyers in your community.", true, 560
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Self Storage", "self-storage", "Best Self Storage in your community.", true, 570
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Snow Removal", "snow-removal", "Best Snow Removal in your community.", true, 580
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Social Media Marketing", "social-media-marketing", "Best Social Media Marketing in your community.", true, 590
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Specialty Art Services", "specialty-art-services", "Best Specialty Art Services in your community.", true, 600
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Tailors and Seamstresses", "tailors-and-seamstresses", "Best Tailors and Seamstresses in your community.", true, 610
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Taxi and Limousine", "taxi-and-limousine", "Best Taxi and Limousine in your community.", true, 620
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Telephone Provider", "telephone-provider", "Best Telephone Provider in your community.", true, 630
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Traffic Lawyers", "traffic-lawyers", "Best Traffic Lawyers in your community.", true, 640
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Transportation", "transportation", "Best Transportation in your community.", true, 650
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Travel Agencies", "travel-agencies", "Best Travel Agencies in your community.", true, 660
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Vacuum Repair", "vacuum-repair", "Best Vacuum Repair in your community.", true, 670
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Video Production", "video-production", "Best Video Production in your community.", true, 680
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Videographers", "videographers", "Best Videographers in your community.", true, 690
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Videography", "videography", "Best Videography in your community.", true, 700
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Web Design", "web-design", "Best Web Design in your community.", true, 710
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wedding Entertainment", "wedding-entertainment", "Best Wedding Entertainment in your community.", true, 720
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wedding Planners", "wedding-planners", "Best Wedding Planners in your community.", true, 730
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Wedding Venue", "wedding-venue", "Best Wedding Venue in your community.", true, 740
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Window Cleaning", "window-cleaning", "Best Window Cleaning in your community.", true, 750
from public.category_groups g where g.slug = "services"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Amusement, Theme Parks and Recreation", "amusement-theme-parks-and-recreation", "Best Amusement, Theme Parks and Recreation in your community.", true, 10
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Art Gallery", "art-gallery", "Best Art Gallery in your community.", true, 20
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bicycle Repair Shop", "bicycle-repair-shop", "Best Bicycle Repair Shop in your community.", true, 30
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Billiards/Pool Hall", "billiards-pool-hall", "Best Billiards/Pool Hall in your community.", true, 40
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Bowling", "bowling", "Best Bowling in your community.", true, 50
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Campgrounds and RV Parks", "campgrounds-and-rv-parks", "Best Campgrounds and RV Parks in your community.", true, 60
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Community Groups", "community-groups", "Best Community Groups in your community.", true, 70
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Dance Lessons", "dance-lessons", "Best Dance Lessons in your community.", true, 80
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Entertainer", "entertainer", "Best Entertainer in your community.", true, 90
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Entertainment", "entertainment", "Best Entertainment in your community.", true, 100
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Family Recreation", "family-recreation", "Best Family Recreation in your community.", true, 110
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Fitness Centres and Gyms", "fitness-centres-and-gyms", "Best Fitness Centres and Gyms in your community.", true, 120
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Golf Courses and Country Clubs", "golf-courses-and-country-clubs", "Best Golf Courses and Country Clubs in your community.", true, 130
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Live Entertainment", "live-entertainment", "Best Live Entertainment in your community.", true, 140
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Local Band", "local-band", "Best Local Band in your community.", true, 150
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Martial Arts", "martial-arts", "Best Martial Arts in your community.", true, 160
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Mini-Golf", "mini-golf", "Best Mini-Golf in your community.", true, 170
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Museums", "museums", "Best Museums in your community.", true, 180
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Night Clubs", "night-clubs", "Best Night Clubs in your community.", true, 190
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Personal Trainer", "personal-trainer", "Best Personal Trainer in your community.", true, 200
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Pilates", "pilates", "Best Pilates in your community.", true, 210
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Radio Stations", "radio-stations", "Best Radio Stations in your community.", true, 220
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Skate Lessons", "skate-lessons", "Best Skate Lessons in your community.", true, 230
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Skiing", "skiing", "Best Skiing in your community.", true, 240
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Swimming Lessons", "swimming-lessons", "Best Swimming Lessons in your community.", true, 250
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Theatre", "theatre", "Best Theatre in your community.", true, 260
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Yoga and Meditation", "yoga-and-meditation", "Best Yoga and Meditation in your community.", true, 270
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Youth Sports and Recreation", "youth-sports-and-recreation", "Best Youth Sports and Recreation in your community.", true, 280
from public.category_groups g where g.slug = "sports-recreation-and-fitness"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Barber Shops and Men's Hairdressers", "barber-shops-and-men-s-hairdressers", "Best Barber Shops and Men's Hairdressers in your community.", true, 10
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Beauty and Health Spas", "beauty-and-health-spas", "Best Beauty and Health Spas in your community.", true, 20
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Candles", "candles", "Best Candles in your community.", true, 30
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Cosmetics and Perfumes", "cosmetics-and-perfumes", "Best Cosmetics and Perfumes in your community.", true, 40
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Estheticians", "estheticians", "Best Estheticians in your community.", true, 50
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hair Extensions", "hair-extensions", "Best Hair Extensions in your community.", true, 60
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hair Removal and Waxing", "hair-removal-and-waxing", "Best Hair Removal and Waxing in your community.", true, 70
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Hair Salons", "hair-salons", "Best Hair Salons in your community.", true, 80
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Lashes", "lashes", "Best Lashes in your community.", true, 90
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Makeup Artistry", "makeup-artistry", "Best Makeup Artistry in your community.", true, 100
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Manicures & Pedicures", "manicures-and-pedicures", "Best Manicures & Pedicures in your community.", true, 110
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Medical Aesthetics", "medical-aesthetics", "Best Medical Aesthetics in your community.", true, 120
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Men's Grooming Products", "men-s-grooming-products", "Best Men's Grooming Products in your community.", true, 130
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Nail Salons", "nail-salons", "Best Nail Salons in your community.", true, 140
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();

insert into public.master_categories (category_group_id, name, slug, description, active, display_order)
select g.id, "Best Reflexology", "reflexology", "Best Reflexology in your community.", true, 150
from public.category_groups g where g.slug = "wellness-hair-and-beauty"
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

-- Soft-retire superseded pre-CV group slugs (masters stay for history).
update public.category_groups
set active = false, updated_at = now()
where slug in ("beauty-and-wellness", "home-and-contractors", "health", "professional-services", "shopping", "entertainment", "pets", "sports-and-recreation", "education", "specialty-services");

update public.master_categories mc
set active = false, updated_at = now()
from public.category_groups cg
where mc.category_group_id = cg.id
  and cg.slug in ("beauty-and-wellness", "home-and-contractors", "health", "professional-services", "shopping", "entertainment", "pets", "sports-and-recreation", "education", "specialty-services");

-- Attach full active catalog to non-archived campaigns.
insert into public.campaign_categories (
  campaign_id, master_category_id, local_name, local_slug, local_description,
  finalist_limit, minimum_nomination_count, active, display_order
)
select c.id, mc.id, null, null, null, 5, 3, true, mc.display_order
from public.campaigns c
cross join public.master_categories mc
join public.category_groups cg on cg.id = mc.category_group_id
where mc.active = true and cg.active = true
  and c.status::text <> 'archived'
on conflict (campaign_id, master_category_id) do update set
  active = excluded.active,
  display_order = excluded.display_order,
  minimum_nomination_count = excluded.minimum_nomination_count,
  updated_at = now();

-- Deactivate campaign category rows whose master/group was retired.
update public.campaign_categories cc
set active = false, updated_at = now()
from public.master_categories mc
join public.category_groups cg on cg.id = mc.category_group_id
where cc.master_category_id = mc.id
  and (mc.active = false or cg.active = false);
