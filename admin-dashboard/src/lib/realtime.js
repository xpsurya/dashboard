import { isMock, supabase } from './supabase';
import { mockDb } from './mockData';

const TABLES = ['attendance_logs', 'sales_orders'];

export function subscribeRealtime(onEvent, onStatus) {
  if (isMock) return mockDb.subscribe(onEvent, onStatus);
  let channel = supabase.channel('ffcc-live-feed');
  TABLES.forEach((table) => {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, (p) =>
      onEvent({ table, type: p.eventType, record: p.eventType === 'DELETE' ? p.old : p.new }),
    );
  });
  channel.subscribe((status) => onStatus(status));
  return () => {
    supabase.removeChannel(channel);
  };
}
