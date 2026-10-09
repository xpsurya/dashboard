# Field Force Command Center — Web Admin Dashboard

React (Vite) · Tailwind CSS · Lucide Icons · Apache ECharts · @supabase/supabase-js

## Setup
```bash
cd admin-dashboard
yarn install --ignore-engines
cp .env.example .env   # isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MASTER_DB_PASSWORD
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

## Catatan keamanan
- Password gate Master Database dicek di browser (`VITE_MASTER_DB_PASSWORD`), bukan proteksi server.
- Policy RLS di `schema.sql` membuka akses anon penuh. Untuk production gunakan Supabase Auth + policy per role.
