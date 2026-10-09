import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random();
    setItems((t) => [...t, { id, message, type }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            data-testid="toast-message"
            className={`fade-up flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-2xl ${
              t.type === 'error' ? 'border-red-500/40 bg-[#2a1520] text-red-100' : 'border-emerald-500/40 bg-[#0f2a26] text-emerald-100'
            }`}
          >
            {t.type === 'error' ? <CircleX className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
