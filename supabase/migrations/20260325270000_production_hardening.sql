-- Production-readiness hardening: RLS, indexes, webhook reclaim support.

-- 1) Award eligibilities: anon may only read rows tied to published results.
drop policy if exists "Public can read active award eligibilities" on public.award_eligibilities;
create policy "Public can read published award eligibilities"
  on public.award_eligibilities for select
  to anon, authenticated
  using (
    public.is_results_admin()
    or exists (
      select 1 from public.business_memberships bm
      where bm.business_id = award_eligibilities.business_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
    or exists (
      select 1 from public.results r
      where r.id = award_eligibilities.result_id
        and r.published = true
    )
  );

-- 2) Prevent suppliers from mutating immutable fulfillment cost/routing columns.
create or replace function public.enforce_fulfillment_immutable_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_has_platform_role(
    array['administrator', 'super_administrator', 'operations']
  ) then
    return new;
  end if;

  if new.supplier_id is distinct from old.supplier_id
    or new.order_id is distinct from old.order_id
    or new.manufacturing_cost_cents is distinct from old.manufacturing_cost_cents
    or new.supplier_shipping_cost_cents is distinct from old.supplier_shipping_cost_cents
    or new.idempotency_key is distinct from old.idempotency_key
    or new.parent_fulfillment_id is distinct from old.parent_fulfillment_id
  then
    raise exception 'Suppliers cannot change fulfillment routing or cost fields.';
  end if;

  return new;
end;
$$;

drop trigger if exists fulfillments_enforce_immutable_columns on public.fulfillments;
create trigger fulfillments_enforce_immutable_columns
  before update on public.fulfillments
  for each row execute function public.enforce_fulfillment_immutable_columns();

-- 3) Analytics / orders / profiles date indexes for reporting filters.
create index if not exists orders_placed_at_idx
  on public.orders (placed_at desc)
  where placed_at is not null;

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

create index if not exists nominations_created_at_idx
  on public.nominations (created_at desc);

create index if not exists votes_created_at_idx
  on public.votes (created_at desc);

create index if not exists webhook_events_processing_status_idx
  on public.webhook_events (processing_status, received_at);

alter table public.webhook_events
  add column if not exists last_attempt_at timestamptz;

update public.webhook_events
set last_attempt_at = coalesce(processed_at, received_at)
where last_attempt_at is null;
