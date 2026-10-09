import { toISODate } from './dates';

export const PK = {
  manpower: 'spg_code',
  stores: 'store_code',
  products: 'sku',
  coverages: 'coverage_id',
  calendar_workdays: 'work_date',
  attendance_logs: 'id',
  store_inventory: 'id',
  sales_orders: 'id',
  sales_order_items: 'id',
  discipline_audit_logs: 'id',
  leader_validations: 'id',
};

export const MASTER_TABLES = {
  manpower: {
    label: 'Manpower',
    pk: 'spg_code',
    fields: [
      { key: 'spg_code', label: 'SPG Code', required: true, sample: 'SPG-101' },
      { key: 'name', label: 'Nama SPG', required: true, sample: 'Rina Kartika' },
      { key: 'region', label: 'Region', required: true, sample: 'Jabodetabek' },
      { key: 'area', label: 'Area', sample: 'Jakarta Selatan' },
      { key: 'store_code', label: 'Store Code', sample: 'ST-001' },
      { key: 'leader_name', label: 'Leader', sample: 'Budi Santoso' },
      { key: 'leader_email', label: 'Leader Email', type: 'email', sample: 'leader@company.co.id' },
      { key: 'phone', label: 'No. HP', sample: '081234567890' },
      { key: 'monthly_target', label: 'Monthly Target', type: 'number', sample: 45000000 },
      { key: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE'], sample: 'ACTIVE' },
      { key: 'join_date', label: 'Join Date', type: 'date', sample: '2026-01-15' },
    ],
  },
  stores: {
    label: 'Stores',
    pk: 'store_code',
    fields: [
      { key: 'store_code', label: 'Store Code', required: true, sample: 'ST-101' },
      { key: 'store_name', label: 'Nama Store', required: true, sample: 'Hypermart Kemang' },
      { key: 'chain', label: 'Chain', sample: 'Hypermart' },
      { key: 'region', label: 'Region', required: true, sample: 'Jabodetabek' },
      { key: 'area', label: 'Area', sample: 'Jakarta Selatan' },
      { key: 'address', label: 'Alamat', sample: 'Jl. Kemang Raya No. 10' },
    ],
  },
  products: {
    label: 'Products',
    pk: 'sku',
    fields: [
      { key: 'sku', label: 'SKU', required: true, sample: 'SKU-101' },
      { key: 'product_name', label: 'Nama Produk', required: true, sample: 'Susu UHT Cokelat 200ml' },
      { key: 'category', label: 'Kategori', sample: 'Dairy' },
      { key: 'price', label: 'Harga (IDR)', type: 'number', sample: 6500 },
    ],
  },
  coverages: {
    label: 'Coverages',
    pk: 'coverage_id',
    fields: [
      { key: 'coverage_id', label: 'Coverage ID', required: true, sample: 'COV-101' },
      { key: 'spg_code', label: 'SPG Code', required: true, sample: 'SPG-101' },
      { key: 'store_code', label: 'Store Code', required: true, sample: 'ST-101' },
      { key: 'visit_days', label: 'Hari Kunjungan', sample: 'Senin-Sabtu' },
      { key: 'start_date', label: 'Start Date', type: 'date', sample: '2026-01-01' },
      { key: 'end_date', label: 'End Date', type: 'date', sample: '2026-12-31' },
    ],
  },
};

const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';

export function normalizeRow(schema, raw, skipEmpty = false) {
  const out = {};
  schema.fields.forEach((f) => {
    const v = raw[f.key];
    if (isEmpty(v)) {
      if (!skipEmpty) out[f.key] = null;
      return;
    }
    if (f.type === 'number') out[f.key] = typeof v === 'number' ? v : Number(String(v).replace(/[^\d-]/g, ''));
    else if (f.type === 'date') out[f.key] = v instanceof Date ? toISODate(v) : String(v).slice(0, 10);
    else out[f.key] = String(v).trim();
  });
  return out;
}

export const missingRequired = (schema, row) => schema.fields.filter((f) => f.required && isEmpty(row[f.key])).map((f) => f.label);
