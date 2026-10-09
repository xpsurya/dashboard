import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { MASTER_TABLES } from '../../lib/schema';
import { BulkExcelPanel } from './BulkExcelPanel';
import { MasterTable } from './MasterTable';
import { GATE_KEY, PasswordGate } from './PasswordGate';

export default function MasterDatabase() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [table, setTable] = useState('manpower');
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const lock = () => {
    sessionStorage.removeItem(GATE_KEY);
    setUnlocked(false);
  };

  return (
    <div className="space-y-5" data-testid="master-database-view">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-surface p-1">
          {Object.entries(MASTER_TABLES).map(([id, s]) => (
            <button key={id} onClick={() => setTable(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${table === id ? 'bg-brand text-white' : 'text-slate-400 hover:text-slate-200'}`} data-testid={`master-subtab-${id}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn-ghost" onClick={lock} data-testid="master-db-lock-button"><LockKeyhole className="h-4 w-4" /> Kunci Master DB</button>
      </div>
      <BulkExcelPanel table={table} />
      <MasterTable key={table} table={table} />
    </div>
  );
}
