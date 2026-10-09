import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isMock, supabase } from '../lib/supabase';
import { loadProfile, readMockSession, signIn as doSignIn, signOut as doSignOut } from '../lib/auth';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readMockSession());
  const [loading, setLoading] = useState(!isMock);

  useEffect(() => {
    if (isMock) return undefined;
    let alive = true;
    const apply = async (session) => {
      const profile = await loadProfile(session);
      if (alive) {
        setUser(profile);
        setLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => apply(session), 0);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const session = await doSignIn(email, password);
    if (isMock) setUser(session);
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    if (isMock) setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
