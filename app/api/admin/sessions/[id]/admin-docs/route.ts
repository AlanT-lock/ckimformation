import { NextResponse, type NextRequest } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Upload de documents admin pour une session réservée.
 * Body multipart : files[] + label__<filename> (optionnel par fichier)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const form = await req.formData();
  const sb = await createClient();
  for (const entry of form.getAll('files')) {
    if (!(entry instanceof File)) continue;
    const labelKey = `label__${entry.name}`;
    const label = String(form.get(labelKey) ?? '');
    const path = `${id}/${crypto.randomUUID()}-${entry.name}`;
    const { error: upErr } = await sb.storage
      .from('session-admin-docs')
      .upload(path, entry);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { error: insErr } = await sb.from('session_admin_documents').insert({
      session_id: id,
      storage_path: path,
      filename: entry.name,
      label: label || null,
      uploaded_by: profile.id,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
