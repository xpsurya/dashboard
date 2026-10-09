import { useEffect } from 'react';
import { X } from 'lucide-react';

const BADGE = {
  red: 'bg-red-500/15 text-red-300 ring-red-500/30',
  yellow: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  blue: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  slate: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
};

export const Badge = ({ tone = 'slate', children, testId }) => (
  <span data-testid={testId} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BADGE[tone]}`}>
    {children}
  </span>
);

export function Card({ title, subtitle, icon: Icon, actions, children, className = '', bodyClass = 'p-4', testId }) {
  return (
    <section className={`card fade-up min-w-0 ${className}`} data-testid={testId}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-blue-300" />}
            <div className="min-w-0">
              <h3 className="font-heading text-base font-semibold text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const TONE = {
  accent: { icon: 'text-blue-300 bg-blue-500/10 ring-blue-400/20', bar: 'bg-blue-500' },
  success: { icon: 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/20', bar: 'bg-emerald-500' },
  warning: { icon: 'text-amber-300 bg-amber-500/10 ring-amber-400/20', bar: 'bg-amber-500' },
  danger: { icon: 'text-red-300 bg-red-500/10 ring-red-400/20', bar: 'bg-red-500' },
};

export function KpiCard({ label, value, sub, icon: Icon, tone = 'accent', progress, testId, delay = 0, className = '' }) {
  return (
    <div
      className={`fade-up relative overflow-hidden rounded-xl border border-slate-700/80 bg-gradient-to-br from-surface to-[#111827] p-4 shadow-xl transition-colors hover:border-slate-500/60 md:p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label">{label}</p>
        {Icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${TONE[tone].icon}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 break-words font-mono text-xl font-bold tracking-tight text-white md:text-2xl" data-testid={`${testId}-value`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-[width] duration-700 ${TONE[tone].bar}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, size = 'md', testId }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={`fade-up relative flex max-h-[92vh] w-full ${w} flex-col rounded-2xl border border-slate-700 bg-surface shadow-2xl`} data-testid={testId}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-5 py-4">
          <h3 className="font-heading text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white" data-testid={`${testId}-close-button`}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-700 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export const EmptyState = ({ text, testId }) => (
  <div className="py-10 text-center text-sm text-slate-500" data-testid={testId}>{text}</div>
);

export const Field = ({ label, children, className = '' }) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    <span className="label">{label}</span>
    {children}
  </label>
);
