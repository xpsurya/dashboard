import { useMemo } from 'react';
import { Activity, BarChart3, Gauge, Map as MapIcon, Receipt, Target, Timer, UserCheck, Users, Wallet, Award } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Card, KpiCard } from '../../components/common/ui';
import { sellingMetrics } from '../../lib/metrics';
import { idr, idrCompact, num, pct, ratio } from '../../lib/format';
import { RegionChart, SkuChart, TrendChart } from './SellingCharts';
import { SpgPerformanceTable } from './SpgPerformanceTable';

export default function SellingPerformance() {
  const ctx = useDashboard();
  const { data, filters, month, workdaysElapsed, workdaysMonth } = ctx;
  const m = useMemo(() => sellingMetrics(ctx), [data, filters, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = m.kpis;
  const onTrack = k.ach >= k.timerate;

  return (
    <div className="space-y-5" data-testid="selling-performance-view">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 2xl:grid-cols-7">
        <KpiCard className="col-span-2 2xl:col-span-1" label="Total National Omzet (MTD)" value={idr(k.mtdOmzet)} sub={`Periode terpilih: ${idrCompact(k.periodOmzet)}`} icon={Wallet} testId="kpi-total-omzet" />
        <KpiCard label="Target vs Achievement" value={pct(k.ach)} sub={`Target ${idrCompact(k.totalTarget)}`} icon={Target} tone={onTrack ? 'success' : 'danger'} progress={k.ach} testId="kpi-achievement" delay={40} />
        <KpiCard label="Timerate (TR)" value={pct(k.timerate)} sub={`${workdaysElapsed}/${workdaysMonth} hari kerja`} icon={Timer} tone="warning" progress={k.timerate} testId="kpi-timerate" delay={80} />
        <KpiCard label="Unique Customers" value={num(k.customers)} sub="Pembeli unik periode ini" icon={Users} testId="kpi-unique-customers" delay={120} />
        <KpiCard label="Total Transactions" value={num(k.transactions)} sub="Jumlah nota (receipts)" icon={Receipt} testId="kpi-total-transactions" delay={160} />
        <KpiCard label="Active SPG vs Master" value={`${k.activeSpg} / ${k.masterSpg}`} sub={`${pct(ratio(k.activeSpg, k.masterSpg))} SPG aktif check-in`} icon={UserCheck} tone="accent" progress={ratio(k.activeSpg, k.masterSpg)} testId="kpi-active-spg" delay={200} />
        <KpiCard label="SPG Over TR %" value={num(k.overTr)} sub={`${pct(ratio(k.overTr, k.masterSpg))} SPG on-track`} icon={Award} tone={k.overTr >= k.masterSpg / 2 ? 'success' : 'warning'} testId="kpi-spg-over-tr" delay={240} />
      </div>

      <Card title="Daily Time Performance Trend vs Timerate %" subtitle={`MTD ${month.label} · Ach kumulatif ${onTrack ? 'di atas' : 'di bawah'} TR`} icon={Activity} testId="card-daily-trend">
        <TrendChart trend={m.trend} />
      </Card>

      <div className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="SKU Contribution by Sales Value" subtitle="Kontribusi omzet per SKU (MTD)" icon={BarChart3} testId="card-sku-contribution">
          <SkuChart rows={m.skuRows} />
        </Card>
        <Card className="xl:col-span-2" title="Achievement % by Region" subtitle="Hijau = di atas TR, merah = di bawah TR" icon={MapIcon} testId="card-region-achievement">
          <RegionChart rows={m.regionRows} timerate={k.timerate} />
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Gauge className="h-3.5 w-3.5" /> Garis putus-putus = Timerate {pct(k.timerate)}</div>
        </Card>
      </div>

      <SpgPerformanceTable rows={m.rows} search={filters.search} single={filters.mode === 'single'} />
    </div>
  );
}
