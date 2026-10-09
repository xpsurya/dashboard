import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadAll } from '../lib/dataService';
import { subscribeRealtime } from '../lib/realtime';
import { isMock } from '../lib/supabase';
import { buildDerived } from '../lib/metrics';
import { monthBounds, toISODate } from '../lib/dates';
import config from '../lib/config';

const EMPTY = { manpower: [], stores: [], products: [], coverages: [], calendar: [], attendance: [], inventory: [], sales: [], discipline: [], validations: [] };
const Ctx = createContext(null);

export const useDashboard = () => useContext(Ctx);

export function DashboardProvider({ children }) {
  const today = toISODate();
  const [filters, setFilters] = useState({ region: 'ALL', mode: 'single', dateFrom: today, dateTo: today, search: '' });
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState({ loading: true, error: null, connection: isMock ? 'mock' : 'connecting', lastSync: null });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realtime, setRealtime] = useState({ status: 'CONNECTING', events: [] });
  const refreshRef = useRef(null);
  const month = useMemo(() => monthBounds(filters.dateTo), [filters.dateTo]);
  const fetchFrom = filters.dateFrom < month.start ? filters.dateFrom : month.start;

  const refresh = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      setData(await loadAll(fetchFrom, month.end));
      setStatus({ loading: false, error: null, connection: isMock ? 'mock' : 'online', lastSync: new Date() });
    } catch (e) {
      setStatus((s) => ({ ...s, loading: false, error: e.message, connection: 'offline' }));
    }
  }, [fetchFrom, month.end]);

  useEffect(() => { refreshRef.current = refresh; refresh(); }, [refresh]);

  useEffect(() => {
    let timer;
    const unsubscribe = subscribeRealtime(
      (evt) => {
        setRealtime((r) => ({ ...r, events: [{ ...evt, id: Math.random(), at: new Date() }, ...r.events].slice(0, 30) }));
        clearTimeout(timer);
        timer = setTimeout(() => refreshRef.current?.(), 800);
      },
      (status) => setRealtime((r) => ({ ...r, status })),
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(refresh, config.autoRefreshSeconds * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refresh]);

  const derived = useMemo(() => buildDerived(data, filters, month), [data, filters, month]);
  const value = useMemo(
    () => ({ filters, setFilters, data, status, realtime, autoRefresh, setAutoRefresh, refresh, month, ...derived }),
    [filters, data, status, realtime, autoRefresh, refresh, month, derived],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
