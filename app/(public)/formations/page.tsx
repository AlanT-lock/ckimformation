import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { QualiopiBanner } from '@/components/sections/QualiopiBanner';
import { getAllFormations } from '@/lib/db/formations';
import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours, Formation } from '@/lib/types/formation';

export const metadata: Metadata = {
  title: 'Formations — Catalogue C-KIM Formation',
  description:
    "Découvrez nos formations en sécurité au travail, prévention, management S&ST et développement humain. Certifiées Qualiopi, intervention en région PACA.",
};

export const revalidate = 300;

export default async function FormationsIndex() {
  const formations = await getAllFormations();
  const parcoursKeys = Object.keys(PARCOURS_META) as Parcours[];

  const grouped = parcoursKeys
    .map((key) => ({
      key,
      meta: PARCOURS_META[key],
      items: formations.filter((f) => f.parcours === key),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative bg-dark text-white py-32 md:py-40 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />

        {/* Backdrop subtil */}
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 95% 15%, rgba(27,143,160,.22), transparent 55%), radial-gradient(ellipse 60% 70% at -10% 100%, rgba(232,105,42,.12), transparent 50%)',
          }}
        />

        <Container className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-6 flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal-l" />
                Catalogue 2026
              </p>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-[0.95]">
                {formations.length} formations<br />
                <em className="not-italic text-teal-l">sur mesure.</em>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
                Sécurité au travail, prévention des risques, management S&amp;ST, développement
                humain. Toutes nos formations sont certifiées <strong className="text-white">Qualiopi</strong>,
                animées sur votre site, en région PACA.
              </p>
            </div>

            {/* Stats */}
            <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-6 lg:gap-4 lg:border-l lg:border-white/10 lg:pl-8">
              <Stat n={formations.length} label="Formations" />
              <Stat n={grouped.length} label="Parcours" />
              <Stat n="80%" label="de pratique" />
            </div>
          </div>

          {/* Pills parcours (anchor jump) */}
          <div className="mt-14 flex flex-wrap gap-2">
            {grouped.map((g) => (
              <a
                key={g.key}
                href={`#${g.key}`}
                className="text-xs uppercase tracking-[0.18em] font-medium px-4 py-2 rounded-full border transition hover:bg-white/10"
                style={{
                  borderColor: `${g.meta.couleur}66`,
                  color: g.meta.couleur,
                }}
              >
                {g.meta.label}{' '}
                <span className="ml-1 opacity-60">·&nbsp;{g.items.length}</span>
              </a>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== ENGAGEMENT QUALITÉ — QUALIOPI ========== */}
      <QualiopiBanner
        variant="compact"
        eyebrow="Notre engagement"
        title="Toutes nos formations sont éligibles aux financements."
        description="Chaque action portée par C-KIM Formation est conçue dans le cadre du référentiel Qualiopi."
      />

      {/* ========== SECTIONS PAR PARCOURS ========== */}
      {grouped.map((g, gi) => (
        <section
          key={g.key}
          id={g.key}
          className={`py-20 md:py-28 ${gi % 2 === 0 ? 'bg-white' : 'bg-light'} scroll-mt-24`}
        >
          <Container>
            {/* En-tête de parcours */}
            <FadeUp>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14 items-end">
                <div className="lg:col-span-7">
                  <p
                    className="text-xs uppercase tracking-[0.3em] flex items-center gap-3 font-semibold"
                    style={{ color: g.meta.couleur }}
                  >
                    <span className="inline-block w-8 h-[2px]" style={{ backgroundColor: g.meta.couleur }} />
                    Parcours · {g.items.length} formation{g.items.length > 1 ? 's' : ''}
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mt-4 leading-[0.95]">
                    {g.meta.label}.
                  </h2>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-base text-dark/70 leading-relaxed">
                    {g.meta.description}
                  </p>
                </div>
              </div>
            </FadeUp>

            {/* Grille de formations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {g.items.map((f, i) => (
                <FadeUp key={f.slug} delay={i * 0.05}>
                  <FormationCard formation={f} color={g.meta.couleur} />
                </FadeUp>
              ))}
            </div>
          </Container>
        </section>
      ))}

      {/* ========== CTA FINAL ========== */}
      <section className="bg-dark text-white py-24 md:py-28 relative overflow-hidden">
        <div className="absolute -top-32 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 bg-teal-l pointer-events-none" />
        <Container className="relative">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-l mb-4">Sur mesure</p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide leading-[0.95]">
                Vous ne trouvez pas votre <em className="not-italic text-teal-l">besoin</em> ?
              </h2>
              <p className="mt-6 text-muted text-lg">
                Nous concevons des programmes adaptés à votre métier et à votre contexte.
                Devis sous 24h.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink href="/contact" variant="primary">Demander un programme sur mesure</ButtonLink>
                <a
                  href="tel:0662515559"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-white/30 text-white hover:bg-white hover:text-dark transition-all"
                >
                  06 62 51 55 59
                </a>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------------------- */

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div>
      <p className="font-display text-4xl md:text-5xl lg:text-6xl text-teal-l leading-none">{n}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted/80">{label}</p>
    </div>
  );
}

function FormationCard({ formation: f, color }: { formation: Formation; color: string }) {
  return (
    <Link
      href={`/formations/${f.slug}`}
      className="group relative h-full rounded-2xl overflow-hidden bg-white border border-dark/5 hover:shadow-[0_24px_50px_-24px_rgba(10,26,30,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-light overflow-hidden">
        {f.hero.image && (
          <Image
            src={f.hero.image}
            alt={f.hero.alt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/40 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />

        {/* Badge durée flottant */}
        {f.infosPratiques.duree && (
          <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-[0.2em] bg-white/95 backdrop-blur text-dark px-3 py-1.5 rounded-full">
            {f.infosPratiques.duree.replace(/\(.*?\)/g, '').trim()}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-2xl tracking-wide leading-tight">
          {f.titre}
          {f.sousTitre && (
            <span className="block text-sm font-normal text-dark/55 mt-1">{f.sousTitre}</span>
          )}
        </h3>
        <p className="text-sm text-dark/70 leading-relaxed line-clamp-3 mt-4">{f.objectifs}</p>
        <div className="mt-6 pt-4 border-t border-dark/5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-dark/40">
            {f.infosPratiques.modalite || 'Présentiel'}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-1 group-hover:gap-2 transition-all"
            style={{ color }}
          >
            Découvrir
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
