import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fmtDateTime } from '../../lib/format';

export function Lightbox({ photos, index, onClose, onNav }) {
  const p = photos[index];
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, onNav]);
  if (!p) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/95" data-testid="photo-lightbox">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading font-semibold text-white">{p.label} · {p.spgName}</p>
          <p className="truncate text-xs text-slate-400">{p.storeName} · {fmtDateTime(p.time)} {p.extra ? `· ${p.extra}` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">{index + 1} / {photos.length}</span>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" onClick={onClose} data-testid="photo-lightbox-close-button"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
        <img src={p.url} alt={p.label} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" data-testid="photo-lightbox-image" />
        <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-3 text-white ring-1 ring-slate-700 hover:bg-slate-800" onClick={() => onNav(-1)} data-testid="photo-lightbox-prev-button"><ChevronLeft className="h-5 w-5" /></button>
        <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-3 text-white ring-1 ring-slate-700 hover:bg-slate-800" onClick={() => onNav(1)} data-testid="photo-lightbox-next-button"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
