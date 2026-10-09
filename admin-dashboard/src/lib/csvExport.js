import { normalizePhone } from './customerAnalytics';

const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(columns, rows) {
  const head = columns.map((c) => esc(c[1])).join(',');
  const body = rows.map((r) => columns.map(([k]) => esc(r[k])).join(','));
  return [head, ...body].join('\r\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const day = (v) => String(v ?? '').slice(0, 10);
const localTs = (iso) => (iso ? new Date(iso).toLocaleString('sv-SE').replace('T', ' ') : '');

export const EXPORT_OPTIONS = [
  { id: 'selling', label: 'Raw Selling', desc: 'Per baris item transaksi (SKU, qty, harga, omzet)' },
  { id: 'absen', label: 'Raw Absen', desc: 'Check-in / checkout, durasi, status validasi, URL foto' },
  { id: 'stock', label: 'Raw Stock', desc: 'Stok per store × SKU & tanggal expired' },
  { id: 'audit', label: 'Raw Validasi-Audit', desc: 'Log validasi leader & poin disiplin SPG' },
];

export function buildRawExports(ctx) {
  const { data, filters, spgMap, storeMap, geoOk } = ctx;
  const inP = (d) => d >= filters.dateFrom && d <= filters.dateTo;
  const pMap = new Map(data.products.map((p) => [p.sku, p]));
  const geoSpg = (code) => {
    const s = spgMap.get(code);
    return s ? geoOk(s) : filters.region === 'ALL';
  };
  const geoStore = (code) => {
    const s = storeMap.get(code);
    return s ? geoOk(s) : filters.region === 'ALL';
  };
  const spgCols = (code) => {
    const s = spgMap.get(code);
    return { spg_name: s?.name ?? '', region: s?.region ?? '', area: s?.area ?? '', leader_name: s?.leader_name ?? '' };
  };

  const selling = () => {
    const rows = [];
    data.sales.filter((o) => inP(day(o.trx_date)) && geoSpg(o.spg_code)).forEach((o) => {
      const items = o.sales_order_items?.length ? o.sales_order_items : [{}];
      const phone = normalizePhone(o.buyer_phone);
      items.forEach((i, idx) => rows.push({
        trx_date: day(o.trx_date), trx_time: localTs(o.created_at), trx_id: o.trx_id, line_no: idx + 1, spg_code: o.spg_code, ...spgCols(o.spg_code),
        store_code: o.store_code, store_name: storeMap.get(o.store_code)?.store_name ?? '', buyer_name: o.buyer_name, buyer_phone: o.buyer_phone,
        customer_id: phone ?? o.trx_id, sku: i.sku, product_name: i.product_name, parent_sku: pMap.get(i.sku)?.parent_sku ?? '', category: pMap.get(i.sku)?.category ?? '',
        qty: i.qty, price: i.price, subtotal: i.subtotal, total_omzet_trx: o.total_omzet, status: o.status, validated_at: localTs(o.validated_at), receipt_photo_url: o.receipt_photo_url,
      }));
    });
    rows.sort((a, b) => a.trx_time.localeCompare(b.trx_time));
    return {
      rows,
      columns: [['trx_date', 'Tanggal'], ['trx_time', 'Waktu Input'], ['trx_id', 'TRX ID'], ['line_no', 'Line'], ['spg_code', 'SPG Code'], ['spg_name', 'Nama SPG'], ['region', 'Region'], ['area', 'Area'], ['leader_name', 'Leader'],
        ['store_code', 'Store Code'], ['store_name', 'Nama Store'], ['buyer_name', 'Nama Pembeli'], ['buyer_phone', 'No. HP Pembeli'], ['customer_id', 'Customer ID'], ['sku', 'SKU'], ['product_name', 'Nama Produk'],
        ['parent_sku', 'Parent SKU'], ['category', 'Kategori'], ['qty', 'Qty'], ['price', 'Harga'], ['subtotal', 'Subtotal'], ['total_omzet_trx', 'Total Omzet TRX'], ['status', 'Status'], ['validated_at', 'Validated At'], ['receipt_photo_url', 'URL Foto Nota']],
    };
  };

  const absen = () => {
    const rows = data.attendance.filter((a) => inP(day(a.work_date)) && geoSpg(a.spg_code)).map((a) => ({
      work_date: day(a.work_date), spg_code: a.spg_code, ...spgCols(a.spg_code), store_code: a.store_code, store_name: storeMap.get(a.store_code)?.store_name ?? '',
      checkin: localTs(a.checkin_time), checkout: localTs(a.checkout_time), duration: a.work_duration_minutes, status: a.checkin_time ? (a.checkout_time ? 'PRESENT' : 'INCOMPLETE') : 'ABSENT',
      validation_status: a.validation_status, validated_at: localTs(a.validated_at), photo_checkin_url: a.photo_checkin_url, photo_a: a.photo_display_a_url, photo_b: a.photo_display_b_url, photo_c: a.photo_display_c_url,
    })).sort((x, y) => x.work_date.localeCompare(y.work_date) || x.spg_code.localeCompare(y.spg_code));
    return {
      rows,
      columns: [['work_date', 'Tanggal'], ['spg_code', 'SPG Code'], ['spg_name', 'Nama SPG'], ['region', 'Region'], ['area', 'Area'], ['leader_name', 'Leader'], ['store_code', 'Store Code'], ['store_name', 'Nama Store'],
        ['checkin', 'Check-in'], ['checkout', 'Checkout'], ['duration', 'Durasi (menit)'], ['status', 'Status Kehadiran'], ['validation_status', 'Status Validasi'], ['validated_at', 'Validated At'],
        ['photo_checkin_url', 'URL Foto Absen'], ['photo_a', 'URL Foto Pajangan A'], ['photo_b', 'URL Foto Pajangan B'], ['photo_c', 'URL Foto Pajangan C']],
    };
  };

  const stock = () => {
    const rows = data.inventory.filter((r) => inP(day(r.created_at)) && geoStore(r.store_code)).map((r) => {
      const st = storeMap.get(r.store_code);
      const days = r.expired_date ? Math.round((new Date(`${day(r.expired_date)}T00:00:00`) - new Date(`${filters.dateTo}T00:00:00`)) / 86400000) : '';
      return {
        input_date: day(r.created_at), input_time: localTs(r.created_at), store_code: r.store_code, store_name: st?.store_name ?? '', region: st?.region ?? '', area: st?.area ?? '',
        sku: r.sku, product_name: r.product_name, parent_sku: pMap.get(r.sku)?.parent_sku ?? '', qty_stock: r.qty_stock, expired_date: day(r.expired_date), days_to_ed: days, attendance_id: r.attendance_id,
      };
    }).sort((x, y) => x.input_time.localeCompare(y.input_time));
    return {
      rows,
      columns: [['input_date', 'Tanggal Input'], ['input_time', 'Waktu Input'], ['store_code', 'Store Code'], ['store_name', 'Nama Store'], ['region', 'Region'], ['area', 'Area'], ['sku', 'SKU'],
        ['product_name', 'Nama Produk'], ['parent_sku', 'Parent SKU'], ['qty_stock', 'Qty Stock'], ['expired_date', 'Expired Date'], ['days_to_ed', 'Sisa Hari ke ED'], ['attendance_id', 'Attendance ID']],
    };
  };

  const audit = () => {
    const disc = new Map();
    data.discipline.forEach((d) => disc.set(`${d.ref_table}|${d.ref_id}`, d));
    const used = new Set();
    const rows = [];
    data.validations.filter((v) => inP(day(v.validated_at || v.email_sent_at)) && geoSpg(v.spg_code)).forEach((v) => {
      const k = `${v.ref_table}|${v.ref_id}`;
      const d = disc.get(k);
      if (d) used.add(d.id);
      const gap = v.validated_at && v.email_sent_at ? ((new Date(v.validated_at) - new Date(v.email_sent_at)) / 3600000).toFixed(2) : '';
      rows.push({
        record_type: 'VALIDATION', id: v.id, date: day(v.validated_at || v.email_sent_at), spg_code: v.spg_code, ...spgCols(v.spg_code), leader: v.leader_name, leader_email: v.leader_email,
        ref_table: v.ref_table, ref_id: v.ref_id, action: v.action, event_type: d?.event_type ?? '', points: d?.points ?? 0, note: v.note ?? d?.note ?? '',
        email_sent_at: localTs(v.email_sent_at), validated_at: localTs(v.validated_at), gap_hours: gap,
      });
    });
    data.discipline.filter((d) => !used.has(d.id) && inP(day(d.created_at)) && geoSpg(d.spg_code)).forEach((d) => rows.push({
      record_type: 'DISCIPLINE', id: d.id, date: day(d.created_at), spg_code: d.spg_code, ...spgCols(d.spg_code), leader: spgMap.get(d.spg_code)?.leader_name ?? '', leader_email: '',
      ref_table: d.ref_table, ref_id: d.ref_id, action: '', event_type: d.event_type, points: d.points, note: d.note, email_sent_at: '', validated_at: localTs(d.created_at), gap_hours: '',
    }));
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return {
      rows,
      columns: [['record_type', 'Jenis Record'], ['id', 'ID'], ['date', 'Tanggal'], ['spg_code', 'SPG Code'], ['spg_name', 'Nama SPG'], ['region', 'Region'], ['area', 'Area'], ['leader', 'Leader'], ['leader_email', 'Leader Email'],
        ['ref_table', 'Ref Table'], ['ref_id', 'Ref ID'], ['action', 'Aksi Leader'], ['event_type', 'Event Disiplin'], ['points', 'Poin'], ['note', 'Catatan'], ['email_sent_at', 'Email Sent At'], ['validated_at', 'Validated At'], ['gap_hours', 'Gap Validasi (jam)']],
    };
  };

  return { selling, absen, stock, audit };
}
