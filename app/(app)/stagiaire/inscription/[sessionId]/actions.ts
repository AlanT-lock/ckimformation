'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import {
  demandeAdminEmailHtml,
  demandeAdminEmailSubject,
  type InscriptionCreneauInfo,
  type InscriptionParticipantInfo,
  type InscriptionPayerInfo,
  type InscriptionSessionInfo,
} from '@/lib/email/templates/inscription';

const ADMIN_EMAIL = 'contact@ckimformation.fr';

async function requireStagiaire() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') throw new Error('Accès refusé');
  return profile;
}

export interface NewEmployeeInput {
  prenom: string;
  nom: string;
  email: string;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function fetchSessionForEmail(sessionId: string, admin: ReturnType<typeof createAdminClient>): Promise<InscriptionSessionInfo> {
  const { data } = await admin
    .from('sessions')
    .select(`
      adresse,
      formation:formations(titre),
      formateur:profiles!sessions_formateur_id_fkey(full_name),
      creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)
    `)
    .eq('id', sessionId)
    .single();

  const formation = Array.isArray(data?.formation) ? data?.formation[0] : data?.formation;
  const formateur = Array.isArray(data?.formateur) ? data?.formateur[0] : data?.formateur;
  const creneaux = ((data?.creneaux ?? []) as { date: string; heure_debut: string; heure_fin: string; ordre: number }[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map<InscriptionCreneauInfo>((c) => ({ date: c.date, heure_debut: c.heure_debut, heure_fin: c.heure_fin }));

  return {
    formation_titre: formation?.titre ?? 'Formation',
    creneaux,
    adresse: (data?.adresse ?? null) as InscriptionSessionInfo['adresse'],
    formateur_nom: formateur?.full_name ?? null,
  };
}

async function fetchPayerInfo(
  payerId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<InscriptionPayerInfo> {
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, phone, account_type')
    .eq('id', payerId)
    .single();

  const accountType = (profile?.account_type ?? 'particulier') as 'entreprise' | 'particulier';
  let raisonSociale: string | null = null;
  if (accountType === 'entreprise') {
    const { data: company } = await admin
      .from('company_details')
      .select('raison_sociale')
      .eq('profile_id', payerId)
      .maybeSingle();
    raisonSociale = company?.raison_sociale ?? null;
  }
  return {
    type: accountType,
    raison_sociale: raisonSociale,
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? null,
  };
}

async function sendDemandeAdminEmail(
  inscriptionId: string,
  payer: InscriptionPayerInfo,
  session: InscriptionSessionInfo,
  participants: InscriptionParticipantInfo[],
  analyseBesoins: string
) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: demandeAdminEmailSubject(payer, session.formation_titre),
      html: demandeAdminEmailHtml({
        inscriptionId,
        session,
        payer,
        participants,
        analyseBesoins,
        adminUrl: `${siteUrl()}/admin/demandes/${inscriptionId}`,
      }),
    });
  } catch (err) {
    console.error('[demande] Email admin failed:', err);
  }
}

// -----------------------------------------------------------------------------
// Particulier
// -----------------------------------------------------------------------------
export async function demanderInscriptionParticulier(
  sessionId: string,
  analyseBesoins: string
): Promise<void> {
  const profile = await requireStagiaire();
  if (profile.account_type !== 'particulier') {
    throw new Error('Cette action est réservée aux comptes particuliers.');
  }
  const besoins = analyseBesoins.trim();
  if (besoins.length < 10) {
    throw new Error('Merci de détailler votre analyse des besoins (10 caractères minimum).');
  }

  const supabase = await createClient();

  // Anti-doublon : une demande en_attente ou confirmee suffit
  const { data: existing } = await supabase
    .from('inscriptions')
    .select('id, statut')
    .eq('session_id', sessionId)
    .eq('payer_profile_id', profile.id)
    .in('statut', ['en_attente', 'confirmee']);
  if (existing && existing.length > 0) {
    throw new Error('Vous avez déjà une demande en cours ou confirmée pour cette session.');
  }

  const { data: insc, error } = await supabase
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: profile.id,
      participant_profile_id: profile.id,
      statut: 'en_attente',
      analyse_besoins: besoins,
    })
    .select('id')
    .single();
  if (error || !insc) {
    console.error('[demande/particulier] insert inscription failed', error);
    throw new Error(error?.message ?? 'Erreur inscription');
  }

  const { error: partErr } = await supabase.from('inscription_participants').insert({
    inscription_id: insc.id,
    participant_profile_id: profile.id,
  });
  if (partErr) {
    console.error('[demande/particulier] insert participant failed', partErr);
    throw new Error(partErr.message);
  }

  // Email + lecture admin sont accessoires : on n'échoue pas la demande si ça
  // foire (sécurité contre RESEND_API_KEY manquant, SERVICE_ROLE_KEY manquant,
  // Resend down, etc.).
  try {
    const admin = createAdminClient();
    const [session, payer] = await Promise.all([
      fetchSessionForEmail(sessionId, admin),
      fetchPayerInfo(profile.id, admin),
    ]);
    const participants: InscriptionParticipantInfo[] = [
      {
        prenom: payer.full_name.split(' ')[0] ?? '',
        nom: payer.full_name.split(' ').slice(1).join(' '),
        email: payer.email,
      },
    ];
    await sendDemandeAdminEmail(insc.id, payer, session, participants, besoins);
  } catch (err) {
    console.error('[demande/particulier] notification admin échouée (non-bloquant)', err);
  }

  revalidatePath('/stagiaire/inscriptions');
  revalidatePath('/stagiaire');
  redirect('/stagiaire/inscriptions?demande=1');
}

