'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { renderSessionReservedCompleted } from '@/lib/email/templates/session-reservee';
import { upsertEmployeeForEmployer } from '@/lib/employees/upsert';

async function requireEtabOnSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié');
  const sb = await createClient();
  const { data: s } = await sb
    .from('sessions')
    .select('reserved_company_id')
    .eq('id', sessionId)
    .single();
  if (!s || (s as { reserved_company_id: string | null }).reserved_company_id !== profile.id) {
    throw new Error('Accès refusé');
  }
  return { profile, sb };
}

export async function saveAnalyseBesoins(sessionId: string, analyse: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb
    .from('session_reserved_details')
    .upsert({
      session_id: sessionId,
      analyse_besoins: analyse,
      updated_at: new Date().toISOString(),
    });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

/**
 * Inscrit un employee (fiche salarié) à la session réservée.
 * - Vérifie que l'employee appartient bien au compte étab connecté.
 * - Anti-doublon : si déjà inscrit (via inscription_participants.employee_id
 *   sur cette session), on no-op.
 * - Crée une inscription `confirmee` (pas de validation admin sur session réservée)
 *   + une ligne inscription_participants.
 */
export async function inscrireStagiaire(sessionId: string, employeeId: string) {
  const { profile, sb } = await requireEtabOnSession(sessionId);

  // 1) Sécurité : l'employee doit appartenir à ce compte étab
  const { data: emp, error: empErr } = await sb
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('employer_profile_id', profile.id)
    .maybeSingle();
  if (empErr) throw new Error(empErr.message);
  if (!emp) throw new Error('Salarié introuvable ou non rattaché à votre compte.');

  // 2) Anti-doublon : déjà inscrit sur cette session ?
  const { data: existingParts } = await sb
    .from('inscription_participants')
    .select('id, inscription:inscriptions!inner(session_id, statut)')
    .eq('employee_id', employeeId);
  const alreadyInscrit = (existingParts ?? []).some((row) => {
    const rel = (row as unknown as { inscription: unknown }).inscription;
    const insc = Array.isArray(rel)
      ? (rel[0] as { session_id: string; statut: string } | undefined)
      : (rel as { session_id: string; statut: string } | null);
    return insc != null && insc.session_id === sessionId && insc.statut !== 'refusee';
  });
  if (alreadyInscrit) {
    revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
    return;
  }

  // 3) Crée l'inscription (confirmee = inscription directe sur session réservée)
  const { data: insc, error: inscErr } = await sb
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: profile.id,
      participant_profile_id: null,
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (inscErr || !insc) throw new Error(inscErr?.message ?? 'Création inscription impossible');

  // 4) Lie le salarié
  const { error: partErr } = await sb.from('inscription_participants').insert({
    inscription_id: (insc as { id: string }).id,
    employee_id: employeeId,
  });
  if (partErr) throw new Error(partErr.message);

  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

/**
 * Crée une fiche salarié dans `employees` puis inscrit ce salarié à la session.
 * Si un salarié avec le même email existe déjà sous ce compte, on le réutilise.
 * Si l'email correspond à un compte stagiaire existant, une invitation de
 * rattachement est envoyée (pas de second compte).
 */
export async function creerEtInscrireStagiaire(
  sessionId: string,
  payload: { prenom: string; nom: string; email: string },
) {
  const { profile, sb } = await requireEtabOnSession(sessionId);

  const result = await upsertEmployeeForEmployer(sb, profile.id, payload, profile.id);
  if (!result.ok) throw new Error(result.error);

  await inscrireStagiaire(sessionId, result.id);
}

export async function uploadDocumentRequest(
  sessionId: string,
  requestId: string,
  formData: FormData,
) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Fichier manquant');
  const path = `${sessionId}/${requestId}/${crypto.randomUUID()}-${file.name}`;
  const { error: upErr } = await sb.storage
    .from('session-etab-uploads')
    .upload(path, file);
  if (upErr) throw new Error(upErr.message);
  await sb.from('session_document_uploads').insert({
    request_id: requestId,
    session_id: sessionId,
    storage_path: path,
    filename: file.name,
    uploaded_by: profile.id,
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function finaliserSession(sessionId: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb.from('session_reserved_details').upsert({
    session_id: sessionId,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id' });

  try {
    const sbAdmin = createAdminClient();
    const { data: sessRaw } = await sbAdmin
      .from('sessions')
      .select('id, reserved_company_id, formations(titre)')
      .eq('id', sessionId)
      .single();
    const sess = sessRaw as {
      id: string;
      reserved_company_id: string | null;
      formations: { titre: string } | { titre: string }[] | null;
    } | null;
    const reservedCompanyId = sess?.reserved_company_id ?? null;
    let raisonSociale = '';
    if (reservedCompanyId) {
      const { data: cd } = await sbAdmin
        .from('company_details')
        .select('raison_sociale')
        .eq('profile_id', reservedCompanyId)
        .maybeSingle();
      raisonSociale = (cd as { raison_sociale: string | null } | null)?.raison_sociale ?? '';
    }
    const f = sess?.formations ?? null;
    const formationTitre = !f ? '' : Array.isArray(f) ? f[0]?.titre ?? '' : f.titre ?? '';
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ckim-formation.fr';
    const adminUrl = `${baseUrl}/admin/sessions/${sessionId}`;

    const { data: admins } = await sbAdmin.from('profiles').select('email').eq('role', 'admin');
    const emails = ((admins as { email: string | null }[] | null) ?? [])
      .map((p) => p.email)
      .filter((e): e is string => !!e);

    for (const to of emails) {
      await sendAndLog({
        kind: 'session_reserved_completed',
        to,
        subject: `${raisonSociale} a finalisé sa session`,
        html: renderSessionReservedCompleted({ raisonSociale, formationTitre, adminUrl }),
        refTable: 'sessions',
        refId: sessionId,
      });
    }
  } catch (e) {
    console.error('[finaliserSession] admin notification failed', e);
  }

  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}
