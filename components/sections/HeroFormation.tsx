import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Tag } from '@/components/ui/Tag';
import type { Formation } from '@/lib/types/formation';
import type { ParcoursMeta } from '@/lib/parcours';

export function HeroFormation({ formation, meta }: { formation: Formation; meta: ParcoursMeta }) {
  return (
    <section className="relative h-[80vh] min-h-[560px] overflow-hidden bg-dark text-white">
      <Image
        src={formation.hero.image}
        alt={formation.hero.alt}
        fill
        priority
        className="object-cover opacity-50"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,26,30,.4) 0%, rgba(10,26,30,.85) 100%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ backgroundColor: meta.couleur }} />
      <Container className="relative z-10 flex flex-col justify-end h-full pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Tag color={meta.couleur} variant="solid">{meta.label}</Tag>
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">{formation.ref}</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-[0.9]">
          {formation.titre}
          {formation.sousTitre && (<><br/><span className="text-teal-l">{formation.sousTitre}</span></>)}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#prochaines-sessions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
            style={{ backgroundColor: meta.couleur }}
            data-track="hero_voir_sessions"
            data-track-formation={formation.slug}
          >
            Voir les prochaines sessions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>
      </Container>
    </section>
  );
}
