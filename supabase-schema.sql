-- ============================================================
-- Self Service Ordering System - CODEEVOLUTION
-- Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────

create type order_status as enum (
  'draft', 'pending', 'preparing', 'served', 'completed', 'cancelled'
);

create type payment_method as enum ('online', 'cashier');
create type payment_status as enum ('unpaid', 'paid');
create type admin_role as enum ('super_admin', 'cashier', 'kitchen');

-- ─── Tabel Utama ──────────────────────────────────────────

create table restaurants (
  id          uuid primary key default uuid_generate_v4(),
  name        varchar(255) not null,
  address     text,
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table tables (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  table_number    varchar(50) not null,
  qr_code_url     text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table categories (
  id              uuid primary key default uuid_generate_v4(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  name            varchar(100) not null,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table menus (
  id              uuid primary key default uuid_generate_v4(),
  category_id     uuid not null references categories(id) on delete cascade,
  name            varchar(255) not null,
  description     text,
  price           numeric(12,2) not null default 0,
  image_url       text,
  is_available    boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create table menu_options (
  id              uuid primary key default uuid_generate_v4(),
  menu_id         uuid not null references menus(id) on delete cascade,
  name            varchar(100) not null,
  is_required     boolean not null default false,
  is_multiple     boolean not null default false,
  created_at      timestamptz not null default now()
);

create table menu_option_items (
  id                  uuid primary key default uuid_generate_v4(),
  menu_option_id      uuid not null references menu_options(id) on delete cascade,
  label               varchar(100) not null,
  additional_price    numeric(12,2) not null default 0,
  created_at          timestamptz not null default now()
);

create table orders (
  id                  uuid primary key default uuid_generate_v4(),
  restaurant_id       uuid not null references restaurants(id),
  table_id            uuid not null references tables(id),
  status              order_status not null default 'draft',
  payment_method      payment_method,
  payment_status      payment_status not null default 'unpaid',
  transaction_id      varchar(255),
  total_price         numeric(12,2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  menu_id     uuid not null references menus(id),
  quantity    integer not null default 1,
  unit_price  numeric(12,2) not null,
  notes       text,
  subtotal    numeric(12,2) not null,
  created_at  timestamptz not null default now()
);

create table order_item_options (
  id                      uuid primary key default uuid_generate_v4(),
  order_item_id           uuid not null references order_items(id) on delete cascade,
  menu_option_item_id     uuid not null references menu_option_items(id),
  label                   varchar(100) not null,
  additional_price        numeric(12,2) not null default 0
);

create table admin_users (
  id              uuid primary key references auth.users(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id),
  email           varchar(255) not null,
  role            admin_role not null default 'cashier',
  created_at      timestamptz not null default now()
);

-- ─── Auto-update updated_at ───────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ─── Indexes ──────────────────────────────────────────────

create index idx_menus_category on menus(category_id);
create index idx_orders_table on orders(table_id);
create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_status on orders(status);
create index idx_order_items_order on order_items(order_id);
create index idx_categories_restaurant on categories(restaurant_id);

-- ─── Row Level Security (RLS) ─────────────────────────────

alter table restaurants enable row level security;
alter table tables enable row level security;
alter table categories enable row level security;
alter table menus enable row level security;
alter table menu_options enable row level security;
alter table menu_option_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;
alter table admin_users enable row level security;

-- Customer: read-only untuk data publik
create policy "Public read restaurants" on restaurants for select using (is_active = true);
create policy "Public read tables" on tables for select using (is_active = true);
create policy "Public read categories" on categories for select using (is_active = true);
create policy "Public read menus" on menus for select using (is_available = true);
create policy "Public read menu_options" on menu_options for select using (true);
create policy "Public read menu_option_items" on menu_option_items for select using (true);

-- Customer: bisa buat order
create policy "Anyone can create orders" on orders for insert with check (true);
create policy "Anyone can read their order" on orders for select using (true);
create policy "Anyone can insert order_items" on order_items for insert with check (true);
create policy "Anyone can read order_items" on order_items for select using (true);
create policy "Anyone can insert order_item_options" on order_item_options for insert with check (true);
create policy "Anyone can read order_item_options" on order_item_options for select using (true);

-- ─── Seed Data (Contoh) ───────────────────────────────────

insert into restaurants (name, address) values
  ('Warung CODEEVOLUTION', 'Jl. Teknologi No. 1, Jakarta');

-- Ambil ID restoran untuk seed selanjutnya jika perlu
-- select id from restaurants where name = 'Warung CODEEVOLUTION';
