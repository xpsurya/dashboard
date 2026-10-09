import { addDays, eachDay, monthBounds, parseDate, toISODate } from './dates';
import { PK } from './schema';

let seed = 20261009;
const rng = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => Math.floor(a + rng() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pad3 = (n) => String(n).padStart(3, '0');

const REGIONS = [
  { region: 'Jabodetabek', areas: ['Jakarta Pusat', 'Jakarta Selatan', 'Tangerang', 'Bekasi'] },
  { region: 'Jawa Barat', areas: ['Bandung', 'Bogor', 'Cirebon'] },
  { region: 'Jawa Tengah', areas: ['Semarang', 'Solo', 'Yogyakarta'] },
  { region: 'Jawa Timur', areas: ['Surabaya', 'Malang', 'Sidoarjo'] },
  { region: 'Sumatera', areas: ['Medan', 'Palembang', 'Pekanbaru'] },
];
const CHAINS = ['Hypermart', 'Transmart', 'Lottemart', 'Superindo', 'Giant', 'Hero', 'Foodmart', 'Alfamidi'];
const STREETS = ['Sudirman', 'Gatot Subroto', 'Diponegoro', 'Ahmad Yani', 'Merdeka', 'Asia Afrika', 'Pemuda'];
const SPG_NAMES = [
  'Rina Kartika', 'Dewi Lestari', 'Siti Aminah', 'Putri Ayu', 'Nurul Huda', 'Ayu Wandira', 'Maya Sari', 'Indah Permata',
  'Fitri Handayani', 'Lia Amelia', 'Yuni Astuti', 'Rani Oktavia', 'Wulan Sari', 'Tika Rahma', 'Nadia Putri', 'Sari Wulandari',
  'Mega Utami', 'Intan Nuraini', 'Dian Safitri', 'Vina Melati', 'Anisa Rahman', 'Citra Dewi', 'Eka Pratiwi', 'Gita Savitri',
  'Hana Pertiwi', 'Irma Susanti', 'Juwita Anggraini', 'Kiki Amalia', 'Laras Ayuning', 'Mira Anjani', 'Novi Kurnia', 'Okta Rahayu',
  'Prita Lestari', 'Ratna Sari',
];
const LEADERS = [
  'Budi Santoso', 'Agus Setiawan', 'Hendra Wijaya', 'Rudi Hartono', 'Bambang Susilo',
  'Joko Prasetyo', 'Andi Firmansyah', 'Dedi Kurniawan', 'Yusuf Hidayat', 'Fajar Nugroho',
];
const SLOW_LEADERS = new Set([3, 6, 9]);
const BUYERS = ['Ibu Ratna', 'Bapak Hadi', 'Ibu Sinta', 'Bapak Yoga', 'Ibu Lina', 'Ibu Wati', 'Bapak Rizal', 'Ibu Tuti', 'Ibu Mira', 'Bapak Doni'];
const PRODUCTS = [
  { sku: 'SKU-001', product_name: 'Susu UHT Full Cream 1L', category: 'Dairy', price: 19500 },
  { sku: 'SKU-002', product_name: 'Susu UHT Cokelat 200ml', category: 'Dairy', price: 6500 },
  { sku: 'SKU-003', product_name: 'Yogurt Drink Strawberry 250ml', category: 'Dairy', price: 9800 },
  { sku: 'SKU-004', product_name: 'Keju Cheddar Slice 170g', category: 'Dairy', price: 27500 },
  { sku: 'SKU-005', product_name: 'Susu Kental Manis 370g', category: 'Dairy', price: 12900 },
  { sku: 'SKU-006', product_name: 'Butter Cookies Tin 454g', category: 'Snack', price: 64000 },
  { sku: 'SKU-007', product_name: 'Sereal Gandum Madu 330g', category: 'Breakfast', price: 41500 },
  { sku: 'SKU-008', product_name: 'Kopi Susu RTD 220ml', category: 'Beverage', price: 8500 },
];
const PHOTOS = {
  checkin: ['/photos/checkin-1.jpg', '/photos/checkin-2.jpg'],
  a: '/photos/display-a.jpg',
  b: '/photos/display-b.jpg',
  c: '/photos/display-c.jpg',
  nota: '/photos/nota.jpg',
};

const at = (dateISO, minutes) => {
  const d = parseDate(dateISO);
  d.setMinutes(minutes);
  return d;
};
const plusMin = (date, m) => new Date(date.getTime() + m * 60000);

function buildMasters() {
  const stores = [];
  const manpower = [];
  REGIONS.forEach(({ region, areas }, ri) => {
    areas.forEach((area) => {
      for (let k = 0; k < 2; k += 1) {
        const i = stores.length + 1;
        const chain = CHAINS[(i + ri) % CHAINS.length];
        stores.push({
          store_code: `ST-${pad3(i)}`, store_name: `${chain} ${area}${k ? ' 2' : ''}`, chain, region, area,
          address: `Jl. ${pick(STREETS)} No. ${between(1, 200)}, ${area}`,
        });
        const li = ri * 2 + (stores.length % 2);
        manpower.push({
          spg_code: `SPG-${pad3(i)}`, name: SPG_NAMES[i - 1], region, area, store_code: `ST-${pad3(i)}`,
          leader_name: LEADERS[li], leader_email: `${LEADERS[li].split(' ')[0].toLowerCase()}.leader@fieldforce.example`,
          phone: `08${between(1100000000, 9899999999)}`, monthly_target: between(50, 120) * 500000, status: 'ACTIVE',
          join_date: `2025-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
          _leaderIdx: li, _rel: 0.84 + rng() * 0.15, _perf: 0.65 + rng() * 0.7,
        });
      }
    });
  });
  [33, 34].forEach((i) => {
    const base = manpower[i - 30];
    manpower.push({ ...base, spg_code: `SPG-${pad3(i)}`, name: SPG_NAMES[i - 1], status: 'INACTIVE', monthly_target: 0 });
  });
  const coverages = manpower.filter((m) => m.status === 'ACTIVE').map((m, i) => ({
    coverage_id: `COV-${pad3(i + 1)}`, spg_code: m.spg_code, store_code: m.store_code, visit_days: 'Senin-Sabtu',
    start_date: m.join_date, end_date: null,
  }));
  return { stores, manpower, coverages };
}

function generate() {
  const now = new Date();
  const today = toISODate(now);
  const start = toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const { stores, manpower, coverages } = buildMasters();
  const calendar = eachDay(start, monthBounds(today).end).map((d) => {
    const off = parseDate(d).getDay() === 0;
    return { work_date: d, is_workday: !off, note: off ? 'Minggu' : 'Hari Kerja' };
  });
  const workdays = new Set(calendar.filter((c) => c.is_workday).map((c) => c.work_date));
  const attendance = [];
  const sales = [];
  const inventory = [];
  const validations = [];
  const discipline = [];
  const expiry = new Map();
  const customers = Array.from({ length: 2500 }, () => ({ name: pick(BUYERS), phone: `08${between(1100000000, 9899999999)}` }));
  let n = 0;

  const validate = (rec, field, table, spg) => {
    const delayH = SLOW_LEADERS.has(spg._leaderIdx) ? 3 + rng() * 37 : 0.2 + rng() * 7.5;
    const validated = new Date(new Date(rec.email_sent_at).getTime() + delayH * 3600000);
    rec.validated_at = null;
    if (validated > now) { rec[field] = 'PENDING'; return; }
    const roll = rng();
    const action = roll < 0.004 ? 'DELETE' : roll < 0.018 ? 'UPDATE' : 'APPROVE';
    rec[field] = { APPROVE: 'APPROVED', UPDATE: 'UPDATED', DELETE: 'DELETED' }[action];
    rec.validated_at = validated.toISOString();
    const base = { spg_code: spg.spg_code, ref_table: table, ref_id: rec.id };
    validations.push({
      id: `LV-${(n += 1)}`, ...base, leader_name: spg.leader_name, leader_email: spg.leader_email, action,
      note: action === 'DELETE' ? 'Indikasi transaksi fiktif' : action === 'UPDATE' ? 'Koreksi input data' : null,
      email_sent_at: rec.email_sent_at, validated_at: rec.validated_at,
    });
    if (action !== 'APPROVE') {
      discipline.push({
        id: `DA-${(n += 1)}`, ...base, event_type: action === 'DELETE' ? 'LEADER_DELETE' : 'LEADER_UPDATE',
        points: action === 'DELETE' ? -25 : -5, note: 'Auto-generated (demo)', created_at: rec.validated_at,
      });
    }
  };

  eachDay(start, today).forEach((d, dayIdx) => {
    if (!workdays.has(d)) return;
    manpower.filter((m) => m.status === 'ACTIVE').forEach((spg) => {
      if (rng() > spg._rel) return;
      const inMin = between(450, 555);
      const checkin = at(d, inMin);
      if (checkin > now) return;
      const dur = between(440, 590);
      let checkout = rng() < 0.04 ? null : at(d, inMin + dur);
      if (checkout && checkout > now) checkout = null;
      n += 1;
      const att = {
        id: `ATT-${n}`, spg_code: spg.spg_code, store_code: spg.store_code, work_date: d,
        checkin_time: checkin.toISOString(), checkout_time: checkout ? checkout.toISOString() : null,
        work_duration_minutes: checkout ? dur : null, photo_checkin_url: PHOTOS.checkin[n % 2],
        photo_display_a_url: PHOTOS.a, photo_display_b_url: PHOTOS.b, photo_display_c_url: rng() > 0.15 ? PHOTOS.c : null,
        created_at: checkin.toISOString(), email_sent_at: plusMin(checkout || checkin, 5).toISOString(),
      };
      validate(att, 'validation_status', 'attendance_logs', spg);
      attendance.push(att);

      const trxCount = between(3, 8);
      const dailyTarget = (spg.monthly_target / 26) * spg._perf;
      let t = plusMin(checkin, between(25, 60));
      for (let j = 0; j < trxCount; j += 1) {
        if (t > now || (checkout && t > checkout)) break;
        const k = between(1, 3);
        const chosen = [...PRODUCTS].sort(() => rng() - 0.5).slice(0, k);
        const trxId = `TRX-${d.replaceAll('-', '')}-${spg.spg_code.slice(4)}-${j + 1}`;
        const items = chosen.map((p, x) => {
          const qty = Math.max(1, Math.round((dailyTarget / trxCount / k / p.price) * (0.6 + rng() * 0.8)));
          return { id: `${trxId}-${x + 1}`, trx_id: trxId, sku: p.sku, product_name: p.product_name, qty, price: p.price, subtotal: qty * p.price };
        });
        const buyer = pick(customers);
        const order = {
          id: `SO-${(n += 1)}`, trx_id: trxId, spg_code: spg.spg_code, store_code: spg.store_code, trx_date: d,
          buyer_name: buyer.name, buyer_phone: buyer.phone, total_omzet: items.reduce((s, i) => s + i.subtotal, 0),
          receipt_photo_url: PHOTOS.nota, created_at: t.toISOString(), email_sent_at: plusMin(t, 2).toISOString(),
          sales_order_items: items,
        };
        validate(order, 'status', 'sales_orders', spg);
        sales.push(order);
        t = plusMin(t, between(30, 75));
      }

      if (dayIdx % 3 === 0 || d === today) {
        PRODUCTS.forEach((p) => {
          const key = `${spg.store_code}|${p.sku}`;
          if (!expiry.has(key)) expiry.set(key, addDays(today, between(-3, 220)));
          inventory.push({
            id: `INV-${(n += 1)}`, attendance_id: att.id, store_code: spg.store_code, sku: p.sku, product_name: p.product_name,
            qty_stock: between(0, 48), expired_date: expiry.get(key), created_at: plusMin(checkin, 20).toISOString(),
          });
        });
      }
    });
  });

  const clean = manpower.map(({ _leaderIdx, _rel, _perf, ...m }) => m);
  return {
    manpower: clean, stores, products: PRODUCTS, coverages, calendar_workdays: calendar, attendance_logs: attendance,
    store_inventory: inventory, sales_orders: sales, discipline_audit_logs: discipline, leader_validations: validations,
  };
}

let tables = null;
const db = () => (tables ??= generate());

export const mockDb = {
  list(table, range) {
    const rows = db()[table] || [];
    if (!range) return rows.map((r) => ({ ...r }));
    const to = range.to.slice(0, 10);
    return rows
      .filter((r) => {
        const v = String(r[range.field] ?? '').slice(0, 10);
        return v >= range.from && v <= to;
      })
      .map((r) => ({ ...r }));
  },
  insert(table, row) {
    db()[table].push({ ...row });
    return [row];
  },
  update(table, pk, id, patch) {
    const rec = db()[table].find((r) => String(r[pk]) === String(id));
    if (!rec) throw new Error(`Record ${id} tidak ditemukan`);
    Object.assign(rec, patch);
    return [rec];
  },
  remove(table, pk, id) {
    db()[table] = db()[table].filter((r) => String(r[pk]) !== String(id));
    return [];
  },
  pk: PK,
};
