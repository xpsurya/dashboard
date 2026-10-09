import { useMemo } from 'react';
import { Award, ClipboardCheck, ShieldAlert, TimerOff } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { KpiCard } from '../../components/common/ui';
import { disciplineScores, leaderSla } from '../../lib/auditMetrics';
import { num } from '../../lib/format';
import { DisciplineScore } from './DisciplineScore';
import { LeaderSla } from './LeaderSla';
import { ReviewQueue } from './ReviewQueue';

export default function AuditDiscipline() {
  const ctx = useDashboard();
  const { data, filters, month } = ctx;
  const scores = useMemo(() => disciplineScores(ctx), [data, filters, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const leaders = useMemo(() => leaderSla(ctx), [data, filters, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const pending = data.sales.filter((o) => o.status === 'PENDING').length + data.attendance.filter((a) => a.validation_status === 'PENDING').length;
  const avg = scores.length ? scores.reduce((s, x) => s + x.score, 0) / scores.length : 0;

  return (
    <div className="space-y-5" data-testid="audit-discipline-view">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Pending Review" value={num(pending)} sub="Transaksi + absensi" icon={ClipboardCheck} tone="warning" testId="kpi-pending-review" />
        <KpiCard label="Avg Discipline Score" value={avg.toFixed(1)} sub="Rata-rata poin SPG (MTD)" icon={Award} tone={avg >= 75 ? 'success' : 'warning'} progress={avg} testId="kpi-avg-discipline" delay={40} />
        <KpiCard label="SPG Critical (< 60)" value={num(scores.filter((s) => s.score < 60).length)} sub="Perlu coaching / SP" icon={ShieldAlert} tone="danger" testId="kpi-spg-critical" delay={80} />
        <KpiCard label="Leader Overdue" value={`${leaders.filter((l) => l.isOverdue).length} / ${leaders.length}`} sub="Gap validasi > 24 jam" icon={TimerOff} tone="danger" testId="kpi-leader-overdue" delay={120} />
      </div>
      <ReviewQueue />
      <div className="grid gap-5 2xl:grid-cols-2">
        <DisciplineScore scores={scores} search={filters.search} />
        <LeaderSla leaders={leaders} />
      </div>
    </div>
  );
}
