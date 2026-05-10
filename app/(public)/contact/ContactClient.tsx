'use client';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import { ContactEntreprise } from '@/components/forms/ContactEntreprise';
import { ContactParticulier } from '@/components/forms/ContactParticulier';
import type { FormationOption } from '@/components/forms/FormationSelect';
import { cn } from '@/lib/utils';

export function ContactClient({ formations }: { formations: FormationOption[] }) {
  const [tab, setTab] = useState<'entreprise' | 'particulier'>('entreprise');

  return (
    <>
      <section className="bg-dark text-white py-32 relative">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Contact</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Parlons<br/><em className="not-italic text-teal-l">formation.</em>
          </h1>
          <p className="mt-8 text-muted max-w-xl">
            Devis sous 24h. Téléphone direct : <a href="tel:0662515559" className="text-teal-l hover:underline">06 62 51 55 59</a>.
          </p>
        </Container>
      </section>

      <section className="bg-white py-20">
        <Container className="max-w-3xl">
          <FadeUp>
            <div className="flex gap-2 mb-8 border-b border-light">
              {(['entreprise', 'particulier'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-6 py-3 text-sm uppercase tracking-[0.15em] font-semibold transition relative',
                    tab === t ? 'text-orange' : 'text-dark/50 hover:text-dark'
                  )}
                >
                  {t === 'entreprise' ? 'Entreprise' : 'Particulier'}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange" />}
                </button>
              ))}
            </div>
            {tab === 'entreprise' ? <ContactEntreprise formations={formations} /> : <ContactParticulier formations={formations} />}
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
