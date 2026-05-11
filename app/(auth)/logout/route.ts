import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function doLogout(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Status 303 (See Other) → impose un GET sur la cible.
  // Sans ça, NextResponse.redirect() défaut à 307 et le navigateur rejoue la
  // requête en POST sur "/", ce qui produit une erreur.
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  return doLogout(request);
}

export async function GET(request: NextRequest) {
  return doLogout(request);
}
