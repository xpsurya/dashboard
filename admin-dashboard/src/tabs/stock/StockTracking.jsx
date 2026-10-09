import { useMemo, useState } from 'react';
import { Boxes, ListChecks, ShieldAlert, ShieldCheck, Store, TriangleAlert } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Badge, Card, EmptyState, KpiCard } from '../../components/common/ui';
import { edLevel } from '../../lib/metrics';
import { daysUntil } from '../../lib/dates';
import { fmtDate, matches, num } from '../../lib/format';
import config from '../../lib/config';
import { ED_TONE, InventoryMatrix, daysLabel } from './InventoryMatrix';

const ACTION = { critical: 'Retur / Tarik Segera', warning: 'Clearance / Promo', safe: 'Aman' };

export default function StockTracking() {
  const { data, filters, storeMap, geoOk } = useDashboard();
  const [nearOnly, setNearOnly] = useState(false);

  const items = useMemo(() => {
    const end = `${filters.dateTo}T23:59:59`;
    const latest = new Map();
    data.inventory.forEach((r) => {
      if (String(r.created_at) > end) return;
      const k = `${r.store_code}|${r.sku}`;
      const prev = latest.get(k);
      if (!prev || String(r.created_at) > String(prev.created_at)) latest.set(k, r);
    });
    return [...latest.values()]
      .map((r) => {
        const days = daysUntil(String(r.expired_date).slice(0, 10));
        return { ...r, days, level: edLevel(days), store: storeMap.get(r.store_code) };
      })
      .filter((r) => geoOk(r.store) && matches(filters.search, r.store_code, r.store?.store_name, r.sku, r.product_name));
  }, [data.inventory, filters, storeMap, geoOk]);

  const visible = useMemo(() => items.filter((i) => !nearOnly || i.level !== 'safe'), [items, nearOnly]);
  const cells = useMemo(() => new Map(visible.map((i) => [`${i.store_code}|${i.sku}`, i])), [visible]);
  const stores = useMemo(() => {
    const codes = new Set(visible.map((i) => i.store_code));
    return [...codes].map((c) => storeMap.get(c) ?? { store_code: c, store_name: c }).sort((a, b) => a.store_name.localeCompare(b.store_name));
  }, [visible, storeMap]);
  const products = useMemo(() => {
    const used = new Set(items.map((i) => i.sku));
    const list = data.products.filter((p) => used.has(p.sku));
    items.forEach((i) => { if (!list.some((p) => p.sku === i.sku)) list.push({ sku: i.sku, product_name: i.product_name }); });
    return list.sort((a, b) => a.sku.localeCompare(b.sku));
  }, [items, data.products]);
  const actionList = useMemo(() => [...visible].sort((a, b) => a.days - b.days), [visible]);
  const count = (lvl) => items.filter((i) => i.level === lvl).length;
  const { criticalDays, warningDays } = config.nearEd;

  return (
    <div className="space-y-5" data-testid="stock-tracking-view">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Store Dipantau" value={num(new Set(items.map((i) => i.store_code)).size)} sub={`${num(items.length)} titik stok store × SKU`} icon={Store} testId="kpi-stores-tracked" />
        <KpiCard label={`Critical (≤ ${criticalDays} hari)`} value={num(count('critical'))} sub="Butuh retur / tarik segera" icon={ShieldAlert} tone="danger" testId="kpi-ed-critical" delay={40} />
        <KpiCard label={`Warning (${criticalDays + 1}–${warningDays} hari)`} value={num(count('warning'))} sub="Rencanakan clearance" icon={TriangleAlert} tone="warning" testId="kpi-ed-warning" delay={80} />
        <KpiCard label={`Safe (> ${warningDays} hari)`} value={num(count('safe'))} sub={`Total qty: ${num(items.reduce((s, i) => s + Number(i.qty_stock || 0), 0))} pcs`} icon={ShieldCheck} tone="success" testId="kpi-ed-safe" delay={120} />
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Boxes className="h-4 w-4 text-blue-300" /> Near-ED Early Warning:
          <Badge tone="red">RED ≤ {criticalDays} hari</Badge>
          <Badge tone="yellow">YELLOW {criticalDays + 1}–{warningDays} hari</Badge>
          <Badge tone="green">GREEN &gt; {warningDays} hari</Badge>
        </div>
        <button className={nearOnly ? 'btn-danger' : 'btn-ghost'} onClick={() => setNearOnly((v) => !v)} aria-pressed={nearOnly} data-testid="near-ed-only-toggle">
          <TriangleAlert className="h-4 w-4" /> {nearOnly ? 'Menampilkan Stok Near-ED' : 'Tampilkan Hanya Stok Near-ED'}
        </button>
      </div>

      <InventoryMatrix stores={stores} products={products} cells={cells} />

      <Card title="Near-ED Action List" subtitle={`${actionList.length} item · diurutkan dari expired date terdekat`} icon={ListChecks} bodyClass="p-0" testId="near-ed-action-list">
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead><tr>{['Store', 'SKU', 'Produk', 'Qty', 'Expired Date', 'Sisa Hari', 'Status', 'Rekomendasi'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {actionList.slice(0, 200).map((i, idx) => (
                <tr key={i.id} className={idx % 2 ? 'row-odd' : 'row-even'} data-testid={`near-ed-row-${idx}`}>
                  <td className="td text-slate-100">{i.store?.store_name ?? i.store_code}</td>
                  <td className="td font-mono text-blue-200">{i.sku}</td>
                  <td className="td text-slate-300">{i.product_name}</td>
                  <td className="td text-right font-mono">{num(i.qty_stock)}</td>
                  <td className="td font-mono text-slate-300">{fmtDate(String(i.expired_date).slice(0, 10))}</td>
                  <td className="td font-mono">{daysLabel(i.days)}</td>
                  <td className="td"><Badge tone={ED_TONE[i.level].badge} testId={`ed-badge-${idx}`}>{ED_TONE[i.level].label}</Badge></td>
                  <td className="td text-xs text-slate-400">{ACTION[i.level]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!actionList.length && <EmptyState text="Tidak ada stok yang perlu ditindaklanjuti." testId="near-ed-empty" />}
        </div>
      </Card>
    </div>
  );
}
