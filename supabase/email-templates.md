# Templates email Supabase — C-KIM Formation

Templates HTML à copier-coller dans **Supabase Dashboard → Authentication → Email Templates**.

Tous les templates :
- Largeur fixe 600px (lisible sur Outlook desktop et mobile)
- Tables imbriquées (compatibilité historique des clients mail)
- Inline CSS (pas de classes — les clients ne les comprennent pas)
- Logo via URL absolue : `https://ckimformation.fr/logo-ckim.png`
- Variables Supabase entre `{{ }}`

---

## 1. Confirm signup

**Sujet** :
```
Confirmez votre inscription à C-KIM Formation
```

**Body HTML** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Confirmez votre inscription</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">
      <!-- Bande gradient -->
      <tr><td style="height:3px;background:linear-gradient(to right,#1B8FA0,#3AB5CA,#E8692A);"></td></tr>

      <!-- Logo -->
      <tr><td align="center" style="padding:32px 32px 16px;">
        <img src="https://ckimformation.fr/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;height:auto;width:160px;" />
      </td></tr>

      <!-- Header -->
      <tr><td style="padding:8px 40px 24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1B8FA0;font-weight:600;">Bienvenue</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#0a0a0a;">Confirmez votre adresse email.</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Bonjour,
        </p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Merci d'avoir créé un compte sur <strong>C-KIM Formation</strong>. Une dernière étape avant de pouvoir vous connecter : confirmer que cette adresse vous appartient.
        </p>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:8px 40px 32px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Confirmer mon email</a>
      </td></tr>

      <!-- Lien fallback -->
      <tr><td style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#888;">
          Le bouton ne fonctionne pas ? Copiez-collez ce lien dans votre navigateur :<br />
          <a href="{{ .ConfirmationURL }}" style="color:#1B8FA0;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </p>
      </td></tr>

      <!-- Note sécurité -->
      <tr><td style="padding:0 40px 32px;">
        <p style="margin:0;padding:16px;background:#f5f7f8;border-radius:6px;font-size:13px;line-height:1.55;color:#666;">
          Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer ce message — aucun compte ne sera activé sans votre confirmation.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 40px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        <p style="margin:0 0 6px;"><strong>C-KIM Formation</strong> — Centre certifié Qualiopi</p>
        <p style="margin:0;">391 avenue du Maréchal Koenig, 83300 Draguignan · <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 2. Magic Link (connexion sans mot de passe)

**Sujet** :
```
Votre lien de connexion à C-KIM Formation
```

**Body HTML** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lien de connexion</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">
      <tr><td style="height:3px;background:linear-gradient(to right,#1B8FA0,#3AB5CA,#E8692A);"></td></tr>

      <tr><td align="center" style="padding:32px 32px 16px;">
        <img src="https://ckimformation.fr/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;height:auto;width:160px;" />
      </td></tr>

      <tr><td style="padding:8px 40px 24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1B8FA0;font-weight:600;">Connexion</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#0a0a0a;">Votre lien de connexion.</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Vous avez demandé à vous connecter à votre espace C-KIM Formation. Cliquez sur le bouton ci-dessous pour ouvrir votre session — aucun mot de passe nécessaire.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:8px 40px 16px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Me connecter</a>
      </td></tr>

      <tr><td align="center" style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;color:#888;">Ce lien expire dans <strong>1 heure</strong> pour des raisons de sécurité.</p>
      </td></tr>

      <tr><td style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#888;">
          Le bouton ne fonctionne pas ? Copiez-collez ce lien :<br />
          <a href="{{ .ConfirmationURL }}" style="color:#1B8FA0;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </p>
      </td></tr>

      <tr><td style="padding:0 40px 32px;">
        <p style="margin:0;padding:16px;background:#f5f7f8;border-radius:6px;font-size:13px;line-height:1.55;color:#666;">
          Si vous n'avez pas demandé ce lien, ignorez ce message. Aucune action ne sera entreprise sur votre compte.
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        <p style="margin:0 0 6px;"><strong>C-KIM Formation</strong> — Centre certifié Qualiopi</p>
        <p style="margin:0;">391 avenue du Maréchal Koenig, 83300 Draguignan · <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 3. Reset password (mot de passe oublié)

**Sujet** :
```
Réinitialisez votre mot de passe C-KIM Formation
```

**Body HTML** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Réinitialiser votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">
      <tr><td style="height:3px;background:linear-gradient(to right,#1B8FA0,#3AB5CA,#E8692A);"></td></tr>

      <tr><td align="center" style="padding:32px 32px 16px;">
        <img src="https://ckimformation.fr/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;height:auto;width:160px;" />
      </td></tr>

      <tr><td style="padding:8px 40px 24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#E8692A;font-weight:600;">Sécurité du compte</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#0a0a0a;">Réinitialisez votre mot de passe.</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte C-KIM Formation. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:8px 40px 16px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#E8692A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Choisir un nouveau mot de passe</a>
      </td></tr>

      <tr><td align="center" style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;color:#888;">Ce lien expire dans <strong>1 heure</strong>.</p>
      </td></tr>

      <tr><td style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#888;">
          Le bouton ne fonctionne pas ? Copiez-collez ce lien :<br />
          <a href="{{ .ConfirmationURL }}" style="color:#1B8FA0;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </p>
      </td></tr>

      <tr><td style="padding:0 40px 32px;">
        <p style="margin:0;padding:16px;background:#fff5ef;border-left:3px solid #E8692A;border-radius:6px;font-size:13px;line-height:1.55;color:#7a3614;">
          <strong>Vous n'êtes pas à l'origine de cette demande ?</strong> Ignorez ce message. Votre mot de passe actuel reste inchangé et personne ne peut accéder à votre compte tant que vous n'avez pas cliqué sur le lien.
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        <p style="margin:0 0 6px;"><strong>C-KIM Formation</strong> — Centre certifié Qualiopi</p>
        <p style="margin:0;">391 avenue du Maréchal Koenig, 83300 Draguignan · <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 4. Invite user (invitation par admin — formateurs)

