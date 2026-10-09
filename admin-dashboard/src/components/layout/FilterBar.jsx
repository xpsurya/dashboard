import { RotateCcw, Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { monthBounds, toISODate } from '../../lib/dates';
import { Field } from '../common/ui';

export function FilterBar() {
  const { filters, setFilters, geo } = useDashboard();
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const setMode = (mode) => set(mode === 'single' ? { mode, dateFrom: filters.dateTo } : { mode, dateFrom: monthBounds(filters.dateTo).start });
  const setFrom = (v) => v && set({ dateFrom: v, dateTo: v > filters.dateTo ? v : filters.dateTo });
  const setTo = (v) => v && set({ dateTo: v, dateFrom: v < filters.dateFrom ? v : filters.dateFrom });
  const reset = () => { const t = toISODate(); setFilters({ region: 'ALL', mode: 'single', dateFrom: t, dateTo: t, search: '' }); };

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-slate-800 bg-[#0E1733] px-4 py-3 md:px-6" data-testid="global-filter-bar">
      <Field label="Region / Area" className="w-full sm:w-56">
        <select className="input" value={filters.region} onChange={(e) => set({ region: e.target.value })} data-testid="global-filter-region-select">
          <option value="ALL">Semua Region / Area</option>
          {geo.map((g) => (
            <optgroup key={g.region} label={g.region}>
              <option value={`R:${g.region}`}>{g.region} (Semua Area)</option>
              {g.areas.map((a) => <option key={a} value={`A:${a}`}>— {a}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Mode Tanggal">
        <div className="flex h-9 rounded-lg border border-slate-700 bg-[#111a35] p-0.5">
          {[['single', 'Single Date'], ['range', 'Date Range']].map(([m, l]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 text-xs font-semibold transition-colors ${filters.mode === m ? 'bg-brand text-white' : 'text-slate-400 hover:text-slate-200'}`}
              data-testid={`date-mode-${m}-button`}
            >
              {l}
            </button>
          ))}
        </div>
      </Field>
      {filters.mode === 'single' ? (
        <Field label="Tanggal" className="w-40">
          <input type="date" className="input" value={filters.dateTo} onChange={(e) => e.target.value && set({ dateFrom: e.target.value, dateTo: e.target.value })} data-testid="global-filter-date-single" />
        </Field>
      ) : (
        <>
          <Field label="Dari" className="w-40">
            <input type="date" className="input" value={filters.dateFrom} onChange={(e) => setFrom(e.target.value)} data-testid="global-filter-date-from" />
          </Field>
          <Field label="Sampai" className="w-40">
            <input type="date" className="input" value={filters.dateTo} onChange={(e) => setTo(e.target.value)} data-testid="global-filter-date-to" />
          </Field>
        </>
      )}
      <Field label="Global Search" className="min-w-[220px] flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input className="input pl-9" placeholder="Cari SPG, Store, SKU…" value={filters.search} onChange={(e) => set({ search: e.target.value })} data-testid="global-search-input" />
        </div>
      </Field>
      <button className="btn-ghost" onClick={reset} data-testid="reset-filters-button">
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}
