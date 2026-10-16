import { ButtonLink } from '@/components/app/Button';
import { ViewHeader } from '@/components/app/ViewHeader';
import { QuestionsManager } from '../../../../tests/[id]/QuestionsManager';
import { getOrCreateDefaultBesoinsTestId } from '@/lib/besoins/data';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// L'accès admin est contrôlé par le layout de la formation.
export default async function DefaultBesoinsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testId = await getOrCreateDefaultBesoinsTestId();
  const admin = createAdminClient();
  const { data } = await admin
    .from('questions')
    .select('id, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options')
    .eq('test_id', testId)
    .order('ordre');

  return (
    <div className="space-y-6">
      <ViewHeader
        nested
        eyebrow="Analyse des besoins"
        title="Questions par défaut"
        description="Communes à toutes les formations qui n'ont pas leur propre questionnaire : une modification ici s'applique à toutes ces formations."
        actions={<ButtonLink href={`/admin/formations/${id}/besoins`} variant="secondary">← Retour</ButtonLink>}
      />
      <QuestionsManager
        testId={testId}
        testKind="enquete"
        initial={(data ?? []).map((q) => ({
          id: q.id,
          libelle: q.libelle,
          type_reponse: q.type_reponse,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          echelle_max: q.echelle_max,
          required: q.required,
          bonne_reponse: q.bonne_reponse,
          follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
        }))}
      />
    </div>
  );
}
