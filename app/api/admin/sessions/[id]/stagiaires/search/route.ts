import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/supabase/server';
import { searchStagiairesForSessionQuery } from '@/lib/sessions/search-stagiaires-query';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Accès réservé à l\'administration.' }, { status: 403 });
  }

  const { id } = await params;
  const q = req.nextUrl.searchParams.get('q') ?? '';

  try {
    const hits = await searchStagiairesForSessionQuery(id, q);
    return NextResponse.json({ hits });
  } catch (err) {
    console.error('[admin] search stagiaires', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'La recherche n’a pas pu aboutir.' },
      { status: 500 },
    );
  }
}
