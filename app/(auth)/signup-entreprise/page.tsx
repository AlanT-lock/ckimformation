import Link from 'next/link';
import { SignupEntrepriseForm } from './SignupEntrepriseForm';
import { getAllSecteurs } from '@/lib/db/secteurs';
import { findInvitationByToken, isInvitationUsable } from '@/lib/supabase/session-invitations';
import type { SessionInvitation } from '@/lib/supabase/types';

export default async function SignupEntreprisePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation_token?: string }>;
}) {
  const sp = await searchParams;
  const secteurs = await getAllSecteurs();

  let invitation: SessionInvitation | null = null;
  let invitationError: string | null = null;
  if (sp.invitation_token) {
    invitation = await findInvitationByToken(sp.invitation_token);
    if (!invitation) {
      invitationError = "Cette invitation est introuvable.";
    } else if (!isInvitationUsable(invitation)) {
      invitationError = "Cette invitation est expirée ou déjà utilisée — vous pouvez vous connecter.";
      invitation = null;
    }
  }

  const prefill = invitation
    ? {
        email: invitation.email,
        raison_sociale: invitation.raison_sociale,
        siret: invitation.siret ?? '',
        contact_nom: invitation.contact_nom ?? '',
        contact_fonction: invitation.contact_fonction ?? '',
        contact_phone: invitation.contact_phone ?? '',
      }
    : undefined;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Création de compte</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
        Entreprise.
      </h1>
      <p className="mt-3 text-muted text-sm">
        Pour inscrire un ou plusieurs collaborateurs à une session de formation.
      </p>

      {invitationError && (
        <div className="mt-6 text-sm border rounded p-3 text-orange bg-orange/10 border-orange/30">
          {invitationError}{' '}
          <Link href="/login" className="underline">Se connecter</Link>
        </div>
      )}

      {invitation && (
        <div className="mt-6 text-sm border rounded p-3 text-teal-l bg-teal-l/10 border-teal-l/30">
          Invitation reçue pour <strong>{invitation.raison_sociale}</strong>. Les
          informations ont été pré-remplies. Après validation de votre email,
          vous serez redirigé vers votre session dédiée.
        </div>
      )}

      <SignupEntrepriseForm
        secteurs={secteurs}
        invitationToken={sp.invitation_token && invitation ? sp.invitation_token : undefined}
        invitationSessionId={invitation?.session_id}
        prefill={prefill}
      />

      <p className="mt-6 text-sm text-muted">
        Vous êtes un particulier ?{' '}
        <Link href="/signup-particulier" className="text-teal-l hover:underline">
          Créer un compte particulier
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-teal-l hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
