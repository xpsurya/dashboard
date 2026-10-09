/**
 * Setup Supabase live: buat akun login (admin + 10 leader) lalu import dummy-data/*.csv.
 * Jalankan dari folder admin-dashboard:
 *   node ../scripts/setup-supabase.mjs
 *
 * Env opsional (bisa di-export sebelum menjalankan):
 *   SUPABASE_SERVICE_ROLE_KEY  -> jika ada, akun dibuat via Admin API (email_confirm=true)
 *   ADMIN_EMAIL / ADMIN_PASSWORD (default xp.surya@gmail.com / Admin#2026)
 *   LEADER_PASSWORD            (default Leader#2026)
 *
 * Tanpa service key: akun leader dibuat via signUp (butuh "Confirm email" OFF & sign-up ON
 * di Authentication settings) dan akun ADMIN harus sudah dibuat manual di dashboard
 * beserta 1x run schema.sql (yang otomatis mengisi role admin-nya).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const dash = join(here, '..', 'admin-dashboard');
const dataDir = join(here, '..', 'dummy-data');

const envFile = Object.fromEntries(
  readFileSync(join(dash, '.env'), 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }),
);
const URL = envFile.VITE_SUPABASE_URL;
const ANON = envFile.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'xp.surya@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#2026';
const LEADER_PASSWORD = process.env.LEADER_PASSWORD || 'Leader#2026';

const LEADERS = [
  ['budi.leader@fieldforce.example', 'Budi Santoso'], ['agus.leader@fieldforce.example', 'Agus Setiawan'],
  ['hendra.leader@fieldforce.example', 'Hendra Wijaya'], ['rudi.leader@fieldforce.example', 'Rudi Hartono'],
  ['bambang.leader@fieldforce.example', 'Bambang Susilo'], ['joko.leader@fieldforce.example', 'Joko Prasetyo'],
  ['andi.leader@fieldforce.example', 'Andi Firmansyah'], ['dedi.leader@fieldforce.example', 'Dedi Kurniawan'],
  ['yusuf.leader@fieldforce.example', 'Yusuf Hidayat'], ['fajar.leader@fieldforce.example', 'Fajar Nugroho'],
];

// urutan penting (FK): masters -> transaksional -> items -> logs
const IMPORT_ORDER = [
  ['01_stores.csv', 'stores', 'store_code'],
  ['02_manpower.csv', 'manpower', 'spg_code'],
  ['03_products.csv', 'products', 'sku'],
  ['04_coverages.csv', 'coverages', 'coverage_id'],
  ['06_attendance_logs.csv', 'attendance_logs', 'id'],
  ['07_store_inventory.csv', 'store_inventory', 'id'],
  ['08_sales_orders.csv', 'sales_orders', 'id'],
  ['09_sales_order_items.csv', 'sales_order_items', 'id'],
  ['10_leader_validations.csv', 'leader_validations', 'id'],
  ['11_discipline_audit_logs.csv', 'discipline_audit_logs', 'id'],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQ) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i += 1; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cur); cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] === '' ? null : r[i]])));
}

const NUM = new Set(['monthly_target', 'price', 'qty_stock', 'total_omzet', 'qty', 'subtotal', 'points', 'work_duration_minutes']);
const BOOL = new Set(['is_workday']);
const coerce = (k, v) => (v === null ? null : NUM.has(k) ? Number(v) : BOOL.has(k) ? v === 'true' : v);

const admin = SERVICE ? createClient(URL, SERVICE, { auth: { persistSession: false } }) : createClient(URL, ANON);

async function createUsers() {
  const out = [];
  const mk = async (email, password, name, role) => {
    let id = null;
    if (SERVICE) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
      if (error && !/already|exists/i.test(error.message)) throw new Error(`createUser ${email}: ${error.message}`);
      id = data?.user?.id ?? null;
      if (!id) {
        const { data: l } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        id = l.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      }
    } else {
      const { data, error } = await admin.auth.signUp({ email, password });
      if (error && !/already|exists|registered/i.test(error.message)) throw new Error(`signUp ${email}: ${error.message}`);
      id = data?.user?.id ?? null;
      if (!id) { // sudah terdaftar -> login untuk mengambil id
        const { data: s } = await admin.auth.signInWithPassword({ email, password });
        id = s?.user?.id ?? null;
        await admin.auth.signOut();
      }
    }
    out.push({ id, email, role, name });
    console.log(`  akun ${role}: ${email} ${id ? 'OK' : '(sudah ada)'}`);
  };
  console.log('== Membuat akun login ==');
  if (SERVICE) await mk(ADMIN_EMAIL, ADMIN_PASSWORD, 'Owner Admin', 'admin');
  for (const [email, name] of LEADERS) await mk(email, LEADER_PASSWORD, name, 'leader');
  return out;
}

async function loginAdmin() {
  if (SERVICE) return admin;
  const { error } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (error) throw new Error(`Login admin gagal (${error.message}). Buat dulu akun admin di dashboard + jalankan schema.sql.`);
  return admin;
}

async function ensureRoles(users, client) {
  console.log('== Mengisi user_roles ==');
  const ids = new Map(users.filter((u) => u.id).map((u) => [u.email, u]));
  if (!ids.has(ADMIN_EMAIL) || !ids.get(ADMIN_EMAIL).id) {
    const { data: me } = await client.auth.getUser();
    if (me?.user?.id) ids.set(ADMIN_EMAIL, { id: me.user.id, role: 'admin', name: 'Owner Admin' });
  }
  const rows = [...ids.values()].filter((u) => u.id).map((u) => ({ user_id: u.id, role: u.role, display_name: u.name }));
  const { error } = await client.from('user_roles').upsert(rows, { onConflict: 'user_id' });
  if (error) console.log(`  ! user_roles: ${error.message} (role admin biasanya sudah di-seed schema.sql; jalankan insert manual bila perlu)`);
  else console.log(`  ${rows.length} role OK`);
}

async function importCsvs(client) {
  console.log('== Import CSV ==');
  for (const [file, table, pk] of IMPORT_ORDER) {
    const rows = parseCsv(readFileSync(join(dataDir, file), 'utf8')).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, coerce(k, v)])));
    let done = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await client.from(table).upsert(rows.slice(i, i + 500), { onConflict: pk });
      if (error) throw new Error(`${table} (baris ${i + 1}): ${error.message}`);
      done += Math.min(500, rows.length - i);
    }
    console.log(`  ${table}: ${done} baris`);
  }
}

const users = await createUsers();
const client = await loginAdmin();
await ensureRoles(users, client);
await importCsvs(client);
console.log('\nSelesai! Buka dashboard — pill kiri atas harus berubah menjadi LIVE · Supabase.');
