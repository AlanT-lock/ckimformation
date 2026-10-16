import Link from 'next/link';
import { ViewHeader } from '@/components/app/ViewHeader';
import { QuestionsManager } from '../../../tests/[id]/QuestionsManager';
import { loadBesoinsQuestionnaire } from '@/lib/besoins/data';
import { createAdminClient } from '@/lib/supabase/admin';
import { BesoinsModeButtons } from './BesoinsModeButtons';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  qcm_unique: 'Choix unique',
  qcm_multiple: 'Choix multiple',
  texte_libre: 'Texte libre',
  echelle: 'Échelle',
  liste: 'Réponse courte',
};

// L'accès admin est contrôlé par le layout de la formation.
export default async function FormationBesoinsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questionnaire = await loadBesoinsQuestionnaire(id);

  let managerQuestions: Parameters<typeof QuestionsManager>[0]['initial'] = [];
  if (!questionnaire.isDefault) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('questions')
      .select('id, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options')
      .eq('test_id', questionnaire.testId)
      .order('ordre');
    managerQuestions = (data ?? []).map((q) => ({
      id: q.id,
      libelle: q.libelle,
      type_reponse: q.type_reponse,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      echelle_max: q.echelle_max,
      required: q.required,
      bonne_reponse: q.bonne_reponse,
      follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
    }));
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        nested
        title="Analyse des besoins"
        description="Questions posées lors de la demande d'inscription (par le stagiaire, ou par l'entreprise pour ses salariés) et sur les sessions dédiées. Les réponses apparaissent sur la demande d'inscription."
        actions={<BesoinsModeButtons formationId={id} isCustom={!questionnaire.isDefault} />}
      />

      {questionnaire.isDefault ? (
        <>
          <div className="rounded-lg border border-teal/30 bg-teal/5 p-4 text-sm">
            <p className="font-medium text-teal">Cette formation utilise les questions par défaut.</p>
            <p className="mt-1 text-dark/70">
              Elles sont communes à toutes les formations sans questionnaire propre.{' '}
              <Link href={`/admin/formations/${id}/besoins/defaut`} className="text-teal underline">
                Modifier les questions par défaut
              </Link>{' '}
              ou cliquez sur « Personnaliser pour cette formation » pour partir de ces questions et les adapter.
            </p>
          </div>
          <ol className="bg-white rounded-lg border border-dark/10 divide-y divide-dark/10">
            {questionnaire.questions.map((q, i) => (
              <li key={q.id} className="px-4 py-3 text-sm flex items-start justify-between gap-3 flex-wrap">
                <span>
                  <span className="text-dark/40 mr-1">{i + 1}.</span>
                  {q.libelle}
                  {q.required && <span className="text-orange ml-1">*</span>}
                </span>
                <span className="text-xs text-dark/50 whitespace-nowrap">{TYPE_LABEL[q.type_reponse] ?? q.type_reponse}</span>
              </li>
            ))}
            {questionnaire.questions.length === 0 && (
              <li className="px-4 py-6 text-sm text-dark/60">Aucune question par défaut.</li>
            )}
          </ol>
        </>
      ) : (
        <div>
          <p className="text-xs text-dark/60 mb-4">
            Questions propres à cette formation. Sans aucune question, l&apos;inscription se fait sans analyse des besoins.
          </p>
          <QuestionsManager testId={questionnaire.testId} testKind="enquete" initial={managerQuestions} />
        </div>
      )}
    </div>
  );
}
