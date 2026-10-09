import { addDays, eachDay, monthBounds, parseDate, toISODate } from './dates';
import { PK } from './schema';
import config from './config';

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
  { sku: 'SKU-001', parent_sku: 'SUSU UHT', product_name: 'Susu UHT Full Cream 1L', category: 'Dairy', price: 19500 },
  { sku: 'SKU-002', parent_sku: 'SUSU UHT', product_name: 'Susu UHT Cokelat 200ml', category: 'Dairy', price: 6500 },
  { sku: 'SKU-003', parent_sku: 'YOGURT DRINK', product_name: 'Yogurt Drink Strawberry 250ml', category: 'Dairy', price: 9800 },
  { sku: 'SKU-004', parent_sku: 'KEJU', product_name: 'Keju Cheddar Slice 170g', category: 'Dairy', price: 27500 },
  { sku: 'SKU-005', parent_sku: 'SUSU KENTAL MANIS', product_name: 'Susu Kental Manis 370g', category: 'Dairy', price: 12900 },
  { sku: 'SKU-006', parent_sku: 'COOKIES', product_name: 'Butter Cookies Tin 454g', category: 'Snack', price: 64000 },
  { sku: 'SKU-007', parent_sku: 'SEREAL', product_name: 'Sereal Gandum Madu 330g', category: 'Breakfast', price: 41500 },
  { sku: 'SKU-008', parent_sku: 'KOPI RTD', product_name: 'Kopi Susu RTD 220ml', category: 'Beverage', price: 8500 },
  { sku: 'SKU-009', parent_sku: 'SUSU UHT', product_name: 'Susu UHT Stroberi 200ml', category: 'Dairy', price: 6500 },
  { sku: 'SKU-010', parent_sku: 'YOGURT DRINK', product_name: 'Yogurt Drink Plain 250ml', category: 'Dairy', price: 9800 },
  { sku: 'SKU-011', parent_sku: 'KEJU', product_name: 'Keju Mozzarella 200g', category: 'Dairy', price: 38500 },
  { sku: 'SKU-012', parent_sku: 'KOPI RTD', product_name: 'Kopi Gula Aren RTD 220ml', category: 'Beverage', price: 9500 },
];
// popularity weight + products that are often bought together (demo market-basket behaviour)
const POPULARITY = { 'SKU-001': 9, 'SKU-002': 8, 'SKU-003': 5, 'SKU-004': 4, 'SKU-005': 6, 'SKU-006': 2, 'SKU-007': 4, 'SKU-008': 7, 'SKU-009': 5, 'SKU-010': 3, 'SKU-011': 2, 'SKU-012': 4 };
const AFFINITY = {
  'SKU-001': ['SKU-007', 'SKU-004'], 'SKU-007': ['SKU-001'], 'SKU-002': ['SKU-009', 'SKU-003'], 'SKU-009': ['SKU-002'],
  'SKU-003': ['SKU-010', 'SKU-002'], 'SKU-010': ['SKU-003'], 'SKU-004': ['SKU-011', 'SKU-001'], 'SKU-011': ['SKU-004'],
  'SKU-005': ['SKU-006', 'SKU-008'], 'SKU-006': ['SKU-005'], 'SKU-008': ['SKU-012', 'SKU-005'], 'SKU-012': ['SKU-008'],
};
const BASKET_SIZE = [[1, 0.44], [2, 0.3], [3, 0.15], [4, 0.08], [5, 0.03]];
const FIRST = ['Ratna', 'Hadi', 'Sinta', 'Yoga', 'Lina', 'Wati', 'Rizal', 'Tuti', 'Mira', 'Doni', 'Sri', 'Agus', 'Yanti', 'Eko', 'Lilis', 'Dodi', 'Ani', 'Wahyu', 'Endang', 'Rudi', 'Sari', 'Asep', 'Nining', 'Bayu'];
const LAST = ['Susanti', 'Wijaya', 'Rahayu', 'Saputra', 'Lestari', 'Hidayat', 'Kusuma', 'Pratama', 'Handoko', 'Purnama', 'Nugraha', 'Maharani'];
const PRODUCT_BY_SKU = new Map(PRODUCTS.map((p) => [p.sku, p]));
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
};
function pickBasket() {
  const k = weighted(BASKET_SIZE);
  const chosen = [weighted(Object.entries(POPULARITY))];
  while (chosen.length < k) {
    const partners = (AFFINITY[chosen[chosen.length - 1]] || []).filter((x) => !chosen.includes(x));
    const next = partners.length && rng() < 0.6 ? pick(partners) : weighted(Object.entries(POPULARITY).filter(([x]) => !chosen.includes(x)));
    chosen.push(next);
  }
  return chosen.map((sku) => PRODUCT_BY_SKU.get(sku));
}
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
  // per-store customer pool: ~20% loyal (sering kembali), sisanya pembeli sesekali
  const customerPool = new Map(stores.map((st) => [st.store_code, Array.from({ length: 100 }, (_, ci) => ({
    name: `${rng() < 0.5 ? 'Ibu' : 'Bapak'} ${pick(FIRST)} ${pick(LAST)}`, phone: `08${between(1100000000, 9899999999)}`, w: ci < 25 ? 8 : 1,
  }))]));
  const pickCustomer = (storeCode) => {
    if (rng() < 0.12) return { name: pick(BUYERS), phone: '0' }; // pembeli tanpa no. HP → identitas pakai ID TRX
    return weighted(customerPool.get(storeCode).map((c) => [c, c.w]));
  };
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
        const chosen = pickBasket();
        const k = chosen.length;
        const trxId = `TRX-${d.replaceAll('-', '')}-${spg.spg_code.slice(4)}-${j + 1}`;
        const items = chosen.map((p, x) => {
          const qty = Math.max(1, Math.round((dailyTarget / trxCount / Math.max(k, 2) / p.price) * (0.6 + rng() * 0.8)));
          return { id: `${trxId}-${x + 1}`, trx_id: trxId, sku: p.sku, product_name: p.product_name, qty, price: p.price, subtotal: qty * p.price };
        });
        const buyer = pickCustomer(spg.store_code);
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
let simN = 900000;

