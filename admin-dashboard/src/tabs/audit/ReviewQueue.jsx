import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Badge, Card, EmptyState } from '../../components/common/ui';
import { validateRecord } from '../../lib/validationActions';
import { duration, fmtDate, fmtDateTime, fmtTime, hours, idr, matches } from '../../lib/format';
import config from '../../lib/config';
import { ReviewDeleteModal, ReviewEditModal } from './ReviewModals';
import { Lightbox } from '../photos/Lightbox';

const waitHours = (iso) => (iso ? (Date.now() - new Date(iso)) / 3600000 : 0);

function Actions({ id, busy, onApprove, onEdit, onDelete }) {
  return (
    <div className="inline-flex gap-1.5">
      <button className="btn-success btn-sm" disabled={busy} onClick={onApprove} data-testid={`review-approve-${id}`}><Check className="h-3.5 w-3.5" /> Approve</button>
      <button className="btn-warn btn-sm" disabled={busy} onClick={onEdit} data-testid={`review-update-${id}`}><Pencil className="h-3.5 w-3.5" /> Update</button>
      <button className="btn-danger btn-sm" disabled={busy} onClick={onDelete} data-testid={`review-delete-${id}`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
    </div>
  );
}

function PhotoThumb({ url, label, onOpen, testId }) {
  if (!url) {
    return <span className="inline-flex h-10 w-14 items-center justify-center rounded-md border border-dashed border-slate-700 text-slate-600" title="Tidak ada foto"><ImageOff className="h-4 w-4" /></span>;
  }
  return (
    <button type="button" onClick={onOpen} className="group relative block h-10 w-14 cursor-zoom-in overflow-hidden rounded-md border border-slate-700 ring-blue-400/60 transition hover:ring-2" title={`Lihat ${label}`} data-testid={testId}>
      <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
    </button>
  );
}

export function ReviewQueue() {
  const { data, spgMap, storeMap, geoOk, filters, refresh } = useDashboard();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const [kind, setKind] = useState('sales');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [photo, setPhoto] = useState(null);

  const pending = useMemo(() => {
    const scope = (r) => {
      const s = spgMap.get(r.spg_code);
      const mine = isAdmin || String(s?.leader_email ?? '').toLowerCase() === String(user.email).toLowerCase();
      return s && mine && geoOk(s) && matches(filters.search, r.spg_code, s.name, storeMap.get(r.store_code)?.store_name, r.trx_id);
    };
    const sort = (a, b) => String(a.email_sent_at).localeCompare(String(b.email_sent_at));
    return {
      sales: data.sales.filter((o) => o.status === 'PENDING' && scope(o)).sort(sort),
      attendance: data.attendance.filter((a) => a.validation_status === 'PENDING' && scope(a)).sort(sort),
    };
  }, [data.sales, data.attendance, spgMap, storeMap, geoOk, filters.search, isAdmin, user.email]);
  const rows = pending[kind];

  const run = async (record, action, opts = {}) => {
    setBusyId(record.id);
    try {
      await validateRecord(kind, record, action, { ...opts, leader: { leader_name: user.name, leader_email: user.email } });
      toast(`${record.trx_id ?? record.spg_code}: ${action === 'APPROVE' ? 'Approved' : action === 'UPDATE' ? 'Updated (−5 pts)' : 'Deleted / fraud flagged (−25 pts)'}`);
      await refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusyId(null);
    setEditing(null);
    setDeleting(null);
  };

  const sla = (iso) => {
    const h = waitHours(iso);
    return <Badge tone={h > config.slaOverdueHours ? 'red' : h > config.slaOverdueHours / 2 ? 'yellow' : 'slate'}>{hours(h)}</Badge>;
  };
  const head = kind === 'sales'
    ? ['TRX ID', 'SPG', 'Store', 'Buyer', 'Items', 'Total Omzet', 'Foto Nota', 'Submitted', 'Menunggu', 'Aksi']
    : ['Tanggal', 'SPG', 'Store', 'Check-in', 'Checkout', 'Durasi', 'Foto Absen', 'Submitted', 'Menunggu', 'Aksi'];

  return (
    <Card title="Leader Review Queue" subtitle={`${pending.sales.length} transaksi & ${pending.attendance.length} absensi menunggu validasi · ${isAdmin ? 'semua SPG (admin)' : 'SPG binaan Anda'}`} icon={ClipboardCheck} bodyClass="p-0" testId="leader-review-queue"
      actions={
        <div className="flex rounded-lg border border-slate-700 bg-[#111a35] p-0.5">
          {[['sales', `Transaksi (${pending.sales.length})`], ['attendance', `Absensi (${pending.attendance.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${kind === k ? 'bg-brand text-white' : 'text-slate-400 hover:text-slate-200'}`} data-testid={`review-kind-${k}`}>{l}</button>
          ))}
        </div>
      }>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr>{head.map((h, i) => <th key={h} className={`th ${i === head.length - 1 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const spg = spgMap.get(r.spg_code);
              const store = storeMap.get(r.store_code)?.store_name ?? r.store_code;
              const bg = i % 2 ? 'row-odd' : 'row-even';
              const props = { id: r.id, busy: busyId === r.id, onApprove: () => run(r, 'APPROVE'), onEdit: () => setEditing(r), onDelete: () => setDeleting(r) };
              return (
                <tr key={r.id} className={bg} data-testid={`review-row-${i}`}>
                  {kind === 'sales' ? (
                    <>
                      <td className="td font-mono text-xs text-blue-200">{r.trx_id}</td>
                      <td className="td text-slate-100">{spg?.name}</td>
                      <td className="td text-slate-300">{store}</td>
                      <td className="td text-slate-300">{r.buyer_name}</td>
                      <td className="td text-center font-mono">{r.sales_order_items?.length ?? 0}</td>
                      <td className="td text-right font-mono text-emerald-300">{idr(r.total_omzet)}</td>
                      <td className="td">
                        <PhotoThumb url={r.receipt_photo_url} label="Foto Nota" testId={`review-photo-${i}`}
                          onOpen={() => setPhoto({ url: r.receipt_photo_url, label: 'Foto Nota Penjualan', spgName: spg?.name ?? r.spg_code, storeName: store, time: r.created_at, extra: `${r.trx_id} · ${idr(r.total_omzet)}` })} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="td text-slate-400">{fmtDate(r.work_date)}</td>
                      <td className="td text-slate-100">{spg?.name}</td>
                      <td className="td text-slate-300">{store}</td>
                      <td className="td font-mono text-emerald-300">{fmtTime(r.checkin_time)}</td>
                      <td className="td font-mono text-blue-300">{fmtTime(r.checkout_time)}</td>
                      <td className="td font-mono">{duration(r.work_duration_minutes)}</td>
                      <td className="td">
                        <PhotoThumb url={r.photo_checkin_url} label="Foto Absen" testId={`review-photo-${i}`}
                          onOpen={() => setPhoto({ url: r.photo_checkin_url, label: 'Foto Absen Masuk', spgName: spg?.name ?? r.spg_code, storeName: store, time: r.checkin_time, extra: `${fmtDate(r.work_date)} · In ${fmtTime(r.checkin_time)} · Out ${fmtTime(r.checkout_time)}` })} />
                      </td>
                    </>
                  )}
                  <td className="td font-mono text-xs text-slate-400">{fmtDateTime(r.email_sent_at)}</td>
                  <td className="td">{sla(r.email_sent_at)}</td>
                  <td className="td text-right"><Actions {...props} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="Antrian kosong — semua sudah tervalidasi." testId="review-queue-empty" />}
      </div>
      {editing && <ReviewEditModal kind={kind} record={editing} busy={busyId === editing.id} onClose={() => setEditing(null)} onSubmit={(patch, note) => run(editing, 'UPDATE', { patch, note })} />}
      {photo && <Lightbox photos={[photo]} onClose={() => setPhoto(null)} />}
      {deleting && <ReviewDeleteModal record={deleting} busy={busyId === deleting.id} onClose={() => setDeleting(null)} onSubmit={(note) => run(deleting, 'DELETE', { note })} />}
    </Card>
  );
}
