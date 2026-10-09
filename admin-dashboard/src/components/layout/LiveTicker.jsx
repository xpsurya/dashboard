import { Radio } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { fmtTime, idr } from '../../lib/format';

function describe(e, spgMap, storeMap) {
  const r = e.record || {};
  const name = spgMap.get(r.spg_code)?.name ?? r.spg_code ?? 'SPG';
  const store = storeMap.get(r.store_code)?.store_name ?? r.store_code ?? '';
  if (e.table === 'attendance_logs') {
    if (e.type === 'INSERT') return `${name} check-in di ${store}`;
    return r.checkout_time ? `${name} checkout dari ${store}` : `Absensi ${name} diperbarui`;
  }
  if (e.type === 'INSERT') return `${name} input transaksi ${r.trx_id} · ${idr(r.total_omzet)}`;
  return `Transaksi ${r.trx_id ?? ''} → ${r.status ?? 'diperbarui'}`;
}

export function LiveTicker() {
  const { realtime, spgMap, storeMap } = useDashboard();
  const live = realtime.status === 'SUBSCRIBED';
  const e = realtime.events[0];
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 bg-[#0c1530] px-4 py-2 text-xs md:px-6" data-testid="live-event-ticker">
      <span className={`flex shrink-0 items-center gap-1.5 font-bold tracking-wider ${live ? 'text-emerald-300' : 'text-amber-300'}`}>
        <Radio className="h-3.5 w-3.5" /> LIVE FEED
      </span>
      {e ? (
        <p key={e.id} className="fade-up min-w-0 truncate text-slate-200" data-testid="live-event-latest">
          <span className="mr-2 font-mono text-slate-500">{fmtTime(e.at.toISOString())}</span>
          {describe(e, spgMap, storeMap)}
        </p>
      ) : (
        <p className="truncate text-slate-500">{live ? 'Menunggu check-in / transaksi baru…' : 'Menghubungkan ke Supabase Realtime…'}</p>
      )}
      <span className="ml-auto shrink-0 font-mono text-slate-500" data-testid="live-event-count">{realtime.events.length} event</span>
    </div>
  );
}
