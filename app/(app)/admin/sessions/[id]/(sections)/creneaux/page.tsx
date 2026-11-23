import { CreneauxManager } from '../../CreneauxManager';
import { loadCreneaux, requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionCreneauxPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);
  const creneaux = await loadCreneaux(id);

  return (
    <section>
      <SectionHeading
        title="Créneaux"
        description="Ajoute, supprime des créneaux. Les modifications sont sauvegardées automatiquement."
      />
      <div className="mt-4">
        <CreneauxManager sessionId={session.id} initial={creneaux} />
      </div>
    </section>
  );
}
