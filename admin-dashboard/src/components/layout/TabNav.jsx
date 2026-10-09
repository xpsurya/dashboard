export function TabNav({ tabs, active, onChange, kiosk }) {
  return (
    <nav className="relative border-b border-slate-800 bg-ink/80" data-testid="main-tab-nav">
      <div className="flex gap-1 overflow-x-auto px-3 md:px-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition-colors ${
              active === id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid={`${id}-tab`}
          >
            <Icon className={`h-4 w-4 ${active === id ? 'text-blue-300' : ''}`} />
            {label}
            {active === id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
      {kiosk && (
        <div className="flex items-center gap-3 border-t border-slate-800 bg-[#0E1733] px-4 py-1.5 text-[11px] font-semibold text-blue-200 md:px-6" data-testid="kiosk-progress">
          <span className="whitespace-nowrap">KIOSK MODE · tab berikutnya dalam {kiosk.remaining}s</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${kiosk.progress * 100}%` }} />
          </div>
        </div>
      )}
    </nav>
  );
}
