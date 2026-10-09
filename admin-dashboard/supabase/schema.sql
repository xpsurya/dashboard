-- Field Force Command Center · Supabase schema
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- MASTER TABLES ---------------------------------------------------------
create table if not exists public.stores (
  store_code   text primary key,
  store_name   text not null,
  chain        text,
  region       text not null,
  area         text,
  address      text,
  created_at   timestamptz not null default now()
);

create table if not exists public.manpower (
  spg_code       text primary key,
  name           text not null,
  region         text not null,
  area           text,
  store_code     text,
  leader_name    text,
  leader_email   text,
  phone          text,
  monthly_target numeric(14,0) not null default 0,
  status         text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  join_date      date,
  created_at     timestamptz not null default now()
);

create table if not exists public.products (
  sku          text primary key,
  product_name text not null,
  category     text,
  price        numeric(12,0) not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.coverages (
  coverage_id text primary key,
  spg_code    text not null,
  store_code  text not null,
  visit_days  text,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists public.calendar_workdays (
  work_date  date primary key,
  is_workday boolean not null default true,
  note       text
);

-- TRANSACTIONAL TABLES --------------------------------------------------
create table if not exists public.attendance_logs (
  id                    uuid primary key default gen_random_uuid(),
  spg_code              text not null,
  store_code            text,
  work_date             date not null,
  checkin_time          timestamptz,
  checkout_time         timestamptz,
  work_duration_minutes integer,
  photo_checkin_url     text,
  photo_display_a_url   text,
  photo_display_b_url   text,
  photo_display_c_url   text,
  validation_status     text not null default 'PENDING' check (validation_status in ('PENDING','APPROVED','UPDATED','DELETED')),
  email_sent_at         timestamptz,
  validated_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique (spg_code, work_date)
);
create index if not exists attendance_logs_work_date_idx on public.attendance_logs (work_date);
create index if not exists attendance_logs_status_idx on public.attendance_logs (validation_status);

create table if not exists public.store_inventory (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid,
  store_code    text not null,
  sku           text not null,
  product_name  text,
  qty_stock     integer not null default 0,
  expired_date  date,
  created_at    timestamptz not null default now()
);
create index if not exists store_inventory_created_idx on public.store_inventory (created_at);
create index if not exists store_inventory_store_sku_idx on public.store_inventory (store_code, sku);

create table if not exists public.sales_orders (
  id                uuid primary key default gen_random_uuid(),
  trx_id            text not null unique,
  spg_code          text not null,
  store_code        text,
  trx_date          date not null,
  buyer_name        text,
  buyer_phone       text,
  total_omzet       numeric(14,0) not null default 0,
  receipt_photo_url text,
  status            text not null default 'PENDING' check (status in ('PENDING','APPROVED','UPDATED','DELETED')),
  email_sent_at     timestamptz,
  validated_at      timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists sales_orders_trx_date_idx on public.sales_orders (trx_date);
create index if not exists sales_orders_status_idx on public.sales_orders (status);

-- FK on trx_id is required for the embedded select: sales_orders(*, sales_order_items(*))
create table if not exists public.sales_order_items (
  id           uuid primary key default gen_random_uuid(),
  trx_id       text not null references public.sales_orders (trx_id) on update cascade on delete cascade,
  sku          text,
  product_name text,
  qty          integer not null default 1,
  price        numeric(12,0) not null default 0,
  subtotal     numeric(14,0) not null default 0
);
create index if not exists sales_order_items_trx_idx on public.sales_order_items (trx_id);

create table if not exists public.discipline_audit_logs (
  id         uuid primary key default gen_random_uuid(),
  spg_code   text not null,
  event_type text not null check (event_type in ('LEADER_UPDATE','LEADER_DELETE','MISSED_CHECKOUT')),
  points     integer not null,
  ref_table  text,
  ref_id     text,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists discipline_audit_logs_created_idx on public.discipline_audit_logs (created_at);

create table if not exists public.leader_validations (
  id            uuid primary key default gen_random_uuid(),
  leader_name   text,
  leader_email  text,
  spg_code      text,
  ref_table     text not null,
  ref_id        text not null,
  action        text not null check (action in ('APPROVE','UPDATE','DELETE')),
  note          text,
  email_sent_at timestamptz,
  validated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists leader_validations_sent_idx on public.leader_validations (email_sent_at);

-- SEED: kalender hari kerja tahun berjalan (Minggu = libur) --------------
insert into public.calendar_workdays (work_date, is_workday, note)
select d::date, extract(dow from d) <> 0, case when extract(dow from d) = 0 then 'Minggu' else 'Hari Kerja' end
from generate_series(date_trunc('year', now()), date_trunc('year', now()) + interval '1 year' - interval '1 day', interval '1 day') d
on conflict (work_date) do nothing;

-- ROW LEVEL SECURITY ------------------------------------------------------
-- WARNING: policy di bawah memberi akses baca/tulis penuh ke role anon (sesuai arsitektur
-- direct read/write dari browser). Untuk production, ganti dengan policy berbasis Supabase Auth.
do $$
declare t text;
begin
  foreach t in array array['stores','manpower','products','coverages','calendar_workdays','attendance_logs',
    'store_inventory','sales_orders','sales_order_items','discipline_audit_logs','leader_validations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anon_full_access" on public.%I', t);
    execute format('create policy "anon_full_access" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
