# PRD — Field Force Command Center (Web Admin Dashboard)

## Original problem statement
"Sekarang kita bangun Web Dashboard Admin di dalam folder terpisah menggunakan spesifikasi ini:" — Production-grade responsive Web Command Center & Admin Dashboard for Enterprise Field Force System using React (Vite), Tailwind CSS, Lucide Icons, Apache ECharts; direct Supabase read/write (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY); branding via config.json (Brand "Field Force Command Center", primary #1A365D). Tables: manpower, stores, coverages, products, calendar_workdays, attendance_logs, store_inventory, sales_orders, sales_order_items, discipline_audit_logs, leader_validations. Tabs: Top Nav & Global Filter (live indicator, last sync, auto-refresh, region/area, single/range date, global search, TV/Kiosk 30s cycle, export PNG/PDF); Selling Performance; Absen Performance & Work Duration; Tracking Stock & Near-ED; Photo Gallery; Master Database (password gate, CRUD, Bulk Excel [AKSI]); Validation, Audit & Discipline Scoring.

## User choices
- MOCK demo data until real Supabase credentials are filled in .env
- Agent designs schema + SQL file
- Separate Vite project at /app/admin-dashboard, served on preview
- Master DB password: ADMIN
- Mixed Indonesian + English labels

## Architecture
- /app/admin-dashboard (Vite 6, React 18, Tailwind 3, ECharts, supabase-js 2.49, xlsx, html2canvas, jspdf)
- /app/frontend/package.json `start`/`build` scripts redirect to ../admin-dashboard (preview on port 3000; build copies dist → frontend/build)
- Data layer: src/lib/dataService.js (Supabase or in-memory mockDb when env is placeholder)
- Schema: /app/admin-dashboard/supabase/schema.sql (tables, indexes, calendar seed, permissive anon RLS)

## User personas
- Ops/Command center managers (TV kiosk), Area leaders (validation queue), Admin (master data)

## Implemented (2026-10-09)
- All 6 tabs + top nav/filter bar, kiosk, export PNG/PDF, auto-refresh 60s
- KPI/charts/tables per spec, heatmap, near-ED badges, photo lightbox
- Master CRUD + Bulk Excel template/upload with PK conflict checks & report
- Review queue Approve/Update/Delete → leader_validations + discipline logs; discipline score & leader SLA
- Testing agent iteration_1: 100% frontend pass

## Implemented (2026-10-09, iteration 2)
- Supabase Realtime (postgres_changes on attendance_logs, sales_orders) → auto refresh + Live Feed ticker; MOCK mode simulates events every 15s
- Supabase Auth email/password login (no sign-up), roles in public.user_roles (admin/leader); Master DB = admin only; Review Queue = leader (own SPGs via manpower.leader_email) or admin; old "ADMIN" password gate removed
- schema.sql: user_roles, is_admin()/is_leader_of() helpers, granular RLS, realtime publication, admin seed for xp.surya@gmail.com
- Testing iteration_2: 100% after .env quoting fix

## Implemented (iteration 3 — continued from GitHub xpsurya/dashboard)
- Live Feed ticker removed (realtime auto-refresh kept)
- Heatmap: click present/incomplete cell → Foto Absen lightbox
- Export: CSV checklist (Raw Selling / Absen / Stock / Validasi-Audit) for global period+region; PNG/PDF kept as "Snapshot"
- Review Queue: Foto Nota (transaksi) & Foto Absen (absensi) thumbnails → lightbox
- Photo Gallery: removed Foto Absen Masuk & Foto Nota categories (only Pajangan A/B/C)
- New tab Customer Analytic: value buckets, NEW vs LOYAL (loyal = ≥2 trx; customer id = phone, else TRX ID when phone empty/0), SKU-per-trx, frequency, Pareto, jam×hari heatmap, Top 20, repeat rate per store, auto insights
- New tab Product Analytic: Parent SKU contribution, SKU by value & qty (high→low), SKU ranking, cross-sell pairs (support/confidence/lift), companion finder, co-occurrence matrix
- products.parent_sku column added (schema.sql + Master DB field); mock data has repeat customers, phone "0" buyers, multi-SKU baskets

## Implemented (iteration 4)
- RFM Segmentation on Customer Analytic: Champions / Loyal / New & Potensial / At Risk / Hibernating with adaptive thresholds (aktif <= span*0.25, diam > span*0.6, high value >= P50), segment cards + chart + detail table, Prioritas Win-Back table (At Risk+Hibernating by value desc, store/SPG, idle days), Segment badge column in Top Customer, win-back insight bullet

## Implemented (iteration 5)
- /app/dummy-data/*.csv: dummy data 12 tabel (header = schema.sql, FK konsisten, UUID valid, enum sesuai constraint, 14 hari terakhir) + README panduan import; generator: scripts/generate-dummy-csv.mjs

## Implemented (iteration 6 — GO-LIVE Supabase)
- LIVE on project oykonaecttzabnxfcchc: user ran RESET_AND_SETUP.sql (old tables replaced with dashboard schema) + FINAL_STEP.sql (admin role + storage bucket 'field-photos' public)
- scripts/setup-supabase.mjs executed: 10 leader accounts (signUp), 11 user_roles, 11 dummy CSVs imported (~6.4k rows)
- Verified end-to-end: LIVE pill, realtime SUBSCRIBED, admin login, all tabs with data, Approve writes to live DB (RLS ok)
- Remaining user action: Authentication settings → turn OFF "Allow new users to sign up"
- Photo URLs still point to app-served /photos/*.jpg; field app should upload to storage bucket field-photos and store its public URL

## Backlog
- P0: Connect real Supabase (fill .env, run schema.sql, create Auth users)
- P1: Require login (viewer role) for reading dashboard data; email notification to leaders
- P1: Atomic validation RPC (status update + validation log + discipline log in one transaction)
- P2: Code-splitting (bundle 2.5MB), per-store drill-down pages
