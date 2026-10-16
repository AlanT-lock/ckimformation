import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { todayIsoParis } from '@/lib/date';
import { canCloseDay, isSessionEditable, sessionDays } from '@/lib/suivi/progress';

/**
 * Contexte des pages « fin de journée » : formateur de la session (ou admin),
 * journée de la session déjà commencée et session encore modifiable.
 */
export async function loadJourneeContext(sessionId: string, date: string) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'formateur' && profile.role !== 'admin')) redirect('/login');

  const admin = createAdminClient();
  const { data: session } = await admin
    .from('sessions')
    .select('id, statut, formateur_id, formation:formations(titre), creneaux:session_creneaux(date)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) redirect('/formateur/sessions');

  const days = sessionDays((session.creneaux ?? []) as Array<{ date: string }>);
  const backHref = `/formateur/sessions/${sessionId}`;
  if (!days.includes(date) || !canCloseDay(date, todayIsoParis()) || !isSessionEditable(session.statut)) {
    redirect(backHref);
  }

  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;
  return {
    formationTitre: formation?.titre ?? 'Formation',
    dayIndex: days.indexOf(date) + 1,
    daysCount: days.length,
    backHref,
  };
}
