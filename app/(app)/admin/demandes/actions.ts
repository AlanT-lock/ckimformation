'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import {
  confirmationEmailHtml,
  confirmationEmailSubject,
  refusEmailHtml,
  refusEmailSubject,
  type InscriptionParticipantInfo,
  type InscriptionPayerInfo,
  type InscriptionSessionInfo,
} from '@/lib/email/templates/inscription';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès réservé à l\'administration.');
  }
  return profile;
}

async function fetchInscriptionContext(inscriptionId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: ins } = await admin
    .from('inscriptions')
    .select(`
      id, session_id, payer_profile_id, analyse_besoins,
      session:sessions(
        adresse,
        formation:formations(titre),
        formateur:profiles!sessions_formateur_id_fkey(full_name),
        creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)
      ),
      participants:inscription_participants(
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      )
    `)
    .eq('id', inscriptionId)
    .single();

  if (!ins) throw new Error('Demande introuvable.');

  const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
  const formateur = sess && (Array.isArray(sess.formateur) ? sess.formateur[0] : sess.formateur);
  const creneaux = ((sess?.creneaux ?? []) as { date: string; heure_debut: string; heure_fin: string; ordre: number }[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((c) => ({ date: c.date, heure_debut: c.heure_debut, heure_fin: c.heure_fin }));

  const session: InscriptionSessionInfo = {
    formation_titre: formation?.titre ?? 'Formation',
    creneaux,
    adresse: (sess?.adresse ?? null) as InscriptionSessionInfo['adresse'],
    formateur_nom: formateur?.full_name ?? null,
  };

  const { data: payerProfile } = await admin
    .from('profiles')
    .select('full_name, email, phone, account_type')
    .eq('id', ins.payer_profile_id)
    .single();

  const accountType = (payerProfile?.account_type ?? 'particulier') as 'entreprise' | 'particulier';
  let raisonSociale: string | null = null;
  if (accountType === 'entreprise') {
    const { data: company } = await admin
      .from('company_details')
      .select('raison_sociale')
      .eq('profile_id', ins.payer_profile_id)
      .maybeSingle();
    raisonSociale = company?.raison_sociale ?? null;
  }
  const payer: InscriptionPayerInfo = {
    type: accountType,
    raison_sociale: raisonSociale,
    full_name: payerProfile?.full_name ?? '',
    email: payerProfile?.email ?? '',
    phone: payerProfile?.phone ?? null,
  };

  const participants: InscriptionParticipantInfo[] = ((ins.participants ?? []) as Array<{
    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  }>)
    .map((p) => {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      if (emp) return { prenom: emp.prenom, nom: emp.nom, email: emp.email };
      if (prof) {
        const parts = prof.full_name.split(' ');
        return { prenom: parts[0] ?? '', nom: parts.slice(1).join(' '), email: prof.email };
      }
      return null;
    })
    .filter((x): x is InscriptionParticipantInfo => x !== null);

  return { ins, session, payer, participants, analyseBesoins: ins.analyse_besoins ?? '' };
}

export async function confirmerDemande(inscriptionId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('inscriptions')
    .update({
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
      refus_motif: null,
      refused_at: null,
    })
    .eq('id', inscriptionId);
  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  const { session, payer, participants } = await fetchInscriptionContext(inscriptionId, admin);

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: payer.email,
      subject: confirmationEmailSubject(session.formation_titre),
      html: confirmationEmailHtml({ payer, session, participants }),
    });
  } catch (err) {
    console.error('[confirm] Email payer failed:', err);
  }

  revalidatePath('/admin/demandes');
  revalidatePath(`/admin/demandes/${inscriptionId}`);
  redirect(`/admin/demandes/${inscriptionId}?confirmee=1`);
}

export async function refuserDemande(inscriptionId: string, motif: string): Promise<void> {
  await requireAdmin();
  const m = motif.trim();
  if (m.length < 5) throw new Error('Merci d\'indiquer un motif (5 caractères minimum).');

  const supabase = await createClient();
  const { error } = await supabase
    .from('inscriptions')
    .update({
      statut: 'refusee',
      refused_at: new Date().toISOString(),
      refus_motif: m,
      confirmed_at: null,
    })
    .eq('id', inscriptionId);
  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  const { session, payer } = await fetchInscriptionContext(inscriptionId, admin);

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: payer.email,
      subject: refusEmailSubject(session.formation_titre),
      html: refusEmailHtml({ payer, session, motif: m }),
    });
  } catch (err) {
    console.error('[refuse] Email payer failed:', err);
  }

  revalidatePath('/admin/demandes');
  revalidatePath(`/admin/demandes/${inscriptionId}`);
  redirect(`/admin/demandes/${inscriptionId}?refusee=1`);
}
