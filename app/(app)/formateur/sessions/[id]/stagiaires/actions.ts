'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';

export async function toggleCreneauAbsence(
  sessionId: string,
  creneauId: string,
  participantId: string,
  absent: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireFormateurOfSession(sessionId);
  const supabase = await createClient();

  // Vérifie que le créneau appartient bien à la session
  const { data: cre } = await supabase
    .from('session_creneaux')
    .select('id, session_id')
    .eq('id', creneauId)
    .single();
  if (!cre || cre.session_id !== sessionId) {
    return { ok: false, error: 'Créneau introuvable.' };
  }

  if (absent) {
    const { error } = await supabase
      .from('creneau_absences')
      .upsert(
        { creneau_id: creneauId, inscription_participant_id: participantId, marked_by: profile.id },
        { onConflict: 'creneau_id,inscription_participant_id' }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('creneau_absences')
      .delete()
      .eq('creneau_id', creneauId)
      .eq('inscription_participant_id', participantId);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function requireFormateurOfSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié.');
  if (profile.role !== 'formateur' && profile.role !== 'admin') {
    throw new Error('Accès réservé.');
  }
  if (profile.role === 'formateur') {
    const supabase = await createClient();
    const { data: s } = await supabase
      .from('sessions')
      .select('formateur_id')
      .eq('id', sessionId)
      .single();
    if (!s || s.formateur_id !== profile.id) throw new Error('Cette session ne vous est pas attribuée.');
  }
  return profile;
}

export async function updateEmployeeEmailBeforeAccount(
  sessionId: string,
  employeeId: string,
  newEmail: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireFormateurOfSession(sessionId);
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email invalide.' };
  }
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id, profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };
  if (emp.profile_id) {
    return { ok: false, error: 'Ce salarié a déjà un compte. Modification impossible.' };
  }
  const { error } = await admin
    .from('employees')
    .update({ email, updated_at: new Date().toISOString() })
    .eq('id', employeeId);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Un autre salarié utilise déjà cet email dans cette entreprise.' };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true };
}

export async function sendInvitationToEmployee(
  sessionId: string,
  employeeId: string
): Promise<{ ok: true; resent: boolean } | { ok: false; error: string }> {
  await requireFormateurOfSession(sessionId);
  const admin = createAdminClient();

  const { data: emp } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id, employer_profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  const isResend = !!emp.profile_id;

  // Charge contexte session pour l'email
  const { data: sess } = await admin
    .from('sessions')
    .select('formation:formations(titre)')
    .eq('id', sessionId)
    .single();
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);

  const { data: company } = await admin
    .from('company_details')
    .select('raison_sociale')
    .eq('profile_id', emp.employer_profile_id)
    .maybeSingle();
  const { data: employer } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', emp.employer_profile_id)
    .maybeSingle();
  const entrepriseLabel = company?.raison_sociale || employer?.full_name || 'Votre employeur';

  const redirect = `${siteUrl()}/callback?redirect=/stagiaire/parcours`;
  let actionLink: string;

  if (isResend) {
    // Le compte auth existe déjà — on génère un lien de récupération (set/reset password)
    // qui ramène l'utilisateur sur /setup-password via /callback.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: emp.email,
      options: { redirectTo: redirect },
    });
    if (error || !data?.properties?.action_link) {
      return {
        ok: false,
        error: error?.message ?? "Impossible de générer un nouveau lien d'invitation.",
      };
    }
    actionLink = data.properties.action_link;
  } else {
    // Première invitation : crée l'auth user + récupère le lien.
    // generateLink('invite') crée l'utilisateur sans envoyer d'email automatique
    // (on envoie nous-mêmes l'email branded C-KIM ci-dessous).
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: emp.email,
      options: {
        data: {
          role: 'stagiaire',
          account_type: 'particulier',
          full_name: `${emp.prenom} ${emp.nom}`.trim(),
          employer_profile_id: emp.employer_profile_id,
          employee_id: emp.id,
        },
        redirectTo: redirect,
      },
    });
    if (error || !data?.properties?.action_link) {
      return { ok: false, error: error?.message ?? "L'invitation n'a pas pu être créée." };
    }
    actionLink = data.properties.action_link;
  }

  // Email custom branding C-KIM avec le lien valide
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: emp.email,
      subject: invitationEmailSubject(formation?.titre ?? 'Formation', isResend),
      html: invitationEmailHtml({
        prenom: emp.prenom,
        nom: emp.nom,
        entrepriseLabel,
        formationTitre: formation?.titre ?? 'Formation',
        invitationUrl: actionLink,
        isResend,
      }),
    });
  } catch (err) {
    console.error('[invitation] Email failed:', err);
    return { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé." };
  }

  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true, resent: isResend };
}
