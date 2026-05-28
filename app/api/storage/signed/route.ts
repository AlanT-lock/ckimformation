import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const path = searchParams.get('path');
  if (!bucket || !path) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const sb = await createClient();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
