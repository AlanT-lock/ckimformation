import Link from 'next/link';
import { SignupParticulierForm } from './SignupParticulierForm';
import { getAllSecteurs } from '@/lib/db/secteurs';

export default async function SignupParticulierPage() {
  const secteurs = await getAllSecteurs();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Création de compte</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
        Particulier.
      </h1>
      <p className="mt-3 text-muted text-sm">
        Pour vous inscrire en votre nom propre à une session de formation.
      </p>

      <SignupParticulierForm secteurs={secteurs} />

      <p className="mt-6 text-sm text-muted">
        Vous représentez une entreprise ?{' '}
        <Link href="/signup-entreprise" className="text-teal-l hover:underline">
          Créer un compte entreprise
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-teal-l hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
