import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="bg-dark text-white py-16 mt-32">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          <div>
            <p className="font-display text-2xl tracking-[0.25em]">C-KIM FORMATION</p>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Centre de formation certifié Qualiopi — Sécurité, prévention et développement humain. Draguignan (83), région PACA.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Navigation</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-teal-l">Accueil</Link></li>
              <li><Link href="/organisme" className="hover:text-teal-l">L'organisme</Link></li>
              <li><Link href="/formations" className="hover:text-teal-l">Formations</Link></li>
              <li><Link href="/contact" className="hover:text-teal-l">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:0662515659" className="hover:text-teal-l">06 62 51 56 59</a></li>
              <li><a href="mailto:ckimsecuriteformation@gmail.com" className="hover:text-teal-l break-all">ckimsecuriteformation@gmail.com</a></li>
              <li className="text-muted">Draguignan (83) — PACA</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Légal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-teal-l">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-teal-l">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} C-KIM Formation — Tous droits réservés</p>
          <p>Certifié Qualiopi · Formateurs INRS / AFNOR / FPA</p>
        </div>
      </Container>
    </footer>
  );
}
