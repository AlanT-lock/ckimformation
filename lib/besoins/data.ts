import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { QuestionType } from '@/lib/supabase/types';
import {
  besoinsSummary,
  buildBesoinsSnapshot,
  type BesoinAnswerInput,
  type BesoinAnswerSnapshot,
  type BesoinQuestion,
} from './answers';

export const BESOINS_KIND = 'analyse_besoins';

/** Questions génériques du questionnaire par défaut (créé au premier besoin). */
const DEFAULT_QUESTIONS: Array<Omit<BesoinQuestion, 'id'>> = [
  {
    ordre: 1,
    libelle: 'Dans quel contexte s\'inscrit cette demande de formation ?',
    type_reponse: 'qcm_multiple',
    options: [
      'Obligation réglementaire',
      'Prise de poste ou nouvelles missions',
      'Montée en compétences',
      'Recyclage / maintien des acquis',
      'Projet personnel ou reconversion',
      'Autre',
    ],
    echelle_max: null,
    required: true,
    follow_up_options: [],
  },
  {
    ordre: 2,
    libelle: 'Quel est le poste ou la fonction du ou des participants ?',
    type_reponse: 'texte_libre',
    options: [],
    echelle_max: null,
    required: true,
    follow_up_options: [],
  },
  {
    ordre: 3,
    libelle: 'Quel est le niveau actuel du ou des participants sur le sujet de la formation ?',
    type_reponse: 'qcm_unique',
    options: [
      'Débutant (aucune connaissance)',
      'Quelques notions',
      'Déjà pratiqué sur le terrain',
      'Recyclage d\'une formation déjà suivie',
    ],
    echelle_max: null,
    required: true,
    follow_up_options: [],
  },
  {
    ordre: 4,
    libelle: 'Qu\'attendez-vous de cette formation ? (objectifs, compétences visées, situations de travail concernées)',
    type_reponse: 'texte_libre',
    options: [],
    echelle_max: null,
    required: true,
    follow_up_options: [],
  },
  {
    ordre: 5,
    libelle: 'Un participant a-t-il besoin d\'une adaptation (situation de handicap, trouble de l\'apprentissage, contrainte de santé ou de langue) ?',
    type_reponse: 'qcm_unique',
    options: ['Non', 'Oui', 'Je préfère en parler par téléphone'],
    echelle_max: null,
    required: true,
    follow_up_options: ['Oui'],
  },
  {
    ordre: 6,
    libelle: 'Avez-vous des contraintes particulières ? (dates, horaires, lieu, matériel…)',
    type_reponse: 'texte_libre',
    options: [],
    echelle_max: null,
    required: false,
    follow_up_options: [],
  },
];

export interface BesoinsQuestionnaire {
  testId: string;
  isDefault: boolean;
  questions: BesoinQuestion[];
}

type QuestionRow = {
  id: string; ordre: number; libelle: string; type_reponse: string; options: unknown;
  echelle_max: number | null; required: boolean; follow_up_options: unknown;
};

function toQuestion(q: QuestionRow): BesoinQuestion {
  return {
    id: q.id,
    ordre: q.ordre,
    libelle: q.libelle,
    type_reponse: q.type_reponse as QuestionType,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    echelle_max: q.echelle_max,
    required: q.required,
    follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
  };
}

async function loadQuestions(testId: string): Promise<BesoinQuestion[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('questions')
    .select('id, ordre, libelle, type_reponse, options, echelle_max, required, follow_up_options')
    .eq('test_id', testId)
    .order('ordre');
  return ((data ?? []) as QuestionRow[]).map(toQuestion);
}

/** Questionnaire par défaut (unique, sans formation), créé avec les questions génériques si absent. */
export async function getOrCreateDefaultBesoinsTestId(): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('tests')
    .select('id')
    .eq('kind', BESOINS_KIND)
    .is('formation_id', null)
    .order('created_at')
    .limit(1);
  if (existing?.[0]?.id) return existing[0].id;

  const { data: test, error } = await admin
    .from('tests')
    .insert({
      formation_id: null,
      nom: 'Analyse des besoins (questions par défaut)',
      description: 'Questions posées à l\'inscription pour les formations qui n\'ont pas leur propre questionnaire.',
      kind: BESOINS_KIND,
      actif: true,
    })
    .select('id')
    .single();
  if (error || !test) throw new Error(error?.message ?? 'Création du questionnaire par défaut impossible.');
  await admin.from('questions').insert(DEFAULT_QUESTIONS.map((q) => ({ ...q, test_id: test.id })));
  return test.id;
}

