import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmargementPdf, type EmargementPdfCreneau, type EmargementPdfData } from '@/lib/pdf/EmargementPdf';
import { ORGANISME, logoUrl, loadParticipantContext, requireAdminOrFormateurOfSession } from '@/lib/pdf/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFilename(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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

  // Tous les créneaux + signatures de ce participant
  const admin = createAdminClient();
  const [{ data: creneaux }, { data: emargements }] = await Promise.all([
    admin.from('session_creneaux').select('id, date, heure_debut, heure_fin, ordre').eq('session_id', sessionId).order('ordre'),
    admin.from('emargements').select('creneau_id, signature_data, signed_at').eq('inscription_participant_id', participantId),
  ]);

  const emargByCreneau = new Map<string, { signature_data: string | null; signed_at: string | null }>();
  for (const e of emargements ?? []) {
    emargByCreneau.set(e.creneau_id, { signature_data: e.signature_data, signed_at: e.signed_at });
  }

  const pdfCreneaux: EmargementPdfCreneau[] = (creneaux ?? []).map((c) => {
    const sig = emargByCreneau.get(c.id);
    return {
      date: c.date,
      heureDebut: c.heure_debut,
      heureFin: c.heure_fin,
      signatureDataUrl: sig?.signature_data ?? null,
      signedAt: sig?.signed_at ?? null,
    };
  });

  const data: EmargementPdfData = {
    logoUrl: logoUrl(),
    organisme: ORGANISME,
    formation: { titre: ctx.formationTitre },
    session: {
      lieu: ctx.session.lieu,
      formateurNom: ctx.session.formateurNom,
      dateDebut: ctx.session.dateDebut,
      dateFin: ctx.session.dateFin,
    },
    stagiaire: { nomComplet: ctx.nomComplet, email: ctx.email },
    entreprise: ctx.entreprise,
    creneaux: pdfCreneaux,
    generatedAt: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(<EmargementPdf data={data} />);
  const filename = `emargement-${safeFilename(ctx.nomComplet)}-${sessionId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
