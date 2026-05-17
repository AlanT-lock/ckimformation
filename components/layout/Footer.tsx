import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="bg-dark text-white py-16 mt-32">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          <div>
            <Image
              src="/logo-ckim.png"
              alt="C-KIM Formation"
              width={512}
              height={353}
              className="h-20 w-auto"
            />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Centre de formation certifié Qualiopi — Sécurité, prévention et développement humain. Draguignan (83), région PACA.
            </p>

            {/* Encart Qualiopi */}
            <div className="mt-6 inline-flex items-start gap-3 bg-white/[0.04] border border-white/10 rounded-lg p-3">
              <div className="shrink-0 bg-white rounded p-2">
                <Image
                  src="/logo-qualiopi.png"
                  alt="Logo Qualiopi — Processus certifié — République française"
                  width={633}
                  height={338}
                  className="h-10 w-auto"
                />
              </div>
              <div className="text-xs leading-relaxed">
                <p className="text-teal-l font-semibold uppercase tracking-wider mb-0.5">Certifié Qualiopi</p>
                <p className="text-muted">Catégorie « Actions de formation ». Éligible OPCO, CPF, Pôle Emploi.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Navigation</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-teal-l">Accueil</Link></li>
              <li><Link href="/organisme" className="hover:text-teal-l">L&apos;organisme</Link></li>
              <li><Link href="/formations" className="hover:text-teal-l">Formations</Link></li>
              <li><Link href="/financement" className="hover:text-teal-l">Financement</Link></li>
              <li><Link href="/contact" className="hover:text-teal-l">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:0662515559" className="hover:text-teal-l">06 62 51 55 59</a></li>
              <li><a href="mailto:contact@ckimformation.fr" className="hover:text-teal-l break-all">contact@ckimformation.fr</a></li>
              <li className="text-muted">Draguignan (83) — PACA</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Légal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-teal-l">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-teal-l">Confidentialité</Link></li>
              <li>
                <a
                  href="/documents/livret-accueil-ckim-formation.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-l"
                >
                  Livret d&apos;accueil
                </a>
              </li>
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