/** Id du questionnaire propre à une formation, s'il existe. */
export async function findFormationBesoinsTestId(formationId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tests')
    .select('id')
    .eq('kind', BESOINS_KIND)
    .eq('formation_id', formationId)
    .order('created_at')
    .limit(1);
  return data?.[0]?.id ?? null;
}

/** Questionnaire à présenter pour une formation : le sien, sinon celui par défaut. */
export async function loadBesoinsQuestionnaire(formationId: string): Promise<BesoinsQuestionnaire> {
  const own = await findFormationBesoinsTestId(formationId);
  const testId = own ?? (await getOrCreateDefaultBesoinsTestId());
  return { testId, isDefault: !own, questions: await loadQuestions(testId) };
}

/** Valide les réponses avant toute écriture (à appeler avant de créer la demande). */
export async function prepareBesoins(
  formationId: string,
  inputs: BesoinAnswerInput[]
): Promise<{ ok: true; testId: string; answers: BesoinAnswerSnapshot[]; summary: string } | { ok: false; error: string }> {
  const questionnaire = await loadBesoinsQuestionnaire(formationId);
  const res = buildBesoinsSnapshot(questionnaire.questions, inputs);
  if (!res.ok) return res;
  return { ok: true, testId: questionnaire.testId, answers: res.answers, summary: besoinsSummary(res.answers) };
}

/** Enregistre (ou remplace) les réponses d'une demande ou d'une session dédiée. */
export async function storeBesoinsReponses(
  target: { inscriptionId: string } | { sessionId: string },
  testId: string,
  answers: BesoinAnswerSnapshot[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const row: Record<string, unknown> = {
    test_id: testId,
    answers,
    updated_at: new Date().toISOString(),
    ...('inscriptionId' in target ? { inscription_id: target.inscriptionId } : { session_id: target.sessionId }),
  };
  const { error } = await admin
    .from('besoins_reponses')
    .upsert(row, { onConflict: 'inscriptionId' in target ? 'inscription_id' : 'session_id' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Réponses enregistrées (lecture admin). */
export async function loadBesoinsReponses(
  target: { inscriptionId: string } | { sessionId: string }
): Promise<{ answers: BesoinAnswerSnapshot[]; updatedAt: string } | null> {
  const admin = createAdminClient();
  const query = admin.from('besoins_reponses').select('answers, updated_at');
  const { data } = await ('inscriptionId' in target
    ? query.eq('inscription_id', target.inscriptionId)
    : query.eq('session_id', target.sessionId)
  ).maybeSingle();
  if (!data) return null;
  return { answers: (data.answers ?? []) as BesoinAnswerSnapshot[], updatedAt: data.updated_at };
}

/** Copie le questionnaire par défaut sur une formation (point de départ personnalisable). */
export async function copyDefaultBesoinsToFormation(formationId: string, formationTitre: string): Promise<string> {
  const existing = await findFormationBesoinsTestId(formationId);
  if (existing) return existing;
  const admin = createAdminClient();
  const defaultId = await getOrCreateDefaultBesoinsTestId();
  const defaults = await loadQuestions(defaultId);
  const { data: test, error } = await admin
    .from('tests')
    .insert({
      formation_id: formationId,
      nom: `Analyse des besoins — ${formationTitre}`,
      kind: BESOINS_KIND,
      actif: true,
    })
    .select('id')
    .single();
  if (error || !test) throw new Error(error?.message ?? 'Création impossible.');
  if (defaults.length > 0) {
    await admin.from('questions').insert(
      defaults.map(({ id: _id, ...q }) => ({ ...q, test_id: test.id }))
    );
  }
  return test.id;
}
