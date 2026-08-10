import { writeFileSync } from "node:fs";

const groups = [
  ["Automotive", "automotive", "Dealers, repair, and auto lifestyle"],
  ["Beauty and Wellness", "beauty-and-wellness", "Salons, spas, and personal care"],
  ["Food and Drink", "food-and-drink", "Restaurants, cafes, and nightlife dining"],
  ["Home and Contractors", "home-and-contractors", "Home services and trades"],
  ["Health", "health", "Clinics, care providers, and wellness health"],
  ["Professional Services", "professional-services", "Business and advisory professionals"],
  ["Shopping", "shopping", "Retail and specialty stores"],
  ["Entertainment", "entertainment", "Arts, nightlife, and leisure venues"],
  ["Pets", "pets", "Pet care, supplies, and services"],
  ["Sports and Recreation", "sports-and-recreation", "Fitness, teams, and outdoor recreation"],
  ["Community Organizations", "community-organizations", "Nonprofits and civic groups"],
  ["Education", "education", "Schools, tutoring, and learning"],
  ["Hotels and Tourism", "hotels-and-tourism", "Lodging, travel, and visitor experiences"],
  ["People and Professionals", "people-and-professionals", "Standout local people and roles"],
  ["Specialty Services", "specialty-services", "Niche local services"],
];

