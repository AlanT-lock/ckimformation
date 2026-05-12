'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/organisme', label: "L'organisme" },
  { href: '/formations', label: 'Formations' },
  { href: '/financement', label: 'Financement' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ferme le menu à chaque changement de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
        }`}
      >
        <Container className="flex h-24 items-center justify-between">
          <Link href="/" aria-label="C-KIM Formation — Accueil" className="block relative z-10">
            <Image
              src="/logo-ckim-noir.png"
              alt="C-KIM Formation"
              width={512}
              height={353}
              priority
              className="h-16 sm:h-[72px] md:h-20 w-auto"
            />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex gap-8 font-sans text-sm font-semibold uppercase tracking-wider">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-teal">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="font-sans text-sm font-semibold uppercase tracking-wider hover:text-teal">
              Espace
            </Link>
            <ButtonLink href="/contact" variant="primary">Demander un devis</ButtonLink>
          </div>

          {/* Bouton burger mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden relative z-10 w-10 h-10 flex items-center justify-center"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">{menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
            <span className="relative w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 bg-dark transition-all duration-300 origin-center ${
                  menuOpen ? 'rotate-45 translate-y-[9px]' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-dark transition-all duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-dark transition-all duration-300 origin-center ${
                  menuOpen ? '-rotate-45 -translate-y-[9px]' : ''
                }`}
              />
            </span>
          </button>
        </Container>
      </header>

      {/* Drawer mobile (overlay) */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop cliquable */}
        <div
          className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Panneau */}
        <div
          className={`absolute inset-x-0 top-24 bg-white shadow-2xl border-t border-light transition-transform duration-300 ${
            menuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          <Container className="py-8">
            <nav className="flex flex-col">
              {LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-4 font-sans text-base font-semibold uppercase tracking-wider hover:text-teal transition-colors ${
                    i !== 0 ? 'border-t border-light' : ''
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="py-4 font-sans text-base font-semibold uppercase tracking-wider hover:text-teal border-t border-light"
              >
                Espace personnel
              </Link>
            </nav>
            <div className="mt-6 pt-6 border-t border-light">
              <ButtonLink
                href="/contact"
                variant="primary"
                className="w-full justify-center"
              >
                Demander un devis
              </ButtonLink>
              <a
                href="tel:0662515559"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark/20 text-dark hover:bg-dark hover:text-white transition-all"
              >
                06 62 51 55 59
              </a>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}
