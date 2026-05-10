import Link from 'next/link';
import { SignupEntrepriseForm } from './SignupEntrepriseForm';
import { getAllSecteurs } from '@/lib/db/secteurs';

export default async function SignupEntreprisePage() {
  const secteurs = await getAllSecteurs();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Création de compte</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
        Entreprise.
      </h1>
      <p className="mt-3 text-muted text-sm">
        Pour inscrire un ou plusieurs collaborateurs à une session de formation.
      </p>

      <SignupEntrepriseForm secteurs={secteurs} />

      <p className="mt-6 text-sm text-muted">
        Vous êtes un particulier ?{' '}
        <Link href="/signup-particulier" className="text-teal-l hover:underline">
          Créer un compte particulier
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-teal-l hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
