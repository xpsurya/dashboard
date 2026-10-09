import { ratio } from './format';

export function productAnalytics(orders, products) {
  const pMap = new Map(products.map((p) => [p.sku, p]));
  const parentOf = (sku) => {
    const p = pMap.get(sku);
    return p?.parent_sku || p?.category || 'LAINNYA';
  };
  const sku = new Map();
  const parent = new Map();
  const pair = new Map();
  let totalValue = 0;
  let totalQty = 0;
  const totalTrx = orders.length;

  orders.forEach((o) => {
    const items = o.sales_order_items || [];
    const inTrx = new Set();
    const parentsInTrx = new Set();
    items.forEach((i) => {
      const code = i.sku || i.product_name;
      const value = Number(i.subtotal) || 0;
      const qty = Number(i.qty) || 0;
      const par = parentOf(i.sku);
      totalValue += value;
      totalQty += qty;
      const s = sku.get(code) || { sku: code, name: i.product_name || pMap.get(code)?.product_name || code, parent: par, value: 0, qty: 0, trx: 0 };
      s.value += value;
      s.qty += qty;
      if (!inTrx.has(code)) { s.trx += 1; inTrx.add(code); }
      sku.set(code, s);
      const p = parent.get(par) || { parent: par, value: 0, qty: 0, trx: 0, skus: new Set() };
      p.value += value;
      p.qty += qty;
      p.skus.add(code);
      if (!parentsInTrx.has(par)) { p.trx += 1; parentsInTrx.add(par); }
      parent.set(par, p);
    });
    const list = [...inTrx].sort();
    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        const k = `${list[a]}|${list[b]}`;
        pair.set(k, (pair.get(k) || 0) + 1);
      }
    }
  });

  const skuRows = [...sku.values()].map((s) => ({
    ...s, valueShare: ratio(s.value, totalValue), qtyShare: ratio(s.qty, totalQty), penetration: ratio(s.trx, totalTrx), avgPrice: s.qty ? s.value / s.qty : 0,
  }));
  const byValue = [...skuRows].sort((a, b) => b.value - a.value);
  const byQty = [...skuRows].sort((a, b) => b.qty - a.qty);
  const parentRows = [...parent.values()].map((p) => ({ ...p, skuCount: p.skus.size, valueShare: ratio(p.value, totalValue), qtyShare: ratio(p.qty, totalQty), penetration: ratio(p.trx, totalTrx) }))
    .sort((a, b) => b.value - a.value);

  const skuStat = new Map(skuRows.map((s) => [s.sku, s]));
  const pairs = [...pair].map(([k, count]) => {
    const [a, b] = k.split('|');
    const A = skuStat.get(a);
    const B = skuStat.get(b);
    const support = ratio(count, totalTrx);
    return {
      a, b, nameA: A?.name ?? a, nameB: B?.name ?? b, count, support,
      confAB: ratio(count, A?.trx), confBA: ratio(count, B?.trx),
      lift: A?.trx && B?.trx ? (count * totalTrx) / (A.trx * B.trx) : 0,
    };
  }).sort((x, y) => y.count - x.count);

  const multiTrx = orders.filter((o) => new Set((o.sales_order_items || []).map((i) => i.sku || i.product_name)).size >= 2).length;
  const matrixSkus = byQty.map((s) => s.sku);
  const matrix = [];
  matrixSkus.forEach((a, xi) => matrixSkus.forEach((b, yi) => {
    if (a === b) return;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    matrix.push([xi, yi, pair.get(k) || 0]);
  }));

  return {
    byValue, byQty, parentRows, pairs, skuStat,
    matrix: { data: matrix, labels: matrixSkus.map((s) => skuStat.get(s)?.name ?? s), max: Math.max(1, ...matrix.map((m) => m[2])) },
    kpis: { totalValue, totalQty, totalTrx, skuActive: skuRows.length, parents: parentRows.length, multiShare: ratio(multiTrx, totalTrx), avgQtyPerTrx: totalTrx ? totalQty / totalTrx : 0 },
  };
}

export function companions(pairs, code) {
  return pairs
    .filter((p) => p.a === code || p.b === code)
    .map((p) => (p.a === code
      ? { sku: p.b, name: p.nameB, count: p.count, confidence: p.confAB, lift: p.lift }
      : { sku: p.a, name: p.nameA, count: p.count, confidence: p.confBA, lift: p.lift }))
    .sort((x, y) => y.count - x.count);
}
