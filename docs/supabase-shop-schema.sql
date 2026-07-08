-- P!nga shop schema
-- Apply this in Supabase SQL editor after creating the project.
--
-- Source of truth:
-- - Storyblok owns product copy/images/config.
-- - Supabase owns stock, enquiries, reservations, orders, and fulfilment.
-- - Stripe owns payment state; webhooks update these tables.

create extension if not exists pgcrypto;

create type public.shop_stock_mode as enum (
  'unlimited',
  'limited',
  'one_of_one',
  'enquiry_goal'
);

create type public.shop_reservation_status as enum (
  'active',
  'converted',
  'released',
  'expired'
);

create type public.shop_order_status as enum (
  'pending',
  'paid',
  'cancelled',
  'fulfilled',
  'refunded'
);

create type public.shop_enquiry_status as enum (
  'new',
  'contacted',
  'closed'
);

create table public.shop_inventory (
  product_id text primary key,
  stock_mode public.shop_stock_mode not null default 'unlimited',
  stock_quantity integer,
  sold_quantity integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_inventory_non_negative check (
    stock_quantity is null or stock_quantity >= 0
  ),
  constraint shop_inventory_sold_non_negative check (sold_quantity >= 0),
  constraint shop_inventory_limited_has_stock check (
    stock_mode not in ('limited', 'one_of_one') or stock_quantity is not null
  ),
  constraint shop_inventory_one_of_one_stock check (
    stock_mode <> 'one_of_one' or stock_quantity = 1
  )
);

create table public.shop_reservations (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.shop_inventory(product_id),
  option_signature text not null default '',
  quantity integer not null,
  status public.shop_reservation_status not null default 'active',
  stripe_session_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_reservations_quantity_positive check (quantity > 0)
);

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  status public.shop_order_status not null default 'pending',
  stripe_session_id text unique,
  customer_email text,
  customer_name text,
  customer_phone text,
  currency text not null default 'AUD',
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  shipping_option_id text,
  shipping_option_label text,
  shipping_address jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_orders_amounts_non_negative check (
    subtotal_cents >= 0 and shipping_cents >= 0 and total_cents >= 0
  )
);

create table public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id text not null,
  title text not null,
  quantity integer not null,
  unit_amount_cents integer not null,
  currency text not null default 'AUD',
  selected_options jsonb not null default '[]'::jsonb,
  option_signature text not null default '',
  created_at timestamptz not null default now(),
  constraint shop_order_items_quantity_positive check (quantity > 0),
  constraint shop_order_items_amount_non_negative check (unit_amount_cents >= 0)
);

create table public.shop_enquiries (
  id uuid primary key default gen_random_uuid(),
  status public.shop_enquiry_status not null default 'new',
  product_id text,
  product_title text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  quantity integer not null default 1,
  selected_options jsonb not null default '[]'::jsonb,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_enquiries_quantity_positive check (quantity > 0)
);

create table public.shop_shipping_profiles (
  profile_key text primary key,
  label text not null,
  base_cents integer not null default 0,
  additional_cents integer not null default 0,
  manual_quote boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_shipping_profiles_amounts_non_negative check (
    base_cents >= 0 and additional_cents >= 0
  )
);

create table public.shop_admin_users (
  username text primary key,
  pin_hash text not null,
  pin_salt text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  setup_completed_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_admin_users_failed_attempts_non_negative check (failed_attempts >= 0)
);

insert into public.shop_shipping_profiles
  (profile_key, label, base_cents, additional_cents, manual_quote)
values
  ('shirt', 'Standard parcel', 1200, 300, false),
  ('unframed_print', 'Print parcel', 1800, 500, false),
  ('framed_print', 'Framed print parcel', 3500, 1000, false),
  ('oversized', 'Oversized freight', 0, 0, true),
  ('pickup_only', 'Pickup only', 0, 0, false),
  ('manual_quote', 'Manual freight quote', 0, 0, true)
on conflict (profile_key) do nothing;

create index shop_reservations_active_idx
  on public.shop_reservations(product_id, status, expires_at)
  where status = 'active';

create index shop_orders_status_created_idx
  on public.shop_orders(status, created_at desc);

