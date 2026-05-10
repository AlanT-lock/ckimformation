'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Petit provider qui force le scroll au top à chaque changement de route.
 * (Lenis a été retiré : sa sensation de retenue dégradait l'UX. Scroll natif partout.)
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
