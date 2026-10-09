import { useMemo } from 'react';
import { LogIn, LogOut, Percent, TrendingUp, UserX, Map as MapIcon } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Card, KpiCard } from '../../components/common/ui';
import { EChart } from '../../components/common/EChart';
import { attendanceMetrics } from '../../lib/metrics';
import { COLORS, axis, baseOption, fade } from '../../lib/chartTheme';
import { num, pct } from '../../lib/format';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import { AttendanceLogTable } from './AttendanceLogTable';

const trendOption = (trend) => ({
  ...baseOption,
  grid: { ...baseOption.grid, top: 20 },
  tooltip: { ...baseOption.tooltip, valueFormatter: (v) => `${v}%` },
  xAxis: { type: 'category', data: trend.map((t) => t.date.slice(8)), ...axis({ splitLine: { show: false } }) },
  yAxis: { type: 'value', min: 0, max: 100, ...axis({ axisLabel: { formatter: '{value}%' } }) },
  series: [{
    name: 'Attendance Rate', type: 'line', smooth: true, data: trend.map((t) => +t.rate.toFixed(1)), symbolSize: 6,
    lineStyle: { width: 3, color: COLORS.accent }, itemStyle: { color: COLORS.accent }, areaStyle: { color: fade(COLORS.accent) },
    markLine: { symbol: 'none', data: [{ yAxis: 95 }], lineStyle: { color: COLORS.success, type: 'dashed' }, label: { formatter: 'Target 95%', color: COLORS.success } },
  }],
});

const regionalOption = (rows) => ({
  ...baseOption,
  xAxis: { type: 'category', data: rows.map((r) => r.region), ...axis({ splitLine: { show: false }, axisLabel: { interval: 0, fontSize: 10 } }) },
  yAxis: { type: 'value', ...axis() },
  series: [
    ['present', 'Present', COLORS.success],
    ['incomplete', 'Incomplete', COLORS.warning],
    ['absent', 'Absent', COLORS.danger],
  ].map(([k, name, color]) => ({ name, type: 'bar', stack: 'att', barMaxWidth: 40, data: rows.map((r) => r[k]), itemStyle: { color } })),
});

export default function AbsenPerformance() {
  const ctx = useDashboard();
  const { data, filters, month } = ctx;
  const m = useMemo(() => attendanceMetrics(ctx), [data, filters, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const trendOpt = useMemo(() => trendOption(m.trend), [m.trend]);
  const regOpt = useMemo(() => regionalOption(m.regional), [m.regional]);
  const k = m.kpis;

  return (
    <div className="space-y-5" data-testid="absen-performance-view">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Attendance Rate" value={pct(k.rate)} sub={`${num(k.checkins)} dari ${num(k.expected)} jadwal kerja`} icon={Percent} tone={k.rate >= 95 ? 'success' : k.rate >= 85 ? 'warning' : 'danger'} progress={k.rate} testId="kpi-attendance-rate" />
        <KpiCard label="Total Check-In" value={num(k.checkins)} sub="Foto absen masuk diterima" icon={LogIn} tone="success" testId="kpi-total-checkin" delay={40} />
        <KpiCard label="Total Checkout" value={num(k.checkouts)} sub={`${num(k.checkins - k.checkouts)} belum checkout`} icon={LogOut} testId="kpi-total-checkout" delay={80} />
        <KpiCard label={filters.mode === 'single' ? 'Gap / Absent SPG' : 'Gap / Absent (SPG-hari)'} value={num(k.absent)} sub="Tidak check-in di hari kerja" icon={UserX} tone="danger" testId="kpi-absent-count" delay={120} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Daily Attendance Rate Trend %" subtitle={`Hari kerja MTD ${month.label}`} icon={TrendingUp} testId="card-attendance-trend">
          <EChart option={trendOpt} height={300} testId="chart-attendance-trend" />
        </Card>
        <Card title="Regional Attendance Distribution" subtitle="Present / Incomplete / Absent pada periode terpilih" icon={MapIcon} testId="card-attendance-regional">
          <EChart option={regOpt} height={300} testId="chart-attendance-regional" />
        </Card>
      </div>
      <AttendanceHeatmap heatmap={m.heatmap} monthLabel={month.label} search={filters.search} />
      <AttendanceLogTable logs={m.logRows} search={filters.search} standard={m.standard} />
    </div>
  );
}
