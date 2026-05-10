import { NextResponse, type NextRequest } from 'next/server';

/**
 * Alias vers /callback pour rester compatible avec les templates Supabase
 * SSR officiels (`{{ .SiteURL }}/auth/confirm?token_hash=...&type=...&next=...`).
 *
 * On préserve tous les paramètres et on laisse /callback faire le travail.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/callback';
  return NextResponse.redirect(url);
}
