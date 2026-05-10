import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback magic link / email confirmation.
 * Reçoit ?code=... ou ?token_hash=&type=
 * Échange contre une session, puis redirige vers ?redirect= ou /stagiaire.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as
    | 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | null;
  const redirect = url.searchParams.get('redirect') || '/stagiaire';

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  } else {
    return NextResponse.redirect(new URL('/login?error=Lien%20invalide', url.origin));
  }

  // Pour les flows "recovery" (mot de passe oublié) ou "invite" (création par admin) →
  // on dirige vers la page de définition de mot de passe.
  if (type === 'recovery' || type === 'invite') {
    return NextResponse.redirect(new URL(`/setup-password?next=${encodeURIComponent(redirect)}`, url.origin));
  }

  // Sinon, on file vers la cible (par défaut l'espace stagiaire).
  // Le middleware corrigera la cible si le rôle ne correspond pas.
  return NextResponse.redirect(new URL(redirect, url.origin));
}
