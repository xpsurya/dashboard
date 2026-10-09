import { useRef, useState } from 'react';
import { FileDown, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useToast } from '../../components/common/Toast';
import { Badge, Card, Modal } from '../../components/common/ui';
import { downloadTemplate, parseWorkbook, processBulk } from '../../lib/excelEngine';
import { MASTER_TABLES } from '../../lib/schema';

function UploadReport({ report, onClose }) {
  return (
    <Modal open size="lg" onClose={onClose} title={`Upload Summary Report · ${report.fileName}`} testId="upload-report-modal"
      footer={<button className="btn-accent" onClick={onClose} data-testid="upload-report-done-button">Selesai</button>}>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-[#111a35] p-3"><p className="label">Total Baris</p><p className="font-mono text-2xl font-bold text-white" data-testid="upload-report-total">{report.total}</p></div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><p className="label">Berhasil</p><p className="font-mono text-2xl font-bold text-emerald-300" data-testid="upload-report-success">{report.success}</p></div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3"><p className="label">Gagal</p><p className="font-mono text-2xl font-bold text-red-300" data-testid="upload-report-failed">{report.failed}</p></div>
        <div className="rounded-lg border border-slate-700 bg-[#111a35] p-3 text-xs text-slate-300">
          {report.summary.map((s) => <p key={s.aksi} className="flex justify-between font-mono"><span>{s.aksi}</span><span><span className="text-emerald-300">{s.success}✓</span> <span className="text-red-300">{s.failed}✗</span></span></p>)}
        </div>
      </div>
      <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-slate-700">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr>{['Baris', 'AKSI', 'Primary Key', 'Status', 'Keterangan'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {report.results.map((r, i) => (
              <tr key={i} className={i % 2 ? 'row-odd' : 'row-even'} data-testid={`upload-report-row-${i}`}>
                <td className="td font-mono text-slate-400">{r.line}</td>
                <td className="td font-mono">{r.aksi}</td>
                <td className="td font-mono text-blue-200">{r.id}</td>
                <td className="td"><Badge tone={r.status === 'SUCCESS' ? 'green' : 'red'}>{r.status}</Badge></td>
                <td className="td whitespace-normal text-slate-300">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export function BulkExcelPanel({ table }) {
  const { data, refresh } = useDashboard();
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const schema = MASTER_TABLES[table];

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const rows = await parseWorkbook(file);
      const res = await processBulk(table, rows, data[table]);
      setReport({ fileName: file.name, ...res });
      await refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  };

  return (
    <Card title="Bulk Excel Engine" subtitle={`Kelola ${schema.label} secara massal via kolom [AKSI]: NEW · UPDATE · DELETE (PK: ${schema.pk})`} icon={FileSpreadsheet} testId="bulk-excel-panel"
      actions={
        <>
          <button className="btn-ghost" onClick={() => downloadTemplate(table)} data-testid="bulk-download-template-button"><FileDown className="h-4 w-4" /> Download Template</button>
          <button className="btn-accent" onClick={() => input.current?.click()} disabled={busy} data-testid="bulk-upload-button">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {busy ? 'Memproses…' : 'Upload .xlsx'}
          </button>
          <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} data-testid="bulk-upload-input" />
        </>
      }>
      <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <p><Badge tone="green">NEW</Badge> Tambah data — ditolak bila primary key sudah ada.</p>
        <p><Badge tone="blue">UPDATE</Badge> Ubah data — hanya kolom terisi yang diperbarui.</p>
        <p><Badge tone="red">DELETE</Badge> Hapus data berdasarkan primary key.</p>
      </div>
      {report && <UploadReport report={report} onClose={() => setReport(null)} />}
    </Card>
  );
}
