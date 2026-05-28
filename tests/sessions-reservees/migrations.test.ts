import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Vérifie que la migration 20260528_sessions_reservees.sql a bien
 * créé les 5 nouvelles tables. Test d'existence le plus simple possible :
 * select limit 0 → si la table n'existe pas, error != null.
 *
 * Le test est sauté si les variables d'env Supabase ne sont pas dispo
 * (CI sans secret, environnement local non configuré).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  'session_invitations',
  'session_reserved_details',
  'session_document_requests',
  'session_document_uploads',
  'session_admin_documents',
] as const;

describe('migration sessions réservées', () => {
  if (!url || !serviceKey) {
    it.skip('skipped — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non définis', () => {});
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of TABLES) {
    it(`la table ${table} existe`, async () => {
      const { error } = await admin.from(table).select('*').limit(0);
      expect(error).toBeNull();
    });
  }
});
