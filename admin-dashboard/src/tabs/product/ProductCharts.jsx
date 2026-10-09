import { useMemo } from 'react';
import { EChart } from '../../components/common/EChart';
import { COLORS, axis, baseOption } from '../../lib/chartTheme';
import { idr, idrCompact, num } from '../../lib/format';

export const PALETTE = ['#3182CE', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#64748B'];
const short = (v) => idrCompact(v).replace('Rp ', '');

export function ParentDonut({ rows }) {
  const option = useMemo(() => ({
    ...baseOption,
    color: PALETTE,
    tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: (p) => `${p.name}<br/><b>${idr(p.value)}</b> · ${p.percent}%` },
    legend: { ...baseOption.legend, type: 'scroll', top: 'bottom', left: 'center' },
    series: [{
      type: 'pie', radius: ['48%', '74%'], center: ['50%', '45%'], avoidLabelOverlap: true, itemStyle: { borderColor: '#141d38', borderWidth: 3, borderRadius: 6 },
      label: { color: '#E2E8F0', fontSize: 11, formatter: '{b}\n{d}%' }, labelLine: { lineStyle: { color: '#475569' } },
      data: rows.map((r) => ({ name: r.parent, value: r.value })),
    }],
  }), [rows]);
  return <EChart option={option} height={340} testId="chart-parent-sku" />;
}

// horizontal bar, highest at the top
export function RankBar({ rows, valueKey, shareKey, isMoney, color, testId }) {
  const option = useMemo(() => ({
    ...baseOption,
    grid: { ...baseOption.grid, top: 8, right: 64 },
    tooltip: { ...baseOption.tooltip, trigger: 'item', valueFormatter: isMoney ? idr : (v) => `${num(v)} pcs` },
    xAxis: { type: 'value', ...axis({ axisLabel: { formatter: isMoney ? short : num } }) },
    yAxis: { type: 'category', inverse: true, data: rows.map((r) => r.name), ...axis({ splitLine: { show: false }, axisLabel: { width: 160, overflow: 'truncate' } }) },
    series: [{
      type: 'bar', name: isMoney ? 'Sales Value' : 'Qty Sold', data: rows.map((r) => r[valueKey]), barMaxWidth: 18,
      itemStyle: { borderRadius: [0, 4, 4, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1A365D' }, { offset: 1, color }] } },
      label: { show: true, position: 'right', color: '#CBD5E1', fontSize: 11, formatter: ({ dataIndex }) => `${rows[dataIndex][shareKey].toFixed(1)}%` },
    }],
  }), [rows, valueKey, shareKey, isMoney, color]);
  return <EChart option={option} height={Math.max(280, rows.length * 32)} testId={testId} />;
}

export function CoMatrix({ matrix }) {
  const option = useMemo(() => ({
    ...baseOption,
    grid: { left: 8, right: 16, top: 10, bottom: 80, containLabel: true },
    tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: (p) => `${matrix.labels[p.data[0]]}<br/>+ ${matrix.labels[p.data[1]]}<br/><b>${num(p.data[2])}</b> transaksi bersamaan` },
    xAxis: { type: 'category', data: matrix.labels, ...axis({ splitLine: { show: false }, axisLabel: { rotate: 40, fontSize: 9, width: 90, overflow: 'truncate' } }) },
    yAxis: { type: 'category', inverse: true, data: matrix.labels, ...axis({ splitLine: { show: false }, axisLabel: { fontSize: 10, width: 140, overflow: 'truncate' } }) },
    visualMap: { min: 0, max: matrix.max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 140, textStyle: { color: COLORS.text, fontSize: 10 }, inRange: { color: ['#0f1a36', '#1A365D', '#3182CE', '#10B981', '#F59E0B'] } },
    series: [{ type: 'heatmap', data: matrix.data, itemStyle: { borderColor: '#0B1224', borderWidth: 1.5, borderRadius: 2 }, label: { show: matrix.labels.length <= 14, color: '#E2E8F0', fontSize: 9, formatter: (p) => (p.data[2] ? p.data[2] : '') } }],
  }), [matrix]);
  return <EChart option={option} height={Math.max(380, matrix.labels.length * 34 + 120)} testId="chart-co-matrix" />;
}
