import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { TestsResponsesPdf, type TestsResponsesPdfData } from '@/lib/pdf/TestsResponsesPdf';
import { loadParticipantPdfTests } from '@/lib/pdf/tests-data';
import {
  ORGANISME,
  logoUrl,
  loadParticipantContext,
  requireAdminOrFormateurOfSession,
  safePdfFilename,
} from '@/lib/pdf/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PDF des réponses aux tests & enquêtes d'un participant.
 * `?completion=<id>` limite le PDF à une seule complétion (un test / une enquête,
 * y compris l'enquête financeur de son inscription).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  const sessionId = request.nextUrl.searchParams.get('session');
  const completionId = request.nextUrl.searchParams.get('completion');
  if (!sessionId) return NextResponse.json({ error: 'session manquant' }, { status: 400 });

  const auth = await requireAdminOrFormateurOfSession(sessionId);
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const ctx = await loadParticipantContext(sessionId, participantId);
  if (!ctx) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  const tests = await loadParticipantPdfTests(participantId, ctx.inscriptionId, completionId);
  if (!tests) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  const data: TestsResponsesPdfData = {
    logoUrl: logoUrl(),
    organisme: ORGANISME,
    formation: { titre: ctx.formationTitre },
    session: { dateDebut: ctx.session.dateDebut, dateFin: ctx.session.dateFin },
    stagiaire: { nomComplet: ctx.nomComplet, email: ctx.email },
    entreprise: ctx.entreprise ? { raisonSociale: ctx.entreprise.raisonSociale } : null,
    tests,
    generatedAt: new Date().toISOString(),
  };

  const single = completionId ? tests[0] : null;
  const buffer = await renderToBuffer(
    <TestsResponsesPdf data={data} title={single ? single.kindLabel : undefined} />
  );
  const prefix = single ? safePdfFilename(single.nom).toLowerCase() || 'test' : 'tests';
  const filename = `${prefix}-${safePdfFilename(ctx.nomComplet)}-${sessionId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
