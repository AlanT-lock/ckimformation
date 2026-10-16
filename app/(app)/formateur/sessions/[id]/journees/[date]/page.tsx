import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { formatDateLong } from '@/lib/date';
import { loadSessionSuivi } from '@/lib/suivi/data';
import { loadJourneeContext } from '../context';
import { CompetencesStep } from './CompetencesStep';

export const dynamic = 'force-dynamic';

export default async function JourneeCompetencesPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = await params;
  const ctx = await loadJourneeContext(id, date);
  const suivi = await loadSessionSuivi(id, []);
  if (!suivi) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Fin de journée · étape 1 / 2 · J${ctx.dayIndex} sur ${ctx.daysCount}`}
        title={ctx.formationTitre}
        description={`Journée du ${formatDateLong(date)} : coche les compétences vues aujourd'hui.`}
        actions={<ButtonLink href={ctx.backHref} variant="secondary">← Session</ButtonLink>}
      />
      <CompetencesStep
        sessionId={id}
        date={date}
        options={suivi.competences.map((c) => ({
          id: c.id,
          libelle: c.libelle,
          vueAutreJour: c.vueLe && c.vueLe !== date ? c.vueLe : null,
          cocheeCeJour: c.vueLe === date,
        }))}
      />
    </div>
  );
}
