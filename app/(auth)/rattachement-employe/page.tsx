import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import { claimEmployeeInvitation } from '@/lib/employees/invitations';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function RattachementEmployePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <Notice
        title="Lien invalide"
        body="Ce lien de rattachement est incomplet. Demandez une nouvelle invitation à votre employeur ou à votre formateur."
      />
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?redirect=${encodeURIComponent(`/rattachement-employe?token=${token}`)}`);
  }

  const result = await claimEmployeeInvitation(token, profile.id);
  if (result.ok) {
    return (
      <Notice
        title={result.already ? 'Compte déjà rattaché' : 'Compte rattaché'}
        body="Votre compte est lié à l’entreprise. Vous pouvez maintenant accéder à vos sessions (émargements, tests, questionnaires)."
        cta={{ href: '/stagiaire/parcours', label: 'Ouvrir l’espace de formation' }}
        tone="ok"
      />
    );
  }

  const wrongEmail = result.invitedEmail
    && result.reason.includes('adresse invitée');
  const logoutNext = `/login?redirect=${encodeURIComponent(`/rattachement-employe?token=${token}`)}`;

  return (
    <Notice
      title="Rattachement impossible"
      body={result.reason}
      cta={wrongEmail
        ? { href: `/logout?next=${encodeURIComponent(logoutNext)}`, label: 'Se connecter avec la bonne adresse' }
        : { href: '/login', label: 'Retour à la connexion' }}
    />
  );
}

function Notice({
  title,
  body,
  cta,
  tone = 'error',
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
  tone?: 'ok' | 'error';
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Rattachement</p>
      <h1 className="font-display text-4xl tracking-wide mt-2">{title}</h1>
      <p className={`mt-4 text-sm ${tone === 'ok' ? 'text-teal-l' : 'text-muted'}`}>{body}</p>
      {cta && (
        <p className="mt-8">
          <Link
            href={cta.href}
            className="inline-block bg-teal hover:bg-teal-l text-white font-medium py-3 px-5 rounded transition"
          >
            {cta.label}
          </Link>
        </p>
      )}
    </div>
  );
}
