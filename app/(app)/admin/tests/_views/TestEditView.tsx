import { notFound, redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { ViewHeader } from '@/components/app/ViewHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestMetaForm } from '../[id]/TestMetaForm';
import { QuestionsManager } from '../[id]/QuestionsManager';
import { DeleteTestButton } from '../[id]/DeleteTestButton';
import type { QuestionType, TestKind, EnqueteKind } from '@/lib/supabase/types';
import { testLinks } from './links';

const KIND_TONE: Record<string, string> = {
  quiz: 'bg-teal/10 text-teal',
  enquete: 'bg-orange/10 text-orange',
  info: 'bg-dark/10 text-dark/70',
  evaluation_formateur: 'bg-dark/10 text-dark',
};

const ENQUETE_LABEL: Record<string, string> = {
  a_chaud: 'Enquête à chaud',
  a_froid: 'Enquête à froid',
};

/** Édition d'un test d'une formation (sous les onglets de la formation). */
export async function TestEditView({ formationId, testId: id }: { formationId: string; testId: string }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: test }, { data: questions }, { data: formations }] = await Promise.all([
    supabase.from('tests').select('*, formation:formations(slug, titre)').eq('id', id).single(),
    supabase.from('questions').select('*').eq('test_id', id).order('ordre'),
    supabase.from('formations').select('id, titre').eq('actif', true).order('titre'),
  ]);

  if (!test || test.formation_id !== formationId) notFound();
  const links = testLinks(formationId);
  const formation = Array.isArray(test.formation) ? test.formation[0] : test.formation;

  const kindLabel = test.kind === 'enquete'
    ? (test.enquete_kind ? ENQUETE_LABEL[test.enquete_kind] : 'Enquête')
    : test.kind === 'quiz' ? 'Test'
    : test.kind === 'evaluation_formateur' ? 'Évaluation formateur'
    : 'Informatif';

  return (
    <div className="space-y-8">
      <ViewHeader
        nested
        eyebrow={kindLabel}
        title={test.nom}
        actions={
          <>
            <ButtonLink href={links.list} variant="secondary">
              ← Retour
            </ButtonLink>
            {test.kind === 'enquete' && (
              <ButtonLink href={links.results(test.id)} variant="secondary">
                Voir les résultats
              </ButtonLink>
            )}
            <DeleteTestButton testId={test.id} />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${KIND_TONE[test.kind] ?? KIND_TONE.info}`}>
          {kindLabel}
        </span>
        {!test.actif && (
          <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60">
            Désactivé
          </span>
        )}
      </div>

      <TestMetaForm
        testId={test.id}
        initial={{
          nom: test.nom,
          description: test.description,
          kind: test.kind as TestKind,
          enquete_kind: (test.enquete_kind ?? null) as EnqueteKind | null,
          actif: test.actif,
        }}
        formationLabel={formation?.titre ?? ''}
        formations={formations ?? []}
      />

      <div>
        <h2 className="font-display text-2xl tracking-wide">Questions</h2>
        <p className="text-xs text-dark/60 mt-1">
          {test.kind === 'quiz'
            ? 'Pour les QCM, cochez les bonnes réponses afin de calculer un score.'
            : 'Configurez les questions de l\'enquête.'}
        </p>
        <div className="mt-4">
          <QuestionsManager
            testId={test.id}
            testKind={test.kind as 'quiz' | 'enquete' | 'info' | 'evaluation_formateur'}
            initial={(questions ?? []).map((q) => ({
              id: q.id,
              libelle: q.libelle,
              type_reponse: q.type_reponse as QuestionType,
              options: Array.isArray(q.options) ? (q.options as string[]) : [],
              echelle_max: q.echelle_max,
              required: q.required,
              bonne_reponse: q.bonne_reponse,
              follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
