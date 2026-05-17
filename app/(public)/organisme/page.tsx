import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { StatCounter } from '@/components/motion/StatCounter';
import { Marquee } from '@/components/motion/Marquee';
import { getFormationBySlug } from '@/lib/db/formations';
import { getParcoursMeta } from '@/lib/parcours';
import { JsonLd } from '@/components/seo/JsonLd';
import { QualiopiBanner } from '@/components/sections/QualiopiBanner';

export const metadata: Metadata = {
  title: "L'organisme — C-KIM Formation, Draguignan PACA",
  description:
    'Centre de formation certifié Qualiopi en Provence-Alpes-Côte d\'Azur. Formateurs INRS, AFNOR, FPA. 60 à 80 % de pratique, intervention sur site, sécurité au travail et développement humain.',
};

export const revalidate = 600;

const HIGHLIGHTED_SLUGS = [
  'sst-initiale',
  'incendie-extincteur-evacuation',
  'gestes-et-postures',
  'duerp-formation-accompagnement',
  'hygiene-alimentaire-haccp',
];

export default async function OrganismePage() {
  const highlighted = (
    await Promise.all(HIGHLIGHTED_SLUGS.map((s) => getFormationBySlug(s)))
  ).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <>
      {/* ========== 1. HERO ========== */}
      <section className="relative bg-dark text-white py-32 md:py-40 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />

        {/* Backdrop subtil — radial gradient cohérent avec la HomePage */}
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 95% 15%, rgba(27,143,160,.22), transparent 55%), radial-gradient(ellipse 60% 70% at -10% 100%, rgba(232,105,42,.12), transparent 50%)',
          }}
        />

        <Container className="relative">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-6 flex items-center gap-3">
            <span className="inline-block w-8 h-[2px] bg-teal-l" />
            L&apos;organisme
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-[0.95] max-w-4xl">
            Former, outiller,<br />
            <em className="not-italic text-teal-l">protéger.</em>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
            C-KIM Formation est un centre indépendant certifié Qualiopi, basé à Draguignan.
            Notre mission : transmettre les compétences qui sauvent et qui font progresser,
            directement sur le terrain de vos équipes.
          </p>

          {/* Tags certifications */}
          <div className="mt-10 flex flex-wrap gap-2">
            {['Qualiopi', 'INRS', 'AFNOR', 'FPA'].map((c) => (
              <span
                key={c}
                className="text-xs uppercase tracking-[0.22em] font-medium px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white/85"
              >
                {c}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== 2. CHIFFRES CLÉS ========== */}
      <section className="bg-white py-20 md:py-24 border-y border-light">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 text-center md:text-left">
            {[
              { n: 150, suffix: '+', label: 'Stagiaires formés depuis 2025', animate: true },
              { n: 17, suffix: '', label: 'Formations au catalogue', animate: true },
              { n: 80, suffix: '%', label: 'de pratique en moyenne', animate: true },
              { n: 24, suffix: 'h', label: 'pour répondre à votre demande', animate: true },
            ].map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.07}>
                <div>
                  <p className="font-display text-5xl md:text-6xl text-teal leading-none">
                    <StatCounter to={s.n} suffix={s.suffix} />
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-dark/55">{s.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== 3. MANIFESTE ========== */}
      <section className="bg-light py-24 md:py-32">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <FadeUp className="lg:col-span-4">
              <p className="text-xs uppercase tracking-[0.3em] text-teal flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal" />
                Notre raison d&apos;être
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-wide mt-5 leading-[0.95]">
                Apprendre <em className="not-italic text-teal">par</em> la pratique.
              </h2>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:col-span-8 space-y-5 text-dark/80 leading-relaxed text-lg">
              <p>
                La sécurité au travail ne se transmet pas par diapositives. Elle se construit
                par la mise en situation, la répétition, l&apos;échange et l&apos;ancrage.
                C&apos;est cette conviction qui guide chacune de nos sessions.
              </p>
              <p>
                Nous formons des Sauveteurs Secouristes du Travail, des équipiers d&apos;évacuation,
                des formateurs internes, des managers QSE — toujours avec un objectif :
                qu&apos;à l&apos;issue de la formation, les acquis soient <strong className="text-dark">utilisables dès le lendemain</strong>.
              </p>
              <p>
                Implantés dans le Var, nous intervenons sur tout le territoire PACA, sur votre
                site, avec votre matériel quand c&apos;est possible, dans votre contexte métier réel.
              </p>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ========== 4. ENGAGEMENTS ========== */}
      <section className="bg-white py-24 md:py-28">
        <Container>
          <FadeUp>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-orange flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-orange" />
                Nos engagements
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                Quatre <em className="not-italic text-orange">promesses</em> tenues.
              </h2>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {[
              {
                titre: 'Qualité certifiée',
                couleur: '#1B8FA0',
                texte:
                  'Certification Qualiopi audit AFNOR. Référencement OPCO et France Travail. Réponse aux marchés PACA.',
              },
              {
                titre: 'Pratique terrain',
                couleur: '#E8692A',
                texte:
                  '60 à 80 % du temps en mises en situation. Matériel professionnel : extincteurs réels, mannequins INRS, EPI, plateau technique.',
              },
              {
                titre: 'Sur votre site',
                couleur: '#2E9E6A',
                texte:
                  'Nous nous déplaçons partout en PACA. Vos locaux, votre équipe, votre contexte. Le déplacement est inclus dans le tarif.',
              },
              {
                titre: 'Pédagogie inclusive',
                couleur: '#6A4ABE',
                texte:
                  'Accessibilité aux personnes en situation de handicap, accompagnement adapté, conseil dossier OPCO/CPF assuré.',
              },
            ].map((e, i) => (
              <FadeUp key={e.titre} delay={i * 0.06}>
                <article className="group relative h-full bg-white border border-light rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ backgroundColor: e.couleur }}
                  />
                  <div
                    className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.18]"
                    style={{ backgroundColor: e.couleur }}
                  />
                  <h3
                    className="font-display text-2xl tracking-wide leading-tight"
                    style={{ color: e.couleur }}
                  >
                    {e.titre}
                  </h3>
                  <p className="mt-4 text-sm text-dark/70 leading-relaxed">{e.texte}</p>
                </article>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== 5. MÉTHODE ========== */}
      <section className="bg-dark text-white py-24 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container className="relative">
          <FadeUp>
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-l flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal-l" />
                La méthode C-KIM
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                Quatre étapes pour un <em className="not-italic text-teal-l">ancrage durable</em>.
              </h2>
              <p className="mt-6 text-muted text-lg leading-relaxed">
                Chaque session suit le même fil conducteur, du diagnostic terrain au suivi
                à 6 mois. Une mécanique éprouvée, adaptée à chaque secteur.
              </p>
            </div>
          </FadeUp>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px mt-14 bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              {
                n: '01',
                t: 'Diagnostic',
                d: 'Audit de vos risques, contraintes métier, besoins de conformité. Personnalisation de chaque session.',
              },
              {
                n: '02',
                t: 'Pratique immersive',
                d: '60 à 80 % du temps en situation réelle. Matériel professionnel et scénarios issus de votre activité.',
              },
              {
                n: '03',
                t: 'Évaluation',
                d: 'Validation des acquis par mises en situation, QCM, et délivrance des attestations conformes.',
              },
              {
                n: '04',
                t: 'Suivi',
                d: 'Enquête de satisfaction à chaud + évaluation à froid 3 à 6 mois après pour mesurer l\'impact.',
              },
            ].map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.08}>
                <div className="bg-dark p-8 md:p-9 h-full flex flex-col">
                  <p className="font-display text-6xl text-teal-l/70 leading-none">{step.n}</p>
                  <h3 className="font-display text-2xl mt-5 tracking-wide">{step.t}</h3>
                  <p className="mt-3 text-sm text-muted leading-relaxed">{step.d}</p>
                </div>
              </FadeUp>
            ))}
          </ol>
        </Container>
      </section>

      {/* ========== 6. SPÉCIALITÉS PHARES (5 formations highlighted) ========== */}
      <section className="bg-light py-24 md:py-28">
        <Container>
          <FadeUp>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-teal flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal" />
                Nos spécialités
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                Cinq <em className="not-italic text-teal">expertises</em> phares.
              </h2>
              <p className="mt-6 text-dark/70 text-lg leading-relaxed">
                Voici les formations qui composent l&apos;essentiel de notre activité.
                Pour chacune, des années de retours terrain et une pédagogie affinée.
              </p>
            </div>
          </FadeUp>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlighted.map((f, i) => {
              const meta = getParcoursMeta(f.parcours);
              const isFirst = i === 0;
              return (
                <FadeUp key={f.slug} delay={i * 0.06}>
                  <Link
                    href={`/formations/${f.slug}`}
                    className={`group relative block h-full rounded-2xl overflow-hidden bg-white border border-dark/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                      isFirst ? 'lg:row-span-2' : ''
                    }`}
                  >
                    <div className={`relative ${isFirst ? 'aspect-[4/5]' : 'aspect-[16/10]'} bg-light overflow-hidden`}>
                      {f.hero.image && (
                        <Image
                          src={f.hero.image}
                          alt={f.hero.alt}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/30 to-transparent" />
                      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: meta.couleur }} />
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <p
                          className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2"
                          style={{ color: meta.couleur }}
                        >
                          {meta.label}
                        </p>
                        <h3 className="font-display text-2xl md:text-3xl tracking-wide text-white leading-tight">
                          {f.titre}
                          {f.sousTitre && (
                            <span className="block text-base md:text-lg text-white/70 mt-1">
                              {f.sousTitre}
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col">
                      <p className="text-sm text-dark/70 leading-relaxed line-clamp-3">
                        {f.objectifs}
                      </p>
                      <div className="mt-4 pt-4 border-t border-dark/5 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-dark/50">
                          {f.infosPratiques.duree}
                        </span>
                        <span
                          className="text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                          style={{ color: meta.couleur }}
                        >
                          Découvrir
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              );
            })}
          </div>

          <FadeUp delay={0.3}>
            <div className="mt-12 text-center">
              <ButtonLink href="/formations" variant="dark">
                Voir tout le catalogue (17 formations)
              </ButtonLink>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ========== 7. CONFORMITÉ QUALIOPI ========== */}
      <section className="bg-white py-24 md:py-28">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeUp>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-orange flex items-center gap-3">
                  <span className="inline-block w-8 h-[2px] bg-orange" />
                  Conformité réglementaire
                </p>
                <h2 className="font-display text-4xl md:text-5xl tracking-wide mt-4 leading-[1.05]">
                  Certification <em className="not-italic text-orange">Qualiopi</em>.
                </h2>
                <p className="mt-6 text-dark/75 leading-relaxed">
                  C-KIM Formation est référencé Qualiopi (audit AFNOR) au titre de la catégorie
                  d&apos;actions de formation. Cette certification est obligatoire depuis 2022 pour
                  toute prise en charge OPCO, CPF ou France Travail.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Référencement OPCO (toutes branches)',
                    'Éligible CPF — Compte Personnel de Formation',
                    'Éligible France Travail — AIF, Plan départemental',
                    'Subrogation directe à l\'OPCO (zéro avance pour vous)',
                    'Accompagnement complet du dossier administratif',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-dark/80">
                      <span className="text-orange mt-1" aria-hidden>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="bg-light rounded-3xl p-8 md:p-10 border border-dark/5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-10 bg-orange" />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-2">N° d&apos;activité</p>
                  <p className="font-display text-3xl md:text-4xl tracking-[0.05em] text-dark">93830858883</p>
                  <p className="mt-2 text-xs text-dark/50">Préfet de région Provence-Alpes-Côte d&apos;Azur</p>

                  <div className="mt-8 pt-8 border-t border-dark/10">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-2">SIRET</p>
                    <p className="font-display text-2xl md:text-3xl tracking-[0.05em] text-dark">
                      991 764 580 00015
                    </p>
                  </div>

                  <div className="mt-8 pt-8 border-t border-dark/10">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-dark/40 mb-2">Statut TVA</p>
                    <p className="text-base text-dark/85">
                      TVA non applicable<br />
                      <span className="text-sm text-dark/60">Article 261-4-4° du CGI</span>
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ========== 8. ZONE D'INTERVENTION ========== */}
      <section className="bg-light py-24 md:py-28">
        <Container className="max-w-5xl">
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-teal flex items-center justify-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal" />
                Zone d&apos;intervention
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                Toute la <em className="not-italic text-teal">région PACA</em>.
              </h2>
              <p className="mt-6 text-dark/70 text-lg leading-relaxed">
                Basés à Draguignan dans le Var, nous intervenons partout en Provence-Alpes-Côte
                d&apos;Azur. Le déplacement est <strong>inclus</strong> dans tous nos tarifs.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="mt-12 bg-white rounded-2xl border border-dark/5 p-8 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-4 text-center">
                {[
                  'Var (83)',
                  'Bouches-du-Rhône (13)',
                  'Alpes-Maritimes (06)',
                  'Vaucluse (84)',
                  'Alpes-de-Haute-Provence (04)',
                  'Hautes-Alpes (05)',
                ].map((d) => (
                  <div key={d}>
                    <p className="font-display text-base md:text-lg tracking-[0.08em] text-dark leading-tight">
                      {d}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-dark/10 text-center">
                <p className="text-sm text-dark/65 leading-relaxed">
                  Siège : <strong>391 avenue du Maréchal Koenig — 83300 Draguignan</strong>
                </p>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ========== 9. NOS FORMATEURS ========== */}
      <section className="bg-white py-24 md:py-28">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <FadeUp className="lg:col-span-5">
              <p className="text-xs uppercase tracking-[0.3em] text-orange flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-orange" />
                Nos formateurs
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-wide mt-4 leading-[1.05]">
                Du <em className="not-italic text-orange">terrain</em>, pas de la théorie.
              </h2>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:col-span-7">
              <p className="text-dark/80 leading-relaxed text-lg">
                Nos formateurs cumulent au minimum <strong>cinq années d&apos;expérience opérationnelle</strong> dans
                leur domaine d&apos;expertise avant d&apos;intervenir. Ils sont titulaires des
                certifications requises pour chaque référentiel : INRS pour le secourisme,
                AFNOR pour la qualité, FPA (Titre Professionnel de Formateur Professionnel
                d&apos;Adultes) pour la pédagogie.
              </p>
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { l: 'INRS', d: 'Secourisme' },
                  { l: 'AFNOR', d: 'Qualité' },
                  { l: 'FPA', d: 'Pédagogie' },
                  { l: 'NF C18-510', d: 'Habilitations électriques' },
                  { l: 'APSAD R6', d: 'Incendie' },
                  { l: 'HACCP', d: 'Hygiène alimentaire' },
                ].map((c) => (
                  <li
                    key={c.l}
                    className="flex items-center gap-3 bg-light rounded-lg p-3 border border-dark/5"
                  >
                    <span className="font-display text-lg tracking-[0.08em] text-teal">{c.l}</span>
                    <span className="text-xs text-dark/55">{c.d}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ========== 10. MARQUEE PARTENAIRES ========== */}
      <section className="bg-light py-12 border-y border-dark/5">
        <Marquee speed={40}>
          {[
            'QUALIOPI', '·', 'INRS', '·', 'AFNOR', '·', 'FPA', '·',
            'CODE DU TRAVAIL', '·', 'APSAD', '·', 'NF C18-510', '·',
            'OPCO', '·', 'CPF', '·', 'FRANCE TRAVAIL', '·',
          ].map((label, i) => (
            <span key={i} className="font-display text-2xl md:text-3xl tracking-[0.2em] text-dark/55">
              {label}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ========== 10b. ENGAGEMENT QUALITÉ — QUALIOPI ========== */}
      <QualiopiBanner
        variant="feature"
        tone="light"
        eyebrow="Référentiel national qualité"
        title="Une exigence qualité auditée chaque année."
        description="C-KIM Formation est certifié Qualiopi pour la catégorie « Actions de formation ». Cette certification, délivrée après un audit indépendant, atteste de la conformité de nos processus au Référentiel National Qualité — de l'analyse du besoin jusqu'au suivi post-formation."
      />

      {/* ========== 11. CTA FINAL ========== */}
      <section className="bg-dark text-white py-24 md:py-28 relative overflow-hidden">
        <div className="absolute -bottom-32 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 bg-teal-l pointer-events-none" />
        <Container className="relative">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-l mb-4">Prêts à former vos équipes ?</p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide leading-[0.95]">
                Construisons votre <em className="not-italic text-teal-l">programme</em> sur mesure.
              </h2>
              <p className="mt-6 text-muted text-lg">Devis sous 24h pour toute demande.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink href="/contact" variant="primary">Demander un devis</ButtonLink>
                <ButtonLink href="/formations" variant="secondary">Voir le catalogue</ButtonLink>
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

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'C-KIM Formation',
          alternateName: 'C-KIM Formation — Centre de formation',
          description:
            'Centre de formation certifié Qualiopi spécialisé en sécurité au travail, prévention des risques professionnels et développement humain.',
          url: 'https://ckimformation.fr',
          telephone: '+33-6-62-51-55-59',
          email: 'contact@ckimformation.fr',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '391 avenue du Maréchal Koenig',
            addressLocality: 'Draguignan',
            postalCode: '83300',
            addressRegion: 'Provence-Alpes-Côte d\'Azur',
            addressCountry: 'FR',
          },
          areaServed: {
            '@type': 'AdministrativeArea',
            name: 'Provence-Alpes-Côte d\'Azur',
          },
          hasCredential: ['Qualiopi', 'INRS', 'AFNOR', 'FPA'],
        }}
      />
    </>
  );
}
