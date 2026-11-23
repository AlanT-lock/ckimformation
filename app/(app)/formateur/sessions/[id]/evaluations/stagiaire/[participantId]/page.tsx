import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { QuestionType } from '@/lib/supabase/types';
import { loadSessionBilans } from '@/lib/suivi/data';
import { bilanStatut } from '@/lib/suivi/bilan';
import { BilanForm } from './BilanForm';

interface PageProps {
  params: Promise<{ id: string; participantId: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * Bilan de fin de formation d'un stagiaire : tout ce que le formateur doit
 * remplir pour lui tient sur cette page (évaluations formateur + compétences).
 */
export default async function FormateurBilanStagiairePage({ params }: PageProps) {
  const { id, participantId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const bilans = await loadSessionBilans(id);
  if (!bilans) notFound();
  if (profile.role === 'formateur' && bilans.formateurId !== profile.id) redirect('/formateur/sessions');

  const stagiaire = bilans.stagiaires.find((s) => s.id === participantId);
  if (!stagiaire) notFound();

  const listHref = `/formateur/sessions/${id}/evaluations`;
  const evaluationIds = bilans.evaluations.map((e) => e.id);
  if (evaluationIds.length === 0 && bilans.competences.length === 0) redirect(listHref);

  const supabase = await createClient();
  const [{ data: questions }, { data: completions }] = await Promise.all([
    evaluationIds.length > 0
      ? supabase
          .from('questions')
          .select('id, test_id, ordre, libelle, type_reponse, options, echelle_max, required, follow_up_options')
          .in('test_id', evaluationIds)
          .order('ordre')
      : Promise.resolve({ data: [] }),
    evaluationIds.length > 0
      ? supabase
          .from('test_completions')
          .select('test_id, responses(question_id, valeur, valeur_json)')
          .in('test_id', evaluationIds)
          .eq('inscription_participant_id', participantId)
      : Promise.resolve({ data: [] }),
  ]);

  const evaluations = bilans.evaluations.map((e) => ({
    ...e,
    questions: (questions ?? [])
      .filter((q) => q.test_id === e.id)
      .map((q) => ({
        id: q.id as string,
        ordre: q.ordre as number,
        libelle: q.libelle as string,
        type_reponse: q.type_reponse as QuestionType,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        echelle_max: q.echelle_max as number | null,
        required: q.required as boolean,
        follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
      })),
    existingResponses: ((completions ?? []).find((c) => c.test_id === e.id)?.responses ?? []) as Array<{
      question_id: string;
      valeur: string | null;
      valeur_json: unknown;
    }>,
  }));

  const statutOf = (s: (typeof bilans.stagiaires)[number]) =>
    bilanStatut({
      evaluationsTotal: bilans.evaluations.length,
      evaluationsRemplies: s.evaluationsRemplies.length,
      competencesTotal: bilans.competences.length,
      competencesEvaluees: bilans.competences.filter((c) => s.niveaux[c.id]).length,
    });

  // Prochain stagiaire dont le bilan reste à remplir, dans l'ordre de la liste.
  const index = bilans.stagiaires.findIndex((s) => s.id === participantId);
  const next = [...bilans.stagiaires.slice(index + 1), ...bilans.stagiaires.slice(0, index)].find(
    (s) => statutOf(s) !== 'complet'
  );
  const complet = statutOf(stagiaire) === 'complet';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Bilan de fin de formation · ${bilans.formationTitre}`}
        title={stagiaire.nom}
        description={stagiaire.email || undefined}
        actions={<ButtonLink href={listHref} variant="secondary">← Tous les stagiaires</ButtonLink>}
      />

      <div className="bg-white border border-dark/10 rounded-lg p-4 text-sm">
        <p className="text-dark/70">
          Stagiaire {index + 1} sur {bilans.stagiaires.length}. L&apos;évaluation reste interne ; le niveau des
          compétences est visible par le stagiaire et par son entreprise.
        </p>
        {complet && <p className="text-xs text-teal mt-2">✅ Bilan déjà rempli — tu peux le modifier.</p>}
      </div>

      <BilanForm
        key={participantId}
        sessionId={id}
        participantId={participantId}
        evaluations={evaluations}
        competences={bilans.competences.map((c) => ({ id: c.id, libelle: c.libelle, vueLe: c.vueLe }))}
        initialNiveaux={stagiaire.niveaux}
        listHref={listHref}
        nextHref={next ? `/formateur/sessions/${id}/evaluations/stagiaire/${next.id}` : null}
      />
    </div>
  );
}
