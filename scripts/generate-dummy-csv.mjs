/**
 * Generate dummy CSV untuk semua tabel yang dibaca dashboard.
 * Sumber data: generator mock aplikasi (src/lib/mockData.js) -> di-bundle via esbuild,
 * lalu dipangkas ke 14 hari terakhir dan id string diubah menjadi UUID deterministik
 * supaya cocok dengan kolom uuid di schema.sql.
 *
 * Jalankan dari folder admin-dashboard:
 *   node ../scripts/generate-dummy-csv.mjs
 * Output: ../dummy-data/*.csv + README.md
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // /app/scripts
const dash = join(here, '..', 'admin-dashboard');
const outDir = join(here, '..', 'dummy-data');
mkdirSync(outDir, { recursive: true });

const bundle = '/tmp/mockdb.bundle.cjs';
execSync(`npx esbuild src/lib/mockData.js --bundle --platform=node --format=cjs --outfile=${bundle}`, { cwd: dash, stdio: 'inherit' });
const { mockDb } = createRequire(import.meta.url)(bundle);

const toUuid = (s) => {
  const h = createHash('md5').update(String(s)).digest('hex');
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(18, 20)}-${h.slice(20, 32)}`;
};
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const writeCsv = (name, columns, rows) => {
  const csv = [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\r\n');
  writeFileSync(join(outDir, name), `﻿${csv}`);
  console.log(`${name}: ${rows.length} baris`);
};

// ---- pangkas ke 14 hari terakhir -------------------------------------------
const today = new Date();
const cutoffDate = new Date(today.getTime() - 13 * 86400000);
const cutoff = cutoffDate.toISOString().slice(0, 10);
const FIXED_TS = '2026-01-01T00:00:00.000Z';

const att = mockDb.list('attendance_logs').filter((r) => r.work_date >= cutoff);
const sales = mockDb.list('sales_orders').filter((r) => r.trx_date >= cutoff);
const attIds = new Map(att.map((r) => [r.id, toUuid(r.id)]));
const salesIds = new Map(sales.map((r) => [r.id, toUuid(r.id)]));
const trxIds = new Set(sales.map((r) => r.trx_id));
const refOk = (r) => (r.ref_table === 'attendance_logs' && attIds.has(r.ref_id)) || (r.ref_table === 'sales_orders' && salesIds.has(r.ref_id));
const refUuid = (r) => attIds.get(r.ref_id) ?? salesIds.get(r.ref_id) ?? r.ref_id;

// ---- masters (lengkap, tidak dipangkas) -------------------------------------
writeCsv('01_stores.csv',
  ['store_code', 'store_name', 'chain', 'region', 'area', 'address', 'created_at'],
  mockDb.list('stores').map((r) => ({ ...r, created_at: FIXED_TS })));

writeCsv('02_manpower.csv',
  ['spg_code', 'name', 'region', 'area', 'store_code', 'leader_name', 'leader_email', 'phone', 'monthly_target', 'status', 'join_date', 'created_at'],
  mockDb.list('manpower').map((r) => ({ ...r, created_at: r.join_date ? `${r.join_date}T00:00:00.000Z` : FIXED_TS })));

writeCsv('03_products.csv',
  ['sku', 'product_name', 'parent_sku', 'category', 'price', 'created_at'],
  mockDb.list('products').map((r) => ({ ...r, created_at: FIXED_TS })));

writeCsv('04_coverages.csv',
  ['coverage_id', 'spg_code', 'store_code', 'visit_days', 'start_date', 'end_date', 'created_at'],
  mockDb.list('coverages').map((r) => ({ ...r, created_at: FIXED_TS })));

writeCsv('05_calendar_workdays.csv',
  ['work_date', 'is_workday', 'note'],
  mockDb.list('calendar_workdays'));

// ---- transaksional -----------------------------------------------------------
writeCsv('06_attendance_logs.csv',
  ['id', 'spg_code', 'store_code', 'work_date', 'checkin_time', 'checkout_time', 'work_duration_minutes', 'photo_checkin_url', 'photo_display_a_url', 'photo_display_b_url', 'photo_display_c_url', 'validation_status', 'email_sent_at', 'validated_at', 'created_at'],
  att.map((r) => ({ ...r, id: attIds.get(r.id) })));

writeCsv('07_store_inventory.csv',
  ['id', 'attendance_id', 'store_code', 'sku', 'product_name', 'qty_stock', 'expired_date', 'created_at'],
  mockDb.list('store_inventory')
    .filter((r) => attIds.has(r.attendance_id))
    .map((r) => ({ ...r, id: toUuid(r.id), attendance_id: attIds.get(r.attendance_id) })));

writeCsv('08_sales_orders.csv',
  ['id', 'trx_id', 'spg_code', 'store_code', 'trx_date', 'buyer_name', 'buyer_phone', 'total_omzet', 'receipt_photo_url', 'status', 'email_sent_at', 'validated_at', 'created_at'],
  sales.map(({ sales_order_items, ...r }) => ({ ...r, id: salesIds.get(r.id) })));

writeCsv('09_sales_order_items.csv',
  ['id', 'trx_id', 'sku', 'product_name', 'qty', 'price', 'subtotal'],
  sales.flatMap((o) => (o.sales_order_items || []).filter((i) => trxIds.has(i.trx_id)).map((i) => ({ ...i, id: toUuid(i.id) }))));

writeCsv('10_leader_validations.csv',
  ['id', 'leader_name', 'leader_email', 'spg_code', 'ref_table', 'ref_id', 'action', 'note', 'email_sent_at', 'validated_at', 'created_at'],
  mockDb.list('leader_validations').filter(refOk).map((r) => ({ ...r, id: toUuid(r.id), ref_id: refUuid(r), created_at: r.validated_at })));

writeCsv('11_discipline_audit_logs.csv',
  ['id', 'spg_code', 'event_type', 'points', 'ref_table', 'ref_id', 'note', 'created_at'],
  mockDb.list('discipline_audit_logs').filter(refOk).map((r) => ({ ...r, id: toUuid(r.id), ref_id: refUuid(r) })));

// user_id dummy — WAJIB diganti dengan id asli dari Supabase Authentication -> Users
writeCsv('12_user_roles.csv',
  ['user_id', 'role', 'display_name', 'created_at'],
  [
    { user_id: toUuid('auth-user-admin-xp.surya@gmail.com'), role: 'admin', display_name: 'Owner Admin', created_at: FIXED_TS },
    { user_id: toUuid('auth-user-leader-budi.leader@fieldforce.example'), role: 'leader', display_name: 'Budi Santoso', created_at: FIXED_TS },
  ]);

console.log(`\nSelesai. Periode transaksi: ${cutoff} s/d ${today.toISOString().slice(0, 10)}`);
