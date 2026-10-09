import { useEffect, useState } from 'react';

export function useKiosk(active, tabs, setTab, seconds) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!active) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || elapsed < seconds) return;
    setElapsed(0);
    setTab((t) => tabs[(tabs.indexOf(t) + 1) % tabs.length]);
  }, [active, elapsed, seconds, tabs, setTab]);

  return { progress: elapsed / seconds, remaining: seconds - elapsed };
}
