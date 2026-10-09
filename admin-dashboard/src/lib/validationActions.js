import { db } from './dataService';
import config from './config';

const KIND = {
  sales: { table: 'sales_orders', statusField: 'status' },
  attendance: { table: 'attendance_logs', statusField: 'validation_status' },
};
const STATUS = { APPROVE: 'APPROVED', UPDATE: 'UPDATED', DELETE: 'DELETED' };
const PENALTY = {
  UPDATE: ['LEADER_UPDATE', config.discipline.leaderUpdate],
  DELETE: ['LEADER_DELETE', config.discipline.leaderDelete],
};

export async function validateRecord(kind, record, action, { patch = {}, note = null, leader } = {}) {
  const { table, statusField } = KIND[kind];
  const now = new Date().toISOString();
  await db.update(table, 'id', record.id, { ...patch, [statusField]: STATUS[action], validated_at: now });
  const base = { spg_code: record.spg_code, ref_table: table, ref_id: String(record.id), note };
  await db.insert('leader_validations', {
    id: crypto.randomUUID(), ...base, action, leader_name: leader?.leader_name ?? null, leader_email: leader?.leader_email ?? null,
    email_sent_at: record.email_sent_at, validated_at: now,
  });
  if (PENALTY[action]) {
    const [event_type, points] = PENALTY[action];
    await db.insert('discipline_audit_logs', { id: crypto.randomUUID(), ...base, event_type, points, created_at: now });
  }
}
