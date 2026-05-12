import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import { TestsResponsesPdf, type PdfQuestion, type PdfTest, type TestsResponsesPdfData } from '@/lib/pdf/TestsResponsesPdf';
import { computeScore, type ScoringQuestion, type ScoringResponse } from '@/lib/scoring';
import { ORGANISME, logoUrl, loadParticipantContext, requireAdminOrFormateurOfSession } from '@/lib/pdf/data';
import type { QuestionType } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFilename(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function kindLabel(kind: string, enqueteKind: string | null): string {
  if (kind === 'quiz') return 'Test';
  if (kind === 'enquete') {
    if (enqueteKind === 'a_froid') return 'Enquête de satisfaction à froid';
    if (enqueteKind === 'a_chaud') return 'Enquête de satisfaction à chaud';
    return 'Enquête';
  }
  return 'Informatif';
}

function renderAnswer(type: QuestionType, valeur: string | null, valeurJson: unknown): string {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  const sessionId = request.nextUrl.searchParams.get('session');
  if (!sessionId) return NextResponse.json({ error: 'session manquant' }, { status: 400 });

  const auth = await requireAdminOrFormateurOfSession(sessionId);
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const ctx = await loadParticipantContext(sessionId, participantId);
  if (!ctx) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  const admin = createAdminClient();
  const { data: completions } = await admin
    .from('test_completions')
    .select(`
      id, completed_at, test_id,
      test:tests(nom, kind, enquete_kind, description),
      responses(question_id, valeur, valeur_json)
    `)
    .eq('inscription_participant_id', participantId)
    .order('completed_at', { ascending: true });

  const testIds = Array.from(new Set((completions ?? []).map((c) => c.test_id)));
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

  const pdfTests: PdfTest[] = (completions ?? []).map((c) => {
    const test = Array.isArray(c.test) ? c.test[0] : c.test;
    const qs = qsByTest.get(c.test_id) ?? [];
    const responses = (c.responses ?? []) as Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>;
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
        reponseAffichee: r ? renderAnswer(q.type_reponse, r.valeur, r.valeur_json) : '',
      };
    });

    return {
      nom: test?.nom ?? 'Test',
      kindLabel: kindLabel(test?.kind ?? 'info', test?.enquete_kind ?? null),
      description: test?.description ?? null,
      completedAt: c.completed_at,
      scorePct: score?.scorePct ?? null,
      scoreCorrect: score?.correct ?? 0,
      scoreTotal: score?.totalEvaluable ?? 0,
      questions,
    };
  });

  const data: TestsResponsesPdfData = {
    logoUrl: logoUrl(),
    organisme: ORGANISME,
    formation: { titre: ctx.formationTitre },
    session: { dateDebut: ctx.session.dateDebut, dateFin: ctx.session.dateFin },
    stagiaire: { nomComplet: ctx.nomComplet, email: ctx.email },
    entreprise: ctx.entreprise ? { raisonSociale: ctx.entreprise.raisonSociale } : null,
    tests: pdfTests,
    generatedAt: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(<TestsResponsesPdf data={data} />);
  const filename = `tests-${safeFilename(ctx.nomComplet)}-${sessionId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
