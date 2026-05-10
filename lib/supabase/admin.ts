import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec la service_role key.
 * Bypass RLS — à n'utiliser QUE côté serveur (Server Actions, Route Handlers, Server Components).
 * Ne JAMAIS importer depuis un composant client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
