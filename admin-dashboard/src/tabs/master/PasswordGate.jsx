import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const GATE_KEY = 'ffcc_master_unlocked';

export function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (pw === import.meta.env.VITE_MASTER_DB_PASSWORD) {
      sessionStorage.setItem(GATE_KEY, '1');
      onUnlock();
    } else {
      setError('Password salah. Akses Master Database ditolak.');
    }
  };
  return (
    <div className="flex justify-center py-12 md:py-20" data-testid="master-db-password-gate">
      <form onSubmit={submit} className="card fade-up w-full max-w-md p-6 md:p-8">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand ring-1 ring-blue-400/30"><Lock className="h-5 w-5 text-blue-200" /></div>
        <h2 className="font-heading text-xl font-bold text-white">Master Database Terkunci</h2>
        <p className="mt-1 text-sm text-slate-400">Area ini berisi data master (Manpower, Stores, Products, Coverages). Masukkan password admin untuk melanjutkan.</p>
        <input type="password" autoFocus className="input mt-5 h-11" placeholder="Password admin" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} data-testid="master-db-password-input" />
        {error && <p className="mt-2 text-sm text-red-300" data-testid="master-db-password-error">{error}</p>}
        <button type="submit" className="btn-accent mt-4 h-11 w-full" data-testid="master-db-unlock-button"><ShieldCheck className="h-4 w-4" /> Buka Akses</button>
      </form>
    </div>
  );
}
