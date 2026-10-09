import { useMemo, useState } from 'react';
import { BarChart3, Clock, Crown, Gem, Lightbulb, PhoneCall, Repeat, ShoppingBasket, Store, Target, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Badge, Card, EmptyState, KpiCard } from '../../components/common/ui';
import { DataTable, ScopeToggle } from '../../components/common/ScopeToggle';
import { SEGMENT_BY_ID, customerAnalytics, maskPhone, scopeOrders } from '../../lib/customerAnalytics';
import { fmtDate, idr, idrCompact, matches, num, pct } from '../../lib/format';
import { BucketChart, HourHeatmap, NvlDailyChart, NvlShareChart, ParetoChart, TYPE_COLOR } from './CustomerCharts';

const TypeBadge = ({ type }) => <Badge tone={type === 'LOYAL' ? 'yellow' : 'blue'}>{type === 'LOYAL' ? 'Loyal' : 'New'}</Badge>;

const SegBadge = ({ id }) => {
  const s = SEGMENT_BY_ID[id];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-slate-100" data-testid={`segment-badge-${id}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
    </span>
  );
};

function NvlTable({ nvl }) {
  const N = nvl.NEW;
  const L = nvl.LOYAL;
  const rows = [
    ['Jumlah Customer', num(N.customers), num(L.customers)],
    ['% dari Total Customer', pct(N.customerShare), pct(L.customerShare)],
    ['Jumlah Transaksi', num(N.trx), num(L.trx)],
    ['Total Omzet', idrCompact(N.value), idrCompact(L.value)],
    ['% Kontribusi Omzet', pct(N.valueShare), pct(L.valueShare)],
    ['Avg Order Value (AOV)', idr(N.aov), idr(L.aov)],
    ['Avg Spend / Customer', idr(N.spend), idr(L.spend)],
    ['Avg Frekuensi Belanja', `${N.freq.toFixed(2)}x`, `${L.freq.toFixed(2)}x`],
    ['Avg Qty / Transaksi', N.qtyPerTrx.toFixed(1), L.qtyPerTrx.toFixed(1)],
    ['Avg SKU / Transaksi', N.skuPerTrx.toFixed(2), L.skuPerTrx.toFixed(2)],
    ['SKU Favorit (by value)', N.topSku, L.topSku],
  ];
  const ix = L.spend && N.spend ? L.spend / N.spend : 0;
  return (
    <div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0" data-testid="nvl-compare-table">
        <thead>
          <tr>
            <th className="th">Metrik</th>
            <th className="th text-right"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR.NEW }} />NEW</span></th>
            <th className="th text-right"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR.LOYAL }} />LOYAL</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([m, n, l], i) => (
            <tr key={m} className={i % 2 ? 'row-odd' : 'row-even'}>
              <td className="td text-slate-300">{m}</td>
              <td className="td text-right font-mono text-sky-200">{n}</td>
              <td className="td text-right font-mono text-amber-200">{l}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {ix > 0 && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100" data-testid="nvl-spend-index">
          1 Loyal customer bernilai <b>{ix.toFixed(1)}x</b> lipat dibanding 1 New customer (avg spend).
        </p>
      )}
    </div>
  );
}

function insights(a) {
  const { kpis: k, nvl, byBasket, byStore, heat, bySegment, winBack } = a;
  const out = [];
  const riskSeg = bySegment.filter((s) => s.id === 'AT_RISK' || s.id === 'HIBERNATING');
  const riskCount = riskSeg.reduce((s, x) => s + x.customers, 0);
  const riskValue = riskSeg.reduce((s, x) => s + x.value, 0);
  if (riskCount) out.push(`${num(riskCount)} customer senilai ${idrCompact(riskValue)} berstatus At Risk / Hibernating — mulai win-back dari ${winBack[0] ? `${winBack[0].name} (${idrCompact(winBack[0].value)})` : 'nilai terbesar'}.`);
  out.push(`Loyal customer hanya ${pct(nvl.LOYAL.customerShare)} dari total customer, namun menyumbang ${pct(nvl.LOYAL.valueShare)} omzet.`);
  out.push(`${pct(k.top20ValueShare)} omzet berasal dari 20% customer teratas; ${pct(k.top80Share)} customer sudah menghasilkan 80% omzet.`);
  const single = byBasket[0];
  if (single) out.push(`${pct(single.trxShare)} transaksi hanya berisi 1 SKU — peluang cross-selling / bundling untuk menaikkan AOV (saat ini ${idr(k.aov)}).`);
  const best = byStore[0];
  if (best) out.push(`Repeat rate tertinggi: ${best.storeName} (${best.spgName}) ${pct(best.repeatRate)} — jadikan benchmark retensi SPG lain.`);
  const peak = heat.data.reduce((m, x) => (x[2] > m[2] ? x : m), [0, 0, 0]);
  if (peak[2]) out.push(`Jam belanja tersibuk: ${heat.days[peak[1]]} pukul ${heat.hours[peak[0]]} — prioritaskan kehadiran SPG di jam ini.`);
  if (k.identifiedShare < 95) out.push(`${pct(100 - k.identifiedShare)} customer tanpa No. HP (pakai ID TRX) — dorong SPG mengisi No. HP agar data loyalitas akurat.`);
  return out;
}

