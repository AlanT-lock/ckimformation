import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { getCurrentProfile } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{ redirect?: string; error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // Si déjà connecté, dispatch direct vers le bon espace
  const profile = await getCurrentProfile();
  if (profile) {
    const home =
      profile.role === 'admin' ? '/admin' :
      profile.role === 'formateur' ? '/formateur' : '/stagiaire';
    redirect(sp.redirect || home);
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Connexion</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
        Bon retour.
      </h1>
      <p className="mt-3 text-muted text-sm">
        Accédez à votre espace personnel.
      </p>

      <LoginForm redirectTo={sp.redirect} initialError={sp.error} initialMessage={sp.message} />

      <div className="mt-8 text-sm text-muted space-y-2">
        <p>
          Pas encore de compte ?{' '}
          <Link href="/signup-particulier" className="text-teal-l hover:underline">
            Particulier
          </Link>
          {' · '}
          <Link href="/signup-entreprise" className="text-teal-l hover:underline">
            Entreprise
          </Link>
        </p>
      </div>
    </div>
  );
}
