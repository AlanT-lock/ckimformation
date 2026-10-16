'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Onglets de la page formation (admin). Ajouter ici les prochaines rubriques. */
export function FormationTabs({ formationId }: { formationId: string }) {
  const pathname = usePathname();
  const base = `/admin/formations/${formationId}`;
  const tabs = [
    { href: base, label: 'Fiche formation', active: pathname === base },
    { href: `${base}/tests`, label: 'Tests & enquêtes', active: pathname.startsWith(`${base}/tests`) },
  ];

  return (
    <nav aria-label="Rubriques de la formation" className="border-b border-dark/10 overflow-x-auto">
      <ul className="flex gap-1 min-w-max">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`inline-block px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                t.active
                  ? 'border-teal text-teal'
                  : 'border-transparent text-dark/60 hover:text-dark hover:border-dark/20'
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
