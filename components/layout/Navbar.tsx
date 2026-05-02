'use client';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-[0.25em] text-dark">C-KIM</Link>
        <nav className="hidden md:flex gap-8 font-sans text-sm font-semibold uppercase tracking-wider">
          <Link href="/organisme" className="hover:text-teal">L'organisme</Link>
          <Link href="/formations" className="hover:text-teal">Formations</Link>
          <Link href="/contact" className="hover:text-teal">Contact</Link>
        </nav>
        <ButtonLink href="/contact" variant="primary" className="hidden md:inline-flex">Demander un devis</ButtonLink>
      </Container>
    </header>
  );
}
