import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';
import {
  findProfileByEmail,
  getEntrepriseLabel,
  sendEmployeeLinkInvitation,
} from '@/lib/employees/invitations';
import { evaluateEmployeeLink } from '@/lib/employees/linkability';

export type AccountInvitationResult =
  | { ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' }
  | { ok: false; error: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Invite un salarié à créer (ou redéfinir) son accès.
 * - fiche sans profil + email déjà connu → invitation de rattachement (jamais de second compte) ;
 * - fiche sans profil → création de l'utilisateur auth (generateLink invite) + mail branded ;
 * - fiche avec profil → lien de récupération (définir le mot de passe).
 */
export async function sendEmployeeAccountInvitation(
  employeeId: string,
  actorId: string,
  opts: { formationTitre?: string | null } = {},
): Promise<AccountInvitationResult> {
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id, employer_profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  async function linkInstead(): Promise<AccountInvitationResult> {
    const sent = await sendEmployeeLinkInvitation(emp!.id, actorId);
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, resent: sent.resent, mode: 'link' };
  }

  if (!emp.profile_id) {
    const existing = await findProfileByEmail(emp.email);
    if (existing) {
      const eligible = evaluateEmployeeLink(existing, emp.employer_profile_id);
      if (!eligible.ok) return { ok: false, error: eligible.message };
      return linkInstead();
    }
  }

  const isResend = !!emp.profile_id;
  const formationTitre = opts.formationTitre ?? null;
  const redirect = `${siteUrl()}/callback?redirect=/stagiaire/parcours`;
  let actionLink: string;

  if (isResend) {
    // Le compte auth existe déjà : lien de récupération → /setup-password via /callback.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: emp.email,
      options: { redirectTo: redirect },
    });
    if (error || !data?.properties?.action_link) {
      return { ok: false, error: error?.message ?? "Impossible de générer un nouveau lien d'invitation." };
    }
    actionLink = data.properties.action_link;
  } else {
    // generateLink('invite') crée l'utilisateur sans envoyer d'email Supabase
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
      if (/already (been )?registered|already exists|user already/i.test(error?.message ?? '')) {
        return linkInstead();
      }
      return { ok: false, error: error?.message ?? "L'invitation n'a pas pu être créée." };
    }
    actionLink = data.properties.action_link;
  }

  const entrepriseLabel = await getEntrepriseLabel(emp.employer_profile_id);
  const sent = await sendAndLog({
    kind: 'employee_account_invitation',
    to: emp.email,
    toProfileId: emp.profile_id,
    subject: invitationEmailSubject(formationTitre, isResend),
    html: invitationEmailHtml({
      prenom: emp.prenom,
      nom: emp.nom,
      entrepriseLabel,
      formationTitre,
      invitationUrl: actionLink,
      isResend,
    }),
    refTable: 'employees',
    refId: emp.id,
    isReminder: isResend,
    metadata: { entreprise: entrepriseLabel, formation: formationTitre },
  });
  if (!sent.ok) {
    return { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé." };
  }
  return { ok: true, resent: isResend, mode: isResend ? 'recovery' : 'create' };
}
