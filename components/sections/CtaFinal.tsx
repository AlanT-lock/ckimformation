'use client';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useDevisModal } from '@/components/forms/DevisModal';
import type { Formation } from '@/lib/types/formation';

export function CtaFinal({ formation }: { formation: Formation }) {
  const { open } = useDevisModal();
  return (
    <section className="bg-light py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide leading-[1.05]">
            Cette formation vous <em className="not-italic text-teal">intéresse</em> ?
          </h2>
          <p className="mt-4 text-dark/70">Devis personnalisé sous 24h. Intervention partout en région PACA.</p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Button variant="primary" onClick={() => open(formation.titre)}>Demander un devis</Button>
            <a href="tel:0662515659" className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark text-dark hover:bg-dark hover:text-white transition-all">
              06 62 51 56 59
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
