import { useCallback, useMemo, useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Badge, Card, EmptyState, Field } from '../../components/common/ui';
import { fmtDateTime, matches, num } from '../../lib/format';
import { Lightbox } from './Lightbox';

const ATT_FIELDS = [
  { id: 'display_a', label: 'Foto Pajangan A', field: 'photo_display_a_url', tone: 'green' },
  { id: 'display_b', label: 'Foto Pajangan B', field: 'photo_display_b_url', tone: 'green' },
  { id: 'display_c', label: 'Foto Pajangan C', field: 'photo_display_c_url', tone: 'green' },
];
const CATEGORIES = [{ id: 'all', label: 'Semua Foto' }, ...ATT_FIELDS];

export default function PhotoGallery() {
  const { data, filters, spgMap, storeMap, geoOk, inPeriod } = useDashboard();
  const [cat, setCat] = useState('all');
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(48);
  const [open, setOpen] = useState(null);

  const photos = useMemo(() => {
    const inDate = (d) => (date ? d === date : inPeriod(d));
    const meta = (r) => {
      const spg = spgMap.get(r.spg_code);
      return { spgCode: r.spg_code, spgName: spg?.name ?? r.spg_code, storeName: storeMap.get(r.store_code)?.store_name ?? r.store_code, ok: !spg || geoOk(spg) };
    };
    const list = [];
    data.attendance.forEach((a) => {
      if (!inDate(a.work_date)) return;
      const m = meta(a);
      if (!m.ok) return;
      ATT_FIELDS.forEach((f) => {
        if ((cat === 'all' || cat === f.id) && a[f.field]) list.push({ id: `${a.id}-${f.id}`, url: a[f.field], label: f.label, tone: f.tone, time: a.checkin_time, ...m });
      });
    });
    const term = q || filters.search;
    return list.filter((p) => matches(term, p.spgCode, p.spgName, p.storeName, p.extra)).sort((a, b) => String(b.time).localeCompare(String(a.time)));
  }, [data.attendance, cat, date, q, filters.search, inPeriod, spgMap, storeMap, geoOk]);

  const nav = useCallback((step) => setOpen((i) => (i + step + photos.length) % photos.length), [photos.length]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="space-y-5" data-testid="photo-gallery-view">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <Field label="Kategori Foto" className="w-full sm:w-56">
          <select className="input" value={cat} onChange={(e) => { setCat(e.target.value); setLimit(48); }} data-testid="photo-category-select">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Tanggal (kosong = periode global)" className="w-full sm:w-52">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} data-testid="photo-date-input" />
        </Field>
        <Field label="Cari SPG / Store" className="min-w-[220px] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input className="input pl-9" placeholder="Nama SPG, kode SPG, atau store…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="photo-search-input" />
          </div>
        </Field>
        {date && <button className="btn-ghost" onClick={() => setDate('')} data-testid="photo-date-clear-button">Reset Tanggal</button>}
      </div>

      <Card title="Photo Gallery Viewer" subtitle={`${num(photos.length)} foto ditemukan`} icon={Camera} testId="photo-gallery-grid">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {photos.slice(0, limit).map((p, i) => (
            <button key={p.id} onClick={() => setOpen(i)} className="group overflow-hidden rounded-xl border border-slate-700/70 bg-[#111a35] text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-400/60" data-testid={`photo-card-${i}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                <img src={p.url} alt={p.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-2 top-2"><Badge tone={p.tone}>{p.label.replace('Foto ', '')}</Badge></span>
              </div>
              <div className="space-y-0.5 p-2.5">
                <p className="truncate text-sm font-semibold text-slate-100">{p.spgName}</p>
                <p className="truncate text-[11px] text-slate-400">{p.storeName}</p>
                <p className="font-mono text-[10px] text-slate-500">{fmtDateTime(p.time)}</p>
              </div>
            </button>
          ))}
        </div>
        {!photos.length && <EmptyState text="Tidak ada foto untuk filter ini." testId="photo-gallery-empty" />}
        {photos.length > limit && (
          <div className="mt-4 text-center">
            <button className="btn-ghost" onClick={() => setLimit((l) => l + 48)} data-testid="photo-load-more-button">Muat lebih banyak ({num(photos.length - limit)} lagi)</button>
          </div>
        )}
      </Card>
      {open != null && <Lightbox photos={photos} index={open} onClose={close} onNav={nav} />}
    </div>
  );
}
