import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Table2, Trash2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useToast } from '../../components/common/Toast';
import { Card, EmptyState, Modal } from '../../components/common/ui';
import { db } from '../../lib/dataService';
import { matches, num } from '../../lib/format';
import { MASTER_TABLES } from '../../lib/schema';
import { CrudModal } from './CrudModal';

const display = (f, v) => (v == null || v === '' ? <span className="text-slate-600">—</span> : f.type === 'number' ? num(v) : String(v));

export function MasterTable({ table }) {
  const { data, refresh, filters } = useDashboard();
  const toast = useToast();
  const schema = MASTER_TABLES[table];
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(
    () => data[table].filter((r) => matches(q || filters.search, ...schema.fields.map((f) => r[f.key]))),
    [data, table, q, filters.search, schema],
  );

  const onSaved = async (verb) => {
    setEditing(null);
    toast(`${schema.label} berhasil ${verb}`);
    await refresh();
  };
  const confirmDelete = async () => {
    setBusy(true);
    try {
      await db.remove(table, schema.pk, deleting[schema.pk]);
      toast(`${deleting[schema.pk]} dihapus`);
      await refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
    setDeleting(null);
  };

  return (
    <Card title={`${schema.label} Table`} subtitle={`${rows.length} record`} icon={Table2} bodyClass="p-0" testId={`master-table-${table}`}
      actions={
        <>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input className="input pl-9" placeholder={`Cari ${schema.label}…`} value={q} onChange={(e) => setQ(e.target.value)} data-testid="master-table-search-input" />
          </div>
          <button className="btn-accent" onClick={() => setEditing({})} data-testid="master-add-button"><Plus className="h-4 w-4" /> Tambah</button>
        </>
      }>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {schema.fields.map((f, i) => <th key={f.key} className={`th ${i === 0 ? 'left-0 z-30 border-r border-slate-700' : ''}`}>{f.label}</th>)}
              <th className="th text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const bg = i % 2 ? 'row-odd' : 'row-even';
              return (
                <tr key={r[schema.pk]} className="group" data-testid={`master-row-${r[schema.pk]}`}>
                  {schema.fields.map((f, j) => (
                    <td key={f.key} className={`td group-hover:bg-elevated ${bg} ${j === 0 ? 'sticky left-0 z-10 border-r border-slate-700 font-mono font-semibold text-blue-200' : 'text-slate-300'} ${f.type === 'number' ? 'text-right font-mono' : ''}`}>
                      {display(f, r[f.key])}
                    </td>
                  ))}
                  <td className={`td text-right group-hover:bg-elevated ${bg}`}>
                    <div className="inline-flex gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing({ record: r })} data-testid={`master-edit-${r[schema.pk]}`}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button className="btn-sm btn border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20" onClick={() => setDeleting(r)} data-testid={`master-delete-${r[schema.pk]}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="Belum ada data." testId="master-table-empty" />}
      </div>
      {editing && <CrudModal table={table} record={editing.record} existing={data[table]} onClose={() => setEditing(null)} onSaved={onSaved} />}
      <Modal open={Boolean(deleting)} size="sm" onClose={() => setDeleting(null)} title="Hapus Data?" testId="master-delete-modal"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDeleting(null)} data-testid="master-delete-cancel-button">Batal</button>
            <button className="btn-danger" onClick={confirmDelete} disabled={busy} data-testid="master-delete-confirm-button"><Trash2 className="h-4 w-4" /> Hapus</button>
          </>
        }>
        <p className="text-sm text-slate-300">Data <span className="font-mono font-bold text-white">{deleting?.[schema.pk]}</span> akan dihapus permanen dari tabel <span className="font-mono">{table}</span>.</p>
      </Modal>
    </Card>
  );
}
