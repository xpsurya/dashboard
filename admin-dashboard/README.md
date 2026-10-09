# Field Force Command Center — Web Admin Dashboard

React (Vite) · Tailwind CSS · Lucide Icons · Apache ECharts · @supabase/supabase-js

## Setup
```bash
cd admin-dashboard
yarn install --ignore-engines
cp .env.example .env   # isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
yarn dev               # http://localhost:3000
yarn build             # output: dist/
```

## Supabase
1. Buka Supabase Dashboard → SQL Editor, jalankan `supabase/schema.sql`.
2. Isi `.env` dengan Project URL & anon key (Settings → API).
3. Selama `.env` masih placeholder (`https://supabase.co` / `<ANON_KEY_HERE>`), dashboard otomatis berjalan dengan **MOCK data** (badge "DEMO MODE").

## Branding
Ubah `config.json` (brandName, primaryColor, interval kiosk, auto-refresh, ambang Near-ED, poin disiplin, SLA jam).

## Struktur
- `src/lib` — supabase client, data service, mock data, metrics, excel engine, export
- `src/context/DashboardContext.jsx` — global filter, data sync, auto-refresh
- `src/components` — layout (TopNav, FilterBar, TabNav) & UI primitives (Card, KpiCard, Modal, EChart)
- `src/tabs` — selling, absen, stock, photos, master, audit

## Login Leader / Admin (Supabase Auth)
1. Authentication → Providers → Email: aktif. Matikan "Allow new users to sign up".
2. Authentication → Users → Add user untuk tiap admin/leader.
3. Jalankan ulang `schema.sql` (seed role admin untuk xp.surya@gmail.com) dan tambahkan baris `user_roles` untuk leader. Email leader harus sama dengan `manpower.leader_email`.
4. Master Database = role `admin`. Leader Review Queue = role `leader` (hanya SPG binaannya) atau `admin`.

## Realtime
`schema.sql` menambahkan `attendance_logs` & `sales_orders` ke publication `supabase_realtime`. Dashboard subscribe `postgres_changes` dan me-refresh data otomatis + menampilkan Live Feed.

## Catatan keamanan
- Hak tulis ditegakkan oleh RLS (bukan hanya UI). Baca data dashboard masih terbuka untuk anon (layar TV tanpa login), termasuk data pembeli.
- Insert absen/sales/stok terbuka untuk anon agar aplikasi mobile SPG bisa mengirim data.
- Variabel `VITE_MOCK_*` hanya dipakai di mode demo (MOCK) dan diabaikan saat Supabase terhubung.
