import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/supabase/server';
import { uploadHeroImage, HERO_RECOMMENDED } from '@/lib/storage/heroImages';

export const runtime = 'nodejs';

export async function GET() {
  // Pratique pour le client : récupère les contraintes côté serveur
  return NextResponse.json({ recommended: HERO_RECOMMENDED });
}

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const slugHint = form.get('slug');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'Aucun fichier reçu.' },
      { status: 400 },
    );
  }

  const result = await uploadHeroImage(
    file,
    typeof slugHint === 'string' ? slugHint : undefined,
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 200 });
}
