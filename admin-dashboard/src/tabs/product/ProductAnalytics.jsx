import { useMemo, useState } from 'react';
import { Boxes, GitMerge, Layers, Link2, Package, PackageCheck, ShoppingBasket, Sigma, TrendingUp, Wallet } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Badge, Card, EmptyState, Field, KpiCard } from '../../components/common/ui';
import { DataTable, ScopeToggle } from '../../components/common/ScopeToggle';
import { scopeOrders } from '../../lib/customerAnalytics';
import { companions, productAnalytics } from '../../lib/productAnalytics';
import { idr, idrCompact, matches, num, pct } from '../../lib/format';
import { CoMatrix, PALETTE, ParentDonut, RankBar } from './ProductCharts';

const liftTone = (l) => (l >= 1.5 ? 'green' : l >= 1 ? 'blue' : 'slate');

export default function ProductAnalytics() {
  const ctx = useDashboard();
  const { sales, data, filters } = ctx;
  const [scope, setScope] = useState('mtd');
  const [focus, setFocus] = useState('');
  const orders = useMemo(() => scopeOrders(ctx, scope), [sales, scope, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useMemo(() => productAnalytics(orders, data.products), [orders, data.products]);
  const k = a.kpis;
  const focusSku = focus && a.skuStat.has(focus) ? focus : a.byQty[0]?.sku;
  const comp = useMemo(() => (focusSku ? companions(a.pairs, focusSku) : []), [a.pairs, focusSku]);
  const focusStat = a.skuStat.get(focusSku);
  const skuTable = useMemo(() => a.byValue.filter((s) => matches(filters.search, s.sku, s.name, s.parent)), [a.byValue, filters.search]);

  const parentCols = [
    { label: 'Parent SKU', render: (r, i) => <span className="inline-flex items-center gap-2 font-semibold text-slate-100"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />{r.parent}</span> },
    { label: 'SKU', right: true, render: (r) => r.skuCount },
    { label: 'Qty', right: true, render: (r) => num(r.qty) },
    { label: 'Value', right: true, render: (r) => idrCompact(r.value) },
    { label: '% Value', right: true, cls: 'text-emerald-300', render: (r) => pct(r.valueShare) },
    { label: 'Penetrasi Trx', right: true, render: (r) => pct(r.penetration) },
  ];
  const skuCols = [
    { label: '#', render: (r, i) => <span className="font-mono text-slate-500">{i + 1}</span> },
    { label: 'SKU', render: (r) => <div><p className="text-slate-100">{r.name}</p><p className="font-mono text-[11px] text-slate-500">{r.sku}</p></div> },
    { label: 'Parent', render: (r) => <Badge tone="slate">{r.parent}</Badge> },
    { label: 'Value', right: true, cls: 'text-emerald-300', render: (r) => idr(r.value) },
    { label: '% Value', right: true, render: (r) => pct(r.valueShare) },
    { label: 'Qty Sold', right: true, render: (r) => num(r.qty) },
    { label: '% Qty', right: true, render: (r) => pct(r.qtyShare) },
    { label: 'Trx', right: true, render: (r) => num(r.trx) },
    { label: 'Penetrasi', right: true, render: (r) => pct(r.penetration) },
    { label: 'Avg Harga', right: true, render: (r) => idrCompact(r.avgPrice) },
  ];
  const pairCols = [
    { label: '#', render: (r, i) => <span className="font-mono text-slate-500">{i + 1}</span> },
    { label: 'Kombinasi Produk', render: (r) => <div className="min-w-[220px]"><p className="text-slate-100">{r.nameA}</p><p className="text-xs text-blue-300">+ {r.nameB}</p></div> },
    { label: 'Trx Bersamaan', right: true, cls: 'text-emerald-300', render: (r) => num(r.count) },
    { label: 'Support', right: true, render: (r) => pct(r.support, 2) },
    { label: 'Conf A→B', right: true, render: (r) => pct(r.confAB) },
    { label: 'Conf B→A', right: true, render: (r) => pct(r.confBA) },
    { label: 'Lift', right: true, render: (r) => <Badge tone={liftTone(r.lift)}>{r.lift.toFixed(2)}x</Badge> },
  ];

  return (
    <div className="space-y-5" data-testid="product-analytics-view">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <ScopeToggle value={scope} onChange={setScope} testId="product-scope" />
        <p className="text-[11px] text-slate-400">Sumber: item transaksi (status ≠ DELETED) · Parent SKU dari Master Products</p>
      </div>

      {!orders.length ? (
        <div className="card"><EmptyState text="Belum ada transaksi pada periode ini." testId="product-empty" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            <KpiCard label="Total Sales Value" value={idrCompact(k.totalValue)} sub={`${num(k.totalTrx)} transaksi`} icon={Wallet} tone="success" testId="kpi-product-value" />
            <KpiCard label="Total Qty Sold" value={num(k.totalQty)} sub="pcs terjual" icon={Package} testId="kpi-product-qty" delay={30} />
            <KpiCard label="SKU Aktif Terjual" value={num(k.skuActive)} sub={`dari ${num(data.products.length)} SKU master`} icon={PackageCheck} testId="kpi-sku-active" delay={60} />
            <KpiCard label="Parent SKU" value={num(k.parents)} sub="grup produk" icon={Layers} testId="kpi-parent-count" delay={90} />
            <KpiCard label="Trx Multi-SKU" value={pct(k.multiShare)} sub="≥ 2 SKU dalam 1 transaksi" icon={ShoppingBasket} tone="warning" progress={k.multiShare} testId="kpi-multi-sku" delay={120} />
            <KpiCard label="Avg Qty / Trx" value={k.avgQtyPerTrx.toFixed(1)} sub="pcs per transaksi" icon={Sigma} testId="kpi-qty-per-trx" delay={150} />
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            <Card title="Parent SKU Contribution" subtitle="Kontribusi value per grup produk" icon={Layers} className="xl:col-span-2" testId="parent-sku-card">
              <ParentDonut rows={a.parentRows} />
            </Card>
            <Card title="Parent SKU — Detail" icon={Layers} className="xl:col-span-3" bodyClass="p-0" testId="parent-sku-table-card">
              <DataTable columns={parentCols} rows={a.parentRows} testId="parent-sku-table" rowKey={(r) => r.parent} />
            </Card>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="SKU Contribution by Value" subtitle="High → Low · label = % kontribusi value" icon={TrendingUp} testId="sku-value-card">
              <RankBar rows={a.byValue} valueKey="value" shareKey="valueShare" isMoney color="#3182CE" testId="chart-sku-value" />
            </Card>
            <Card title="SKU Sold by Qty" subtitle="High → Low · label = % kontribusi qty" icon={Boxes} testId="sku-qty-card">
              <RankBar rows={a.byQty} valueKey="qty" shareKey="qtyShare" color="#10B981" testId="chart-sku-qty" />
            </Card>
          </div>

          <Card title="SKU Ranking — Detail" subtitle="Urut value tertinggi · Penetrasi = % transaksi yang memuat SKU" icon={Package} bodyClass="p-0" testId="sku-ranking-card">
            <DataTable columns={skuCols} rows={skuTable} testId="sku-ranking-table" rowKey={(r) => r.sku} />
          </Card>

          <div className="grid gap-5 2xl:grid-cols-5">
            <Card title="Persilangan SKU — Sering Dibeli Bersamaan" subtitle="Market basket: Support = % trx berisi pasangan · Confidence = peluang B dibeli jika A dibeli · Lift > 1 = asosiasi kuat" icon={GitMerge} className="2xl:col-span-3" bodyClass="p-0" testId="cross-sell-card">
              <DataTable columns={pairCols} rows={a.pairs.slice(0, 20)} testId="cross-sell-table" rowKey={(r) => `${r.a}|${r.b}`} maxHeight="max-h-[640px]" />
              {!a.pairs.length && <EmptyState text="Belum ada transaksi multi-SKU." testId="cross-sell-empty" />}
            </Card>
            <Card title="Produk Pendamping" subtitle="Pilih SKU → produk yang paling sering ikut terbeli" icon={Link2} className="2xl:col-span-2" testId="companion-card">
              <Field label="SKU Utama">
                <select className="input" value={focusSku ?? ''} onChange={(e) => setFocus(e.target.value)} data-testid="companion-sku-select">
                  {a.byQty.map((s) => <option key={s.sku} value={s.sku}>{s.name}</option>)}
                </select>
              </Field>
              {focusStat && <p className="mt-2 text-xs text-slate-400">Dibeli di <b className="text-slate-200">{num(focusStat.trx)}</b> transaksi · penetrasi {pct(focusStat.penetration)}</p>}
              <ul className="mt-3 space-y-2" data-testid="companion-list">
                {comp.slice(0, 8).map((c) => (
                  <li key={c.sku} className="rounded-lg border border-slate-700/60 bg-[#111a35] px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-slate-100">{c.name}</span>
                      <Badge tone={liftTone(c.lift)}>Lift {c.lift.toFixed(2)}x</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(c.confidence, 100)}%` }} /></div>
                      <span className="w-28 text-right font-mono text-[11px] text-slate-400">{pct(c.confidence)} · {num(c.count)} trx</span>
                    </div>
                  </li>
                ))}
                {!comp.length && <EmptyState text="SKU ini belum pernah dibeli bersama SKU lain." />}
              </ul>
            </Card>
          </div>

          <Card title="Matriks Persilangan SKU" subtitle="Jumlah transaksi di mana 2 SKU terjual bersamaan (urut qty tertinggi)" icon={GitMerge} testId="co-matrix-card">
            <CoMatrix matrix={a.matrix} />
          </Card>
        </>
      )}
    </div>
  );
}
