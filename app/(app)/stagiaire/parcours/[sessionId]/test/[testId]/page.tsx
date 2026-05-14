import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestResponseForm } from './TestResponseForm';
import type { QuestionType } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ sessionId: string; testId: string }> }

export default async function TestResponsePage({ params }: PageProps) {
  const { sessionId, testId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') redirect('/login');

  const supabase = await createClient();

  // Trouver l'inscription_participant du user pour cette session
  const { data: parts } = await supabase
    .from('inscription_participants')
    .select(`
      id, participant_profile_id,
      inscription:inscriptions!inner(id, session_id, statut),
      employee:employees(profile_id)
    `)
    .eq('inscription.session_id', sessionId)
    .eq('inscription.statut', 'confirmee');

  const me = (parts ?? []).find((p) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    return p.participant_profile_id === profile.id || emp?.profile_id === profile.id;
  });
  if (!me) notFound();

  // Vérifie que le test est bien déclenché pour cette session
  const { data: trigger } = await supabase
    .from('session_test_triggers')
    .select('id')
    .eq('session_id', sessionId)
    .eq('test_id', testId)
    .maybeSingle();
  if (!trigger) notFound();

  // Vérifie que le test n'est pas déjà complété
  const { data: completion } = await supabase
    .from('test_completions')
    .select('completed_at')
    .eq('inscription_participant_id', me.id)
    .eq('test_id', testId)
    .maybeSingle();
  if (completion?.completed_at) {
    redirect('/stagiaire/parcours');
  }

  // Charge le test + questions
  const [{ data: test }, { data: questions }] = await Promise.all([
    supabase.from('tests').select('*').eq('id', testId).single(),
    supabase.from('questions').select('*').eq('test_id', testId).order('ordre'),
  ]);
  if (!test) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={test.kind === 'enquete' ? 'Enquête' : 'Test'}
        title={test.nom}
        description={test.description ?? undefined}
        actions={
          <ButtonLink href="/stagiaire/parcours" variant="secondary">
            ← Retour
          </ButtonLink>
        }
      />

      <TestResponseForm
        sessionId={sessionId}
        testId={testId}
        isEnqueteChaud={test.kind === 'enquete' && test.enquete_kind === 'a_chaud'}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          ordre: q.ordre,
          libelle: q.libelle,
          type_reponse: q.type_reponse as QuestionType,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          echelle_max: q.echelle_max,
          required: q.required,
          follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
        }))}
      />
    </div>
  );
}
