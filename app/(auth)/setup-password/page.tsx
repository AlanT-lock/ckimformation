import { redirect } from 'next/navigation';
import { SetupPasswordForm } from './SetupPasswordForm';

interface PageProps {
  searchParams: Promise<{ next?: string; code?: string }>;
}

export default async function SetupPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // Anciens liens de réinitialisation (?code=… PKCE) : la session doit être créée
  // par /callback avant d'afficher le formulaire.
  if (sp.code) {
    redirect(`/callback?code=${encodeURIComponent(sp.code)}&redirect=${encodeURIComponent('/setup-password')}`);
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Bienvenue</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
        Définis ton mot de passe.
      </h1>
      <p className="mt-3 text-muted text-sm">
        Cette étape sécurise ton compte. Tu pourras te connecter avec ton email + ce mot de passe ensuite.
      </p>
      <SetupPasswordForm next={sp.next} />
    </div>
  );
}
