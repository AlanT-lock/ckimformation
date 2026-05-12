import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tag } from '@/components/ui/Tag';
import { Accordion } from '@/components/ui/Accordion';
import { FadeUp } from '@/components/motion/FadeUp';
import { HeroFormation } from '@/components/sections/HeroFormation';
import { MetaBlock } from '@/components/sections/MetaBlock';
import { MethodeCkim } from '@/components/sections/MethodeCkim';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { UpcomingSessions } from '@/components/sections/UpcomingSessions';
import { TarifsSection } from '@/components/sections/TarifsSection';
import { QualiopiBanner } from '@/components/sections/QualiopiBanner';
import { getAllFormations, getFormationBySlug } from '@/lib/db/formations';
import { getParcoursMeta } from '@/lib/parcours';
import { JsonLd } from '@/components/seo/JsonLd';

interface PageProps { params: Promise<{ slug: string }> }

export const revalidate = 300; // ISR : données rafraîchies toutes les 5 min

export async function generateStaticParams() {
  const formations = await getAllFormations();
  return formations.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFormationBySlug(slug);
  if (!f) return {};
  return { title: f.seo.title, description: f.seo.description };
}

export default async function FormationPage({ params }: PageProps) {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);
  if (!formation) notFound();
  const meta = getParcoursMeta(formation.parcours);
  const liees = (await Promise.all(
    formation.formationsLiees.map((s) => getFormationBySlug(s))
  )).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <>
      <HeroFormation formation={formation} meta={meta} />
      <MetaBlock formation={formation} color={meta.couleur} />
      <TarifsSection tarifs={formation.tarifs ?? []} color={meta.couleur} />

      {/* 2b. Prochaines sessions (remonté juste sous les tarifs) */}
      <UpcomingSessions formationSlug={formation.slug} color={meta.couleur} />

      {/* 3. Objectifs - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Objectifs</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Ce que vous saurez <em className="not-italic" style={{ color: meta.couleur }}>faire</em>.
            </h2>
            <p className="mt-6 text-lg text-dark/80 leading-relaxed">{formation.objectifs}</p>
          </FadeUp>
        </Container>
      </section>

      {/* 4. Programme - light */}
      <section className="bg-light py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Programme</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Programme <em className="not-italic" style={{ color: meta.couleur }}>détaillé</em>.
            </h2>
            <div className="mt-8">
              <Accordion items={formation.programme} color={meta.couleur} />
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 5. Public & prérequis - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Public visé</p>
                <h3 className="font-display text-2xl md:text-3xl tracking-wide mt-3">Pour qui ?</h3>
                <p className="mt-4 text-dark/80 leading-relaxed">
                  {formation.publicDetail || formation.infosPratiques.public}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Prérequis</p>
                <h3 className="font-display text-2xl md:text-3xl tracking-wide mt-3">Avant la formation</h3>
                <p className="mt-4 text-dark/80 leading-relaxed">{formation.infosPratiques.prerequis}</p>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 6. Évaluation - light */}
      <section className="bg-light py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Évaluation</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Modalités d&apos;<em className="not-italic" style={{ color: meta.couleur }}>évaluation</em>.
            </h2>
            <p className="mt-6 text-lg text-dark/80 leading-relaxed">{formation.evaluation}</p>
          </FadeUp>
        </Container>
      </section>

      {/* 7. Références - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Cadre légal</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Références <em className="not-italic" style={{ color: meta.couleur }}>réglementaires</em>.
            </h2>
            <div className="mt-6 p-6 bg-light rounded-lg border-l-4" style={{ borderColor: meta.couleur }}>
              <p className="text-sm text-dark/80 leading-relaxed">{formation.referencesReglementaires}</p>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 7b. Qualiopi — bandeau qualité */}
      <QualiopiBanner
        variant="compact"
        eyebrow="Formation certifiée"
        title="Cette formation est éligible aux financements qualité."
        description="Conçue dans le cadre du référentiel Qualiopi, cette action est mobilisable via OPCO, CPF, Pôle Emploi ou plan de développement des compétences."
      />

      {/* 8. Méthode C-KIM (transverse) - dark */}
      <MethodeCkim />

      {/* 9. CTA final - light */}
      <CtaFinal formation={formation} />

      {/* 10. Formations liées - white */}
      {liees.length > 0 && (
        <section className="bg-white py-20 border-t border-light">
          <Container>
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.3em] text-orange">Pour aller plus loin</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-wide mt-3">Formations liées</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {liees.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/formations/${f.slug}`}
                    className="block bg-light rounded-lg p-6 hover:shadow-lg transition-all"
                  >
                    <Tag color={getParcoursMeta(f.parcours).couleur}>{f.ref}</Tag>
                    <h3 className="font-display text-xl mt-3 tracking-wide">{f.titre}</h3>
                    <p className="text-xs text-dark/60 mt-2">{f.infosPratiques.duree}</p>
                  </Link>
                ))}
              </div>
            </FadeUp>
          </Container>
        </section>
      )}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: `${formation.titre}${formation.sousTitre ? ' — ' + formation.sousTitre : ''}`,
          description: formation.objectifs,
          provider: { '@type': 'Organization', name: 'C-KIM Formation', sameAs: 'https://ckimformation.fr' },
        }}
      />
    </>
  );
}
