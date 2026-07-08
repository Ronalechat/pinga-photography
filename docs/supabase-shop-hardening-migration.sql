-- P!nga shop checkout hardening migration
-- Apply this once in Supabase SQL editor for projects that already ran
-- docs/supabase-shop-schema.sql before the atomic reservation RPC was added.

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
