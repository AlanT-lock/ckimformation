import { ViewHeader } from '@/components/app/ViewHeader';
import { createAdminClient } from '@/lib/supabase/admin';
import { CompetencesManager, type CompetenceRow } from './CompetencesManager';
import { MentionDocumentsForm } from './MentionDocumentsForm';

export const dynamic = 'force-dynamic';

// L'accès admin est contrôlé par le layout de la formation.
export default async function FormationCompetencesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: competences } = await admin
    .from('formation_competences')
    .select('id, libelle, vues:session_competences_vues(count)')
    .eq('formation_id', id)
    .order('ordre')
    .order('created_at');

  // Colonne ajoutée par migration : absente, la requête échoue et la mention reste vide.
  const { data: mentionRow } = await admin
    .from('formations')
    .select('mention_documents')
    .eq('id', id)
    .maybeSingle();
  const mention = (mentionRow as { mention_documents?: string | null } | null)?.mention_documents ?? '';

  const rows: CompetenceRow[] = (competences ?? []).map((c) => ({
    id: c.id,
    libelle: c.libelle,
    usage: (c.vues as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <ViewHeader
        nested
        title="Compétences"
        description="Compétences travaillées pendant la formation. À la fin de chaque journée, le formateur coche celles qui ont été vues ; l'entreprise suit ainsi l'avancée de ses salariés. Elles figurent toutes sur l'attestation de fin de formation."
      />
      <CompetencesManager formationId={id} initial={rows} />
      <MentionDocumentsForm formationId={id} initial={mention} />
    </div>
  );
}
