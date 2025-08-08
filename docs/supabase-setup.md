# Supabase Setup Guide

The following SQL snippets create the core tables for the room rental system. Run them in the Supabase SQL editor.

## 1. Rooms
```sql
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  number text not null,
  type text not null,
  rate_monthly numeric not null,
  rate_daily numeric not null,
  water_rate numeric not null,
  electric_rate numeric not null,
  status text default 'available'
);
```

## 2. Tenants
```sql
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  phone text
);
```

## 3. Rentals
```sql
create table if not exists rentals (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  rental_type text check (rental_type in ('monthly','daily')),
  start_date date not null,
  end_date date,
  price numeric not null
);
```

## 4. Meter Readings
```sql
create table if not exists meter_readings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  reading_date date not null,
  water numeric not null,
  electric numeric not null
);
```

## 5. Invoices & Charges
```sql
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  rental_id uuid references rentals(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  water_usage numeric,
  water_cost numeric,
  electric_usage numeric,
  electric_cost numeric,
  base_rent numeric,
  late_fee numeric default 0,
  other_total numeric default 0,
  total numeric not null,
  due_date date not null,
  paid_at timestamptz,
  status text default 'unpaid'
);

create table if not exists invoice_charges (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  name text not null,
  amount numeric not null
);
```

## 6. Store
```sql
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null,
  delivery_fee numeric not null default 0
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  total numeric not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null,
  price numeric not null
);
```

## 7. Credit Limits
```sql
create table if not exists credit_limits (
  tenant_id uuid references tenants(id) primary key,
  month date not null,
  limit_amount numeric not null default 500,
  used numeric not null default 0
);
```

Configure Row Level Security (RLS) policies according to your access rules. For example, allow tenants to read their own rentals and invoices while admins and support have full access.
