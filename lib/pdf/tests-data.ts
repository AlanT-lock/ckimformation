import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeScore, type ScoringQuestion, type ScoringResponse } from '@/lib/scoring';
import type { QuestionType } from '@/lib/supabase/types';
import type { PdfQuestion, PdfTest } from './TestsResponsesPdf';

export function testKindLabel(kind: string, enqueteKind: string | null): string {
  if (kind === 'quiz') return 'Test';
  if (kind === 'enquete') {
    if (enqueteKind === 'a_froid') return 'Enquête de satisfaction à froid';
    if (enqueteKind === 'a_chaud') return 'Enquête de satisfaction à chaud';
    if (enqueteKind === 'financeur') return 'Enquête de satisfaction financeur';
    return 'Enquête';
  }
  if (kind === 'evaluation_formateur') return 'Évaluation formateur';
  return 'Informatif';
}

export function renderAnswerText(type: QuestionType, valeur: string | null, valeurJson: unknown): string {
  if (type === 'qcm_unique') {
    if (typeof valeurJson === 'string') return valeurJson;
    if (valeurJson && typeof valeurJson === 'object' && 'value' in valeurJson) {
      const v = (valeurJson as { value: unknown }).value;
      if (typeof v === 'string') return v;
    }
    return valeur ?? '';
  }
  if (type === 'qcm_multiple') {
    let arr: string[] = [];
    if (Array.isArray(valeurJson)) arr = valeurJson.map(String);
    else if (valeurJson && typeof valeurJson === 'object' && 'values' in valeurJson) {
      const vs = (valeurJson as { values: unknown }).values;
      if (Array.isArray(vs)) arr = vs.map(String);
    }
    return arr.join(', ');
  }
  return valeur ?? '';
}

type CompletionRow = {
  id: string;
  completed_at: string | null;
  test_id: string;
  inscription_id: string;
  inscription_participant_id: string | null;
  test: { nom: string; kind: string; enquete_kind: string | null; description: string | null } | null;
  responses: Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>;
};

/**
 * Charge les tests / enquêtes complétés d'un participant, prêts pour le PDF.
 * - sans `completionId` : toutes les complétions du participant (évaluations formateur en dernier) ;
 * - avec `completionId` : uniquement cette complétion, si elle appartient au participant
 *   ou s'il s'agit de l'enquête financeur de son inscription. Renvoie `null` sinon.
 */
export async function loadParticipantPdfTests(
  participantId: string,
  inscriptionId: string,
  completionId?: string | null
): Promise<PdfTest[] | null> {
  const admin = createAdminClient();
  let query = admin
    .from('test_completions')
    .select(`
      id, completed_at, test_id, inscription_id, inscription_participant_id,
      test:tests(nom, kind, enquete_kind, description),
      responses(question_id, valeur, valeur_json)
    `)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true });
  query = completionId ? query.eq('id', completionId) : query.eq('inscription_participant_id', participantId);
  const { data } = await query;

  const completions = (data ?? []).map((c) => ({
    ...c,
    test: Array.isArray(c.test) ? c.test[0] ?? null : c.test,
  })) as CompletionRow[];

  if (completionId) {
    const c = completions[0];
    if (!c) return null;
    const ownedByParticipant = c.inscription_participant_id === participantId;
    const isFinanceurOfInscription =
      c.inscription_id === inscriptionId && c.test?.enquete_kind === 'financeur';
    if (!ownedByParticipant && !isFinanceurOfInscription) return null;
  }

  const testIds = Array.from(new Set(completions.map((c) => c.test_id)));
  const { data: allQuestions } = testIds.length > 0
    ? await admin
        .from('questions')
        .select('id, test_id, ordre, libelle, type_reponse, options, bonne_reponse')
        .in('test_id', testIds)
        .order('ordre')
    : { data: [] };

  const qsByTest = new Map<string, Array<{
    id: string; ordre: number; libelle: string; type_reponse: QuestionType; options: string[]; bonne_reponse: unknown;
  }>>();
  for (const q of allQuestions ?? []) {
    const arr = qsByTest.get(q.test_id) ?? [];
    arr.push({
      id: q.id,
      ordre: q.ordre,
      libelle: q.libelle,
      type_reponse: q.type_reponse as QuestionType,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      bonne_reponse: q.bonne_reponse,
    });
    qsByTest.set(q.test_id, arr);
  }

  const pdfTests: PdfTest[] = completions.map((c) => {
    const test = c.test;
    const qs = qsByTest.get(c.test_id) ?? [];
    const responses = c.responses ?? [];
    const byQ = new Map(responses.map((r) => [r.question_id, r]));

    const isScorable = test?.kind === 'quiz';
    const score = isScorable
      ? computeScore(qs as ScoringQuestion[], responses as ScoringResponse[])
      : null;

    const questions: PdfQuestion[] = qs.map((q) => {
      const r = byQ.get(q.id);
      return {
        ordre: q.ordre,
        libelle: q.libelle,
        type: q.type_reponse,
        bonneReponse: isScorable && q.bonne_reponse != null
          ? (Array.isArray(q.bonne_reponse) ? (q.bonne_reponse as string[]) : String(q.bonne_reponse))
          : null,
        reponseAffichee: r ? renderAnswerText(q.type_reponse, r.valeur, r.valeur_json) : '',
      };
    });

    return {
      nom: test?.nom ?? 'Test',
      kindLabel: testKindLabel(test?.kind ?? 'info', test?.enquete_kind ?? null),
      isEvaluationFormateur: test?.kind === 'evaluation_formateur',
      description: test?.description ?? null,
      completedAt: c.completed_at,
      scorePct: score?.scorePct ?? null,
      scoreCorrect: score?.correct ?? 0,
      scoreTotal: score?.totalEvaluable ?? 0,
      questions,
    };
  });

  // Évaluations formateur toujours en bas
  pdfTests.sort((a, b) => Number(a.isEvaluationFormateur) - Number(b.isEvaluationFormateur));
  return pdfTests;
}
