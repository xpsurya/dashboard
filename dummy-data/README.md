# Dummy Data CSV — Field Force Command Center

Paket CSV dummy untuk mengisi tabel Supabase. **Header setiap file persis sama dengan kolom yang dibaca dashboard** (sesuai `admin-dashboard/supabase/schema.sql`). Sesuaikan isi/header dengan tabel Anda; jika nama kolom berubah, sesuaikan juga kode dashboard.

Dibuat otomatis oleh `scripts/generate-dummy-csv.mjs` (jalankan ulang dari folder `admin-dashboard`: `node ../scripts/generate-dummy-csv.mjs`).

## Daftar file & urutan import

Urutan penting karena ada relasi antar-tabel (FK). Import berurutan dari 01:

| # | File | Tabel Supabase | Isi |
|---|------|----------------|-----|
| 01 | `01_stores.csv` | `stores` | Master toko (32) |
| 02 | `02_manpower.csv` | `manpower` | Master SPG + leader (34) |
| 03 | `03_products.csv` | `products` | Master SKU + **parent_sku** (12) |
| 04 | `04_coverages.csv` | `coverages` | Penugasan SPG → toko (32) |
| 05 | `05_calendar_workdays.csv` | `calendar_workdays` | Kalender hari kerja (Minggu = libur) |
| 06 | `06_attendance_logs.csv` | `attendance_logs` | Absen masuk/pulang + URL foto + status validasi (314) |
| 07 | `07_store_inventory.csv` | `store_inventory` | Stok per toko × SKU + tanggal ED (972) |
| 08 | `08_sales_orders.csv` | `sales_orders` | Header transaksi (1.706) |
| 09 | `09_sales_order_items.csv` | `sales_order_items` | Item per transaksi — **wajib setelah 08** (FK `trx_id`) (3.341) |
| 10 | `10_leader_validations.csv` | `leader_validations` | Log validasi leader (1.987) |
| 11 | `11_discipline_audit_logs.csv` | `discipline_audit_logs` | Poin disiplin (33) |
| 12 | `12_user_roles.csv` | `user_roles` | Role admin/leader (2) — lihat catatan di bawah |

Periode data transaksi: 14 hari terakhir (auto mengikuti tanggal saat digenerate).

## Format nilai

- **date**: `YYYY-MM-DD` (mis. `2026-09-26`)
- **timestamptz**: ISO 8601 UTC (mis. `2026-09-26T07:38:00.000Z`)
- **boolean**: `true` / `false`
- **kosong / NULL**: sel dibiarkan kosong
- **id**: UUID valid (kolom `id` pada tabel transaksional; `user_id` di `user_roles`)

## Nilai enum (harus persis, ada CHECK constraint)

| Kolom | Nilai yang diizinkan |
|-------|----------------------|
| `manpower.status` | `ACTIVE`, `INACTIVE` |
| `sales_orders.status` & `attendance_logs.validation_status` | `PENDING`, `APPROVED`, `UPDATED`, `DELETED` |
| `leader_validations.action` | `APPROVE`, `UPDATE`, `DELETE` |
| `discipline_audit_logs.event_type` | `LEADER_UPDATE`, `LEADER_DELETE`, `MISSED_CHECKOUT` |
| `user_roles.role` | `admin`, `leader` |

## Kolom yang dipakai fitur khusus dashboard

- **`products.parent_sku`** → tab Product Analytic (Parent SKU Contribution). Jika kosong, dashboard memakai `category`.
- **`sales_orders.buyer_phone`** → identitas customer di tab Customer Analytic. Jika kosong atau `0`, customer dianggap unik per `trx_id`. Dummy sengaja berisi sebagian `0` untuk mendemokan aturan ini.
- **`sales_orders.trx_id`** → harus **unik** dan menjadi FK dari `sales_order_items.trx_id` (dipakai embedded select dashboard: `sales_orders(*, sales_order_items(*))`).
- **`attendance_logs.photo_*_url`, `sales_orders.receipt_photo_url`** → ditampilkan di Photo Gallery / Review Queue / Heatmap. Nilai dummy adalah path relatif (`/photos/...`); di production ganti dengan **public URL Supabase Storage** Anda.
- **`manpower.leader_email`** → menentukan SPG binaan pada Review Queue untuk akun role `leader` (email harus sama dengan email login).
- **`leader_validations.ref_table` + `ref_id`** → menunjuk record yang divalidasi (`attendance_logs` / `sales_orders`); `ref_id` berisi UUID record tersebut (tipe kolom `text`).

## Catatan penting

1. **`12_user_roles.csv`: `user_id` hanyalah placeholder.** Ganti dengan UUID asli dari Supabase Dashboard → Authentication → Users. Kolom email tidak ada di tabel ini — pemetaan lewat `user_id`.
2. `attendance_logs` punya constraint `unique (spg_code, work_date)` — satu SPG maksimal 1 absen per hari.
3. Jalankan `admin-dashboard/supabase/schema.sql` dulu sebelum import, agar tabel, index, RLS, dan realtime publication siap.
4. Setelah tabel live terisi, isi `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` di `admin-dashboard/.env` untuk keluar dari mode MOCK.
