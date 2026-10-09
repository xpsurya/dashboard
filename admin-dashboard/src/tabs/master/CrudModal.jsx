import { useState } from 'react';
import { Save } from 'lucide-react';
import { Field, Modal } from '../../components/common/ui';
import { db } from '../../lib/dataService';
import { MASTER_TABLES, missingRequired, normalizeRow } from '../../lib/schema';

export function CrudModal({ table, record, existing, onClose, onSaved }) {
  const schema = MASTER_TABLES[table];
  const isEdit = Boolean(record);
  const [form, setForm] = useState(() => (isEdit ? { ...record } : Object.fromEntries(schema.fields.map((f) => [f.key, f.options?.[0] ?? '']))));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const missing = missingRequired(schema, form);
    if (missing.length) return setError(`Wajib diisi: ${missing.join(', ')}`);
    const payload = normalizeRow(schema, form);
    if (!isEdit && existing.some((r) => String(r[schema.pk]) === String(payload[schema.pk]))) {
      return setError(`Primary key "${payload[schema.pk]}" sudah ada.`);
    }
    setSaving(true);
    try {
      if (isEdit) {
        const { [schema.pk]: _omit, ...patch } = payload;
        await db.update(table, schema.pk, record[schema.pk], patch);
      } else {
        await db.insert(table, payload);
      }
      onSaved(isEdit ? 'diperbarui' : 'ditambahkan');
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
    return null;
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Tambah'} ${schema.label}`}
      testId="crud-modal"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} data-testid="crud-modal-cancel-button">Batal</button>
          <button className="btn-accent" onClick={save} disabled={saving} data-testid="crud-modal-save-button"><Save className="h-4 w-4" /> {saving ? 'Menyimpan…' : 'Simpan'}</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.map((f) => (
          <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}${f.key === schema.pk ? ' (PK)' : ''}`}>
            {f.type === 'select' ? (
              <select className="input" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} data-testid={`crud-field-${f.key}`}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="input disabled:opacity-60"
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                value={form[f.key] ?? ''}
                disabled={isEdit && f.key === schema.pk}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={String(f.sample ?? '')}
                data-testid={`crud-field-${f.key}`}
              />
            )}
          </Field>
        ))}
      </div>
      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" data-testid="crud-modal-error">{error}</p>}
    </Modal>
  );
}
