import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET_ADMIN, BUCKET_PAYER, getSignedUrl } from '@/lib/storage/documents';

export const runtime = 'nodejs';

/**
 * Génère une URL signée et redirige le client vers elle (téléchargement).
 * `kind` : 'payer-demande' (table inscription_document_demandes)
 *          'admin' (table inscription_admin_documents)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id } = await params;
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supa.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  const admin = createAdminClient();

  if (kind === 'payer-demande') {
    const { data: doc } = await admin
      .from('inscription_document_demandes')
      .select('storage_path, inscription:inscriptions!inner(payer_profile_id, session:sessions(formateur_id))')
      .eq('id', id)
      .single();
    if (!doc?.storage_path) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    const ins = Array.isArray(doc.inscription) ? doc.inscription[0] : doc.inscription;
    const sess = ins?.session && (Array.isArray(ins.session) ? ins.session[0] : ins.session);
    const isPayer = ins?.payer_profile_id === user.id;
    const isFormateur = sess?.formateur_id === user.id;
    if (!isAdmin && !isPayer && !isFormateur) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const url = await getSignedUrl(BUCKET_PAYER, doc.storage_path);
    if (!url) return NextResponse.json({ error: 'sign-failed' }, { status: 500 });
    return NextResponse.redirect(url);
  }

  if (kind === 'admin') {
    const { data: doc } = await admin
      .from('inscription_admin_documents')
      .select('storage_path, inscription:inscriptions!inner(payer_profile_id, session:sessions(formateur_id))')
      .eq('id', id)
      .single();
    if (!doc) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    const ins = Array.isArray(doc.inscription) ? doc.inscription[0] : doc.inscription;
    const sess = ins?.session && (Array.isArray(ins.session) ? ins.session[0] : ins.session);
    const isPayer = ins?.payer_profile_id === user.id;
    const isFormateur = sess?.formateur_id === user.id;
    if (!isAdmin && !isPayer && !isFormateur) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const url = await getSignedUrl(BUCKET_ADMIN, doc.storage_path);
    if (!url) return NextResponse.json({ error: 'sign-failed' }, { status: 500 });
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: 'bad-kind' }, { status: 400 });
}
