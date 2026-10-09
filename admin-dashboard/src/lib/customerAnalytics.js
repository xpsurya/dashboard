import { ratio } from './format';

// Identitas customer: No. HP (dinormalisasi) sebagai acuan; jika kosong / "0" → pakai ID TRX (dianggap customer unik)
export function normalizePhone(raw) {
  let p = String(raw ?? '').replace(/\D/g, '');
  if (p.startsWith('62')) p = `0${p.slice(2)}`;
  return p && Number(p) !== 0 ? p : null;
}

export function customerKey(o) {
  const p = normalizePhone(o.buyer_phone);
  return p ? `P:${p}` : `T:${o.trx_id ?? o.id}`;
}

export const maskPhone = (p) => (p ? `${p.slice(0, 4)}****${p.slice(-3)}` : '—');

export function scopeOrders(ctx, scope) {
  const { sales, inMtd, inPeriod } = ctx;
  return sales.filter((o) => (scope === 'mtd' ? inMtd(o.trx_date) : inPeriod(o.trx_date)));
}

export const VALUE_BUCKETS = [
  { label: '< Rp 100 Rb', max: 100000 },
  { label: 'Rp 100–250 Rb', max: 250000 },
  { label: 'Rp 250–500 Rb', max: 500000 },
  { label: 'Rp 500 Rb–1 Jt', max: 1000000 },
  { label: 'Rp 1–2 Jt', max: 2000000 },
  { label: '> Rp 2 Jt', max: Infinity },
];
export const FREQ_BUCKETS = [
  { label: '1x', min: 1, max: 1 },
  { label: '2x', min: 2, max: 2 },
  { label: '3x', min: 3, max: 3 },
  { label: '4–5x', min: 4, max: 5 },
  { label: '6–9x', min: 6, max: 9 },
  { label: '10x+', min: 10, max: Infinity },
];
export const BASKET_BUCKETS = ['1 SKU', '2 SKU', '3 SKU', '4 SKU', '5+ SKU'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const skuCount = (o) => new Set((o.sales_order_items || []).map((i) => i.sku || i.product_name)).size;
const qtyOf = (o) => (o.sales_order_items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);

export function customerAnalytics(orders, { spgMap, storeMap }) {
  const map = new Map();
  orders.forEach((o) => {
    const key = customerKey(o);
    let c = map.get(key);
    if (!c) {
      c = { key, phone: key.startsWith('P:') ? key.slice(2) : null, name: o.buyer_name || 'Tanpa Nama', orders: [], value: 0, qty: 0, skus: new Set(), first: o.trx_date, last: o.trx_date, stores: new Map() };
      map.set(key, c);
    }
    c.orders.push(o);
    c.value += Number(o.total_omzet) || 0;
    c.qty += qtyOf(o);
    (o.sales_order_items || []).forEach((i) => c.skus.add(i.sku || i.product_name));
    if (o.trx_date < c.first) c.first = o.trx_date;
    if (o.trx_date > c.last) c.last = o.trx_date;
    c.stores.set(o.store_code, (c.stores.get(o.store_code) || 0) + 1);
  });
  const customers = [...map.values()].map((c) => {
    const freq = c.orders.length;
    const store = [...c.stores].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { ...c, freq, type: freq >= 2 ? 'LOYAL' : 'NEW', aov: c.value / freq, store, storeName: storeMap.get(store)?.store_name ?? store };
  });

  const totalValue = customers.reduce((s, c) => s + c.value, 0);
  const totalTrx = orders.length;
  const identified = customers.filter((c) => c.phone).length;

  // --- NEW vs LOYAL
  const group = (type) => {
    const cs = customers.filter((c) => c.type === type);
    const os = cs.flatMap((c) => c.orders);
    const value = cs.reduce((s, c) => s + c.value, 0);
    const sku = new Map();
    os.forEach((o) => (o.sales_order_items || []).forEach((i) => sku.set(i.product_name, (sku.get(i.product_name) || 0) + Number(i.subtotal || 0))));
    const top = [...sku].sort((a, b) => b[1] - a[1])[0];
    return {
      type, customers: cs.length, customerShare: ratio(cs.length, customers.length), trx: os.length, trxShare: ratio(os.length, totalTrx),
      value, valueShare: ratio(value, totalValue), aov: os.length ? value / os.length : 0, spend: cs.length ? value / cs.length : 0,
      freq: cs.length ? os.length / cs.length : 0, qtyPerTrx: os.length ? os.reduce((s, o) => s + qtyOf(o), 0) / os.length : 0,
      skuPerTrx: os.length ? os.reduce((s, o) => s + skuCount(o), 0) / os.length : 0, topSku: top?.[0] ?? '—',
    };
  };
  const nvl = { NEW: group('NEW'), LOYAL: group('LOYAL') };

  // daily omzet & customer per type
  const custType = new Map(customers.map((c) => [c.key, c.type]));
  const dailyMap = new Map();
  orders.forEach((o) => {
    const d = dailyMap.get(o.trx_date) || { date: o.trx_date, NEW: 0, LOYAL: 0 };
    d[custType.get(customerKey(o))] += Number(o.total_omzet) || 0;
    dailyMap.set(o.trx_date, d);
  });
  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // --- by value
  const byValue = VALUE_BUCKETS.map((b, i) => {
    const min = i ? VALUE_BUCKETS[i - 1].max : 0;
    const cs = customers.filter((c) => c.value >= min && c.value < b.max);
    const value = cs.reduce((s, c) => s + c.value, 0);
    return { label: b.label, customers: cs.length, customerShare: ratio(cs.length, customers.length), value, valueShare: ratio(value, totalValue), loyal: cs.filter((c) => c.type === 'LOYAL').length };
  });

  // --- by frequency
  const byFreq = FREQ_BUCKETS.map((b) => {
    const cs = customers.filter((c) => c.freq >= b.min && c.freq <= b.max);
    const value = cs.reduce((s, c) => s + c.value, 0);
    return { label: b.label, customers: cs.length, customerShare: ratio(cs.length, customers.length), value, valueShare: ratio(value, totalValue), spend: cs.length ? value / cs.length : 0, trx: cs.reduce((s, c) => s + c.freq, 0) };
  });

  // --- by basket size (jumlah SKU per transaksi)
  const byBasket = BASKET_BUCKETS.map((label, i) => {
    const os = orders.filter((o) => Math.min(Math.max(skuCount(o), 1), 5) === i + 1);
    const value = os.reduce((s, o) => s + (Number(o.total_omzet) || 0), 0);
    return { label, trx: os.length, trxShare: ratio(os.length, totalTrx), value, valueShare: ratio(value, totalValue), aov: os.length ? value / os.length : 0, qty: os.length ? os.reduce((s, o) => s + qtyOf(o), 0) / os.length : 0 };
  });

  // --- Pareto (konsentrasi omzet)
  const sorted = [...customers].sort((a, b) => b.value - a.value);
  let cum = 0;
  let top80 = 0;
  const step = Math.max(1, Math.floor(sorted.length / 100));
  const pareto = [{ x: 0, y: 0 }];
  sorted.forEach((c, i) => {
    cum += c.value;
    if (!top80 && totalValue && cum / totalValue >= 0.8) top80 = i + 1;
    if ((i + 1) % step === 0 || i === sorted.length - 1) pareto.push({ x: +ratio(i + 1, sorted.length).toFixed(1), y: +ratio(cum, totalValue).toFixed(1) });
  });
  const top20Count = Math.max(1, Math.ceil(sorted.length * 0.2));
  const top20Value = sorted.slice(0, top20Count).reduce((s, c) => s + c.value, 0);

  // --- repeat rate per store / SPG
  const storeAgg = new Map();
  customers.forEach((c) => {
    const g = storeAgg.get(c.store) || { store: c.store, customers: 0, loyal: 0, value: 0, loyalValue: 0 };
    g.customers += 1;
    g.value += c.value;
    if (c.type === 'LOYAL') { g.loyal += 1; g.loyalValue += c.value; }
    storeAgg.set(c.store, g);
  });
  const spgOfStore = new Map();
  spgMap.forEach((s) => { if (s.status === 'ACTIVE' && !spgOfStore.has(s.store_code)) spgOfStore.set(s.store_code, s.name); });
  const byStore = [...storeAgg.values()].map((g) => ({
    ...g, storeName: storeMap.get(g.store)?.store_name ?? g.store, spgName: spgOfStore.get(g.store) ?? '—', repeatRate: ratio(g.loyal, g.customers), loyalValueShare: ratio(g.loyalValue, g.value),
  })).sort((a, b) => b.repeatRate - a.repeatRate);

  // --- jam × hari belanja
  const heat = new Map();
  orders.forEach((o) => {
    const t = new Date(o.created_at || `${o.trx_date}T12:00:00`);
    const k = `${t.getDay()}|${t.getHours()}`;
    heat.set(k, (heat.get(k) || 0) + 1);
  });
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const heatmap = [];
  dayOrder.forEach((d, yi) => hours.forEach((h, xi) => heatmap.push([xi, yi, heat.get(`${d}|${h}`) || 0])));

  return {
    customers, sorted, nvl, daily, byValue, byFreq, byBasket, pareto, byStore,
    heat: { data: heatmap, hours: hours.map((h) => `${String(h).padStart(2, '0')}:00`), days: dayOrder.map((d) => DAYS[d]), max: Math.max(1, ...heatmap.map((x) => x[2])) },
    kpis: {
      customers: customers.length, identified, identifiedShare: ratio(identified, customers.length), totalValue, totalTrx,
      repeatRate: ratio(nvl.LOYAL.customers, customers.length), aov: totalTrx ? totalValue / totalTrx : 0, spend: customers.length ? totalValue / customers.length : 0,
      avgFreq: customers.length ? totalTrx / customers.length : 0, top80Share: ratio(top80, customers.length), top20ValueShare: ratio(top20Value, totalValue),
    },
  };
}
