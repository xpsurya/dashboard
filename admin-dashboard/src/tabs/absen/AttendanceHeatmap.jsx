import { CalendarDays } from 'lucide-react';
import { Card, EmptyState } from '../../components/common/ui';
import { matches } from '../../lib/format';

const CELL = {
  present: { cls: 'bg-emerald-500', label: 'Present' },
  incomplete: { cls: 'bg-amber-400', label: 'Incomplete (belum checkout)' },
  absent: { cls: 'bg-red-500/85', label: 'Absent' },
  off: { cls: 'bg-slate-700/50', label: 'Libur' },
  future: { cls: 'border border-slate-700/70 bg-transparent', label: 'Belum terjadi' },
};
const SUNDAY = (d) => new Date(`${d}T00:00:00`).getDay() === 0;

export function AttendanceHeatmap({ heatmap, monthLabel, search }) {
  const rows = heatmap.filter((r) => matches(search, r.spg.spg_code, r.spg.name, r.spg.store_code));
  const days = heatmap[0]?.cells ?? [];
  const legend = Object.entries(CELL).filter(([k]) => k !== 'future');

  return (
    <Card
      title="1-Month Calendar Heatmap Matrix"
      subtitle={`${monthLabel} · status kehadiran per SPG per tanggal`}
      icon={CalendarDays}
      bodyClass="p-0"
      testId="attendance-heatmap"
      actions={legend.map(([k, v]) => (
        <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-400"><span className={`h-3 w-3 rounded-sm ${v.cls}`} />{v.label.split(' ')[0]}</span>
      ))}
    >
      <div className="max-h-[520px] overflow-auto">
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="th left-0 z-30 min-w-[180px] border-r border-slate-700">SPG</th>
              {days.map((c) => (
                <th key={c.date} className={`th px-0.5 text-center ${SUNDAY(c.date) ? 'text-red-300' : ''}`}>{Number(c.date.slice(8))}</th>
              ))}
              <th className="th text-center">H</th>
              <th className="th text-center">I</th>
              <th className="th text-center">A</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const count = (s) => r.cells.filter((c) => c.status === s).length;
              const bg = i % 2 ? 'row-odd' : 'row-even';
              return (
                <tr key={r.spg.spg_code} data-testid={`heatmap-row-${r.spg.spg_code}`}>
                  <td className={`td sticky left-0 z-10 border-r border-slate-700 py-1.5 ${bg}`}>
                    <p className="text-xs font-semibold text-slate-100">{r.spg.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{r.spg.spg_code}</p>
                  </td>
                  {r.cells.map((c) => (
                    <td key={c.date} className={`border-b border-slate-800/80 px-0.5 py-1 ${bg}`}>
                      <div className={`mx-auto h-5 w-5 rounded-[4px] transition-transform hover:scale-125 ${CELL[c.status].cls}`} title={`${c.date} · ${CELL[c.status].label}`} />
                    </td>
                  ))}
                  <td className={`td text-center font-mono text-xs text-emerald-300 ${bg}`}>{count('present')}</td>
                  <td className={`td text-center font-mono text-xs text-amber-300 ${bg}`}>{count('incomplete')}</td>
                  <td className={`td text-center font-mono text-xs text-red-300 ${bg}`}>{count('absent')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="Tidak ada SPG untuk ditampilkan." testId="heatmap-empty" />}
      </div>
    </Card>
  );
}
