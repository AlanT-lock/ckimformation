import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminOrFormateurOfSession } from '@/lib/pdf/data';
import { renderConvocationPdf } from '@/lib/pdf/render-convocation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  const sessionId = request.nextUrl.searchParams.get('session');
  if (!sessionId) return NextResponse.json({ error: 'session manquant' }, { status: 400 });

  const auth = await requireAdminOrFormateurOfSession(sessionId);
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const rendered = await renderConvocationPdf(sessionId, participantId);
  if (!rendered) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  return new NextResponse(rendered.buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${rendered.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
