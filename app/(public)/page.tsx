import Link from 'next/link';
import { HeroAccueil } from '@/components/sections/HeroAccueil';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { StatCounter } from '@/components/motion/StatCounter';
import { Marquee } from '@/components/motion/Marquee';
import { PARCOURS_META } from '@/lib/parcours';
import { JsonLd } from '@/components/seo/JsonLd';
import { FormationsHighlight } from '@/components/sections/FormationsHighlight';
import { QualiopiBanner } from '@/components/sections/QualiopiBanner';
import { getFormationBySlug } from '@/lib/db/formations';

const HIGHLIGHTED_SLUGS = [
  'sst-initiale',
  'incendie-extincteur-evacuation',
  'gestes-et-postures',
  'duerp-formation-accompagnement',
  'hygiene-alimentaire-haccp',
];

export const revalidate = 300;

export default async function Home() {
  const highlighted = (await Promise.all(
    HIGHLIGHTED_SLUGS.map((s) => getFormationBySlug(s))
  )).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <>
      <HeroAccueil />

      {/* Manifesto - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Notre approche"
              titre="Apprendre par la pratique."
              accent="pratique"
              description="60 à 80 % de pratique, formateurs certifiés, intervention directement sur votre site. Une pédagogie ancrée dans la réalité terrain de vos équipes pour des compétences durables."
            />
          </FadeUp>
        </Container>
      </section>

      {/* Stats - light */}
      <section className="bg-light py-24">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
            {[
              { n: 150, s: '', label: 'Sessions de formation organisées', animate: true },
              { n: 2025, s: '', label: "Création de l'organisme", animate: false },
              { n: 80, s: '%', label: 'Pratique', animate: true },
            ].map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.08}>
                <div>
                  <p className="font-display text-6xl md:text-7xl text-teal leading-none">
                    {stat.animate ? (
                      <StatCounter to={stat.n} suffix={stat.s} />
                    ) : (
                      <span>{stat.n}{stat.s}</span>
                    )}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-dark/60">{stat.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Formations à l'affiche - carousel - light */}
      <FormationsHighlight formations={highlighted} />

      {/* Parcours preview - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Catalogue"
              titre="8 parcours, 17 formations."
              accent="17 formations"
              description="Un catalogue couvrant la sécurité au travail, la prévention, le management, les formateurs et le développement humain."
            />
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {Object.entries(PARCOURS_META).map(([key, meta], i) => (
              <FadeUp key={key} delay={i * 0.05}>
                <Link
                  href={`/formations#${key}`}
                  className="block bg-white border border-light rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="h-1 w-12 mb-4" style={{ backgroundColor: meta.couleur }} />
                  <h3 className="font-display text-2xl tracking-wide text-dark">{meta.label}</h3>
                  <p className="mt-2 text-sm text-dark/60 leading-relaxed">{meta.description}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>
                    Découvrir →
                  </p>
                </Link>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.4}>
            <div className="mt-12 text-center">
              <ButtonLink href="/formations" variant="dark">Voir toutes les formations</ButtonLink>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* Qualiopi — engagement qualité */}
      <QualiopiBanner variant="feature" tone="light" />

      {/* Citation - dark */}
      <section className="bg-dark text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <FadeUp>
            <p className="font-serif italic text-3xl md:text-5xl leading-[1.2] max-w-4xl">
              « La sécurité, ça <span className="text-teal-l">s'apprend</span>. La performance, ça se <span className="text-orange">construit</span>. »
            </p>
            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-muted">— L'équipe C-KIM Formation</p>
          </FadeUp>
        </Container>
      </section>

      {/* Marquee - white */}
      <section className="bg-white py-12 border-y border-light">
        <Marquee speed={40}>
          {['QUALIOPI', '·', 'INRS', '·', 'AFNOR', '·', 'FPA', '·', 'CODE DU TRAVAIL', '·', 'APSAD', '·'].map((label, i) => (
            <span key={i} className="font-display text-3xl tracking-[0.2em] text-dark/60">{label}</span>
          ))}
        </Marquee>
      </section>

      {/* Final CTA - light */}
      <section className="bg-light py-24">
        <Container>
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto">
              <SectionHeader
                align="center"
                eyebrow="Démarrer"
                titre="Une formation pour votre équipe ?"
                accent="votre équipe"
                description="Demandez un devis personnalisé pour votre site. Réponse sous 24h."
              />
              <div className="flex flex-wrap gap-4 justify-center mt-8">
                <ButtonLink href="/contact" variant="primary">Demander un devis</ButtonLink>
                <a href="tel:0662515559" className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark text-dark hover:bg-dark hover:text-white transition-all">
                  06 62 51 55 59
                </a>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'C-KIM Formation',
          description: 'Centre de formation certifié Qualiopi spécialisé en sécurité au travail, prévention et développement humain.',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Draguignan',
            postalCode: '83300',
            addressRegion: 'Provence-Alpes-Côte d\'Azur',
            addressCountry: 'FR',
          },
          email: 'ckimsecuriteformation@gmail.com',
          telephone: '+33-6-62-51-55-59',
          areaServed: 'Provence-Alpes-Côte d\'Azur',
        }}
      />
    </>
  );
}
