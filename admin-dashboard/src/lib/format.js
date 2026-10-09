const nf = new Intl.NumberFormat('id-ID');

export const num = (n) => nf.format(Math.round(Number(n) || 0));
export const idr = (n) => `Rp ${num(n)}`;
export const idrCompact = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `Rp ${(v / 1e9).toFixed(2)} M`;
  if (Math.abs(v) >= 1e6) return `Rp ${(v / 1e6).toFixed(1)} Jt`;
  if (Math.abs(v) >= 1e3) return `Rp ${(v / 1e3).toFixed(0)} Rb`;
  return idr(v);
};
export const pct = (n, d = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(d)}%`;
export const ratio = (a, b) => (b ? (a / b) * 100 : 0);
export const duration = (m) => (m == null ? '-' : `${Math.floor(m / 60)} Jam ${Math.round(m % 60)} Menit`);
export const hours = (h) => `${h.toFixed(1)} jam`;

export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-');
export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const fmtDate = (s) =>
  s ? new Date(s.length === 10 ? `${s}T00:00:00` : s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const matches = (q, ...fields) => !q || fields.some((f) => String(f ?? '').toLowerCase().includes(q.trim().toLowerCase()));

export const sum = (rows, key) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
export const groupBy = (rows, key) =>
  rows.reduce((m, r) => {
    const k = r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
    return m;
  }, new Map());
