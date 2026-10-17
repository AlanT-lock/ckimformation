import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback unifié pour les flows d'authentification Supabase.
 *
 * Gère :
 *  - PKCE : `?code=...` → exchangeCodeForSession
 *  - OTP / magic link / invite / recovery : `?token_hash=&type=` → verifyOtp
 *  - Erreurs Supabase remontées en query : `?error=&error_description=`
 *
 * Accepte aussi `?next=...` (convention templates Supabase SSR) en plus
 * de `?redirect=...` (héritage interne).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as
    | 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'email' | null;

  // Erreur explicite renvoyée par Supabase
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const errorCode = url.searchParams.get('error_code');

  const next = url.searchParams.get('next');
  const explicitRedirect = next || url.searchParams.get('redirect');
  const redirect = explicitRedirect || '/stagiaire';

  function loginRedirect(message: string, isError = true) {
    const key = isError ? 'error' : 'message';
    return NextResponse.redirect(
      new URL(`/login?${key}=${encodeURIComponent(message)}`, url.origin)
    );
  }

  if (errorParam || errorDescription) {
    const msg = errorDescription || errorParam || 'Erreur d\'authentification';
    // Cas typique : lien expiré
    if (errorCode === 'otp_expired' || /expired/i.test(msg)) {
      return loginRedirect('Le lien d\'invitation a expiré. Demandez-en un nouveau.');
    }
    return loginRedirect(msg);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Typiquement : lien ouvert dans un autre navigateur que celui de la demande,
      // ou lien déjà utilisé / expiré.
      return loginRedirect('Ce lien n\'est plus valide ou a été ouvert sur un autre appareil. Demandez un nouveau lien.');
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type === 'email' ? 'signup' : type) as 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change',
    });
    if (error) {
      if (/expired|invalid/i.test(error.message)) {
        return loginRedirect('Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien.');
      }
      return loginRedirect(error.message);
    }
  } else {
    // Aucun paramètre d'auth : peut venir d'un lien mal formé OU d'un fragment
    // (#access_token=...) que le serveur ne peut pas lire. On délègue à une
    // petite page client qui inspectera la fragment.
    return NextResponse.redirect(new URL(`/callback/hash?redirect=${encodeURIComponent(redirect)}`, url.origin));
  }

  // Pour invite / recovery → définition du mot de passe. Sans destination
  // explicite, la page renvoie ensuite vers l'accueil correspondant au rôle.
  if (type === 'recovery' || type === 'invite') {
    const target = explicitRedirect
      ? `/setup-password?next=${encodeURIComponent(explicitRedirect)}`
      : '/setup-password';
    return NextResponse.redirect(new URL(target, url.origin));
  }

  return NextResponse.redirect(new URL(redirect, url.origin));
}
