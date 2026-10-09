import * as XLSX from 'xlsx';
import { db } from './dataService';
import { MASTER_TABLES, missingRequired, normalizeRow } from './schema';

const ACTIONS = ['NEW', 'UPDATE', 'DELETE'];
const AKSI = '[AKSI]';

export function downloadTemplate(table) {
  const schema = MASTER_TABLES[table];
  const header = [AKSI, ...schema.fields.map((f) => f.key)];
  const sample = schema.fields.map((f) => f.sample ?? '');
  const ws = XLSX.utils.aoa_to_sheet([header, ['NEW', ...sample], ['UPDATE', ...sample], ['DELETE', sample[0]]]);
  ws['!cols'] = header.map(() => ({ wch: 20 }));
  const guide = XLSX.utils.aoa_to_sheet([
    [`PANDUAN BULK UPLOAD — ${schema.label.toUpperCase()}`],
    [],
    ['1. Isi data pada sheet "Template". Jangan ubah nama kolom pada baris pertama.'],
    ['2. Kolom [AKSI] wajib diisi: NEW / UPDATE / DELETE.'],
    ['   NEW    : tambah data baru. Ditolak jika Primary Key sudah ada.'],
    ['   UPDATE : ubah data berdasarkan Primary Key. Hanya kolom yang terisi yang diperbarui.'],
    ['   DELETE : hapus data berdasarkan Primary Key (kolom lain boleh kosong).'],
    [`3. Primary Key tabel ini: ${schema.pk}. Primary Key tidak boleh duplikat dalam satu file.`],
    ['4. Format tanggal: YYYY-MM-DD. Angka tanpa titik/koma ribuan.'],
    ['5. Hapus baris contoh sebelum upload.'],
    [],
    ['Kolom', 'Label', 'Tipe', 'Wajib', 'Contoh'],
    ...schema.fields.map((f) => [f.key, f.label, f.type || 'text', f.required ? 'YA' : 'TIDAK', String(f.sample ?? '')]),
  ]);
  guide['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.utils.book_append_sheet(wb, guide, 'Panduan');
  XLSX.writeFile(wb, `template_${table}.xlsx`);
}

export async function parseWorkbook(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const ws = wb.Sheets.Template || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
  if (!rows.length) throw new Error('File kosong atau sheet "Template" tidak ditemukan.');
  if (!(AKSI in rows[0])) throw new Error('Kolom [AKSI] tidak ditemukan. Gunakan template resmi.');
  return rows;
}

export async function processBulk(table, rows, existing) {
  const schema = MASTER_TABLES[table];
  const { pk } = schema;
  const keys = new Set(existing.map((r) => String(r[pk])));
  const seen = new Set();
  const results = [];
  for (const [i, raw] of rows.entries()) {
    const aksi = String(raw[AKSI] ?? '').trim().toUpperCase();
    const id = String(raw[pk] ?? '').trim();
    const push = (status, message) => results.push({ line: i + 2, aksi: aksi || '-', id: id || '-', status, message });
    if (!ACTIONS.includes(aksi)) { push('FAILED', 'Kolom [AKSI] harus NEW / UPDATE / DELETE'); continue; }
    if (!id) { push('FAILED', `Primary key "${pk}" kosong`); continue; }
    if (seen.has(id)) { push('FAILED', 'Primary key duplikat di dalam file'); continue; }
    seen.add(id);
    try {
      if (aksi === 'NEW') {
        if (keys.has(id)) { push('FAILED', 'Konflik: primary key sudah ada (gunakan UPDATE)'); continue; }
        const missing = missingRequired(schema, raw);
        if (missing.length) { push('FAILED', `Kolom wajib kosong: ${missing.join(', ')}`); continue; }
        await db.insert(table, normalizeRow(schema, raw));
        keys.add(id);
        push('SUCCESS', 'Data baru ditambahkan');
      } else if (!keys.has(id)) {
        push('FAILED', 'Primary key tidak ditemukan di database');
      } else if (aksi === 'UPDATE') {
        const { [pk]: _omit, ...patch } = normalizeRow(schema, raw, true);
        if (!Object.keys(patch).length) { push('FAILED', 'Tidak ada kolom yang diperbarui'); continue; }
        await db.update(table, pk, id, patch);
        push('SUCCESS', 'Data diperbarui');
      } else {
        await db.remove(table, pk, id);
        keys.delete(id);
        push('SUCCESS', 'Data dihapus');
      }
    } catch (e) {
      push('FAILED', e.message);
    }
  }
  const count = (a, s) => results.filter((r) => (!a || r.aksi === a) && r.status === s).length;
  return {
    results,
    summary: ACTIONS.map((a) => ({ aksi: a, success: count(a, 'SUCCESS'), failed: count(a, 'FAILED') })),
    total: results.length,
    success: count(null, 'SUCCESS'),
    failed: count(null, 'FAILED'),
  };
}