const cats = {
  automotive: [
    "Best New Car Dealership",
    "Best Used Car Dealership",
    "Best Auto Repair Shop",
    "Best Oil Change",
    "Best Tire Shop",
    "Best Auto Body Shop",
    "Best Car Wash",
    "Best Motorcycle Shop",
  ],
  "beauty-and-wellness": [
    "Best Hair Salon",
    "Best Barber Shop",
    "Best Day Spa",
    "Best Nail Salon",
    "Best Med Spa",
    "Best Massage Therapy",
    "Best Brow and Lash Studio",
    "Best Fitness Studio",
  ],
  "food-and-drink": [
    "Best Fine Dining",
    "Best Casual Dining",
    "Best Breakfast Spot",
    "Best Burger",
    "Best Pizza",
    "Best Sushi",
    "Best Coffee Shop",
    "Best Bakery",
    "Best Pub",
    "Best Patio",
  ],
  "home-and-contractors": [
    "Best General Contractor",
    "Best Plumber",
    "Best Electrician",
    "Best HVAC Company",
    "Best Roofing Company",
    "Best Landscaping",
    "Best Interior Designer",
    "Best Home Cleaning",
  ],
  health: [
    "Best Family Doctor Clinic",
    "Best Dentist",
    "Best Orthodontist",
    "Best Optometrist",
    "Best Chiropractor",
    "Best Physiotherapy Clinic",
    "Best Pharmacy",
    "Best Mental Health Clinic",
  ],
  "professional-services": [
    "Best Accountant",
    "Best Lawyer",
    "Best Real Estate Agent",
    "Best Mortgage Broker",
    "Best Insurance Broker",
    "Best Financial Advisor",
    "Best Marketing Agency",
    "Best IT Services",
  ],
  shopping: [
    "Best Clothing Boutique",
    "Best Jewelry Store",
    "Best Bookstore",
    "Best Home Decor Store",
    "Best Electronics Store",
    "Best Gift Shop",
    "Best Thrift Store",
    "Best Farmers Market Vendor",
  ],
  entertainment: [
    "Best Live Music Venue",
    "Best Movie Theatre",
    "Best Comedy Night",
    "Best Escape Room",
    "Best Bowling Alley",
    "Best Arcade",
    "Best Festival",
    "Best Local Theatre Company",
  ],
  pets: [
    "Best Veterinary Clinic",
    "Best Pet Groomer",
    "Best Pet Store",
    "Best Dog Daycare",
    "Best Pet Boarding",
    "Best Dog Trainer",
    "Best Pet Photographer",
  ],
  "sports-and-recreation": [
    "Best Gym",
    "Best Yoga Studio",
    "Best Martial Arts School",
    "Best Youth Sports Program",
    "Best Golf Course",
    "Best Outdoor Adventure Company",
    "Best Sports Bar",
    "Best Recreation Centre",
  ],
  "community-organizations": [
    "Best Charity",
    "Best Service Club",
    "Best Youth Organization",
    "Best Arts Organization",
    "Best Cultural Association",
    "Best Volunteer Program",
    "Best Community Event Organizer",
  ],
  education: [
    "Best Tutoring Service",
    "Best Preschool",
    "Best Dance School",
    "Best Music School",
    "Best Language School",
    "Best Driving School",
    "Best Adult Education Program",
  ],
  "hotels-and-tourism": [
    "Best Hotel",
    "Best Boutique Inn",
    "Best Bed and Breakfast",
    "Best Tour Operator",
    "Best Visitor Attraction",
    "Best Campground",
    "Best Event Venue",
  ],
  "people-and-professionals": [
    "Best Local Chef",
    "Best Local Musician",
    "Best Local Artist",
    "Best Coach",
    "Best Teacher",
    "Best Server",
    "Best Bartender",
    "Best Entrepreneur",
  ],
  "specialty-services": [
    "Best Photographer",
    "Best Wedding Planner",
    "Best Printing Company",
    "Best Moving Company",
    "Best Storage Facility",
    "Best Security Company",
    "Best Dry Cleaner",
    "Best Tailor",
  ],
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const sql = [];
sql.push("-- Seed campaign template, category taxonomy, and SSM 2027 pilot campaign");
sql.push("");
sql.push(
  "insert into public.campaign_templates (name, description, default_nomination_days, default_review_days, default_voting_days, default_audit_days, active)",
);
sql.push("values (");
sql.push("  'Standard Annual Awards',");
sql.push(
  "  'Default Locals Choice Awards schedule: nominations, finalist review, voting, and audit.',",
);
sql.push("  28, 14, 21, 10, true");
sql.push(")");
sql.push("on conflict (name) do update set");
sql.push("  description = excluded.description,");
sql.push("  default_nomination_days = excluded.default_nomination_days,");
sql.push("  default_review_days = excluded.default_review_days,");
sql.push("  default_voting_days = excluded.default_voting_days,");
sql.push("  default_audit_days = excluded.default_audit_days,");
sql.push("  active = excluded.active,");
sql.push("  updated_at = now();");
sql.push("");

let order = 10;
let total = 0;
for (const [gname, gslug, gdesc] of groups) {
  sql.push(
    "insert into public.category_groups (name, slug, description, display_order, active)",
  );
  sql.push(
    `values (${JSON.stringify(gname)}, ${JSON.stringify(gslug)}, ${JSON.stringify(gdesc)}, ${order}, true)`,
  );
  sql.push(
    "on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();",
  );
  sql.push("");
  order += 10;
}

for (const [, gslug] of groups) {
  const list = cats[gslug];
  total += list.length;
  let d = 10;
  for (const name of list) {
    const slug = slugify(name.replace(/^Best /, ""));
    sql.push(
      "insert into public.master_categories (category_group_id, name, slug, description, active, display_order)",
    );
    sql.push(
      `select g.id, ${JSON.stringify(name)}, ${JSON.stringify(slug)}, ${JSON.stringify(`${name} in your community.`)}, true, ${d}`,
    );
    sql.push(`from public.category_groups g where g.slug = ${JSON.stringify(gslug)}`);
    sql.push(
      "on conflict (category_group_id, slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order, active = excluded.active, updated_at = now();",
    );
    sql.push("");
    d += 10;
  }
}

sql.push("-- 2027 pilot campaign for Sault Ste. Marie");
sql.push("do $$");
sql.push("declare");
sql.push("  v_community_id uuid;");
sql.push("  v_template_id uuid;");
sql.push("  v_campaign_id uuid;");
sql.push("begin");
sql.push(
  "  select id into v_community_id from public.communities where subdomain = 'saultstemarie' limit 1;",
);
sql.push(
  "  select id into v_template_id from public.campaign_templates where name = 'Standard Annual Awards' limit 1;",
);
sql.push("  if v_community_id is null or v_template_id is null then");
sql.push("    raise notice 'Skipping SSM 2027 campaign seed; community or template missing';");
sql.push("    return;");
sql.push("  end if;");
sql.push("");
sql.push("  insert into public.campaigns (");
sql.push("    community_id, campaign_template_id, year, name, status,");
sql.push("    nomination_opens_at, nomination_closes_at, finalist_review_closes_at,");
sql.push("    voting_opens_at, voting_closes_at, results_publish_at,");
sql.push("    timezone, exact_vote_totals_public, published_at");
sql.push("  )");
sql.push("  values (");
sql.push("    v_community_id, v_template_id, 2027,");
sql.push("    'Sault Ste. Marie Locals Choice Awards 2027', 'scheduled',");
sql.push("    timestamptz '2027-01-12 09:00:00 America/Toronto',");
sql.push("    timestamptz '2027-02-09 23:59:59 America/Toronto',");
sql.push("    timestamptz '2027-02-23 23:59:59 America/Toronto',");
sql.push("    timestamptz '2027-02-24 09:00:00 America/Toronto',");
sql.push("    timestamptz '2027-03-17 23:59:59 America/Toronto',");
sql.push("    timestamptz '2027-03-27 12:00:00 America/Toronto',");
sql.push("    'America/Toronto', false, now()");
sql.push("  )");
sql.push("  on conflict (community_id, year) do update set");
sql.push("    name = excluded.name,");
sql.push("    status = excluded.status,");
sql.push("    nomination_opens_at = excluded.nomination_opens_at,");
sql.push("    nomination_closes_at = excluded.nomination_closes_at,");
sql.push("    finalist_review_closes_at = excluded.finalist_review_closes_at,");
sql.push("    voting_opens_at = excluded.voting_opens_at,");
sql.push("    voting_closes_at = excluded.voting_closes_at,");
sql.push("    results_publish_at = excluded.results_publish_at,");
sql.push("    timezone = excluded.timezone,");
sql.push("    published_at = coalesce(public.campaigns.published_at, excluded.published_at),");
sql.push("    updated_at = now()");
sql.push("  returning id into v_campaign_id;");
sql.push("");
sql.push("  if v_campaign_id is null then");
sql.push(
  "    select id into v_campaign_id from public.campaigns where community_id = v_community_id and year = 2027;",
);
sql.push("  end if;");
sql.push("");
sql.push("  delete from public.campaign_phases where campaign_id = v_campaign_id;");
sql.push(
  "  insert into public.campaign_phases (campaign_id, phase, starts_at, ends_at, status) values",
);
sql.push(
  "    (v_campaign_id, 'nomination', timestamptz '2027-01-12 09:00:00 America/Toronto', timestamptz '2027-02-09 23:59:59 America/Toronto', 'scheduled'),",
);
sql.push(
  "    (v_campaign_id, 'finalist_review', timestamptz '2027-02-10 00:00:00 America/Toronto', timestamptz '2027-02-23 23:59:59 America/Toronto', 'scheduled'),",
);
sql.push(
  "    (v_campaign_id, 'voting', timestamptz '2027-02-24 09:00:00 America/Toronto', timestamptz '2027-03-17 23:59:59 America/Toronto', 'scheduled'),",
);
sql.push(
  "    (v_campaign_id, 'audit', timestamptz '2027-03-18 00:00:00 America/Toronto', timestamptz '2027-03-27 11:59:59 America/Toronto', 'scheduled'),",
);
sql.push(
  "    (v_campaign_id, 'results', timestamptz '2027-03-27 12:00:00 America/Toronto', timestamptz '2027-12-31 23:59:59 America/Toronto', 'scheduled');",
);
sql.push("");
sql.push(
  "  insert into public.campaign_categories (campaign_id, master_category_id, local_name, local_slug, local_description, finalist_limit, minimum_nomination_count, active, display_order)",
);
sql.push(
  "  select v_campaign_id, mc.id, null, null, null, 5, 3, true, mc.display_order",
);
sql.push("  from public.master_categories mc");
sql.push("  join public.category_groups cg on cg.id = mc.category_group_id");
sql.push("  where mc.active = true and cg.active = true");
sql.push("  on conflict (campaign_id, master_category_id) do update set");
sql.push("    active = excluded.active,");
sql.push("    display_order = excluded.display_order,");
sql.push("    minimum_nomination_count = excluded.minimum_nomination_count,");
sql.push("    updated_at = now();");
sql.push("end $$;");
sql.push("");

writeFileSync(
  "supabase/migrations/20260325150001_seed_campaigns_and_categories.sql",
  sql.join("\n"),
  "utf8",
);
console.log(`Wrote seed with ${groups.length} groups and ${total} master categories`);
