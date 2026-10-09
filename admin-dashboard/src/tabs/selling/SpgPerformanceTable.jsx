import { useMemo, useState } from 'react';
import { ArrowDownUp, Users } from 'lucide-react';
import { Card, EmptyState } from '../../components/common/ui';
import { idr, matches, num, pct } from '../../lib/format';

const achClass = (v) => (v == null ? 'text-slate-500' : v >= 100 ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'bg-red-500/15 text-red-300 font-bold');

export function SpgPerformanceTable({ rows, search, single }) {
  const [sort, setSort] = useState({ key: 'monthAch', dir: -1 });
  const p = single ? 'Today' : 'Periode';
  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'region', label: 'Region' },
    { key: 'target', label: 'Monthly Target', fmt: idr },
    { key: 'monthlyOmzet', label: 'Monthly Omzet', fmt: idr },
    { key: 'monthAch', label: 'Month Ach %', ach: true },
    { key: 'periodTarget', label: `${p} Target`, fmt: idr },
    { key: 'periodOmzet', label: `${p} Omzet`, fmt: idr },
    { key: 'periodAch', label: `${p} Ach %`, ach: true },
    { key: 'customers', label: 'Customer Count', fmt: num },
    { key: 'transactions', label: 'Transactions', fmt: num },
  ];
  const view = useMemo(
    () => rows
      .filter((r) => matches(search, r.spg_code, r.name, r.storeName, r.store_code, r.region, r.area))
      .sort((a, b) => {
        const x = a[sort.key] ?? -1;
        const y = b[sort.key] ?? -1;
        return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
      }),
    [rows, search, sort],
  );
  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }));
  const Th = ({ k, label, frozen }) => (
    <th className={`th cursor-pointer select-none ${frozen ? 'left-0 z-30 border-r border-slate-700' : ''}`} onClick={() => toggle(k)} data-testid={`spg-table-sort-${k}`}>
      <span className="inline-flex items-center gap-1">{label}<ArrowDownUp className={`h-3 w-3 ${sort.key === k ? 'text-blue-300' : 'opacity-30'}`} /></span>
    </th>
  );

  return (
    <Card title="SPG Performance Table" subtitle={`${view.length} SPG · hijau = Ach ≥ 100%, merah = di bawah target`} icon={Users} bodyClass="p-0" testId="spg-performance-table">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th k="spg_code" label="SPG Code" frozen />
              {cols.map((c) => <Th key={c.key} k={c.key} label={c.label} />)}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => {
              const bg = i % 2 ? 'row-odd' : 'row-even';
              return (
                <tr key={r.spg_code} className="group" data-testid={`spg-performance-table-row-${i}`}>
                  <td className={`td sticky left-0 z-10 border-r border-slate-700 font-mono font-semibold text-blue-200 group-hover:bg-elevated ${bg}`}>{r.spg_code}</td>
                  {cols.map((c) => (
                    <td key={c.key} className={`td group-hover:bg-elevated ${bg} ${c.fmt ? 'text-right font-mono' : ''} ${c.ach ? `text-right font-mono ${achClass(r[c.key])}` : ''}`}>
                      {c.ach ? (r[c.key] == null ? '-' : pct(r[c.key])) : c.fmt ? c.fmt(r[c.key]) : (
                        <span className={c.key === 'name' ? 'font-medium text-slate-100' : 'text-slate-300'}>{r[c.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!view.length && <EmptyState text="Tidak ada SPG yang cocok dengan filter." testId="spg-table-empty" />}
      </div>
    </Card>
  );
}
