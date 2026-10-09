import { isMock, supabase } from './supabase';
import { mockDb } from './mockData';

const PAGE = 1000;

async function fetchAll(table, select, range) {
  let rows = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(select);
    if (range) q = q.gte(range.field, range.from).lte(range.field, range.to);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows = rows.concat(data);
    if (data.length < PAGE) return rows;
  }
}

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const mock = (fn) => Promise.resolve().then(fn);

export const db = {
  list: (table, { select = '*', range } = {}) => (isMock ? mock(() => mockDb.list(table, range)) : fetchAll(table, select, range)),
  insert: (table, row) => (isMock ? mock(() => mockDb.insert(table, row)) : supabase.from(table).insert(row).select().then(unwrap)),
  update: (table, pk, id, patch) =>
    isMock ? mock(() => mockDb.update(table, pk, id, patch)) : supabase.from(table).update(patch).eq(pk, id).select().then(unwrap),
  remove: (table, pk, id) => (isMock ? mock(() => mockDb.remove(table, pk, id)) : supabase.from(table).delete().eq(pk, id).then(unwrap)),
};

export async function loadAll(from, to) {
  const r = (field) => ({ field, from, to: `${to}T23:59:59` });
  const [manpower, stores, products, coverages, calendar, attendance, inventory, sales, discipline, validations] = await Promise.all([
    db.list('manpower'),
    db.list('stores'),
    db.list('products'),
    db.list('coverages'),
    db.list('calendar_workdays', { range: r('work_date') }),
    db.list('attendance_logs', { range: r('work_date') }),
    db.list('store_inventory', { range: r('created_at') }),
    db.list('sales_orders', { select: '*, sales_order_items(*)', range: r('trx_date') }),
    db.list('discipline_audit_logs', { range: r('created_at') }),
    db.list('leader_validations', { range: r('email_sent_at') }),
  ]);
  return { manpower, stores, products, coverages, calendar, attendance, inventory, sales, discipline, validations };
}
