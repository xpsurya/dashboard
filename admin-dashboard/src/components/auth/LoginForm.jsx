import { useState } from 'react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isMock } from '../../lib/supabase';
import { Field } from '../common/ui';

export function LoginForm({ onSuccess, idPrefix = 'login' }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid={`${idPrefix}-form`}>
      <Field label="Email">
        <input type="email" required autoComplete="username" className="input h-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.co.id" data-testid={`${idPrefix}-email-input`} />
      </Field>
      <Field label="Password">
        <input type="password" required autoComplete="current-password" className="input h-11" value={password} onChange={(e) => setPassword(e.target.value)} data-testid={`${idPrefix}-password-input`} />
      </Field>
      {error && <p className="text-sm text-red-300" role="alert" data-testid={`${idPrefix}-error`}>{error}</p>}
      <button type="submit" className="btn-accent h-11 w-full" disabled={busy} data-testid={`${idPrefix}-submit-button`}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {busy ? 'Memverifikasi…' : 'Login'}
      </button>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Akun leader & admin dibuat oleh administrator (tidak ada pendaftaran publik).
        {isMock && <span className="text-amber-300"> Mode demo: login diverifikasi lokal (MOCK) sampai Supabase terhubung.</span>}
      </p>
    </form>
  );
}
