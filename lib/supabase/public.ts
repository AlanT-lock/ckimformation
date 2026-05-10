import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase sans gestion de session (anon key, pas de cookies).
 * Pour les pages publiques en SSG/ISR — la RLS "read published" suffit à filtrer.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
