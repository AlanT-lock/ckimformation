import { SuiviDetail } from '@/components/app/suivi/SuiviDetail';
import { SuiviProgress } from '@/components/app/suivi/SuiviProgress';
import { loadSessionSuivi } from '@/lib/suivi/data';
import { requireAdminSession } from '../../session-data';
import { EmptySection, SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionSuiviPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdminSession(id);
  const suivi = await loadSessionSuivi(id, 'all');

  return (
    <section>
      <SectionHeading
        title="Suivi des journées"
        description="Compétences cochées et commentaires du formateur en fin de journée, puis bilan de compétences de chaque stagiaire en fin de formation (vue entreprise, tous les stagiaires)."
      />
      <div className="mt-4 space-y-6">
        {suivi && suivi.journees.length > 0 ? (
          <>
            <div className="bg-white rounded-xl border border-dark/10 p-5">
              <SuiviProgress suivi={suivi} />
            </div>
            <SuiviDetail
              suivi={suivi}
              commentairesLabel="Commentaires par stagiaire"
              bilansLabel="Bilan de compétences par stagiaire"
            />
          </>
        ) : (
          <EmptySection>Aucune journée à suivre pour l&apos;instant : ajoutez des créneaux à la session.</EmptySection>
        )}
      </div>
    </section>
  );
}
