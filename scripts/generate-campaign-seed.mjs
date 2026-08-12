import { readFileSync, writeFileSync } from "node:fs";

/**
 * Generates the CommunityVotes-ported category catalog migration.
 * Source: data/localschoice-category-catalog.json
 *
 * Usage: node scripts/generate-campaign-seed.mjs
 */
const catalog = JSON.parse(
  readFileSync("data/localschoice-category-catalog.json", "utf8"),
);

const groups = catalog.groups;
const cats = catalog.categories;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const cvSlugs = new Set(groups.map(([, slug]) => slug));
const retiredSlugs = [
  "beauty-and-wellness",
  "home-and-contractors",
  "health",
  "professional-services",
  "shopping",
  "entertainment",
  "pets",
  "sports-and-recreation",
  "education",
  "specialty-services",
].filter((slug) => !cvSlugs.has(slug));

const sql = [];
sql.push("-- CommunityVotes-ported category catalog expansion");
sql.push(`-- Source: ${catalog.generatedFrom} (${catalog.sourcedAt})`);
sql.push(`-- ${catalog.groupCount} groups · ${catalog.categoryCount} master categories`);
sql.push("-- Idempotent upserts by slug; attaches missing categories to campaigns.");
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
  const list = cats[gslug] ?? [];
  total += list.length;
  let d = 10;
  for (const name of list) {
    const slug = slugify(String(name).replace(/^Best /i, ""));
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

if (retiredSlugs.length) {
  sql.push("-- Soft-retire superseded pre-CV group slugs (masters stay for history).");
  sql.push("update public.category_groups");
  sql.push("set active = false, updated_at = now()");
  sql.push(
    `where slug in (${retiredSlugs.map((slug) => JSON.stringify(slug)).join(", ")});`,
  );
  sql.push("");
  sql.push("update public.master_categories mc");
  sql.push("set active = false, updated_at = now()");
  sql.push("from public.category_groups cg");
  sql.push("where mc.category_group_id = cg.id");
  sql.push(
    `  and cg.slug in (${retiredSlugs.map((slug) => JSON.stringify(slug)).join(", ")});`,
  );
  sql.push("");
}

sql.push("-- Attach full active catalog to non-archived campaigns.");
sql.push("insert into public.campaign_categories (");
sql.push(
  "  campaign_id, master_category_id, local_name, local_slug, local_description,",
);
sql.push("  finalist_limit, minimum_nomination_count, active, display_order");
sql.push(")");
sql.push("select c.id, mc.id, null, null, null, 5, 3, true, mc.display_order");
sql.push("from public.campaigns c");
sql.push("cross join public.master_categories mc");
sql.push("join public.category_groups cg on cg.id = mc.category_group_id");
sql.push("where mc.active = true and cg.active = true");
sql.push("  and c.status::text <> 'archived'");
sql.push("on conflict (campaign_id, master_category_id) do update set");
sql.push("  active = excluded.active,");
sql.push("  display_order = excluded.display_order,");
sql.push("  minimum_nomination_count = excluded.minimum_nomination_count,");
sql.push("  updated_at = now();");
sql.push("");

sql.push("-- Deactivate campaign category rows whose master/group was retired.");
sql.push("update public.campaign_categories cc");
sql.push("set active = false, updated_at = now()");
sql.push("from public.master_categories mc");
sql.push("join public.category_groups cg on cg.id = mc.category_group_id");
sql.push("where cc.master_category_id = mc.id");
sql.push("  and (mc.active = false or cg.active = false);");
sql.push("");

writeFileSync(
  "supabase/migrations/20260325291000_communityvotes_category_catalog.sql",
  sql.join("\n"),
  "utf8",
);

console.log(
  `Wrote migration with ${groups.length} groups and ${total} master categories`,
);
