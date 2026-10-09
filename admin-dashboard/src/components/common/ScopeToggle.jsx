import { useDashboard } from '../../context/DashboardContext';
import { fmtDate } from '../../lib/format';

export function ScopeToggle({ value, onChange, testId = 'scope-toggle' }) {
  const { filters, month } = useDashboard();
  const period = filters.dateFrom === filters.dateTo ? fmtDate(filters.dateFrom) : `${fmtDate(filters.dateFrom)} – ${fmtDate(filters.dateTo)}`;
  const opts = [
    ['mtd', 'MTD', `${fmtDate(month.start)} – ${fmtDate(filters.dateTo)}`],
    ['period', 'Periode Filter', period],
  ];
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid={testId}>
      <div className="flex rounded-lg border border-slate-700 bg-[#111a35] p-0.5">
        {opts.map(([k, l]) => (
          <button key={k} onClick={() => onChange(k)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${value === k ? 'bg-brand text-white' : 'text-slate-400 hover:text-slate-200'}`} data-testid={`${testId}-${k}`}>{l}</button>
        ))}
      </div>
      <span className="font-mono text-[11px] text-slate-400">{opts.find((o) => o[0] === value)[2]}</span>
    </div>
  );
}

export function DataTable({ columns, rows, testId, maxHeight = 'max-h-[420px]', rowKey = (r, i) => i }) {
  return (
    <div className={`${maxHeight} overflow-auto`} data-testid={testId}>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>{columns.map((c) => <th key={c.label} className={`th ${c.right ? 'text-right' : ''}`}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} className={i % 2 ? 'row-odd' : 'row-even'} data-testid={testId ? `${testId}-row-${i}` : undefined}>
              {columns.map((c) => (
                <td key={c.label} className={`td ${c.right ? 'text-right font-mono' : ''} ${c.cls ?? ''}`}>{c.render ? c.render(r, i) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
