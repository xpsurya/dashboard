import { useMemo } from 'react';
import { EChart } from '../../components/common/EChart';
import { COLORS, axis, baseOption } from '../../lib/chartTheme';
import { idr, idrCompact, num } from '../../lib/format';

export const TYPE_COLOR = { NEW: '#38BDF8', LOYAL: '#F59E0B' };
const pctFmt = (v) => `${v}%`;
const short = (v) => idrCompact(v).replace('Rp ', '');

export function NvlShareChart({ nvl }) {
  const option = useMemo(() => {
    const cats = ['% Customer', '% Transaksi', '% Omzet'];
    const vals = (g) => [g.customerShare, g.trxShare, g.valueShare].map((v) => +v.toFixed(1));
    return {
      ...baseOption,
      grid: { ...baseOption.grid, top: 36 },
      tooltip: { ...baseOption.tooltip, valueFormatter: pctFmt },
      xAxis: { type: 'category', data: cats, ...axis({ splitLine: { show: false } }) },
      yAxis: { type: 'value', max: 100, ...axis({ axisLabel: { formatter: '{value}%' } }) },
      series: ['NEW', 'LOYAL'].map((t) => ({
        name: t === 'NEW' ? 'New Customer' : 'Loyal Customer', type: 'bar', barMaxWidth: 36, data: vals(nvl[t]),
        itemStyle: { color: TYPE_COLOR[t], borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', color: '#E2E8F0', fontSize: 11, formatter: '{c}%' },
      })),
    };
  }, [nvl]);
  return <EChart option={option} height={290} testId="chart-nvl-share" />;
}

export function NvlDailyChart({ daily }) {
  const option = useMemo(() => ({
    ...baseOption,
    tooltip: { ...baseOption.tooltip, valueFormatter: idr },
    xAxis: { type: 'category', data: daily.map((d) => d.date.slice(5)), ...axis({ splitLine: { show: false } }) },
    yAxis: { type: 'value', ...axis({ axisLabel: { formatter: short } }) },
    series: ['NEW', 'LOYAL'].map((t) => ({
      name: t === 'NEW' ? 'Omzet New' : 'Omzet Loyal', type: 'bar', stack: 'omzet', barMaxWidth: 18, data: daily.map((d) => d[t]),
      itemStyle: { color: TYPE_COLOR[t] },
    })),
  }), [daily]);
  return <EChart option={option} height={290} testId="chart-nvl-daily" />;
}

// bar = jumlah (customer / trx), line = % omzet
export function BucketChart({ rows, countKey, countLabel, color = COLORS.accent, testId }) {
  const option = useMemo(() => ({
    ...baseOption,
    xAxis: { type: 'category', data: rows.map((r) => r.label), ...axis({ splitLine: { show: false }, axisLabel: { interval: 0, fontSize: 10 } }) },
    yAxis: [
      { type: 'value', name: countLabel, ...axis() },
      { type: 'value', name: '% Omzet', min: 0, ...axis({ splitLine: { show: false }, axisLabel: { formatter: '{value}%' } }) },
    ],
    series: [
      { name: countLabel, type: 'bar', barMaxWidth: 40, data: rows.map((r) => r[countKey]), itemStyle: { color, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', color: '#CBD5E1', fontSize: 10, formatter: ({ value }) => num(value) }, tooltip: { valueFormatter: num } },
      { name: '% Omzet', type: 'line', yAxisIndex: 1, smooth: true, data: rows.map((r) => +r.valueShare.toFixed(1)), symbolSize: 7, lineStyle: { width: 3, color: COLORS.success }, itemStyle: { color: COLORS.success }, tooltip: { valueFormatter: pctFmt } },
    ],
  }), [rows, countKey, countLabel, color]);
  return <EChart option={option} height={290} testId={testId} />;
}

export function ParetoChart({ points }) {
  const option = useMemo(() => ({
    ...baseOption,
    grid: { ...baseOption.grid, top: 30 },
    tooltip: { ...baseOption.tooltip, formatter: (p) => `${p[0].data[0]}% customer teratas<br/>menyumbang <b>${p[0].data[1]}%</b> omzet` },
    xAxis: { type: 'value', max: 100, name: '% Customer', nameLocation: 'middle', nameGap: 26, ...axis({ axisLabel: { formatter: '{value}%' } }) },
    yAxis: { type: 'value', max: 100, ...axis({ axisLabel: { formatter: '{value}%' } }) },
    series: [{
      name: 'Kumulatif Omzet', type: 'line', smooth: true, showSymbol: false, data: points.map((p) => [p.x, p.y]),
      lineStyle: { width: 3, color: COLORS.accent }, areaStyle: { color: 'rgba(49,130,206,0.18)' },
      markLine: { symbol: 'none', silent: true, lineStyle: { color: COLORS.warning, type: 'dashed' }, label: { color: COLORS.warning, formatter: '{b}', position: 'insideEndTop' }, data: [{ yAxis: 80, name: '80% omzet' }, { xAxis: 20, name: '20% customer' }] },
    }],
  }), [points]);
  return <EChart option={option} height={290} testId="chart-pareto" />;
}

export function HourHeatmap({ heat }) {
  const option = useMemo(() => ({
    ...baseOption,
    grid: { left: 8, right: 16, top: 10, bottom: 70, containLabel: true },
    tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: (p) => `${heat.days[p.data[1]]} · ${heat.hours[p.data[0]]}<br/><b>${num(p.data[2])}</b> transaksi` },
    xAxis: { type: 'category', data: heat.hours, ...axis({ splitLine: { show: false }, axisLabel: { fontSize: 10 } }) },
    yAxis: { type: 'category', data: heat.days, ...axis({ splitLine: { show: false } }) },
    visualMap: { min: 0, max: heat.max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 120, textStyle: { color: COLORS.text, fontSize: 10 }, inRange: { color: ['#0f1a36', '#1A365D', '#3182CE', '#F59E0B', '#EF4444'] } },
    series: [{ type: 'heatmap', data: heat.data, itemStyle: { borderColor: '#0B1224', borderWidth: 2, borderRadius: 3 }, emphasis: { itemStyle: { borderColor: '#fff' } } }],
  }), [heat]);
  return <EChart option={option} height={300} testId="chart-hour-heatmap" />;
}
