import { isMock, supabase } from './supabase';

const KEY = 'ffcc_mock_session';
const env = import.meta.env;
const MOCK_USERS = [
  { email: env.VITE_MOCK_ADMIN_EMAIL, password: env.VITE_MOCK_ADMIN_PASSWORD, role: 'admin', name: 'Owner Admin' },
  { email: env.VITE_MOCK_LEADER_EMAIL, password: env.VITE_MOCK_LEADER_PASSWORD, role: 'leader', name: 'Budi Santoso' },
];
const INVALID = 'Email atau password salah.';

export const readMockSession = () => (isMock ? JSON.parse(sessionStorage.getItem(KEY) || 'null') : null);

export async function signIn(email, password) {
  const mail = email.trim().toLowerCase();
  if (isMock) {
    const u = MOCK_USERS.find((x) => x.email && x.email.toLowerCase() === mail && x.password === password);
    if (!u) throw new Error(INVALID);
    const session = { email: u.email, role: u.role, name: u.name };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }
  const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
  if (error) throw new Error(INVALID);
  return null;
}

export async function signOut() {
  if (isMock) sessionStorage.removeItem(KEY);
  else await supabase.auth.signOut();
}

export async function loadProfile(session) {
  if (!session) return null;
  const { data, error } = await supabase.from('user_roles').select('role, display_name').eq('user_id', session.user.id).maybeSingle();
  return {
    id: session.user.id,
    email: session.user.email,
    role: error ? null : data?.role ?? null,
    name: data?.display_name || session.user.email,
  };
}
