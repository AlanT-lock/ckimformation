import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestMetaForm } from './TestMetaForm';
import { QuestionsManager } from './QuestionsManager';
import { DeleteTestButton } from './DeleteTestButton';
import type { QuestionType } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ id: string }> }

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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Test · ${formation?.titre ?? ''}`}
        title={test.nom}
        actions={
          <>
            <ButtonLink href="/admin/tests" variant="secondary">← Retour</ButtonLink>
            <DeleteTestButton testId={test.id} />
          </>
        }
      />

      <TestMetaForm
        testId={test.id}
        initial={{
          nom: test.nom,
          description: test.description,
          kind: test.kind,
          actif: test.actif,
        }}
        formationLabel={formation?.titre ?? ''}
        formations={formations ?? []}
      />

      <div>
        <h2 className="font-display text-2xl tracking-wide">Questions</h2>
        <p className="text-xs text-dark/60 mt-1">
          Pour chaque question, choisis le type de réponse attendu.
        </p>
        <div className="mt-4">
          <QuestionsManager
            testId={test.id}
            initial={(questions ?? []).map((q) => ({
              id: q.id,
              libelle: q.libelle,
              type_reponse: q.type_reponse as QuestionType,
              options: Array.isArray(q.options) ? (q.options as string[]) : [],
              echelle_max: q.echelle_max,
              required: q.required,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
