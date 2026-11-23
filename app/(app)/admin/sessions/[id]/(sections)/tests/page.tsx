import { createClient } from '@/lib/supabase/server';
import { TestsExportPanel, type TestsExportRow } from '../../TestsExportPanel';
import { loadInscriptions, requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionTestsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);
  const { participantRows } = await loadInscriptions(id);

  // Stagiaires confirmés + nombre de tests / enquêtes complétés
  const confirmedRows = participantRows.filter((r) => r.inscriptionStatut === 'confirmee');
  const supabase = await createClient();
  const { data: completionRows } = confirmedRows.length > 0
    ? await supabase
        .from('test_completions')
        .select('inscription_participant_id')
        .in('inscription_participant_id', confirmedRows.map((r) => r.id))
        .not('completed_at', 'is', null)
    : { data: [] as Array<{ inscription_participant_id: string | null }> };

  const completedByParticipant = new Map<string, number>();
  for (const c of completionRows ?? []) {
    if (!c.inscription_participant_id) continue;
    completedByParticipant.set(
      c.inscription_participant_id,
      (completedByParticipant.get(c.inscription_participant_id) ?? 0) + 1,
    );
  }

  const rows: TestsExportRow[] = confirmedRows
    .map((r) => ({
      participantId: r.id,
      nom: `${r.prenom} ${r.nom}`.trim() || r.email,
      // Seules les fiches salarié sont forcément rattachées à l'entreprise payeuse
      entreprise: r.kind === 'employee' ? r.payerLabel || null : null,
      completedCount: completedByParticipant.get(r.id) ?? 0,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <section>
      <SectionHeading
        title="Tests & enquêtes"
        description="Exportez en PDF les réponses aux tests et enquêtes (y compris l'enquête financeur et les évaluations formateur), pour un stagiaire ou pour tous les stagiaires dans un seul fichier."
      />
      <div className="mt-4">
        <TestsExportPanel sessionId={session.id} rows={rows} />
      </div>
    </section>
  );
}
