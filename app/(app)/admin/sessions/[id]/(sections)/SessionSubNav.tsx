'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SessionNavItem {
  /** Segment d'URL de la section ; chaîne vide pour la page d'accueil de la session. */
  slug: string;
  label: string;
}

/** Sous-menu d'une session : une entrée par section, chacune sur sa propre page. */
export function SessionSubNav({ sessionId, items }: { sessionId: string; items: SessionNavItem[] }) {
  const pathname = usePathname();
  const base = `/admin/sessions/${sessionId}`;

  return (
    <nav aria-label="Sections de la session" className="bg-white border border-dark/10 rounded-lg p-1.5">
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => {
          const href = item.slug ? `${base}/${item.slug}` : base;
          const active = item.slug
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === base;
          return (
            <li key={item.slug}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`block px-3 py-1.5 rounded text-sm whitespace-nowrap transition ${
                  active
                    ? 'bg-teal text-white font-medium'
                    : 'text-dark/70 hover:text-dark hover:bg-dark/5'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
