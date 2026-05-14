import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestMetaForm } from './TestMetaForm';
import { QuestionsManager } from './QuestionsManager';
import { DeleteTestButton } from './DeleteTestButton';
import type { QuestionType, TestKind, EnqueteKind } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ id: string }> }

const KIND_TONE: Record<string, string> = {
  quiz: 'bg-teal/10 text-teal',
  enquete: 'bg-orange/10 text-orange',
  info: 'bg-dark/10 text-dark/70',
};

const ENQUETE_LABEL: Record<string, string> = {
  a_chaud: 'Enquête à chaud',
  a_froid: 'Enquête à froid',
};

export default async function AdminTestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: test }, { data: questions }, { data: formations }] = await Promise.all([
    supabase.from('tests').select('*, formation:formations(slug, titre)').eq('id', id).single(),
    supabase.from('questions').select('*').eq('test_id', id).order('ordre'),
    supabase.from('formations').select('id, titre').eq('actif', true).order('titre'),
  ]);

  if (!test) notFound();
  const formation = Array.isArray(test.formation) ? test.formation[0] : test.formation;

  const kindLabel = test.kind === 'enquete'
    ? (test.enquete_kind ? ENQUETE_LABEL[test.enquete_kind] : 'Enquête')
    : test.kind === 'quiz' ? 'Test' : 'Informatif';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${kindLabel} · ${formation?.titre ?? ''}`}
        title={test.nom}
        actions={
          <>
            <ButtonLink
              href={formation ? `/admin/tests/formation/${test.formation_id}` : '/admin/tests'}
              variant="secondary"
            >
              ← Retour
            </ButtonLink>
            {test.kind === 'enquete' && (
              <ButtonLink href={`/admin/tests/${test.id}/resultats`} variant="secondary">
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
            testKind={test.kind as 'quiz' | 'enquete' | 'info'}
            initial={(questions ?? []).map((q) => ({
              id: q.id,
              libelle: q.libelle,
              type_reponse: q.type_reponse as QuestionType,
              options: Array.isArray(q.options) ? (q.options as string[]) : [],
              echelle_max: q.echelle_max,
              required: q.required,
              bonne_reponse: q.bonne_reponse,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
