import config from './config';
import { groupBy } from './format';
import { hoursBetween, toISODate } from './dates';

const day = (v) => String(v ?? '').slice(0, 10);

export const gradeOf = (score) =>
  score >= 90 ? { grade: 'A', label: 'Excellent', tone: 'green' }
    : score >= 75 ? { grade: 'B', label: 'Good', tone: 'blue' }
      : score >= 60 ? { grade: 'C', label: 'Warning', tone: 'yellow' }
        : { grade: 'D', label: 'Critical', tone: 'red' };

export function disciplineScores(ctx) {
  const { spgs, data, inMtd } = ctx;
  const P = config.discipline;
  const today = toISODate();
  const logs = groupBy(data.discipline.filter((l) => inMtd(day(l.created_at))), 'spg_code');
  const missed = new Map();
  data.attendance.forEach((a) => {
    if (inMtd(a.work_date) && a.checkin_time && !a.checkout_time && a.work_date < today) missed.set(a.spg_code, (missed.get(a.spg_code) || 0) + 1);
  });
  return spgs
    .map((s) => {
      const l = logs.get(s.spg_code) || [];
      const updates = l.filter((x) => x.event_type === 'LEADER_UPDATE').length;
      const deletes = l.filter((x) => x.event_type === 'LEADER_DELETE').length;
      const m = missed.get(s.spg_code) || 0;
      const score = Math.max(0, P.base + updates * P.leaderUpdate + deletes * P.leaderDelete + m * P.missedCheckout);
      return { ...s, updates, deletes, missed: m, score, ...gradeOf(score) };
    })
    .sort((a, b) => a.score - b.score);
}

export function leaderSla(ctx) {
  const { data, inMtd, spgMap, geoOk } = ctx;
  const H = config.slaOverdueHours;
  const now = Date.now();
  const leaders = new Map();
  const get = (name, email) => {
    const k = email || name || 'Unassigned';
    if (!leaders.has(k)) leaders.set(k, { leader_name: name || '-', leader_email: email || '-', count: 0, total: 0, max: 0, overdue: 0, pending: 0, pendingOverdue: 0 });
    return leaders.get(k);
  };
  data.validations.forEach((v) => {
    if (!v.validated_at || !v.email_sent_at || !inMtd(day(v.email_sent_at))) return;
    const spg = spgMap.get(v.spg_code);
    if (spg && !geoOk(spg)) return;
    const h = hoursBetween(v.email_sent_at, v.validated_at);
    const L = get(v.leader_name, v.leader_email);
    L.count += 1;
    L.total += h;
    L.max = Math.max(L.max, h);
    if (h > H) L.overdue += 1;
  });
  [...data.sales.filter((o) => o.status === 'PENDING'), ...data.attendance.filter((a) => a.validation_status === 'PENDING')].forEach((p) => {
    const spg = spgMap.get(p.spg_code);
    if (!spg || !geoOk(spg) || !p.email_sent_at) return;
    const L = get(spg.leader_name, spg.leader_email);
    L.pending += 1;
    if ((now - new Date(p.email_sent_at)) / 3600000 > H) L.pendingOverdue += 1;
  });
  return [...leaders.values()]
    .map((L) => ({ ...L, avg: L.count ? L.total / L.count : 0, isOverdue: L.overdue > 0 || L.pendingOverdue > 0 }))
    .sort((a, b) => b.avg - a.avg);
}
