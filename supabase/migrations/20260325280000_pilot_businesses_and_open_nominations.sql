-- Open pilot nomination windows and seed sample businesses for directory demos.
-- Safe to re-run: uses deterministic upserts where possible.

do $$
declare
  v_community record;
  v_template_id uuid;
  v_campaign_id uuid;
  v_now timestamptz := now();
  v_nom_open timestamptz := now() - interval '7 days';
  v_nom_close timestamptz := now() + interval '21 days';
  v_review_close timestamptz := now() + interval '35 days';
  v_vote_open timestamptz := now() + interval '36 days';
  v_vote_close timestamptz := now() + interval '57 days';
  v_results timestamptz := now() + interval '67 days';
  v_business_id uuid;
  v_location_id uuid;
  v_category_id uuid;
  v_slug text;
  v_item record;
begin
  select id into v_template_id from public.campaign_templates where name = 'Standard Annual Awards' limit 1;
  if v_template_id is null then
    raise notice 'Skipping pilot business seed; campaign template missing';
    return;
  end if;

  for v_community in
    select id, name, subdomain, timezone
    from public.communities
    where subdomain in ('saultstemarie', 'sudbury', 'winnipeg', 'marquette', 'detroit')
  loop
    insert into public.campaigns (
      community_id, campaign_template_id, year, name, status,
      nomination_opens_at, nomination_closes_at, finalist_review_closes_at,
      voting_opens_at, voting_closes_at, results_publish_at,
      timezone, exact_vote_totals_public, published_at
    )
    values (
      v_community.id,
      v_template_id,
      2026,
      v_community.name || ' Locals Choice Awards 2026',
      'nominations_open',
      v_nom_open,
      v_nom_close,
      v_review_close,
      v_vote_open,
      v_vote_close,
      v_results,
      coalesce(v_community.timezone, 'America/Toronto'),
      false,
      v_now
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
      published_at = coalesce(public.campaigns.published_at, excluded.published_at),
      updated_at = now()
    returning id into v_campaign_id;

    if v_campaign_id is null then
      select id into v_campaign_id
      from public.campaigns
      where community_id = v_community.id and year = 2026;
    end if;

    delete from public.campaign_phases where campaign_id = v_campaign_id;
    insert into public.campaign_phases (campaign_id, phase, starts_at, ends_at, status) values
      (v_campaign_id, 'nomination', v_nom_open, v_nom_close, 'active'),
      (v_campaign_id, 'finalist_review', v_nom_close + interval '1 second', v_review_close, 'scheduled'),
      (v_campaign_id, 'voting', v_vote_open, v_vote_close, 'scheduled'),
      (v_campaign_id, 'audit', v_vote_close + interval '1 second', v_results - interval '1 second', 'scheduled'),
      (v_campaign_id, 'results', v_results, timestamptz '2026-12-31 23:59:59', 'scheduled');

    insert into public.campaign_categories (
      campaign_id, master_category_id, local_name, local_slug, local_description,
      finalist_limit, minimum_nomination_count, active, display_order
    )
    select
      v_campaign_id, mc.id, null, null, null, 5, 3, true, mc.display_order
    from public.master_categories mc
    join public.category_groups cg on cg.id = mc.category_group_id
    where mc.active = true and cg.active = true
    on conflict (campaign_id, master_category_id) do update set
      active = excluded.active,
      display_order = excluded.display_order,
      updated_at = now();

    for v_item in
      select * from (values
        ('casual-dining', 'Main Street Kitchen', '100 Main Street'),
        ('casual-dining', 'Harbour Table', '22 Harbour Road'),
        ('pizza', 'Fire Oven Pizza', '45 Queen Street'),
        ('pizza', 'Neighbourhood Slice', '8 Bay Street'),
        ('coffee-shop', 'Daily Grind Cafe', '12 Market Square'),
        ('coffee-shop', 'River Roasters', '77 River Road'),
        ('bakery', 'Morning Crust Bakery', '3 Baker Lane'),
        ('hair-salon', 'Studio Cut', '19 Wellington'),
        ('barber-shop', 'Classic Fade Barbers', '55 King Street'),
        ('auto-repair-shop', 'Reliable Auto Care', '200 Industrial Ave'),
        ('clothing-boutique', 'Thread & Co.', '14 Fashion Way'),
        ('plumber', 'True North Plumbing', null),
        ('pet-store', 'Paws & Provisions', '66 Pet Parade')
      ) as t(category_slug, business_name, address)
    loop
      v_slug := lower(regexp_replace(v_community.subdomain || '-' || v_item.business_name, '[^a-z0-9]+', '-', 'g'));
      v_slug := trim(both '-' from v_slug);

      select id into v_business_id
      from public.businesses
      where lower(slug) = lower(v_slug) and deleted_at is null
      limit 1;

      if v_business_id is null then
        insert into public.businesses (
          legal_name, public_name, slug, description, website_url, primary_email, status
        )
        values (
          v_community.name || ' ' || v_item.business_name,
          v_community.name || ' ' || v_item.business_name,
          v_slug,
          'Pilot directory listing for ' || v_item.business_name,
          'https://example.com/' || v_slug,
          regexp_replace(lower(v_item.business_name), '[^a-z0-9]+', '', 'g') || '@example.com',
          'approved'
        )
        returning id into v_business_id;
      end if;

      select id into v_location_id
      from public.business_locations
      where business_id = v_business_id
        and community_id = v_community.id
        and deleted_at is null
      limit 1;

      if v_location_id is null then
        insert into public.business_locations (
          business_id, community_id, location_name, slug,
          address_line_1, city, phone, email, website_url, active
        )
        values (
          v_business_id,
          v_community.id,
          v_community.name || ' ' || v_item.business_name,
          'main',
          v_item.address,
          v_community.name,
          null,
          regexp_replace(lower(v_item.business_name), '[^a-z0-9]+', '', 'g') || '@example.com',
          'https://example.com/' || v_slug,
          true
        )
        returning id into v_location_id;
      end if;

      select cc.id into v_category_id
      from public.campaign_categories cc
      join public.master_categories mc on mc.id = cc.master_category_id
      where cc.campaign_id = v_campaign_id
        and coalesce(cc.local_slug, mc.slug) = v_item.category_slug
      limit 1;

      if v_category_id is not null and v_location_id is not null then
        insert into public.business_category_assignments (
          business_location_id, campaign_category_id, status
        )
        values (v_location_id, v_category_id, 'approved')
        on conflict (business_location_id, campaign_category_id) do update set
          status = 'approved',
          updated_at = now();
      end if;
    end loop;
  end loop;

  -- Keep legacy 2027 SSM campaign nomination-open as well for older links.
  update public.campaigns
  set
    status = 'nominations_open',
    nomination_opens_at = v_nom_open,
    nomination_closes_at = v_nom_close,
    finalist_review_closes_at = v_review_close,
    voting_opens_at = v_vote_open,
    voting_closes_at = v_vote_close,
    results_publish_at = v_results,
    updated_at = now()
  where year = 2027
    and community_id in (select id from public.communities where subdomain = 'saultstemarie');
end $$;
