const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s) => new Date(`${s}T00:00:00`);

export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export const monthBounds = (s) => {
  const d = parseDate(s);
  const y = d.getFullYear();
  const m = d.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  return {
    start: toISODate(new Date(y, m, 1)),
    end: toISODate(new Date(y, m, days)),
    days,
    label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  };
};

export const eachDay = (from, to) => {
  const out = [];
  for (let s = from; s <= to; s = addDays(s, 1)) out.push(s);
  return out;
};

export const daysUntil = (s, from = toISODate()) => Math.round((parseDate(s) - parseDate(from)) / 86400000);
export const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / 3600000;

export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
