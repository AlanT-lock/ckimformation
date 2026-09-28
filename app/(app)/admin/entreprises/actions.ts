'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertEmployeeForEmployer } from '@/lib/employees/upsert';
import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';
import { loadSessionOccupants } from '@/lib/sessions/search-stagiaires-query';
import { isSessionEligibleForCompany, partitionEmployeesByOccupancy } from '@/lib/companies/enrollment';
import { firstAndLastDate } from '@/lib/companies/sessions';
import { todayIsoParis } from '@/lib/date';
import {
  inviteNewCompany,
  resendCompanyInvitationLink,
  type InviteCompanyResult,
} from '@/lib/companies/invitation';
import type { CompanyInput } from '@/lib/validation/company';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Accès réservé à l'administration.");
  }
  return profile;
}

export async function createCompanyByAdmin(input: CompanyInput): Promise<InviteCompanyResult> {
  await requireAdmin();
  const res = await inviteNewCompany(input);
  if (res.ok) revalidatePath('/admin/entreprises');
  return res;
}

export async function resendCompanyInvitation(
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  return resendCompanyInvitationLink(companyId);
}

type Admin = ReturnType<typeof createAdminClient>;

async function assertCompany(admin: Admin, companyId: string): Promise<boolean> {
  const { data } = await admin.from('profiles').select('account_type').eq('id', companyId).maybeSingle();
  return data?.account_type === 'entreprise';
}

function revalidateCompany(companyId: string) {
  revalidatePath(`/admin/entreprises/${companyId}`);
  revalidatePath('/admin/entreprises');
}

function invitationMessage(mode: 'create' | 'recovery' | 'link'): string {
  if (mode === 'link') return 'Ce salarié a déjà un compte : une invitation de rattachement lui a été envoyée.';
  if (mode === 'recovery') return 'Un nouveau lien d’accès a été envoyé.';
  return 'Salarié ajouté : son invitation a été envoyée par email.';
}

export async function addEmployeeByAdmin(
  companyId: string,
  input: { prenom: string; nom: string; email: string },
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const me = await requireAdmin();
  const admin = createAdminClient();
  if (!(await assertCompany(admin, companyId))) return { ok: false, error: 'Entreprise introuvable.' };

  const res = await upsertEmployeeForEmployer(admin, companyId, input, me.id);
  if (!res.ok) return res;
  revalidateCompany(companyId);

  if (res.self) {
    return { ok: true, message: 'Le contact de l’entreprise a été ajouté comme salarié (même compte, même identifiant).' };
  }
  if (res.invitation === 'sent') return { ok: true, message: invitationMessage('link') };
  if (res.invitation === 'failed') {
    return { ok: true, message: 'Salarié ajouté, mais l’invitation n’a pas pu être envoyée. Utilisez « Renvoyer ».' };
  }

  const { data: emp } = await admin.from('employees').select('profile_id').eq('id', res.id).maybeSingle();
  if (emp?.profile_id) {
    return { ok: true, message: res.created ? 'Salarié ajouté.' : 'Ce salarié est déjà dans la liste.' };
  }

  const sent = await sendEmployeeAccountInvitation(res.id, me.id);
  revalidateCompany(companyId);
  if (!sent.ok) return { ok: true, message: `Salarié ajouté, mais l’invitation a échoué : ${sent.error}` };
  return { ok: true, message: invitationMessage(sent.mode) };
}

export async function resendEmployeeInvitationByAdmin(
  companyId: string,
  employeeId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const me = await requireAdmin();
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('employer_profile_id', companyId)
    .maybeSingle();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  const sent = await sendEmployeeAccountInvitation(employeeId, me.id);
  if (!sent.ok) return sent;
  revalidateCompany(companyId);
  return { ok: true, message: invitationMessage(sent.mode) };
}

export async function getEnrolledEmployeeIds(companyId: string, sessionId: string): Promise<string[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: emps }, occupants] = await Promise.all([
    admin.from('employees').select('id, profile_id').eq('employer_profile_id', companyId),
    loadSessionOccupants(admin, sessionId),
  ]);
  return partitionEmployeesByOccupancy(emps ?? [], occupants).alreadyEnrolled;
}

export async function enrollEmployeesByAdmin(
  companyId: string,
  sessionId: string,
  employeeIds: string[],
): Promise<{ ok: true; enrolled: number; skipped: number } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  if (employeeIds.length === 0) return { ok: false, error: 'Sélectionnez au moins un salarié.' };
  if (!(await assertCompany(admin, companyId))) return { ok: false, error: 'Entreprise introuvable.' };

  const { data: session } = await admin
    .from('sessions')
    .select('id, statut, visibility, reserved_company_id, creneaux:session_creneaux(date, ordre)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return { ok: false, error: 'Session introuvable.' };
  const { firstDate } = firstAndLastDate(session.creneaux as { date: string; ordre: number }[] | null);
  const eligible = isSessionEligibleForCompany(
    {
      id: session.id,
      statut: session.statut,
      visibility: session.visibility as 'public' | 'reserved',
      reserved_company_id: session.reserved_company_id,
      firstDate,
    },
    companyId,
    todayIsoParis(),
  );
  if (!eligible) return { ok: false, error: "Cette session n'est pas ouverte à cette entreprise." };

  const uniqueIds = [...new Set(employeeIds)];
  const { data: emps } = await admin
    .from('employees')
    .select('id, profile_id')
    .eq('employer_profile_id', companyId)
    .in('id', uniqueIds);
  if (!emps || emps.length !== uniqueIds.length) {
    return { ok: false, error: "Un des salariés sélectionnés n'appartient pas à cette entreprise." };
  }

  let occupants;
  try {
    occupants = await loadSessionOccupants(admin, sessionId, { strict: true });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lecture de la session impossible.' };
  }
  const { enrollable, alreadyEnrolled } = partitionEmployeesByOccupancy(emps, occupants);
  if (enrollable.length === 0) {
    return { ok: false, error: 'Tous les salariés sélectionnés sont déjà inscrits à cette session.' };
  }

  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: companyId,
      participant_profile_id: null,
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (inscErr || !insc) return { ok: false, error: inscErr?.message ?? "Création de l'inscription impossible." };

  const { error: partErr } = await admin
    .from('inscription_participants')
    .insert(enrollable.map((employee_id) => ({ inscription_id: insc.id, employee_id })));
  if (partErr) {
    await admin.from('inscriptions').delete().eq('id', insc.id);
    return { ok: false, error: partErr.message };
  }

  revalidateCompany(companyId);
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  revalidatePath('/stagiaire/parcours');
  return { ok: true, enrolled: enrollable.length, skipped: alreadyEnrolled.length };
}
