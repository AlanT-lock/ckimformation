import { SetupPasswordForm } from './SetupPasswordForm';

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SetupPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
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
