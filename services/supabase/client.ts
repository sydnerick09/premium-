import { createClient } from '@supabase/supabase-js';

// Supabase project (publishable/anon key — safe to ship in the client).
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://nkavbdhccvwzfiocdefq.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_tJU86kJzFgENPgvCyLWNGQ_K6mzqEeS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist the session so the same browser keeps a stable identity across
    // reloads (web uses localStorage automatically). This is what lets Row Level
    // Security scope rows to THIS user via auth.uid().
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Each device signs in anonymously so it has a real auth.uid() that RLS can key
// on — without asking the user for credentials. Memoised so we only do it once.
let _sessionPromise: Promise<string | null> | null = null;
export function ensureSupabaseUserId(): Promise<string | null> {
  if (!_sessionPromise) {
    _sessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) return data.session.user.id;
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) { _sessionPromise = null; return null; } // e.g. anon sign-in disabled
        return anon.user?.id ?? null;
      } catch {
        _sessionPromise = null;
        return null;
      }
    })();
  }
  return _sessionPromise;
}
