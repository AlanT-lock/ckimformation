'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { FIN_FORMATION_KINDS, type FinFormationKind } from '@/lib/fin-formation/model';
import {
  issueDocumentsForStagiaire,
  sendCompanyRecaps,
  type CompanyRecapResult,
  type StagiaireSendResult,
} from '@/lib/fin-formation/send';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès refusé');
  }
  return profile;
}

function cleanKinds(kinds: string[]): FinFormationKind[] {
  return FIN_FORMATION_KINDS.filter((k) => kinds.includes(k));
}

/**
 * Émet les documents de fin de formation d'UN stagiaire et les lui envoie.
 * Le pop-up d'envoi appelle cette action stagiaire par stagiaire, pour afficher
 * la progression et rester sous la durée maximale d'une requête.
 */
export async function sendFinFormationToStagiaire(
  sessionId: string,
  participantId: string,
  kinds: string[]
): Promise<StagiaireSendResult> {
  const profile = await requireAdmin();
  try {
    return await issueDocumentsForStagiaire(sessionId, participantId, cleanKinds(kinds), profile.id);
  } catch (err) {
    console.error('[fin-formation] envoi stagiaire', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inattendue.' };
  }
}

/** Après l'envoi aux stagiaires : un récapitulatif par entreprise. */
export async function sendFinFormationCompanyRecaps(
  sessionId: string,
  participantIds: string[],
  kinds: string[]
): Promise<CompanyRecapResult> {
  await requireAdmin();
  try {
    return await sendCompanyRecaps(sessionId, participantIds, cleanKinds(kinds));
  } catch (err) {
    console.error('[fin-formation] récapitulatif entreprise', err);
    return {
      sent: [],
      failed: [{ entreprise: 'Entreprises', error: err instanceof Error ? err.message : 'Erreur inattendue.' }],
    };
  } finally {
    // 'layout' : toutes les rubriques de la fiche session (dont « Fin de formation »).
    revalidatePath(`/admin/sessions/${sessionId}`, 'layout');
  }
}
