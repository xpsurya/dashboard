import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Placeholder credentials => run on in-memory MOCK data
export const isMock = !url || !key || key.includes('ANON_KEY_HERE') || /^https:\/\/supabase\.co\/?$/.test(url);

export const supabase = isMock ? null : createClient(url, key);
