import { useMemo } from 'react';
import { EChart } from '../../components/common/EChart';
import { COLORS, axis, baseOption, fade } from '../../lib/chartTheme';
import { idr, idrCompact } from '../../lib/format';

const pctFmt = (v) => `${v}%`;

export function TrendChart({ trend }) {
  const option = useMemo(() => ({
    ...baseOption,
    xAxis: { type: 'category', data: trend.map((t) => t.date.slice(8)), ...axis({ splitLine: { show: false } }) },
    yAxis: [
      { type: 'value', name: 'Omzet', ...axis({ axisLabel: { formatter: (v) => idrCompact(v).replace('Rp ', '') } }) },
      { type: 'value', name: '%', min: 0, ...axis({ splitLine: { show: false }, axisLabel: { formatter: '{value}%' } }) },
    ],
    series: [
      { name: 'Omzet Harian', type: 'bar', data: trend.map((t) => t.omzet), barMaxWidth: 14, itemStyle: { color: 'rgba(49,130,206,0.45)', borderRadius: [3, 3, 0, 0] }, tooltip: { valueFormatter: idr } },
      { name: 'Ach % (Kumulatif)', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((t) => +t.ach.toFixed(1)), symbolSize: 6, lineStyle: { width: 3, color: COLORS.success }, itemStyle: { color: COLORS.success }, areaStyle: { color: fade(COLORS.success) }, tooltip: { valueFormatter: pctFmt } },
      { name: 'Timerate %', type: 'line', yAxisIndex: 1, data: trend.map((t) => +t.tr.toFixed(1)), symbol: 'none', lineStyle: { width: 2, type: 'dashed', color: COLORS.warning }, itemStyle: { color: COLORS.warning }, tooltip: { valueFormatter: pctFmt } },
    ],
  }), [trend]);
  return <EChart option={option} height={320} testId="chart-daily-trend" />;
}

export function SkuChart({ rows }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const option = useMemo(() => ({
    ...baseOption,
    grid: { ...baseOption.grid, top: 8, right: 90 },
    tooltip: { ...baseOption.tooltip, trigger: 'item', valueFormatter: idr },
    xAxis: { type: 'value', ...axis({ axisLabel: { formatter: (v) => idrCompact(v).replace('Rp ', '') } }) },
    yAxis: { type: 'category', data: rows.map((r) => r.name), ...axis({ splitLine: { show: false }, axisLabel: { width: 150, overflow: 'truncate' } }) },
    series: [{
      type: 'bar', name: 'Sales Value', data: rows.map((r) => r.value), barMaxWidth: 18,
      itemStyle: { borderRadius: [0, 4, 4, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1A365D' }, { offset: 1, color: COLORS.accent }] } },
      label: { show: true, position: 'right', color: '#CBD5E1', fontSize: 11, formatter: ({ value }) => `${((value / total) * 100).toFixed(1)}%` },
    }],
  }), [rows, total]);
  return <EChart option={option} height={Math.max(280, rows.length * 36)} testId="chart-sku-contribution" />;
}

export function RegionChart({ rows, timerate }) {
  const option = useMemo(() => ({
    ...baseOption,
    grid: { ...baseOption.grid, top: 24 },
    tooltip: { ...baseOption.tooltip, valueFormatter: (v) => `${v}%` },
    xAxis: { type: 'category', data: rows.map((r) => r.region), ...axis({ splitLine: { show: false }, axisLabel: { interval: 0, fontSize: 10 } }) },
    yAxis: { type: 'value', ...axis({ axisLabel: { formatter: '{value}%' } }) },
    series: [{
      type: 'bar', name: 'Achievement %', barMaxWidth: 38,
      data: rows.map((r) => ({ value: +r.ach.toFixed(1), itemStyle: { color: r.ach >= timerate ? COLORS.success : COLORS.danger, borderRadius: [4, 4, 0, 0] } })),
      label: { show: true, position: 'top', color: '#E2E8F0', fontSize: 11, formatter: '{c}%' },
      markLine: { symbol: 'none', data: [{ yAxis: +timerate.toFixed(1), name: 'TR' }], lineStyle: { color: COLORS.warning, type: 'dashed' }, label: { formatter: 'TR {c}%', color: COLORS.warning } },
    }],
  }), [rows, timerate]);
  return <EChart option={option} height={300} testId="chart-region-achievement" />;
}
