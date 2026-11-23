import { SessionParticipantsManager } from '../../SessionParticipantsManager';
import { loadInscriptions, requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionStagiairesPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);
  const { participantRows } = await loadInscriptions(id);

  return (
    <section>
      <SectionHeading
        title={`Stagiaires (${participantRows.length})`}
        description="Retirez un participant ou ajoutez un compte déjà créé (pour rattacher manuellement un stagiaire à la session)."
      />
      <div className="mt-4">
        <SessionParticipantsManager sessionId={session.id} initial={participantRows} />
      </div>
    </section>
  );
}
