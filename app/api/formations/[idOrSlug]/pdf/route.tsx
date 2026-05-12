import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { rowToFormation, type FormationRow } from '@/lib/db/formations';
import { FormationPDF } from '@/lib/pdf/FormationPDF';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLS = `
  id, slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
  duree, public_concerne, public_detail, prerequis, prix_indicatif,
  modalite, inscription, recyclage,
  objectifs, programme, tarifs, evaluation, references_reglementaires, formations_liees,
  secteurs_cibles, formations_recommandees,
  seo_title, seo_description, actif, ordre, created_at, updated_at
`;

function sanitizeFilename(input: string) {
  // NFD décompose les caractères accentués → "é" devient "e" + accent combinant.
  // U+0300 → U+036F couvre tous les marqueurs combinants de diacritique.
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await params;
  // Le client server-side passe la session admin via cookies (RLS applique
  // les droits admin → formations actif=false accessibles). Pour un visiteur
  // non-authentifié, RLS limite naturellement aux formations publiées.
  const supabase = await createClient();

  // Accepte UUID (lien admin) ou slug (lien public)
  const query = supabase.from('formations').select(COLS);
  const { data, error } = UUID_RE.test(idOrSlug)
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
  }

  const formation = rowToFormation(data as unknown as FormationRow);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(<FormationPDF formation={formation} />);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF render error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const ref = formation.ref || 'CKIM';
  const filename = `${sanitizeFilename(`CKIM-${ref}-${formation.slug}`)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
