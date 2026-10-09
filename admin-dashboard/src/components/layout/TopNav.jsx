import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, FileImage, FileSpreadsheet, FileText, LoaderCircle, Radar, RefreshCw, Tv } from 'lucide-react';
import { EXPORT_OPTIONS, buildRawExports, downloadCsv, toCsv } from '../../lib/csvExport';
import { fmtDate, num } from '../../lib/format';
import { useToast } from '../common/Toast';
import { useDashboard } from '../../context/DashboardContext';
import config from '../../lib/config';
import { isMock } from '../../lib/supabase';
import { UserMenu } from '../auth/UserMenu';

function RealtimePill({ status }) {
  const on = status === 'SUBSCRIBED';
  return (
    <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider sm:inline-flex ${on ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-300'}`} data-testid="realtime-status-indicator">
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {on ? `REALTIME${isMock ? ' (SIMULASI)' : ''}` : `REALTIME ${status}`}
    </span>
  );
}

const CONN = {
  mock: { dot: 'bg-amber-400 text-amber-400', text: 'DEMO MODE · MOCK DATA', ring: 'border-amber-500/40 bg-amber-500/10 text-amber-200' },
  online: { dot: 'bg-emerald-400 text-emerald-400', text: 'LIVE · Supabase', ring: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' },
  offline: { dot: 'bg-red-500 text-red-500', text: 'OFFLINE', ring: 'border-red-500/40 bg-red-500/10 text-red-200' },
  connecting: { dot: 'bg-slate-400 text-slate-400', text: 'CONNECTING…', ring: 'border-slate-600 bg-slate-700/30 text-slate-300' },
};

function ConnectionPill({ connection }) {
  const c = CONN[connection];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider ${c.ring}`} data-testid="live-connection-indicator">
      <span className={`pulse-dot h-2 w-2 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}

function ExportMenu({ onExport, exporting }) {
  const ctx = useDashboard();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(() => new Set(['selling']));
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const { filters } = ctx;

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const builders = useMemo(() => (open ? buildRawExports(ctx) : null), [open, ctx]);
  const counts = useMemo(() => {
    if (!builders) return {};
    return Object.fromEntries(EXPORT_OPTIONS.map((o) => [o.id, builders[o.id]().rows.length]));
  }, [builders]);

  const toggle = (id) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const allOn = picked.size === EXPORT_OPTIONS.length;
  const run = (fmt) => { setOpen(false); onExport(fmt); };

  const downloadSelected = async () => {
    setBusy(true);
    try {
      const period = filters.dateFrom === filters.dateTo ? filters.dateFrom : `${filters.dateFrom}_sd_${filters.dateTo}`;
      const list = EXPORT_OPTIONS.filter((o) => picked.has(o.id));
      const done = [];
      const empty = [];
      for (const o of list) {
        const { columns, rows } = builders[o.id]();
        if (!rows.length) { empty.push(o.label.replace('Raw ', '')); continue; }
        downloadCsv(`raw_${o.id}_${period}.csv`, toCsv(columns, rows));
        done.push(o.label.replace('Raw ', ''));
        await new Promise((r) => setTimeout(r, 350));
      }
      const skip = empty.length ? ` · dilewati (0 baris): ${empty.join(', ')}` : '';
      if (done.length) toast(`${done.length} file CSV berhasil diunduh (${done.join(', ')})${skip}`);
      else toast(`Tidak ada data pada periode ini${skip}`, 'error');
      if (done.length) setOpen(false);
    } catch (e) {
      toast(`Export CSV gagal: ${e.message}`, 'error');
    }
    setBusy(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost" onClick={() => setOpen((o) => !o)} disabled={exporting || busy} data-testid="export-dashboard-button">
        {exporting || busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden md:inline">Export</span>
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-xl border border-slate-700 bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[340px]" data-testid="export-menu">
          <div className="border-b border-slate-700 px-4 py-3">
            <p className="flex items-center gap-2 font-heading text-sm font-semibold text-white"><FileSpreadsheet className="h-4 w-4 text-emerald-300" /> Export Raw Data (CSV)</p>
            <p className="mt-0.5 text-[11px] text-slate-400" data-testid="export-period-label">
              Periode {fmtDate(filters.dateFrom)}{filters.dateFrom !== filters.dateTo ? ` – ${fmtDate(filters.dateTo)}` : ''} · {filters.region === 'ALL' ? 'Semua Region' : filters.region.slice(2)}
            </p>
          </div>
          <div className="space-y-1 p-2">
            <button type="button" onClick={() => setPicked(allOn ? new Set() : new Set(EXPORT_OPTIONS.map((o) => o.id)))} className="w-full px-2 py-1 text-left text-[11px] font-semibold text-blue-300 hover:text-blue-200" data-testid="export-select-all">
              {allOn ? 'Hapus semua pilihan' : 'Pilih semua'}
            </button>
            {EXPORT_OPTIONS.map((o) => {
              const on = picked.has(o.id);
              return (
                <button key={o.id} type="button" onClick={() => toggle(o.id)} role="checkbox" aria-checked={on}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${on ? 'border-blue-500/50 bg-blue-500/10' : 'border-transparent hover:bg-elevated'}`}
                  data-testid={`export-option-${o.id}`}>
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-500'}`}>{on && <Check className="h-3 w-3" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-100">{o.label}<span className="font-mono text-[10px] font-normal text-slate-500" data-testid={`export-count-${o.id}`}>{num(counts[o.id])} baris</span></span>
                    <span className="block text-[11px] leading-snug text-slate-400">{o.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-700 p-3">
            <button className="btn-accent w-full justify-center" disabled={!picked.size || busy} onClick={downloadSelected} data-testid="export-csv-download-button">
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download CSV ({picked.size})
            </button>
          </div>
          <div className="flex gap-1 border-t border-slate-700 bg-ink/40 px-2 py-2">
            <span className="self-center px-2 text-[10px] uppercase tracking-wider text-slate-500">Snapshot</span>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-300 hover:bg-elevated" onClick={() => run('png')} data-testid="export-png-button">
              <FileImage className="h-3.5 w-3.5 text-blue-300" /> PNG
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-300 hover:bg-elevated" onClick={() => run('pdf')} data-testid="export-pdf-button">
              <FileText className="h-3.5 w-3.5 text-red-300" /> PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopNav({ kiosk, onToggleKiosk, onExport, exporting }) {
  const { status, realtime, autoRefresh, setAutoRefresh, refresh } = useDashboard();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-ink/95 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 md:gap-3 md:px-6">
        <div className="mr-auto flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand shadow-lg shadow-blue-950/60 ring-1 ring-blue-400/30">
            <Radar className="h-5 w-5 text-blue-200" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-bold tracking-tight text-white md:text-xl" data-testid="brand-name">{config.brandName}</h1>
            <p className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:block">{config.brandTagline}</p>
          </div>
        </div>
        <ConnectionPill connection={status.connection} />
        <RealtimePill status={realtime.status} />
        <div className="text-xs text-slate-400" data-testid="last-sync-timestamp">
          Last Sync{' '}
          <span className="font-mono text-slate-200">{status.lastSync ? status.lastSync.toLocaleTimeString('id-ID') : '—'}</span>
        </div>
        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500"
          data-testid="auto-refresh-toggle"
          aria-pressed={autoRefresh}
        >
          <span className={`relative h-4 w-7 rounded-full transition-colors ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-600'}`}>
            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </span>
          Auto {config.autoRefreshSeconds}s
        </button>
        <button className="btn-ghost px-2.5" onClick={refresh} title="Refresh data" data-testid="manual-refresh-button">
          <RefreshCw className={`h-4 w-4 ${status.loading ? 'animate-spin' : ''}`} />
        </button>
        <button className={kiosk ? 'btn-accent' : 'btn-ghost'} onClick={onToggleKiosk} data-testid="kiosk-mode-toggle-button">
          <Tv className="h-4 w-4" />
          <span className="hidden md:inline">{kiosk ? 'Exit Kiosk' : 'TV / Kiosk Mode'}</span>
        </button>
        <ExportMenu onExport={onExport} exporting={exporting} />
        <UserMenu />
      </div>
    </header>
  );
}
