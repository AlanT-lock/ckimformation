import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import { Tag } from '@/components/ui/Tag';
import { formations } from '@/lib/formations';
import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours } from '@/lib/types/formation';

export const metadata: Metadata = {
  title: 'Formations — Catalogue C-KIM Formation',
  description: 'Découvrez nos 15 formations en sécurité au travail, prévention, management S&ST et développement humain. Certifiées Qualiopi, intervention en région PACA.',
};

export default function FormationsIndex() {
  const grouped = (Object.keys(PARCOURS_META) as Parcours[]).map((key) => ({
    key,
    meta: PARCOURS_META[key],
    items: formations.filter((f) => f.parcours === key),
  }));

  return (
    <>
      {/* Hero - dark */}
      <section className="bg-dark text-white py-32 relative">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Catalogue</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Toutes nos<br/><em className="not-italic text-teal-l">formations.</em>
          </h1>
          <p className="mt-8 text-muted max-w-xl">
            15 formations réparties en 8 parcours. Toutes certifiées Qualiopi, dispensées en région PACA, sur votre site.
          </p>
        </Container>
      </section>

      {grouped.map((g, gi) => (
        g.items.length === 0 ? null : (
          <section
            key={g.key}
            id={g.key}
            className={gi % 2 === 0 ? 'bg-white py-20' : 'bg-light py-20'}
          >
            <Container>
              <FadeUp>
                <div className="flex items-center gap-4 mb-10">
                  <span className="h-10 w-1 rounded" style={{ backgroundColor: g.meta.couleur }} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: g.meta.couleur }}>Parcours</p>
                    <h2 className="font-display text-3xl md:text-5xl tracking-wide">{g.meta.label}</h2>
                  </div>
                </div>
              </FadeUp>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {g.items.map((f, i) => (
                  <FadeUp key={f.slug} delay={i * 0.06}>
                    <Link
                      href={`/formations/${f.slug}`}
                      className="block bg-white rounded-lg overflow-hidden border border-light hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                    >
                      <div className="h-1" style={{ backgroundColor: g.meta.couleur }} />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <Tag color={g.meta.couleur}>{f.ref}</Tag>
                          <span className="text-xs text-dark/50">{f.infosPratiques.duree}</span>
                        </div>
                        <h3 className="font-display text-2xl tracking-wide leading-tight mb-2">
                          {f.titre}
                          {f.sousTitre && <><br/><span className="text-dark/60 text-lg">{f.sousTitre}</span></>}
                        </h3>
                        <p className="text-sm text-dark/70 line-clamp-3 mt-3 leading-relaxed">{f.objectifs}</p>
                        <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: g.meta.couleur }}>
                          Voir la formation →
                        </p>
                      </div>
                    </Link>
                  </FadeUp>
                ))}
              </div>
            </Container>
          </section>
        )
      ))}
    </>
  );
}
