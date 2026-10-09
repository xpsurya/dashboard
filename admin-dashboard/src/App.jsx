import { useRef, useState } from 'react';
import { CalendarCheck, Database, Images, LoaderCircle, PackageSearch, ShieldCheck, TrendingUp } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { ToastProvider, useToast } from './components/common/Toast';
import { TopNav } from './components/layout/TopNav';
import { FilterBar } from './components/layout/FilterBar';
import { TabNav } from './components/layout/TabNav';
import { LiveTicker } from './components/layout/LiveTicker';
import { AuthProvider } from './context/AuthContext';
import { useKiosk } from './hooks/useKiosk';
import { exportDashboard } from './lib/exportDashboard';
import config from './lib/config';
import SellingPerformance from './tabs/selling/SellingPerformance';
import AbsenPerformance from './tabs/absen/AbsenPerformance';
import StockTracking from './tabs/stock/StockTracking';
import PhotoGallery from './tabs/photos/PhotoGallery';
import MasterDatabase from './tabs/master/MasterDatabase';
import AuditDiscipline from './tabs/audit/AuditDiscipline';

const TABS = [
  { id: 'selling', label: 'Selling Performance', icon: TrendingUp, Comp: SellingPerformance },
  { id: 'absen', label: 'Absen & Work Duration', icon: CalendarCheck, Comp: AbsenPerformance },
  { id: 'stock', label: 'Stock & Near-ED', icon: PackageSearch, Comp: StockTracking },
  { id: 'photos', label: 'Photo Gallery', icon: Images, Comp: PhotoGallery },
  { id: 'master', label: 'Master Database', icon: Database, Comp: MasterDatabase },
  { id: 'audit', label: 'Validasi & Audit', icon: ShieldCheck, Comp: AuditDiscipline },
];
const KIOSK_TABS = TABS.filter((t) => t.id !== 'master').map((t) => t.id);

function Shell() {
  const [tab, setTab] = useState('selling');
  const [kiosk, setKiosk] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef(null);
  const toast = useToast();
  const { status } = useDashboard();
  const kioskState = useKiosk(kiosk, KIOSK_TABS, setTab, config.kioskIntervalSeconds);

  const toggleKiosk = () => {
    const next = !kiosk;
    setKiosk(next);
    if (next) {
      if (!KIOSK_TABS.includes(tab)) setTab(KIOSK_TABS[0]);
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const onExport = async (format) => {
    setExporting(true);
    try {
      await exportDashboard(ref.current, format, `field-force-${tab}`);
      toast(`Dashboard berhasil diekspor ke ${format.toUpperCase()}`);
    } catch (e) {
      toast(`Export gagal: ${e.message}`, 'error');
    }
    setExporting(false);
  };

  const Active = TABS.find((t) => t.id === tab).Comp;
  return (
    <div className="min-h-screen bg-ink bg-grid">
      <TopNav kiosk={kiosk} onToggleKiosk={toggleKiosk} onExport={onExport} exporting={exporting} />
      <FilterBar />
      <TabNav tabs={TABS} active={tab} onChange={setTab} kiosk={kiosk ? kioskState : null} />
      <LiveTicker />
      {status.error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 md:mx-6" data-testid="data-error-banner">
          Gagal memuat data dari Supabase: {status.error}
        </div>
      )}
      <main ref={ref} className="bg-ink px-4 py-5 md:px-6 md:py-6" data-testid="dashboard-content">
        {status.loading && !status.lastSync ? (
          <div className="flex items-center justify-center gap-3 py-32 text-slate-400" data-testid="initial-loader">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Memuat data command center…
          </div>
        ) : (
          <Active key={tab} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DashboardProvider>
          <Shell />
        </DashboardProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
