import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { QuestionType } from '@/lib/supabase/types';
import { EvaluationForm } from './EvaluationForm';

interface PageProps {
  params: Promise<{ id: string; testId: string; participantId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function FormateurEvaluationFormPage({ params }: PageProps) {
  const { id, testId, participantId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formateur_id, formation:formations(id, titre)')
    .eq('id', id)
    .single();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    redirect('/formateur/sessions');
  }
  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;

  // Test + questions
  const [{ data: test }, { data: questions }] = await Promise.all([
    supabase
      .from('tests')
      .select('id, nom, description, kind, formation_id')
      .eq('id', testId)
      .single(),
    supabase
      .from('questions')
      .select('id, ordre, libelle, type_reponse, options, echelle_max, required, follow_up_options')
      .eq('test_id', testId)
      .order('ordre'),
  ]);

  if (!test) notFound();
  if (test.kind !== 'evaluation_formateur') notFound();
  if (test.formation_id !== formation?.id) notFound();

  // Stagiaire (inscription_participant)
  const { data: ip } = await supabase
    .from('inscription_participants')
    .select(`
      id,
      inscription:inscriptions!inner(id, session_id, statut),
      employee:employees(prenom, nom, email),
      profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
    `)
    .eq('id', participantId)
    .single();
  if (!ip) notFound();
  const ins = Array.isArray(ip.inscription) ? ip.inscription[0] : ip.inscription;
  if (ins?.session_id !== id) notFound();

  const emp = Array.isArray(ip.employee) ? ip.employee[0] : ip.employee;
  const prof = Array.isArray(ip.profile) ? ip.profile[0] : ip.profile;
  const stagiaireName = emp ? `${emp.prenom} ${emp.nom}`.trim() : (prof?.full_name ?? '(sans nom)');
  const stagiaireEmail = emp?.email ?? prof?.email ?? '';

  // Réponses existantes pour pré-remplir
  const { data: existing } = await supabase
    .from('test_completions')
    .select('id, completed_at, responses(question_id, valeur, valeur_json)')
    .eq('test_id', testId)
    .eq('inscription_participant_id', participantId)
    .maybeSingle();

  const existingResponses = ((existing?.responses ?? []) as Array<{
    question_id: string;
    valeur: string | null;
    valeur_json: unknown;
  }>);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Évaluation formateur · ${stagiaireName}`}
        title={test.nom}
        description={test.description ?? undefined}
        actions={
          <ButtonLink href={`/formateur/sessions/${id}/evaluations`} variant="secondary">
            ← Retour
          </ButtonLink>
        }
      />

      <div className="bg-white border border-dark/10 rounded-lg p-4 text-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Stagiaire évalué</p>
        <p className="mt-1 font-medium">{stagiaireName}</p>
        {stagiaireEmail && <p className="text-xs text-dark/60">{stagiaireEmail}</p>}
        {existing?.completed_at && (
          <p className="text-xs text-teal mt-2">
            ✅ Déjà rempli le {new Date(existing.completed_at).toLocaleString('fr-FR')} — vous pouvez modifier.
          </p>
        )}
      </div>

      <EvaluationForm
        sessionId={id}
        testId={testId}
        participantId={participantId}
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
        existingResponses={existingResponses}
      />
    </div>
  );
}
