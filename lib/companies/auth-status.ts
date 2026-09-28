import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Ids (parmi `ids`) dont l'utilisateur auth s'est déjà connecté au moins une fois. */
export async function loadSignedInIds(admin: AdminClient, ids: string[]): Promise<Set<string>> {
  const wanted = new Set(ids);
  const signedIn = new Set<string>();
  if (wanted.size === 0) return signedIn;

  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('[companies] listUsers failed', error);
      break;
    }
    for (const u of data.users) {
      if (wanted.has(u.id) && u.last_sign_in_at) signedIn.add(u.id);
    }
    if (data.users.length < perPage) break;
  }
  return signedIn;
}
