import { useState } from 'react';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge, Modal } from '../common/ui';
import { LoginForm } from './LoginForm';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <>
        <button className="btn-ghost" onClick={() => setOpen(true)} data-testid="login-open-button">
          <LogIn className="h-4 w-4" /> <span className="hidden md:inline">Login</span>
        </button>
        <Modal open={open} size="sm" title="Login Leader / Admin" onClose={() => setOpen(false)} testId="login-modal">
          <LoginForm idPrefix="nav-login" onSuccess={() => setOpen(false)} />
        </Modal>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1.5" data-testid="user-menu">
      <span className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-200" data-testid="current-user-badge">
        <UserRound className="h-3.5 w-3.5 text-blue-300" />
        <span className="hidden max-w-[150px] truncate lg:inline">{user.name}</span>
        <Badge tone={user.role === 'admin' ? 'blue' : user.role ? 'green' : 'red'} testId="current-user-role">{user.role ? user.role.toUpperCase() : 'NO ROLE'}</Badge>
      </span>
      <button className="btn-ghost px-2.5" onClick={signOut} title="Logout" data-testid="logout-button">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
