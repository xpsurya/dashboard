import { LoaderCircle, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';

export function AccessGate({ roles, title, description, children, testId }) {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className="card flex items-center justify-center gap-2 p-8 text-sm text-slate-400" data-testid={`${testId}-loading`}>
        <LoaderCircle className="h-4 w-4 animate-spin" /> Memeriksa sesi login…
      </div>
    );
  }
  if (user && roles.includes(user.role)) return children;

  return (
    <div className="flex justify-center py-8 md:py-12" data-testid={testId}>
      <div className="card fade-up w-full max-w-md p-6 md:p-8">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand ring-1 ring-blue-400/30">
          <ShieldCheck className="h-5 w-5 text-blue-200" />
        </div>
        <h2 className="font-heading text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
        <div className="mt-5">
          {user ? (
            <>
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200" data-testid="access-denied-message">
                Akun <b>{user.email}</b> ({user.role ?? 'tanpa role'}) tidak memiliki akses. Dibutuhkan role: {roles.join(' / ').toUpperCase()}.
              </div>
              <button className="btn-ghost mt-4 w-full" onClick={signOut} data-testid="access-gate-logout-button">
                <LogOut className="h-4 w-4" /> Logout & ganti akun
              </button>
            </>
          ) : (
            <LoginForm idPrefix={`${testId}-login`} />
          )}
        </div>
      </div>
    </div>
  );
}
