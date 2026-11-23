import type { ReactNode } from 'react';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { formatDate } from '@/lib/date';
import { DeleteSessionButton } from '../DeleteSessionButton';
import { loadCreneaux, requireAdminSession } from '../session-data';
import { SessionSubNav, type SessionNavItem } from './SessionSubNav';

const STATUT_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  cancelled: 'Annulée',
  completed: 'Terminée',
};

const SECTIONS: SessionNavItem[] = [
  { slug: '', label: 'Informations' },
  { slug: 'creneaux', label: 'Créneaux' },
  { slug: 'demandes', label: 'Demandes' },
  { slug: 'stagiaires', label: 'Stagiaires' },
  { slug: 'convocations', label: 'Convocations' },
  { slug: 'emargement', label: 'Émargement' },
  { slug: 'tests', label: 'Tests & enquêtes' },
  { slug: 'suivi', label: 'Suivi des journées' },
  { slug: 'fin-formation', label: 'Fin de formation' },
];

const SECTION_ETABLISSEMENT: SessionNavItem = { slug: 'etablissement', label: 'Établissement' };

export default async function AdminSessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, creneaux] = await Promise.all([requireAdminSession(id), loadCreneaux(id)]);

  const debut = creneaux[0]?.date;
  const fin = creneaux[creneaux.length - 1]?.date;
  const dates = !debut
    ? 'Aucun créneau'
    : debut === fin
      ? `Le ${formatDate(debut)}`
      : `Du ${formatDate(debut)} au ${formatDate(fin)}`;
  const description = [
    dates,
    session.adresse?.ville,
    STATUT_LABEL[session.statut] ?? session.statut,
    session.visibility === 'reserved' ? 'Réservée à un établissement' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const items = session.visibility === 'reserved' ? [...SECTIONS, SECTION_ETABLISSEMENT] : SECTIONS;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Session"
        title={session.formationTitre ?? 'Session'}
        description={description}
        actions={
          <>
            <ButtonLink href="/admin/sessions" variant="secondary">← Retour</ButtonLink>
            <DeleteSessionButton sessionId={session.id} />
          </>
        }
      />
      <SessionSubNav sessionId={session.id} items={items} />
      {children}
    </div>
  );
}
