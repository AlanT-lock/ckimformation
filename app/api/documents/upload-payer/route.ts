import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET_PAYER, uploadDocument } from '@/lib/storage/documents';

export const runtime = 'nodejs';

/**
 * Upload d'un document par le payer en réponse à une demande.
 * Body multipart : file + demandeId
 */
export async function POST(request: NextRequest) {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const demandeId = formData.get('demandeId');
  const file = formData.get('file');

  if (typeof demandeId !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: demande } = await admin
    .from('inscription_document_demandes')
    .select('id, inscription_id, storage_path, inscription:inscriptions!inner(payer_profile_id)')
    .eq('id', demandeId)
    .single();
  if (!demande) return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });
  const ins = Array.isArray(demande.inscription) ? demande.inscription[0] : demande.inscription;
  if (ins?.payer_profile_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // Si un fichier existe déjà sur cette demande, on le supprime avant l'upload
  if (demande.storage_path) {
    await admin.storage.from(BUCKET_PAYER).remove([demande.storage_path]);
  }

  const res = await uploadDocument(BUCKET_PAYER, demande.inscription_id, demande.id, file);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });

  const { error: updErr } = await admin
    .from('inscription_document_demandes')
    .update({
      storage_path: res.path,
      file_name: res.fileName,
      file_size: res.fileSize,
      mime_type: res.mimeType,
      uploaded_at: new Date().toISOString(),
      declined: false,
      decline_reason: null,
    })
    .eq('id', demande.id);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    demandeId: demande.id,
    fileName: res.fileName,
    fileSize: res.fileSize,
  });
}
