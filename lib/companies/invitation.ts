import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { companyInvitationEmailHtml, companyInvitationEmailSubject } from '@/lib/email/templates/company-invitation';
import { findProfileByEmail } from '@/lib/employees/invitations';
import {
  normalizeCompanyInput,
  toCompanyAuthMetadata,
  validateCompanyInput,
  type CompanyInput,
} from '@/lib/validation/company';
import { canConvertToCompany } from './conversion';
import { siteUrl } from '@/lib/site-url';

export type InviteCompanyResult =
  | { ok: true; id: string; emailSent: boolean }
  | { ok: false; error: string; convertibleProfileId?: string };

function redirectTo(): string {
  return `${siteUrl()}/callback?redirect=/stagiaire`;
}

async function sendCompanyEmail(p: {
  companyId: string; email: string; contactNom: string; raisonSociale: string; link: string; isResend: boolean;
}): Promise<boolean> {
  const sent = await sendAndLog({
    kind: 'company_invitation',
    to: p.email,
    toProfileId: p.companyId,
    subject: companyInvitationEmailSubject(p.raisonSociale, p.isResend),
    html: companyInvitationEmailHtml({
      contactNom: p.contactNom,
      raisonSociale: p.raisonSociale,
      invitationUrl: p.link,
      isResend: p.isResend,
    }),
    refTable: 'profiles',
    refId: p.companyId,
    isReminder: p.isResend,
    metadata: { raison_sociale: p.raisonSociale },
  });
  return sent.ok;
}

/** Crée le compte entreprise (auth + profil + company_details via trigger) et envoie l'invitation. */
export async function inviteNewCompany(raw: CompanyInput): Promise<InviteCompanyResult> {
  const input = normalizeCompanyInput(raw);
  const err = validateCompanyInput(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();

  const existing = await findProfileByEmail(input.email);
  if (existing) {
    const { count } = await admin
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', existing.id);
    const convertible = canConvertToCompany(existing, count ?? 0).ok;
    return convertible
      ? {
          ok: false,
          error: 'Un compte particulier existe déjà avec cet email. Vous pouvez le transformer en compte entreprise depuis sa fiche.',
          convertibleProfileId: existing.id,
        }
      : { ok: false, error: 'Un compte existe déjà avec cet email.' };
  }

  // generateLink('invite') crée l'utilisateur sans email Supabase : on envoie le nôtre.
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: input.email,
    options: { data: toCompanyAuthMetadata(input), redirectTo: redirectTo() },
  });
  if (error || !data?.user || !data.properties?.action_link) {
    if (/already (been )?registered|already exists|user already/i.test(error?.message ?? '')) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }
    return { ok: false, error: error?.message ?? "Le compte n'a pas pu être créé." };
  }

  const emailSent = await sendCompanyEmail({
    companyId: data.user.id,
    email: input.email,
    contactNom: input.full_name,
    raisonSociale: input.raison_sociale,
    link: data.properties.action_link,
    isResend: false,
  });
  return { ok: true, id: data.user.id, emailSent };
}

/** Renvoie un lien (recovery) tant que l'entreprise ne s'est jamais connectée. */
export async function resendCompanyInvitationLink(
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from('profiles')
    .select('id, email, full_name, account_type, company:company_details!company_details_profile_id_fkey(raison_sociale)')
    .eq('id', companyId)
    .maybeSingle();
  if (!prof || prof.account_type !== 'entreprise') return { ok: false, error: 'Entreprise introuvable.' };

  const { data: userData } = await admin.auth.admin.getUserById(companyId);
  if (userData?.user?.last_sign_in_at) {
    return { ok: false, error: 'Ce compte est déjà activé.' };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: prof.email,
    options: { redirectTo: redirectTo() },
  });
  if (error || !data?.properties?.action_link) {
    return { ok: false, error: error?.message ?? "Impossible de générer un nouveau lien d'invitation." };
  }

  const company = Array.isArray(prof.company) ? prof.company[0] : prof.company;
  const ok = await sendCompanyEmail({
    companyId,
    email: prof.email,
    contactNom: prof.full_name,
    raisonSociale: company?.raison_sociale ?? prof.full_name,
    link: data.properties.action_link,
    isResend: true,
  });
  return ok ? { ok: true } : { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé." };
}