export default function CustomerAnalytics() {
  const ctx = useDashboard();
  const { sales, filters, spgMap, storeMap, month } = ctx;
  const [scope, setScope] = useState('mtd');
  const [q, setQ] = useState('');
  const orders = useMemo(() => scopeOrders(ctx, scope), [sales, scope, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const bounds = scope === 'mtd' ? { scopeStart: month.start, scopeEnd: filters.dateTo } : { scopeStart: filters.dateFrom, scopeEnd: filters.dateTo };
  const a = useMemo(() => customerAnalytics(orders, { spgMap, storeMap, ...bounds }), [orders, spgMap, storeMap, bounds.scopeStart, bounds.scopeEnd]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = a.kpis;
  const top = useMemo(() => a.sorted.filter((c) => matches(q || filters.search, c.name, c.phone, c.storeName)).slice(0, 20), [a.sorted, q, filters.search]);

  const valueCols = [
    { label: 'Segmen Value', key: 'label', cls: 'font-semibold text-slate-100' },
    { label: 'Customer', right: true, render: (r) => num(r.customers) },
    { label: '% Cust', right: true, render: (r) => pct(r.customerShare) },
    { label: 'Loyal', right: true, render: (r) => num(r.loyal) },
    { label: 'Omzet', right: true, render: (r) => idrCompact(r.value) },
    { label: '% Omzet', right: true, cls: 'text-emerald-300', render: (r) => pct(r.valueShare) },
  ];
  const freqCols = [
    { label: 'Frekuensi', key: 'label', cls: 'font-semibold text-slate-100' },
    { label: 'Customer', right: true, render: (r) => num(r.customers) },
    { label: '% Cust', right: true, render: (r) => pct(r.customerShare) },
    { label: 'Transaksi', right: true, render: (r) => num(r.trx) },
    { label: 'Avg Spend', right: true, render: (r) => idrCompact(r.spend) },
    { label: '% Omzet', right: true, cls: 'text-emerald-300', render: (r) => pct(r.valueShare) },
  ];
  const basketCols = [
    { label: 'Isi Transaksi', key: 'label', cls: 'font-semibold text-slate-100' },
    { label: 'Transaksi', right: true, render: (r) => num(r.trx) },
    { label: '% Trx', right: true, render: (r) => pct(r.trxShare) },
    { label: 'AOV', right: true, render: (r) => idr(r.aov) },
    { label: 'Avg Qty', right: true, render: (r) => r.qty.toFixed(1) },
    { label: '% Omzet', right: true, cls: 'text-emerald-300', render: (r) => pct(r.valueShare) },
  ];
  const storeCols = [
    { label: 'Store', render: (r) => <div><p className="text-slate-100">{r.storeName}</p><p className="text-[11px] text-slate-500">{r.spgName}</p></div> },
    { label: 'Customer', right: true, render: (r) => num(r.customers) },
    { label: 'Loyal', right: true, render: (r) => num(r.loyal) },
    { label: 'Repeat Rate', right: true, render: (r) => <span className={r.repeatRate >= k.repeatRate ? 'text-emerald-300' : 'text-red-300'}>{pct(r.repeatRate)}</span> },
    { label: '% Omzet Loyal', right: true, render: (r) => pct(r.loyalValueShare) },
  ];
  const segCols = [
    { label: 'Segment', render: (r) => <SegBadge id={r.id} /> },
    { label: 'Customer', right: true, render: (r) => num(r.customers) },
    { label: '% Cust', right: true, render: (r) => pct(r.customerShare) },
    { label: 'Omzet', right: true, render: (r) => idrCompact(r.value) },
    { label: '% Omzet', right: true, cls: 'text-emerald-300', render: (r) => pct(r.valueShare) },
    { label: 'Avg Value', right: true, render: (r) => idrCompact(r.avgValue) },
    { label: 'Avg Frek', right: true, render: (r) => `${r.avgFreq.toFixed(1)}x` },
    { label: 'Avg Diam', right: true, render: (r) => `${Math.round(r.avgRecency)} hari` },
  ];
  const winCols = [
    { label: '#', render: (r, i) => <span className="font-mono text-slate-500">{i + 1}</span> },
    { label: 'Customer', render: (r) => <div><p className="text-slate-100">{r.name}</p><p className="font-mono text-[11px] text-slate-500">{r.phone ? maskPhone(r.phone) : `ID TRX · ${r.key.slice(2)}`}</p></div> },
    { label: 'Segment', render: (r) => <SegBadge id={r.segment} /> },
    { label: 'Store / SPG', render: (r) => <div><p className="text-slate-300">{r.storeName}</p><p className="text-[11px] text-slate-500">{r.spgName}</p></div> },
    { label: 'Terakhir Beli', render: (r) => <span className="text-xs text-slate-400">{fmtDate(r.last)}</span> },
    { label: 'Diam', right: true, render: (r) => <span className="text-red-300">{r.recencyDays} hari</span> },
    { label: 'Frek', right: true, render: (r) => `${r.freq}x` },
    { label: 'Total Value', right: true, cls: 'text-emerald-300', render: (r) => idr(r.value) },
    { label: 'AOV', right: true, render: (r) => idrCompact(r.aov) },
  ];
  const topCols = [
    { label: '#', render: (r, i) => <span className="font-mono text-slate-500">{i + 1}</span> },
    { label: 'Customer', render: (r) => <div><p className="text-slate-100">{r.name}</p><p className="font-mono text-[11px] text-slate-500">{r.phone ? maskPhone(r.phone) : `ID TRX · ${r.key.slice(2)}`}</p></div> },
    { label: 'Tipe', render: (r) => <TypeBadge type={r.type} /> },
    { label: 'Segment', render: (r) => <SegBadge id={r.segment} /> },
    { label: 'Store', render: (r) => <span className="text-slate-300">{r.storeName}</span> },
    { label: 'Frek', right: true, render: (r) => `${r.freq}x` },
    { label: 'Total Value', right: true, cls: 'text-emerald-300', render: (r) => idr(r.value) },
    { label: 'AOV', right: true, render: (r) => idrCompact(r.aov) },
    { label: 'SKU Unik', right: true, render: (r) => r.skus.size },
    { label: 'Terakhir Beli', render: (r) => <span className="text-xs text-slate-400">{fmtDate(r.last)}</span> },
  ];

  return (
    <div className="space-y-5" data-testid="customer-analytics-view">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <ScopeToggle value={scope} onChange={setScope} testId="customer-scope" />
        <p className="text-[11px] text-slate-400">Customer ID = <b className="text-slate-200">No. HP</b> · jika No. HP kosong / 0 → memakai <b className="text-slate-200">ID TRX</b> · Loyal = belanja ≥ 2x</p>
      </div>

      {!orders.length ? (
        <div className="card"><EmptyState text="Belum ada transaksi pada periode ini — pilih MTD atau gunakan Date Range di filter global." testId="customer-empty" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            <KpiCard label="Total Customer" value={num(k.customers)} sub={`${num(k.totalTrx)} transaksi`} icon={Users} testId="kpi-total-customer" />
            <KpiCard label="New Customer" value={num(a.nvl.NEW.customers)} sub={`${pct(a.nvl.NEW.customerShare)} · belanja 1x`} icon={UserPlus} testId="kpi-new-customer" delay={30} />
            <KpiCard label="Loyal Customer" value={num(a.nvl.LOYAL.customers)} sub={`Repeat rate ${pct(k.repeatRate)}`} icon={UserCheck} tone="warning" progress={k.repeatRate} testId="kpi-loyal-customer" delay={60} />
            <KpiCard label="Avg Order Value" value={idrCompact(k.aov)} sub="Omzet / transaksi" icon={Wallet} tone="success" testId="kpi-aov" delay={90} />
            <KpiCard label="Avg Spend / Customer" value={idrCompact(k.spend)} sub={`Avg ${k.avgFreq.toFixed(2)}x belanja`} icon={Gem} tone="success" testId="kpi-avg-spend" delay={120} />
            <KpiCard label="Customer ber-No. HP" value={pct(k.identifiedShare)} sub={`${num(k.identified)} teridentifikasi`} icon={Repeat} tone={k.identifiedShare >= 90 ? 'accent' : 'danger'} progress={k.identifiedShare} testId="kpi-identified" delay={150} />
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            <Card title="NEW vs LOYAL Customer — Perbandingan" subtitle="New = belanja 1x · Loyal = belanja berulang (≥ 2x) pada periode" icon={UserCheck} className="xl:col-span-2" testId="nvl-compare-card">
              <div className="overflow-x-auto"><NvlTable nvl={a.nvl} /></div>
            </Card>
            <div className="grid gap-5 xl:col-span-3">
              <Card title="Share Customer · Transaksi · Omzet" icon={BarChart3} testId="nvl-share-card"><NvlShareChart nvl={a.nvl} /></Card>
              <Card title="Omzet Harian — New vs Loyal" icon={BarChart3} testId="nvl-daily-card"><NvlDailyChart daily={a.daily} /></Card>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" data-testid="rfm-segments-row">
            {a.bySegment.map((s) => (
              <div key={s.id} className="card fade-up border-l-4 p-4" style={{ borderLeftColor: s.color }} data-testid={`segment-card-${s.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-100">{s.label}</p>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                </div>
                <p className="mt-1 font-mono text-2xl font-bold text-white">{num(s.customers)}</p>
                <p className="text-[11px] text-slate-400">{pct(s.customerShare)} customer · {pct(s.valueShare)} omzet</p>
                <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="RFM Segmentation" subtitle={`Ambang adaptif: aktif ≤ ${a.rfm.tRecent} hari · diam > ${a.rfm.tDormant} hari · nilai tinggi ≥ ${idrCompact(a.rfm.p50)} · acuan ${fmtDate(a.rfm.end)} · periode ${a.rfm.span} hari`} icon={Target} testId="rfm-card">
              <BucketChart rows={a.bySegment} countKey="customers" countLabel="Customer" colors={a.bySegment.map((s) => s.color)} testId="chart-rfm-segment" />
              <DataTable columns={segCols} rows={a.bySegment} testId="rfm-detail-table" rowKey={(r) => r.id} maxHeight="" />
            </Card>
            <Card title="Prioritas Win-Back" subtitle={`${num(a.winBack.length)} customer diam > ${a.rfm.tDormant} hari · nilai berisiko ${idrCompact(a.winBack.reduce((s, c) => s + c.value, 0))} · urut nilai terbesar`} icon={PhoneCall} bodyClass="p-0" testId="winback-card">
              <DataTable columns={winCols} rows={a.winBack.slice(0, 20)} testId="winback-table" rowKey={(r) => r.key} />
              {!a.winBack.length && <EmptyState text="Tidak ada customer yang diam melewati ambang — bagus!" testId="winback-empty" />}
            </Card>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="Customer by Value" subtitle="Pengelompokan customer berdasarkan total nilai belanja" icon={Gem} testId="customer-value-card">
              <BucketChart rows={a.byValue} countKey="customers" countLabel="Customer" color="#8B5CF6" testId="chart-customer-value" />
              <DataTable columns={valueCols} rows={a.byValue} testId="customer-value-table" maxHeight="" />
            </Card>
            <Card title="Frequency Purchase" subtitle="Berapa kali customer belanja (acuan No. HP / ID TRX)" icon={Repeat} testId="customer-frequency-card">
              <BucketChart rows={a.byFreq} countKey="customers" countLabel="Customer" color="#F59E0B" testId="chart-customer-frequency" />
              <DataTable columns={freqCols} rows={a.byFreq} testId="customer-frequency-table" maxHeight="" />
            </Card>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="Transaksi by Jumlah SKU" subtitle="Transaksi pembelian 1 SKU, 2 SKU, 3 SKU, dst." icon={ShoppingBasket} testId="basket-size-card">
              <BucketChart rows={a.byBasket} countKey="trx" countLabel="Transaksi" color="#3182CE" testId="chart-basket-size" />
              <DataTable columns={basketCols} rows={a.byBasket} testId="basket-size-table" maxHeight="" />
            </Card>
            <Card title="Insight Otomatis" subtitle="Ringkasan temuan dari data customer" icon={Lightbulb} testId="customer-insights-card">
              <ul className="space-y-2.5">
                {insights(a).map((t) => (
                  <li key={t} className="flex gap-2.5 rounded-lg border border-slate-700/60 bg-[#111a35] px-3 py-2.5 text-sm text-slate-200">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="Pareto Customer (80/20)" subtitle={`${pct(k.top80Share)} customer menghasilkan 80% omzet`} icon={Crown} testId="pareto-card"><ParetoChart points={a.pareto} /></Card>
            <Card title="Jam × Hari Belanja" subtitle="Kapan customer paling banyak bertransaksi" icon={Clock} testId="hour-heatmap-card"><HourHeatmap heat={a.heat} /></Card>
          </div>

          <div className="grid gap-5 2xl:grid-cols-5">
            <Card title="Top 20 Customer by Value" subtitle="No. HP disamarkan" icon={Crown} className="2xl:col-span-3" bodyClass="p-0" testId="top-customer-card"
              actions={<input className="input h-8 w-48 text-xs" placeholder="Cari customer / store…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="top-customer-search" />}>
              <DataTable columns={topCols} rows={top} testId="top-customer-table" rowKey={(r) => r.key} />
              {!top.length && <EmptyState text="Tidak ada customer yang cocok." />}
            </Card>
            <Card title="Repeat Rate per Store / SPG" subtitle={`Rata-rata ${pct(k.repeatRate)} · hijau = di atas rata-rata`} icon={Store} className="2xl:col-span-2" bodyClass="p-0" testId="store-repeat-card">
              <DataTable columns={storeCols} rows={a.byStore} testId="store-repeat-table" rowKey={(r) => r.store} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
