import { useMemo, useState } from 'react';
import { ClipboardList, TriangleAlert } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/common/ui';
import { duration, fmtDate, fmtTime, matches } from '../../lib/format';

export function AttendanceLogTable({ logs, search, standard }) {
  const [limit, setLimit] = useState(100);
  const [onlyShort, setOnlyShort] = useState(false);
  const view = useMemo(
    () => logs.filter((l) => matches(search, l.spg_code, l.spg?.name, l.storeName, l.store_code) && (!onlyShort || (l.work_duration_minutes ?? 0) < standard)),
    [logs, search, onlyShort, standard],
  );
  const shortCount = logs.filter((l) => l.work_duration_minutes != null && l.work_duration_minutes < standard).length;

  return (
    <Card
      title="Attendance Logs"
      subtitle={`${view.length} log · ${shortCount} entri di bawah ${standard / 60} jam kerja`}
      icon={ClipboardList}
      bodyClass="p-0"
      testId="attendance-log-table"
      actions={
        <button className={onlyShort ? 'btn-warn btn-sm' : 'btn-ghost btn-sm'} onClick={() => setOnlyShort((v) => !v)} data-testid="attendance-short-only-toggle">
          <TriangleAlert className="h-3.5 w-3.5" /> Hanya &lt; 8 Jam
        </button>
      }
    >
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {['Tanggal', 'SPG', 'Store', 'Check-in', 'Checkout', 'Total Work Duration', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {view.slice(0, limit).map((l, i) => {
              const short = l.work_duration_minutes != null && l.work_duration_minutes < standard;
              const bg = short ? 'bg-red-500/[0.07]' : i % 2 ? 'row-odd' : 'row-even';
              return (
                <tr key={l.id} className={bg} data-testid={`attendance-log-row-${i}`}>
                  <td className="td text-slate-400">{fmtDate(l.work_date)}</td>
                  <td className="td"><p className="font-medium text-slate-100">{l.spg?.name ?? l.spg_code}</p><p className="font-mono text-[10px] text-slate-500">{l.spg_code}</p></td>
                  <td className="td text-slate-300">{l.storeName}</td>
                  <td className="td font-mono text-emerald-300">{fmtTime(l.checkin_time)}</td>
                  <td className="td font-mono text-blue-300">{fmtTime(l.checkout_time)}</td>
                  <td className={`td font-mono ${short ? 'font-bold text-amber-300' : 'text-slate-200'}`} data-testid={`attendance-duration-${i}`}>
                    <span className="inline-flex items-center gap-1.5">{short && <TriangleAlert className="h-3.5 w-3.5" />}{duration(l.work_duration_minutes)}</span>
                  </td>
                  <td className="td">
                    {!l.checkout_time ? <Badge tone="yellow">Belum Checkout</Badge> : short ? <Badge tone="red">&lt; 8 Jam</Badge> : <Badge tone="green">Standar</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!view.length && <EmptyState text="Belum ada log absensi pada periode ini." testId="attendance-log-empty" />}
      </div>
      {view.length > limit && (
        <div className="border-t border-slate-700/60 p-3 text-center">
          <button className="btn-ghost btn-sm" onClick={() => setLimit((l) => l + 100)} data-testid="attendance-log-load-more">Muat lebih banyak ({view.length - limit} lagi)</button>
        </div>
      )}
    </Card>
  );
}
