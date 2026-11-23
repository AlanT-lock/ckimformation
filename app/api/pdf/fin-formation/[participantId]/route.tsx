import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/supabase/server';
import { todayIsoParis } from '@/lib/date';
import { buildFinFormationInput, loadFinFormationSession } from '@/lib/fin-formation/data';
import { documentFileName, isFinFormationKind, previewNumero } from '@/lib/fin-formation/model';
import { renderFinFormationPdf } from '@/lib/pdf/render-fin-formation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Aperçu (admin) d'un document de fin de formation, généré à la volée et jamais
 * enregistré : ?session=<id>&kind=certificat|attestation. Le numéro définitif
 * n'est attribué qu'à l'envoi ; un document déjà envoyé garde le sien.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  const sessionId = request.nextUrl.searchParams.get('session');
  const kind = request.nextUrl.searchParams.get('kind');
  if (!sessionId) return NextResponse.json({ error: 'session manquant' }, { status: 400 });
  if (!isFinFormationKind(kind)) return NextResponse.json({ error: 'kind invalide' }, { status: 400 });

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (profile.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const session = await loadFinFormationSession(sessionId);
  const participant = session?.participants.find((p) => p.id === participantId);
  if (!session || !participant) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  const dateEdition = todayIsoParis();
  const numero = participant.docs[kind]?.numero ?? previewNumero(kind, dateEdition);
  const buffer = await renderFinFormationPdf(kind, buildFinFormationInput(session, participant, numero, dateEdition));
  const filename = documentFileName(kind, participant.nomComplet, 'apercu');

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
