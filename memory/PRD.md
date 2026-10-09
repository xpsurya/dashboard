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

## Backlog
- P0: Connect real Supabase (fill .env, run schema.sql)
- P1: Supabase Auth + role-based RLS (replace client-side password gate & anon full access)
- P1: Realtime subscriptions for live updates; email notification to leaders
- P2: Code-splitting (bundle 2.5MB), per-store drill-down pages
