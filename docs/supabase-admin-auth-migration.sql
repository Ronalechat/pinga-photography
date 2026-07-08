-- P!nga shop admin PIN login migration
-- Apply this once in Supabase SQL editor after docs/supabase-shop-schema.sql.

create table if not exists public.shop_admin_users (
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

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'shop_admin_users_updated_at'
  ) then
    create trigger shop_admin_users_updated_at
    before update on public.shop_admin_users
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.shop_admin_users enable row level security;
