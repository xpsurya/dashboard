import { Award } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/common/ui';
import { matches } from '../../lib/format';
import config from '../../lib/config';

const barColor = (s) => (s >= 90 ? 'bg-emerald-500' : s >= 75 ? 'bg-blue-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500');

export function DisciplineScore({ scores, search }) {
  const P = config.discipline;
  const rows = scores.filter((s) => matches(search, s.spg_code, s.name, s.store_code));
  return (
    <Card title="Poin Kedisiplinan SPG (Discipline & Integrity Score)" subtitle={`Base ${P.base} · Update ${P.leaderUpdate} · Delete ${P.leaderDelete} · Missed checkout ${P.missedCheckout} (MTD)`} icon={Award} bodyClass="p-0" testId="discipline-score-table">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr>{['SPG', 'Region', 'Update (−5)', 'Delete (−25)', 'Missed Checkout (−10)', 'Score', 'Grade'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.spg_code} className={i % 2 ? 'row-odd' : 'row-even'} data-testid={`discipline-row-${s.spg_code}`}>
                <td className="td"><p className="font-medium text-slate-100">{s.name}</p><p className="font-mono text-[10px] text-slate-500">{s.spg_code}</p></td>
                <td className="td text-slate-400">{s.region}</td>
                <td className="td text-center font-mono text-amber-300">{s.updates}</td>
                <td className="td text-center font-mono text-red-300">{s.deletes}</td>
                <td className="td text-center font-mono text-orange-300">{s.missed}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <span className="w-9 font-mono font-bold text-white" data-testid={`discipline-score-${s.spg_code}`}>{s.score}</span>
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${barColor(s.score)}`} style={{ width: `${s.score}%` }} /></div>
                  </div>
                </td>
                <td className="td"><Badge tone={s.tone}>{s.grade} · {s.label}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="Tidak ada SPG." testId="discipline-empty" />}
      </div>
    </Card>
  );
}
