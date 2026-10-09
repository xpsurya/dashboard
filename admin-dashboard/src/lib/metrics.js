import { eachDay, parseDate, toISODate } from './dates';
import { groupBy, ratio, sum } from './format';
import config from './config';

export function buildDerived(data, filters, month) {
  const calMap = new Map(data.calendar.map((c) => [String(c.work_date).slice(0, 10), c.is_workday]));
  const isWorkday = (d) => (calMap.has(d) ? calMap.get(d) : parseDate(d).getDay() !== 0);
  const monthDays = eachDay(month.start, month.end);
  const workdaysMonth = monthDays.filter(isWorkday).length;
  const workdaysElapsed = monthDays.filter((d) => d <= filters.dateTo && isWorkday(d)).length;
  const periodDays = eachDay(filters.dateFrom, filters.dateTo);
  const periodWorkdays = periodDays.filter(isWorkday).length;
  const f = filters.region;
  const geoOk = (o) => f === 'ALL' || (f.startsWith('R:') ? o?.region === f.slice(2) : o?.area === f.slice(2));
  const spgMap = new Map(data.manpower.map((m) => [m.spg_code, m]));
  const storeMap = new Map(data.stores.map((s) => [s.store_code, s]));
  const spgs = data.manpower.filter((m) => m.status === 'ACTIVE' && geoOk(m));
  const spgSet = new Set(spgs.map((s) => s.spg_code));
  const inPeriod = (d) => d >= filters.dateFrom && d <= filters.dateTo;
  const inMtd = (d) => d >= month.start && d <= filters.dateTo;
  const geoTree = new Map();
  [...data.manpower, ...data.stores].forEach((o) => {
    if (!o.region) return;
    if (!geoTree.has(o.region)) geoTree.set(o.region, new Set());
    if (o.area) geoTree.get(o.region).add(o.area);
  });
  const geo = [...geoTree].sort().map(([region, areas]) => ({ region, areas: [...areas].sort() }));
  return {
    isWorkday, monthDays, workdaysMonth, workdaysElapsed, timerate: ratio(workdaysElapsed, workdaysMonth),
    periodDays, periodWorkdays, geoOk, geo, spgMap, storeMap, spgs, inPeriod, inMtd,
    sales: data.sales.filter((o) => o.status !== 'DELETED' && spgSet.has(o.spg_code)),
    attendance: data.attendance.filter((a) => spgSet.has(a.spg_code)),
  };
}

export function sellingMetrics(ctx) {
  const { spgs, sales, attendance, inPeriod, inMtd, timerate, workdaysMonth, periodWorkdays, monthDays, isWorkday, filters, storeMap } = ctx;
  const bySpg = groupBy(sales, 'spg_code');
  const rows = spgs.map((s) => {
    const orders = bySpg.get(s.spg_code) || [];
    const mtd = orders.filter((o) => inMtd(o.trx_date));
    const period = orders.filter((o) => inPeriod(o.trx_date));
    const target = Number(s.monthly_target) || 0;
    const periodTarget = workdaysMonth ? (target / workdaysMonth) * periodWorkdays : 0;
    const monthlyOmzet = sum(mtd, 'total_omzet');
    const periodOmzet = sum(period, 'total_omzet');
    return {
      ...s, storeName: storeMap.get(s.store_code)?.store_name ?? s.store_code, target, monthlyOmzet,
      monthAch: ratio(monthlyOmzet, target), periodTarget, periodOmzet, periodAch: periodTarget ? ratio(periodOmzet, periodTarget) : null,
      customers: new Set(period.map((o) => o.buyer_phone || o.buyer_name)).size, transactions: period.length,
    };
  });
  const totalTarget = sum(rows, 'target');
  const mtdOmzet = sum(rows, 'monthlyOmzet');
  const periodOrders = sales.filter((o) => inPeriod(o.trx_date));
  const kpis = {
    mtdOmzet, totalTarget, ach: ratio(mtdOmzet, totalTarget), timerate, periodOmzet: sum(periodOrders, 'total_omzet'),
    customers: new Set(periodOrders.map((o) => o.buyer_phone || o.buyer_name)).size, transactions: periodOrders.length,
    activeSpg: new Set(attendance.filter((a) => inPeriod(a.work_date) && a.checkin_time).map((a) => a.spg_code)).size,
    masterSpg: spgs.length, overTr: rows.filter((r) => r.target && r.monthAch >= timerate).length,
  };

  const daily = new Map();
  const sku = new Map();
  sales.forEach((o) => {
    if (!inMtd(o.trx_date)) return;
    daily.set(o.trx_date, (daily.get(o.trx_date) || 0) + Number(o.total_omzet));
    (o.sales_order_items || []).forEach((i) => sku.set(i.product_name, (sku.get(i.product_name) || 0) + Number(i.subtotal)));
  });
  let cum = 0;
  let wd = 0;
  const trend = monthDays.filter((d) => d <= filters.dateTo).map((d) => {
    cum += daily.get(d) || 0;
    if (isWorkday(d)) wd += 1;
    return { date: d, omzet: daily.get(d) || 0, ach: ratio(cum, totalTarget), tr: ratio(wd, workdaysMonth) };
  });
  const skuRows = [...sku].map(([name, value]) => ({ name, value })).sort((a, b) => a.value - b.value);
  const reg = new Map();
  rows.forEach((r) => {
    const g = reg.get(r.region) || { target: 0, omzet: 0 };
    g.target += r.target;
    g.omzet += r.monthlyOmzet;
    reg.set(r.region, g);
  });
  const regionRows = [...reg].map(([region, g]) => ({ region, ach: ratio(g.omzet, g.target), omzet: g.omzet })).sort((a, b) => b.ach - a.ach);
  return { rows, kpis, trend, skuRows, regionRows };
}

