import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET_ADMIN, uploadDocument } from '@/lib/storage/documents';

export const runtime = 'nodejs';

/**
 * Upload d'un document par l'admin (à joindre à une inscription).
 * Body multipart : file + inscriptionId
 */
export async function POST(request: NextRequest) {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supa.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const inscriptionId = formData.get('inscriptionId');
  const file = formData.get('file');

  if (typeof inscriptionId !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'invalid-form' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: ins } = await admin
    .from('inscriptions')
    .select('id')
    .eq('id', inscriptionId)
    .single();
  if (!ins) return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });

  const res = await uploadDocument(BUCKET_ADMIN, inscriptionId, 'admin', file);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });

  const { data: created, error: insErr } = await admin
    .from('inscription_admin_documents')
    .insert({
      inscription_id: inscriptionId,
      storage_path: res.path,
      file_name: res.fileName,
      file_size: res.fileSize,
      mime_type: res.mimeType,
      uploaded_by: user.id,
    })
    .select('id, file_name, file_size, mime_type, created_at')
    .single();

  if (insErr || !created) {
    return NextResponse.json({ ok: false, error: insErr?.message ?? 'insert failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document: created });
}
