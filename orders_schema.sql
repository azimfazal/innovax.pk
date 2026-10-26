-- Run this in Supabase Dashboard > SQL Editor.
-- One row represents one product line in an order.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'shipped', 'completed', 'cancelled')),
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  customer_phone text not null check (length(trim(customer_phone)) between 7 and 30),
  customer_email text check (customer_email is null or length(customer_email) <= 254),
  delivery_address text not null check (length(trim(delivery_address)) between 5 and 500),
  city text not null check (length(trim(city)) between 2 and 100),
  province text check (province is null or length(province) <= 100),
  postal_code text check (postal_code is null or length(postal_code) <= 20),
  delivery_notes text check (delivery_notes is null or length(delivery_notes) <= 500),
  product_id text not null check (length(product_id) between 1 and 40),
  product_name text not null check (length(product_name) between 1 and 250),
  product_image_url text,
  product_price numeric(12,2) not null check (product_price > 0),
  quantity integer not null default 1 check (quantity between 1 and 100),
  total_amount numeric(14,2) generated always as (product_price * quantity) stored,
  category text,
  markaz_product_url text
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_product_id_idx on public.orders (product_id);

alter table public.orders enable row level security;
revoke all on table public.orders from public, anon, authenticated;
grant insert on table public.orders to anon;
grant insert, select, delete on table public.orders to authenticated;

drop policy if exists "Public can submit order requests" on public.orders;
create policy "Public can submit order requests"
  on public.orders for insert to anon, authenticated
  with check (
    length(trim(customer_name)) between 2 and 120
    and length(trim(customer_phone)) between 7 and 30
    and length(trim(delivery_address)) between 5 and 500
    and length(trim(city)) between 2 and 100
    and product_price > 0
    and quantity between 1 and 100
  );

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
  on public.orders for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