export function attendanceMetrics(ctx) {
  const { spgs, attendance, inPeriod, periodDays, isWorkday, monthDays, filters, storeMap } = ctx;
  const today = toISODate();
  const key = (s, d) => `${s}|${d}`;
  const attMap = new Map(attendance.map((a) => [key(a.spg_code, a.work_date), a]));
  const statusOf = (s, d) => {
    const a = attMap.get(key(s, d));
    if (a?.checkin_time) return a.checkout_time ? 'present' : 'incomplete';
    if (d > today) return 'future';
    return isWorkday(d) ? 'absent' : 'off';
  };
  const periodWork = periodDays.filter(isWorkday);
  const expected = spgs.length * periodWork.length;
  const logs = attendance.filter((a) => inPeriod(a.work_date));
  const checkins = logs.filter((a) => a.checkin_time).length;
  const kpis = {
    rate: ratio(checkins, expected), checkins, checkouts: logs.filter((a) => a.checkout_time).length,
    absent: Math.max(expected - checkins, 0), expected,
  };
  const trend = monthDays.filter((d) => d <= filters.dateTo && isWorkday(d)).map((d) => ({
    date: d, rate: ratio(spgs.filter((s) => attMap.get(key(s.spg_code, d))?.checkin_time).length, spgs.length),
  }));
  const reg = new Map();
  spgs.forEach((s) => {
    const g = reg.get(s.region) || { present: 0, incomplete: 0, absent: 0 };
    periodWork.forEach((d) => {
      const st = statusOf(s.spg_code, d);
      if (g[st] !== undefined) g[st] += 1;
    });
    reg.set(s.region, g);
  });
  const regional = [...reg].map(([region, g]) => ({ region, ...g })).sort((a, b) => a.region.localeCompare(b.region));
  const heatmap = spgs.map((s) => ({ spg: s, cells: monthDays.map((d) => ({ date: d, status: statusOf(s.spg_code, d) })) }));
  const logRows = logs
    .map((a) => ({ ...a, spg: ctx.spgMap.get(a.spg_code), storeName: storeMap.get(a.store_code)?.store_name ?? a.store_code }))
    .sort((a, b) => String(b.checkin_time).localeCompare(String(a.checkin_time)));
  return { kpis, trend, regional, heatmap, logRows, standard: config.standardWorkMinutes };
}

export const edLevel = (days) =>
  days <= config.nearEd.criticalDays ? 'critical' : days <= config.nearEd.warningDays ? 'warning' : 'safe';
