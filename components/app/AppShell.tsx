import Link from 'next/link';
import Image from 'next/image';
import type { Profile } from '@/lib/supabase/types';

type NavItem = { href: string; label: string };

const NAV_ADMIN: NavItem[] = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/demandes', label: 'Demandes' },
  { href: '/admin/formations', label: 'Formations' },
  { href: '/admin/tests', label: 'Tests & enquêtes' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs' },
  { href: '/admin/analytics', label: 'Analytics' },
];

const NAV_FORMATEUR: NavItem[] = [
  { href: '/formateur', label: 'Tableau de bord' },
  { href: '/formateur/sessions', label: 'Mes sessions' },
];

const NAV_STAGIAIRE_BASE: NavItem[] = [
  { href: '/stagiaire', label: 'Tableau de bord' },
  { href: '/stagiaire/formations', label: 'Catalogue' },
  { href: '/stagiaire/inscriptions', label: 'Mes demandes' },
  { href: '/stagiaire/parcours', label: 'En formation' },
];

function navFor(profile: Profile): NavItem[] {
  if (profile.role === 'admin') return NAV_ADMIN;
  if (profile.role === 'formateur') return NAV_FORMATEUR;
  // Salarié rattaché à une entreprise : accès uniquement à l'espace "En formation"
  if (profile.role === 'stagiaire' && profile.employer_profile_id) {
    return [{ href: '/stagiaire/parcours', label: 'En formation' }];
  }
  if (profile.account_type === 'entreprise') {
    return [
      ...NAV_STAGIAIRE_BASE.slice(0, 2),
      { href: '/stagiaire/employes', label: 'Mes salariés' },
      ...NAV_STAGIAIRE_BASE.slice(2),
    ];
  }
  return NAV_STAGIAIRE_BASE;
}

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administration',
  formateur: 'Espace formateur',
  stagiaire: 'Espace stagiaire',
};

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const nav = navFor(profile);
  return (
    <div className="min-h-screen bg-light text-dark">
      <header className="bg-dark text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="C-KIM Formation — Accueil" className="block">
              <Image
                src="/logo-ckim.png"
                alt="C-KIM Formation"
                width={512}
                height={353}
                className="h-10 w-auto"
              />
            </Link>
            <span className="text-xs uppercase tracking-[0.3em] text-teal-l hidden sm:inline">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted hidden md:inline">{profile.full_name || profile.email}</span>
            <form action="/logout" method="POST">
              <button className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white transition">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-10 flex gap-6 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-sm text-muted hover:text-white whitespace-nowrap border-b-2 border-transparent hover:border-teal-l transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