create index shop_enquiries_status_created_idx
  on public.shop_enquiries(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shop_inventory_updated_at
before update on public.shop_inventory
for each row execute function public.set_updated_at();

create trigger shop_reservations_updated_at
before update on public.shop_reservations
for each row execute function public.set_updated_at();

create trigger shop_orders_updated_at
before update on public.shop_orders
for each row execute function public.set_updated_at();

create trigger shop_enquiries_updated_at
before update on public.shop_enquiries
for each row execute function public.set_updated_at();

create trigger shop_shipping_profiles_updated_at
before update on public.shop_shipping_profiles
for each row execute function public.set_updated_at();

create trigger shop_admin_users_updated_at
before update on public.shop_admin_users
for each row execute function public.set_updated_at();

create or replace function public.shop_create_reservation(
  p_product_id text,
  p_option_signature text,
  p_quantity integer,
  p_stripe_session_id text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inventory_row public.shop_inventory%rowtype;
  active_reserved integer;
  available_quantity integer;
  reservation_id uuid;
begin
  if p_quantity <= 0 then
    raise exception 'Reservation quantity must be positive';
  end if;

  select *
  into inventory_row
  from public.shop_inventory
  where product_id = p_product_id
  for update;

  if not found then
    raise exception 'Inventory row missing for product %', p_product_id;
  end if;

  if inventory_row.stock_mode = 'unlimited' then
    insert into public.shop_reservations (
      product_id,
      option_signature,
      quantity,
      stripe_session_id,
      expires_at
    )
    values (
      p_product_id,
      coalesce(p_option_signature, ''),
      p_quantity,
      p_stripe_session_id,
      p_expires_at
    )
    returning id into reservation_id;

    return reservation_id;
  end if;

  select coalesce(sum(quantity), 0)
  into active_reserved
  from public.shop_reservations
  where product_id = p_product_id
    and status = 'active'
    and expires_at > now();

  available_quantity :=
    coalesce(inventory_row.stock_quantity, 0) -
    inventory_row.sold_quantity -
    active_reserved;

  if available_quantity < p_quantity then
    raise exception 'Insufficient stock for product %', p_product_id;
  end if;

  insert into public.shop_reservations (
    product_id,
    option_signature,
    quantity,
    stripe_session_id,
    expires_at
  )
  values (
    p_product_id,
    coalesce(p_option_signature, ''),
    p_quantity,
    p_stripe_session_id,
    p_expires_at
  )
  returning id into reservation_id;

  return reservation_id;
end;
$$;

create or replace function public.shop_convert_reservations(
  p_stripe_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_row record;
begin
  for reservation_row in
    select product_id, sum(quantity)::integer as quantity
    from public.shop_reservations
    where stripe_session_id = p_stripe_session_id
      and status = 'active'
    group by product_id
  loop
    update public.shop_inventory
    set sold_quantity = sold_quantity + reservation_row.quantity
    where product_id = reservation_row.product_id;
  end loop;

  update public.shop_reservations
  set status = 'converted'
  where stripe_session_id = p_stripe_session_id
    and status = 'active';
end;
$$;

create or replace function public.shop_create_checkout_reservations(
  p_stripe_session_id text,
  p_expires_at timestamptz,
  p_lines jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  line_item jsonb;
  line_quantity integer;
  created_count integer := 0;
begin
  if p_stripe_session_id is null or btrim(p_stripe_session_id) = '' then
    raise exception 'Stripe session id is required';
  end if;

  if p_expires_at <= now() then
    raise exception 'Reservation expiry must be in the future';
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Reservation lines are required';
  end if;

  for line_item in select * from jsonb_array_elements(p_lines)
  loop
    if line_item->>'product_id' is null or length(trim(line_item->>'product_id')) = 0 then
      raise exception 'Reservation product id is required';
    end if;

    line_quantity := (line_item->>'quantity')::integer;

    if line_quantity is null or line_quantity <= 0 then
      raise exception 'Reservation quantity must be positive';
    end if;

    perform public.shop_create_reservation(
      line_item->>'product_id',
      coalesce(line_item->>'option_signature', ''),
      line_quantity,
      p_stripe_session_id,
      p_expires_at
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

create or replace function public.shop_release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.shop_reservations
  set status = 'expired'
  where status = 'active'
    and expires_at <= now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

create or replace function public.shop_release_reservations(
  p_stripe_session_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.shop_reservations
  set status = 'released'
  where stripe_session_id = p_stripe_session_id
    and status = 'active';

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

-- SECURITY DEFINER RPCs run with elevated table privileges. Keep direct execute
-- access limited to server-side service-role calls only.
revoke all on function public.shop_create_reservation(text, text, integer, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.shop_create_checkout_reservations(text, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.shop_convert_reservations(text)
  from public, anon, authenticated;
revoke all on function public.shop_release_expired_reservations()
  from public, anon, authenticated;
revoke all on function public.shop_release_reservations(text)
  from public, anon, authenticated;

grant execute on function public.shop_create_reservation(text, text, integer, text, timestamptz)
  to service_role;
grant execute on function public.shop_create_checkout_reservations(text, timestamptz, jsonb)
  to service_role;
grant execute on function public.shop_convert_reservations(text)
  to service_role;
grant execute on function public.shop_release_expired_reservations()
  to service_role;
grant execute on function public.shop_release_reservations(text)
  to service_role;

-- Keep public access closed. Server routes should use the service role key.
alter table public.shop_inventory enable row level security;
alter table public.shop_reservations enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_enquiries enable row level security;
alter table public.shop_shipping_profiles enable row level security;
alter table public.shop_admin_users enable row level security;