// -----------------------------------------------------------------------------
// Entreprise
// -----------------------------------------------------------------------------
export async function demanderInscriptionEntreprise(
  sessionId: string,
  existingEmployeeIds: string[],
  newEmployees: NewEmployeeInput[],
  analyseBesoins: string
): Promise<void> {
  const profile = await requireStagiaire();
  if (profile.account_type !== 'entreprise') {
    throw new Error('Cette action est réservée aux comptes entreprise.');
  }
  const besoins = analyseBesoins.trim();
  if (besoins.length < 10) {
    throw new Error('Merci de détailler votre analyse des besoins (10 caractères minimum).');
  }

  // Normalise new employees
  const normalizedNew = newEmployees
    .map((e) => ({
      prenom: e.prenom.trim(),
      nom: e.nom.trim(),
      email: e.email.trim().toLowerCase(),
    }))
    .filter((e) => e.prenom && e.nom && e.email);

  if (existingEmployeeIds.length === 0 && normalizedNew.length === 0) {
    throw new Error('Sélectionnez au moins un salarié à inscrire.');
  }
  for (const e of normalizedNew) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) {
      throw new Error(`Email invalide pour ${e.prenom} ${e.nom}.`);
    }
  }

  const supabase = await createClient();

  // 1) Vérifie que les existingEmployeeIds appartiennent à ce compte entreprise
  let validatedExistingIds: string[] = [];
  if (existingEmployeeIds.length > 0) {
    const { data: rows, error: chkErr } = await supabase
      .from('employees')
      .select('id')
      .eq('employer_profile_id', profile.id)
      .in('id', existingEmployeeIds);
    if (chkErr) throw new Error(chkErr.message);
    validatedExistingIds = (rows ?? []).map((r) => r.id);
    if (validatedExistingIds.length !== existingEmployeeIds.length) {
      throw new Error('Salarié(s) introuvable(s) ou non rattaché(s) à votre compte.');
    }
  }

  // 2) Crée les nouveaux employés (s'ils n'existent pas déjà — sinon récupère l'ID)
  const createdIds: string[] = [];
  for (const e of normalizedNew) {
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('employer_profile_id', profile.id)
      .eq('email', e.email)
      .maybeSingle();
    if (existing) {
      createdIds.push(existing.id);
      continue;
    }
    const { data: inserted, error: insErr } = await supabase
      .from('employees')
      .insert({ employer_profile_id: profile.id, prenom: e.prenom, nom: e.nom, email: e.email })
      .select('id')
      .single();
    if (insErr || !inserted) {
      throw new Error(`Création du salarié ${e.email} impossible : ${insErr?.message ?? ''}`);
    }
    createdIds.push(inserted.id);
  }

  const allEmployeeIds = Array.from(new Set([...validatedExistingIds, ...createdIds]));
  if (allEmployeeIds.length === 0) throw new Error('Aucun participant valide.');

  // 3) Crée la demande d'inscription (1 ligne) + participants (N lignes)
  const { data: insc, error } = await supabase
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: profile.id,
      participant_profile_id: null,
      statut: 'en_attente',
      analyse_besoins: besoins,
    })
    .select('id')
    .single();
  if (error || !insc) {
    console.error('[demande/entreprise] insert inscription failed', error);
    throw new Error(error?.message ?? 'Erreur création demande');
  }

  const partRows = allEmployeeIds.map((eid) => ({ inscription_id: insc.id, employee_id: eid }));
  const { error: partErr } = await supabase.from('inscription_participants').insert(partRows);
  if (partErr) {
    console.error('[demande/entreprise] insert participants failed', partErr);
    throw new Error(partErr.message);
  }

  // Email + lecture admin sont accessoires
  try {
    const admin = createAdminClient();
    const [session, payer, employeesData] = await Promise.all([
      fetchSessionForEmail(sessionId, admin),
      fetchPayerInfo(profile.id, admin),
      admin.from('employees').select('prenom, nom, email').in('id', allEmployeeIds),
    ]);
    const participants: InscriptionParticipantInfo[] = (employeesData.data ?? []).map((e) => ({
      prenom: e.prenom,
      nom: e.nom,
      email: e.email,
    }));
    await sendDemandeAdminEmail(insc.id, payer, session, participants, besoins);
  } catch (err) {
    console.error('[demande/entreprise] notification admin échouée (non-bloquant)', err);
  }

  revalidatePath('/stagiaire/inscriptions');
  revalidatePath('/stagiaire');
  redirect(`/stagiaire/inscriptions?demande=${allEmployeeIds.length}`);
}
