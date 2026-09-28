import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadFormationFiche } from '@/lib/formations/fiche-pdf';
import { ficheContentDisposition } from '@/lib/formations/fiche-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fiche PDF d'une formation (UUID côté admin, slug côté site).
 * Affichée dans le navigateur par défaut ; `?download=1` force le téléchargement.
 * Sert le PDF déposé par l'admin s'il existe, sinon la fiche générée.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await params;
  const download = new URL(req.url).searchParams.get('download') === '1';
  // Client lié à la session : RLS limite les visiteurs aux formations publiées,
  // l'admin voit aussi les formations inactives.
  const supabase = await createClient();

  let fiche;
  try {
    fiche = await loadFormationFiche(supabase, idOrSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF render error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  if (!fiche) {
    return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(fiche.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': ficheContentDisposition(fiche.filename, download),
      'Cache-Control': 'private, no-store',
    },
  });
}
