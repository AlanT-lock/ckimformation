import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';

/**
 * Salarié rattaché à une entreprise : on ne lui ouvre que /stagiaire/parcours.
 * À appeler en haut d'une page que l'employé ne doit pas voir.
 */
export function redirectEmployeeStagiaire(profile: Profile | null | undefined) {
  if (profile?.role === 'stagiaire' && profile.employer_profile_id) {
    redirect('/stagiaire/parcours');
  }
}
