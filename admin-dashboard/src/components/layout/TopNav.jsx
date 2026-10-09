import { useState } from 'react';
import { Download, FileImage, FileText, LoaderCircle, Radar, RefreshCw, Tv } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const run = (fmt) => { setOpen(false); onExport(fmt); };
  return (
    <div className="relative">
      <button className="btn-ghost" onClick={() => setOpen((o) => !o)} disabled={exporting} data-testid="export-dashboard-button">
        {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden md:inline">Export</span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-lg border border-slate-700 bg-surface shadow-2xl">
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated" onClick={() => run('png')} data-testid="export-png-button">
            <FileImage className="h-4 w-4 text-blue-300" /> Export PNG
          </button>
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated" onClick={() => run('pdf')} data-testid="export-pdf-button">
            <FileText className="h-4 w-4 text-red-300" /> Export PDF
          </button>
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
