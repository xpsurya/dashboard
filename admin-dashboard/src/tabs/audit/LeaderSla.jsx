import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/common/ui';
import { EChart } from '../../components/common/EChart';
import { COLORS, axis, baseOption } from '../../lib/chartTheme';
import { hours, num } from '../../lib/format';
import config from '../../lib/config';

export function LeaderSla({ leaders }) {
  const H = config.slaOverdueHours;
  const option = useMemo(() => ({
    ...baseOption,
    grid: { ...baseOption.grid, top: 16, right: 40 },
    tooltip: { ...baseOption.tooltip, valueFormatter: (v) => `${v} jam` },
    xAxis: { type: 'value', ...axis({ axisLabel: { formatter: '{value}j' } }) },
    yAxis: { type: 'category', inverse: true, data: leaders.map((l) => l.leader_name), ...axis({ splitLine: { show: false } }) },
    series: [{
      name: 'Avg Response', type: 'bar', barMaxWidth: 16,
      data: leaders.map((l) => ({ value: +l.avg.toFixed(1), itemStyle: { color: l.isOverdue ? COLORS.danger : COLORS.success, borderRadius: [0, 4, 4, 0] } })),
      markLine: { symbol: 'none', data: [{ xAxis: H }], lineStyle: { color: COLORS.warning, type: 'dashed' }, label: { formatter: `SLA ${H}j`, color: COLORS.warning } },
    }],
  }), [leaders, H]);

  return (
    <Card title="Leader Responsiveness SLA" subtitle={`validated_at − email_sent_at · Overdue jika gap > ${H} jam`} icon={Clock} testId="leader-sla-tracker">
      <EChart option={option} height={Math.max(220, leaders.length * 34)} testId="chart-leader-sla" />
      <div className="mt-3 max-h-[360px] overflow-auto rounded-lg border border-slate-700/60">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr>{['Leader', 'Validasi', 'Avg', 'Max', `> ${H}j`, 'Pending', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {leaders.map((l, i) => (
              <tr key={l.leader_email} className={i % 2 ? 'row-odd' : 'row-even'} data-testid={`leader-sla-row-${i}`}>
                <td className="td"><p className="font-medium text-slate-100">{l.leader_name}</p><p className="text-[10px] text-slate-500">{l.leader_email}</p></td>
                <td className="td text-center font-mono">{num(l.count)}</td>
                <td className="td font-mono">{hours(l.avg)}</td>
                <td className={`td font-mono ${l.max > H ? 'text-red-300' : ''}`}>{hours(l.max)}</td>
                <td className="td text-center font-mono text-red-300">{l.overdue}</td>
                <td className="td text-center font-mono">{l.pending}{l.pendingOverdue ? <span className="text-red-300"> ({l.pendingOverdue} overdue)</span> : ''}</td>
                <td className="td"><Badge tone={l.isOverdue ? 'red' : 'green'} testId={`leader-sla-status-${i}`}>{l.isOverdue ? 'OVERDUE' : 'ON TRACK'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leaders.length && <EmptyState text="Belum ada data validasi leader." testId="leader-sla-empty" />}
      </div>
    </Card>
  );
}
