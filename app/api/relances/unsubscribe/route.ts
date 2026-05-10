import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/recommendations/unsubscribe';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const profileId = url.searchParams.get('p');
  const token = url.searchParams.get('t');

  if (!profileId || !token || !verifyUnsubscribeToken(profileId, token)) {
    return new NextResponse(htmlPage('Lien invalide', 'Le lien de désinscription est invalide ou a expiré.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ relances_optin: false })
    .eq('id', profileId);

  if (error) {
    return new NextResponse(htmlPage('Erreur', "Une erreur est survenue. Réessayez plus tard."), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(
    htmlPage(
      'Désinscription confirmée',
      "Vous ne recevrez plus nos recommandations de formation. Vous pouvez vous réabonner depuis votre espace personnel à tout moment."
    ),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title} — C-KIM Formation</title>
<style>
body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#0a0a0a; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
.box { max-width:480px; text-align:center; }
h1 { font-size:28px; margin:0 0 16px; font-weight:600; letter-spacing:0.02em; }
p { font-size:15px; line-height:1.6; color:#bbb; margin:0 0 24px; }
a { display:inline-block; padding:12px 24px; background:#1B8FA0; color:#fff; text-decoration:none; border-radius:6px; font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
</style>
</head>
<body>
  <div class="box">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Retour au site</a>
  </div>
</body>
</html>`;
}