**Sujet** :
```
Vous êtes invité à rejoindre l'équipe C-KIM Formation
```

**Body HTML** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invitation C-KIM Formation</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">
      <tr><td style="height:3px;background:linear-gradient(to right,#1B8FA0,#3AB5CA,#E8692A);"></td></tr>

      <tr><td align="center" style="padding:32px 32px 16px;">
        <img src="https://ckimformation.fr/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;height:auto;width:160px;" />
      </td></tr>

      <tr><td style="padding:8px 40px 24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1B8FA0;font-weight:600;">Invitation</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#0a0a0a;">Bienvenue chez C-KIM Formation.</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Vous avez été invité·e à rejoindre l'équipe de formateurs de <strong>C-KIM Formation</strong>. Pour activer votre compte, cliquez sur le bouton ci-dessous et définissez votre mot de passe.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:8px 40px 16px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Activer mon compte</a>
      </td></tr>

      <tr><td style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#888;">
          Le bouton ne fonctionne pas ? Copiez-collez ce lien :<br />
          <a href="{{ .ConfirmationURL }}" style="color:#1B8FA0;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </p>
      </td></tr>

      <tr><td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:20px;background:#f5f7f8;border-radius:6px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0a0a0a;">Une fois connecté·e, vous pourrez :</p>
            <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;color:#555;">
              <li>Gérer vos sessions de formation et émargements</li>
              <li>Déclencher les tests et enquêtes en cours de session</li>
              <li>Suivre la progression de vos stagiaires</li>
            </ul>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:13px;line-height:1.55;color:#888;">
          Une question ? Contactez l'administration à <a href="mailto:contact@ckimformation.fr" style="color:#1B8FA0;">contact@ckimformation.fr</a>.
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        <p style="margin:0 0 6px;"><strong>C-KIM Formation</strong> — Centre certifié Qualiopi</p>
        <p style="margin:0;">391 avenue du Maréchal Koenig, 83300 Draguignan · <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 5. Change Email Address

**Sujet** :
```
Confirmez votre nouvelle adresse email
```

**Body HTML** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Confirmer le changement d'email</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">
      <tr><td style="height:3px;background:linear-gradient(to right,#1B8FA0,#3AB5CA,#E8692A);"></td></tr>

      <tr><td align="center" style="padding:32px 32px 16px;">
        <img src="https://ckimformation.fr/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;height:auto;width:160px;" />
      </td></tr>

      <tr><td style="padding:8px 40px 24px;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1B8FA0;font-weight:600;">Changement d'email</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#0a0a0a;">Confirmez votre nouvelle adresse.</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
          Vous avez demandé à changer l'email associé à votre compte C-KIM Formation. Pour valider ce changement, cliquez sur le bouton ci-dessous.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;width:100%;">
          <tr>
            <td style="padding:12px 16px;background:#f5f7f8;border-radius:6px;font-size:13px;color:#555;">
              <strong>Nouvelle adresse :</strong> {{ .NewEmail }}
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:8px 40px 16px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Confirmer le changement</a>
      </td></tr>

      <tr><td style="padding:0 40px 24px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#888;">
          Le bouton ne fonctionne pas ? Copiez-collez ce lien :<br />
          <a href="{{ .ConfirmationURL }}" style="color:#1B8FA0;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </p>
      </td></tr>

      <tr><td style="padding:0 40px 32px;">
        <p style="margin:0;padding:16px;background:#fff5ef;border-left:3px solid #E8692A;border-radius:6px;font-size:13px;line-height:1.55;color:#7a3614;">
          <strong>Vous n'êtes pas à l'origine de cette demande ?</strong> Connectez-vous immédiatement et changez votre mot de passe — quelqu'un pourrait avoir accès à votre compte.
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        <p style="margin:0 0 6px;"><strong>C-KIM Formation</strong> — Centre certifié Qualiopi</p>
        <p style="margin:0;">391 avenue du Maréchal Koenig, 83300 Draguignan · <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## Configuration côté Supabase

1. **Authentication → Email Templates**
   - Pour chaque template (Confirm signup, Invite user, Magic Link, Change Email Address, Reset Password) :
   - Met à jour le **Subject** et le **Body HTML** depuis ce fichier

2. **Authentication → URL Configuration**
   - **Site URL** : `https://ckimformation.fr`
   - **Redirect URLs** (autorisées) :
     - `https://ckimformation.fr/callback`
     - `https://ckimformation.fr/setup-password`
     - `http://localhost:3000/callback` (dev)
     - `http://localhost:3000/setup-password` (dev)

3. **Authentication → SMTP Settings** (recommandé pour la délivrabilité)
   - Connecter Resend en SMTP custom : sinon Supabase utilise son SMTP partagé limité et qui finit souvent en spam
   - Host : `smtp.resend.com`
   - Port : `465`
   - User : `resend`
   - Password : ta `RESEND_API_KEY`
   - Sender email : `contact@ckimformation.fr`
   - Sender name : `C-KIM Formation`
