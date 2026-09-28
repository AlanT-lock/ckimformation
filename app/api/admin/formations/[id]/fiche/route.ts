import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { removeFormationFiche, uploadFormationFiche } from '@/lib/formations/fiche-pdf';

export const runtime = 'nodejs';

async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !!profile && profile.role === 'admin';
}

/** Dépose (ou remplace) le PDF personnalisé de la formation. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Aucun fichier reçu.' }, { status: 400 });
  }
  const res = await uploadFormationFiche(id, file);
  if (res.ok) revalidatePath(`/admin/formations/${id}`);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

/** Supprime le PDF personnalisé : retour à la fiche générée. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const res = await removeFormationFiche(id);
  if (res.ok) revalidatePath(`/admin/formations/${id}`);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
