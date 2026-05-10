'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';

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
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireFormateurOfSession(sessionId);
  const admin = createAdminClient();

  const { data: emp } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id, employer_profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };
  if (emp.profile_id) return { ok: false, error: 'Le compte est déjà créé.' };

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

  // Invitation Supabase auth — le trigger handle_new_user lira employee_id
  // et liera employees.profile_id à new.id automatiquement.
  const redirect = `${siteUrl()}/callback?redirect=/stagiaire/parcours`;
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(emp.email, {
    data: {
      role: 'stagiaire',
      account_type: 'particulier',
      full_name: `${emp.prenom} ${emp.nom}`.trim(),
      employer_profile_id: emp.employer_profile_id,
      employee_id: emp.id,
    },
    redirectTo: redirect,
  });

  if (inviteErr) {
    return { ok: false, error: inviteErr.message };
  }
  if (!invited.user) {
    return { ok: false, error: "L'invitation n'a pas pu être envoyée." };
  }

  // Email custom (en plus du mail Supabase) avec branding C-KIM
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: emp.email,
      subject: invitationEmailSubject(formation?.titre ?? 'Formation'),
      html: invitationEmailHtml({
        prenom: emp.prenom,
        nom: emp.nom,
        entrepriseLabel,
        formationTitre: formation?.titre ?? 'Formation',
        invitationUrl: redirect,
      }),
    });
  } catch (err) {
    console.error('[invitation] Email C-KIM failed (Supabase invite déjà envoyé):', err);
  }

  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true };
}