// Simulated realtime feed: new check-in or new transaction at "now"
function simulate() {
  const t = db();
  const now = new Date();
  const today = toISODate(now);
  const iso = now.toISOString();
  const active = t.manpower.filter((m) => m.status === 'ACTIVE');
  const present = new Set(t.attendance_logs.filter((a) => a.work_date === today).map((a) => a.spg_code));
  const absent = active.filter((m) => !present.has(m.spg_code));
  simN += 1;
  if (absent.length && (!present.size || rng() < 0.35)) {
    const spg = pick(absent);
    const rec = {
      id: `ATT-L${simN}`, spg_code: spg.spg_code, store_code: spg.store_code, work_date: today, checkin_time: iso,
      checkout_time: null, work_duration_minutes: null, photo_checkin_url: PHOTOS.checkin[simN % 2],
      photo_display_a_url: PHOTOS.a, photo_display_b_url: PHOTOS.b, photo_display_c_url: PHOTOS.c,
      validation_status: 'PENDING', email_sent_at: iso, validated_at: null, created_at: iso,
    };
    t.attendance_logs.push(rec);
    return { table: 'attendance_logs', type: 'INSERT', record: rec };
  }
  const code = pick([...present]);
  const spg = active.find((m) => m.spg_code === code);
  if (!spg) return null;
  const p = pick(PRODUCTS);
  const qty = between(1, 6);
  const trxId = `TRX-${today.replaceAll('-', '')}-${spg.spg_code.slice(4)}-L${simN}`;
  const rec = {
    id: `SO-L${simN}`, trx_id: trxId, spg_code: spg.spg_code, store_code: spg.store_code, trx_date: today,
    buyer_name: pick(BUYERS), buyer_phone: `08${between(1100000000, 9899999999)}`, total_omzet: qty * p.price,
    receipt_photo_url: PHOTOS.nota, status: 'PENDING', validated_at: null, created_at: iso, email_sent_at: iso,
    sales_order_items: [{ id: `${trxId}-1`, trx_id: trxId, sku: p.sku, product_name: p.product_name, qty, price: p.price, subtotal: qty * p.price }],
  };
  t.sales_orders.push(rec);
  return { table: 'sales_orders', type: 'INSERT', record: rec };
}

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
  subscribe(onEvent, onStatus) {
    onStatus('SUBSCRIBED');
    const id = setInterval(() => {
      const e = simulate();
      if (e) onEvent(e);
    }, config.mockRealtimeSeconds * 1000);
    return () => clearInterval(id);
  },
  pk: PK,
};
