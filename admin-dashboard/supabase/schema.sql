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

-- AUTH ROLES ----------------------------------------------------------------
-- Akun dibuat admin di Supabase Dashboard → Authentication → Users (matikan "Allow new users to sign up").
create table if not exists public.user_roles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('admin','leader')),
  display_name text,
  created_at   timestamptz not null default now()
);

create or replace function public.app_role() returns text
language sql security definer set search_path = public stable as $$
  select role from public.user_roles where user_id = (select auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce(public.app_role() = 'admin', false)
$$;

-- Leader hanya boleh memvalidasi SPG yang manpower.leader_email = email login-nya
create or replace function public.is_leader_of(target_spg text) returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce(public.app_role() = 'leader', false) and exists (
    select 1 from public.manpower m
    where m.spg_code = target_spg and lower(m.leader_email) = lower(auth.jwt() ->> 'email')
  )
$$;

revoke all on function public.app_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_leader_of(text) from public;
grant execute on function public.app_role(), public.is_admin(), public.is_leader_of(text) to authenticated;

-- ROW LEVEL SECURITY ------------------------------------------------------
-- Baca: anon + authenticated (layar TV / kiosk tanpa login).
-- Tulis master data: hanya ADMIN. Validasi: ADMIN atau LEADER pemilik SPG.
-- Insert transaksi lapangan (absen, sales, stok) tetap terbuka untuk aplikasi mobile SPG.
do $$
declare
  t text;
  p record;
  all_tables text[] := array['stores','manpower','products','coverages','calendar_workdays','attendance_logs',
    'store_inventory','sales_orders','sales_order_items','discipline_audit_logs','leader_validations','user_roles'];
begin
  foreach t in array all_tables loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    if t <> 'user_roles' then
      execute format('create policy "read_all" on public.%I for select to anon, authenticated using (true)', t);
    end if;
  end loop;

  foreach t in array array['stores','manpower','products','coverages','calendar_workdays'] loop
    execute format('create policy "admin_write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array['attendance_logs','sales_orders','sales_order_items','store_inventory'] loop
    execute format('create policy "field_app_insert" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "admin_delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;

  foreach t in array array['attendance_logs','sales_orders'] loop
    execute format('create policy "validator_update" on public.%I for update to authenticated using (public.is_admin() or public.is_leader_of(spg_code)) with check (public.is_admin() or public.is_leader_of(spg_code))', t);
  end loop;

  foreach t in array array['sales_order_items','store_inventory'] loop
    execute format('create policy "admin_update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array['leader_validations','discipline_audit_logs'] loop
    execute format('create policy "validator_insert" on public.%I for insert to authenticated with check (public.is_admin() or public.is_leader_of(spg_code))', t);
    execute format('create policy "admin_modify" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin_remove" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

create policy "own_or_admin_read" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "admin_manage_roles" on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- REALTIME ------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.attendance_logs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sales_orders; exception when duplicate_object then null; end;
end $$;

-- SEED ROLE ADMIN (jalankan setelah user dibuat di Authentication → Users) ---
insert into public.user_roles (user_id, role, display_name)
select id, 'admin', 'Owner Admin' from auth.users where lower(email) = 'xp.surya@gmail.com'
on conflict (user_id) do update set role = excluded.role;

-- Contoh role leader (email harus sama dengan manpower.leader_email):
-- insert into public.user_roles (user_id, role, display_name)
-- select id, 'leader', 'Nama Leader' from auth.users where lower(email) = 'leader@company.co.id'
-- on conflict (user_id) do update set role = excluded.role;
