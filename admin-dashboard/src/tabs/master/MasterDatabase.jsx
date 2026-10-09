import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AccessGate } from '../../components/auth/AccessGate';
import { MASTER_TABLES } from '../../lib/schema';
import { BulkExcelPanel } from './BulkExcelPanel';
import { MasterTable } from './MasterTable';

function MasterContent() {
  const { signOut } = useAuth();
  const [table, setTable] = useState('manpower');
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
        <button className="btn-ghost" onClick={signOut} data-testid="master-db-lock-button"><LockKeyhole className="h-4 w-4" /> Logout & Kunci</button>
      </div>
      <BulkExcelPanel table={table} />
      <MasterTable key={table} table={table} />
    </div>
  );
}

export default function MasterDatabase() {
  return (
    <AccessGate
      roles={['admin']}
      title="Master Database — Khusus Admin"
      description="Data master (Manpower, Stores, Products, Coverages) hanya dapat dikelola oleh akun ber-role ADMIN."
      testId="master-db-gate"
    >
      <MasterContent />
    </AccessGate>
  );
}
