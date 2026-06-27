import { supabase, ensureSupabaseUserId } from './client';

const TABLE = 'profiles';

export interface ProfileUpsert {
  email?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  isPremium?: boolean;
  provider?: string | null;
}

export const supabaseProfiles = {
  /**
   * Record the signed-in account in Supabase so account creation/sign-in is
   * visible in the database. Keyed on the device's anonymous auth.uid() (which
   * RLS requires); writes the account's email / name so you can see who signed
   * up. Best-effort — never throws into the auth flow.
   */
  async upsert(p: ProfileUpsert): Promise<void> {
    const id = await ensureSupabaseUserId();
    if (!id) return; // anonymous sign-in disabled → skip silently
    const row: Record<string, unknown> = {
      id,
      email: p.email ?? null,
      display_name: p.displayName ?? null,
      photo_url: p.photoUrl ?? null,
    };
    if (p.isPremium != null) row.is_premium = p.isPremium;
    const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },
};
