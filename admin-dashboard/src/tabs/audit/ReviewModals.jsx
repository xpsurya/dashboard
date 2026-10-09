import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Field, Modal } from '../../components/common/ui';
import { toLocalInput } from '../../lib/dates';
import { idr } from '../../lib/format';

export function ReviewEditModal({ kind, record, onClose, onSubmit, busy }) {
  const [form, setForm] = useState(() => (kind === 'sales'
    ? { buyer_name: record.buyer_name ?? '', buyer_phone: record.buyer_phone ?? '', total_omzet: record.total_omzet ?? 0 }
    : { checkin_time: toLocalInput(record.checkin_time), checkout_time: toLocalInput(record.checkout_time) }));
  const [note, setNote] = useState('Koreksi input data oleh leader');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    let patch;
    if (kind === 'sales') {
      patch = { buyer_name: form.buyer_name, buyer_phone: form.buyer_phone, total_omzet: Number(form.total_omzet) || 0 };
    } else {
      const cin = form.checkin_time ? new Date(form.checkin_time) : null;
      const cout = form.checkout_time ? new Date(form.checkout_time) : null;
      patch = {
        checkin_time: cin?.toISOString() ?? null,
        checkout_time: cout?.toISOString() ?? null,
        work_duration_minutes: cin && cout ? Math.max(0, Math.round((cout - cin) / 60000)) : null,
      };
    }
    onSubmit(patch, note);
  };

  return (
    <Modal open onClose={onClose} title={`Update (Field Correction) · ${record.trx_id ?? record.spg_code}`} testId="review-edit-modal"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} data-testid="review-edit-cancel-button">Batal</button>
          <button className="btn-warn" onClick={submit} disabled={busy} data-testid="review-edit-save-button"><Save className="h-4 w-4" /> Simpan Koreksi (−5 pts)</button>
        </>
      }>
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === 'sales' ? (
          <>
            <Field label="Nama Pembeli"><input className="input" value={form.buyer_name} onChange={(e) => set('buyer_name', e.target.value)} data-testid="review-edit-buyer-name" /></Field>
            <Field label="No. HP Pembeli"><input className="input" value={form.buyer_phone} onChange={(e) => set('buyer_phone', e.target.value)} data-testid="review-edit-buyer-phone" /></Field>
            <Field label={`Total Omzet (awal ${idr(record.total_omzet)})`}><input type="number" className="input" value={form.total_omzet} onChange={(e) => set('total_omzet', e.target.value)} data-testid="review-edit-total-omzet" /></Field>
          </>
        ) : (
          <>
            <Field label="Check-in Time"><input type="datetime-local" className="input" value={form.checkin_time} onChange={(e) => set('checkin_time', e.target.value)} data-testid="review-edit-checkin" /></Field>
            <Field label="Checkout Time"><input type="datetime-local" className="input" value={form.checkout_time} onChange={(e) => set('checkout_time', e.target.value)} data-testid="review-edit-checkout" /></Field>
          </>
        )}
        <Field label="Catatan Leader" className="sm:col-span-2"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} data-testid="review-edit-note" /></Field>
      </div>
      <p className="mt-4 text-xs text-amber-300">Koreksi oleh leader dicatat sebagai careless entry: −5 poin kedisiplinan SPG.</p>
    </Modal>
  );
}

export function ReviewDeleteModal({ record, onClose, onSubmit, busy }) {
  const [note, setNote] = useState('Indikasi transaksi fiktif / fraud');
  return (
    <Modal open size="sm" onClose={onClose} title="Flag Fraud & Delete" testId="review-delete-modal"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} data-testid="review-delete-cancel-button">Batal</button>
          <button className="btn-danger" onClick={() => onSubmit(note)} disabled={busy} data-testid="review-delete-confirm-button"><Trash2 className="h-4 w-4" /> Flag & Delete (−25 pts)</button>
        </>
      }>
      <p className="text-sm text-slate-300">Record <span className="font-mono font-bold text-white">{record.trx_id ?? record.id}</span> akan ditandai <b className="text-red-300">DELETED (fraud/fake)</b> dan dikeluarkan dari perhitungan omzet.</p>
      <Field label="Alasan" className="mt-4"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} data-testid="review-delete-note" /></Field>
    </Modal>
  );
}
