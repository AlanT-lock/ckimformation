import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { QualiopiBanner } from '@/components/sections/QualiopiBanner';

export const metadata: Metadata = {
  title: 'Financement de formation — OPCO, CPF | C-KIM Formation',
  description:
    'Financez votre formation professionnelle : OPCO (entreprises), CPF (salariés et indépendants), France Travail, Région Sud. C-KIM Formation accompagne le montage de votre dossier.',
};

export default function FinancementPage() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative bg-dark text-white py-32 md:py-40 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
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
                Financement
              </p>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-[0.95]">
                Faites financer<br />
                <em className="not-italic text-teal-l">votre formation.</em>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
                La plupart de nos formations sont éligibles à un dispositif de prise en charge.
                OPCO pour les entreprises, CPF pour les salariés et indépendants, France Travail
                pour les demandeurs d&apos;emploi : nous vous accompagnons dans le montage du dossier.
              </p>
            </div>

            {/* 3 dispositifs en sub-hero */}
            <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-4 lg:border-l lg:border-white/10 lg:pl-8">
              {[
                { l: 'OPCO', d: 'Entreprises' },
                { l: 'CPF', d: 'Particuliers' },
                { l: 'AIF', d: 'France Travail' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-3xl md:text-4xl lg:text-5xl text-teal-l leading-none tracking-[0.05em]">
                    {s.l}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted/80">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ========== INTRO ========== */}
      <section className="bg-white py-20 md:py-24 border-b border-light">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-lg md:text-xl text-dark/80 leading-relaxed">
              <strong className="text-dark">Vous n&apos;avez pas à avancer les frais.</strong> En tant
              qu&apos;organisme certifié Qualiopi (n° d&apos;activité <span className="font-mono">93830858883</span>),
              nous sommes référencés auprès de tous les financeurs de la formation professionnelle.
              Nous gérons la subrogation directement avec eux : votre OPCO ou votre CPF règle C-KIM,
              vous ne sortez rien de votre poche.
            </p>
          </FadeUp>
        </Container>
      </section>

      {/* ========== OPCO ========== */}
      <section id="opco" className="bg-light py-24 md:py-28 scroll-mt-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <FadeUp className="lg:col-span-4">
              <p className="text-xs uppercase tracking-[0.3em] text-teal flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal" />
                Pour les entreprises
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                <em className="not-italic text-teal">OPCO</em><br />
                Opérateur de Compétences.
              </h2>
              <p className="mt-6 text-dark/70 leading-relaxed">
                Chaque entreprise française est rattachée à un OPCO en fonction de sa branche
                professionnelle. C&apos;est lui qui finance la formation continue de vos salariés.
              </p>
            </FadeUp>

            <FadeUp delay={0.1} className="lg:col-span-8 space-y-6">
              <Card title="À qui ça s'adresse ?" color="#1B8FA0">
                <p>
                  À toutes les <strong>entreprises</strong> qui souhaitent former leurs salariés
                  (en CDI, CDD ou en alternance). Les fonds proviennent de la contribution unique
                  à la formation que verse chaque employeur.
                </p>
              </Card>

              <Card title="Comment ça fonctionne ?" color="#1B8FA0">
                <ol className="space-y-3 list-decimal list-inside">
                  <li>
                    <strong>Identification de votre OPCO</strong> selon votre code NAF / convention collective.
                  </li>
                  <li>
                    <strong>Demande de prise en charge</strong> auprès de l&apos;OPCO avant le démarrage de la formation
                    (devis, programme, convention de formation).
                  </li>
                  <li>
                    <strong>Validation</strong> par l&apos;OPCO sous 2 à 4 semaines en moyenne.
                  </li>
                  <li>
                    <strong>Subrogation directe</strong> : C-KIM facture l&apos;OPCO, vous ne faites pas l&apos;avance.
                  </li>
                </ol>
              </Card>

              <Card title="Les principaux OPCO" color="#1B8FA0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ['OPCO EP', 'Entreprises de proximité (artisanat, commerce, services)'],
                    ['AKTO', 'Services à forte intensité de main-d\'œuvre'],
                    ['OPCO 2i', 'Industrie'],
                    ['Constructys', 'Bâtiment et travaux publics'],
                    ['OPCO Mobilités', 'Transport, logistique'],
                    ['OCAPIAT', 'Agriculture, agroalimentaire, pêche'],
                    ['OPCO Santé', 'Sanitaire, social, médico-social'],
                    ['AFDAS', 'Culture, médias, communication'],
                    ['Atlas', 'Assurance, finance, conseil'],
                    ['Uniformation', 'Cohésion sociale'],
                    ['OPCO Commerce', 'Commerce'],
                  ].map(([name, sector]) => (
                    <div key={name} className="py-2 border-b border-dark/5 last:border-0">
                      <p className="font-semibold text-dark">{name}</p>
                      <p className="text-dark/55 text-xs mt-0.5">{sector}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Notre accompagnement" color="#1B8FA0">
                <p>
                  Vous nous communiquez vos coordonnées et la formation choisie : nous identifions
                  votre OPCO, montons le dossier de prise en charge, et gérons toute la facturation
                  jusqu&apos;au remboursement. <strong>Zéro paperasse pour vous.</strong>
                </p>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ========== CPF ========== */}
      <section id="cpf" className="bg-white py-24 md:py-28 scroll-mt-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <FadeUp className="lg:col-span-4">
              <p className="text-xs uppercase tracking-[0.3em] text-orange flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-orange" />
                Pour les particuliers
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                <em className="not-italic text-orange">CPF</em><br />
                Compte Personnel de Formation.
              </h2>
              <p className="mt-6 text-dark/70 leading-relaxed">
                Le CPF est un droit individuel. Chaque salarié et chaque indépendant cumule des
                euros sur son compte tout au long de sa vie active, à utiliser librement.
              </p>
            </FadeUp>

            <FadeUp delay={0.1} className="lg:col-span-8 space-y-6">
              <Card title="À qui ça s'adresse ?" color="#E8692A">
                <p>
                  À toute personne <strong>active de plus de 16 ans</strong> : salariés du privé,
                  agents publics, travailleurs indépendants, demandeurs d&apos;emploi (selon
                  conditions). Le compte se cumule automatiquement chaque année.
                </p>
              </Card>

              <Card title="Combien sur votre compte ?" color="#E8692A">
                <ul className="space-y-2">
                  <li>
                    <strong>500 € par an</strong> pour un salarié à temps plein, plafonné à 5 000 €
                  </li>
                  <li>
                    <strong>800 € par an</strong> pour les salariés non qualifiés, plafonné à 8 000 €
                  </li>
                  <li>
                    <strong>Reste à charge de 100 €</strong> par dossier depuis 2024 (sauf abondement employeur ou France Travail)
                  </li>
                </ul>
              </Card>

              <Card title="Comment l'utiliser ?" color="#E8692A">
                <ol className="space-y-3 list-decimal list-inside">
                  <li>
                    Connectez-vous sur{' '}
                    <a
                      href="https://www.moncompteformation.gouv.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange underline font-medium"
                    >
                      moncompteformation.gouv.fr
                    </a>{' '}
                    avec FranceConnect+.
                  </li>
                  <li>Recherchez la formation C-KIM par son intitulé ou son code RS / RNCP.</li>
                  <li>Sélectionnez la session et envoyez votre demande d&apos;inscription.</li>
                  <li>
                    Validation sous quelques jours, puis convocation envoyée. Le CPF règle C-KIM
                    directement.
                  </li>
                </ol>
              </Card>

              <Card title="Quelles formations sont éligibles ?" color="#E8692A">
                <p>
                  Seules les formations <strong>certifiantes ou diplômantes</strong> inscrites au
                  RNCP ou au Répertoire Spécifique sont éligibles. Côté C-KIM : le titre <strong>FPA
                  (Formateur Professionnel d&apos;Adultes — RNCP37274)</strong>, le <strong>SST</strong>{' '}
                  et son recyclage MAC SST sont éligibles. Pour les autres, demandez-nous.
                </p>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ========== AUTRES DISPOSITIFS ========== */}
      <section className="bg-light py-24 md:py-28">
        <Container>
          <FadeUp>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-teal flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal" />
                Autres dispositifs
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-wide mt-4 leading-[1.05]">
                Et aussi<em className="not-italic text-teal">…</em>
              </h2>
            </div>
          </FadeUp>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                titre: 'France Travail (AIF)',
                couleur: '#1B8FA0',
                public: 'Demandeurs d\'emploi inscrits',
                texte:
                  'L\'Aide Individuelle à la Formation (AIF) finance une formation lorsqu\'elle facilite votre retour à l\'emploi. Demande à formuler avec votre conseiller.',
              },
              {
                titre: 'Région Sud',
                couleur: '#E8692A',
                public: 'Demandeurs d\'emploi PACA',
                texte:
                  'Le Plan régional de formation finance des parcours certifiants pour les demandeurs d\'emploi de Provence-Alpes-Côte d\'Azur.',
              },
              {
                titre: 'Plan de l\'employeur',
                couleur: '#2E9E6A',
                public: 'Salariés',
                texte:
                  'L\'employeur peut prendre directement en charge la formation, sans passer par l\'OPCO, dans le cadre de son plan de développement des compétences.',
              },
            ].map((d, i) => (
              <FadeUp key={d.titre} delay={i * 0.06}>
                <article className="h-full bg-white rounded-2xl border border-dark/5 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ backgroundColor: d.couleur }}
                  />
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-2"
                    style={{ color: d.couleur }}
                  >
                    {d.public}
                  </p>
                  <h3 className="font-display text-2xl tracking-wide leading-tight">{d.titre}</h3>
                  <p className="mt-4 text-sm text-dark/70 leading-relaxed">{d.texte}</p>
                </article>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* ========== COMPARATIF ========== */}
      <section className="bg-white py-24 md:py-28">
        <Container className="max-w-5xl">
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-orange flex items-center justify-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-orange" />
                En un coup d&apos;œil
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-wide mt-4 leading-[1.05]">
                <em className="not-italic text-orange">OPCO</em> ou <em className="not-italic text-orange">CPF</em> ?
              </h2>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
              <ComparTable
                titre="OPCO"
                color="#1B8FA0"
                rows={[
                  ['Public', 'Salariés (CDI, CDD, alternance)'],
                  ['Initiative', 'Employeur'],
                  ['Pris en charge', 'Tout ou partie selon branche'],
                  ['Avance', 'Non — subrogation directe'],
                  ['Démarche', 'C-KIM gère le dossier'],
                  ['Délai', '2 à 4 semaines de validation'],
                ]}
              />
              <ComparTable
                titre="CPF"
                color="#E8692A"
                rows={[
                  ['Public', 'Toute personne active 16+'],
                  ['Initiative', 'Salarié / particulier'],
                  ['Pris en charge', 'Selon solde du compte'],
                  ['Reste à charge', '100 € par dossier (2024)'],
                  ['Démarche', 'Inscription en ligne autonome'],
                  ['Délai', 'Quelques jours'],
                ]}
              />
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ========== ÉTAPES ACCOMPAGNEMENT ========== */}
      <section className="bg-dark text-white py-24 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container className="relative">
          <FadeUp>
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-l flex items-center gap-3">
                <span className="inline-block w-8 h-[2px] bg-teal-l" />
                Notre accompagnement
              </p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-4 leading-[0.95]">
                Vous formez. <em className="not-italic text-teal-l">On gère le reste.</em>
              </h2>
              <p className="mt-6 text-muted text-lg leading-relaxed">
                Pas de paperasse, pas d&apos;avance de frais. Notre équipe administrative monte
                votre dossier de financement de A à Z.
              </p>
            </div>
          </FadeUp>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px mt-14 bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              { n: '01', t: 'Devis & convention', d: 'Nous établissons un devis personnalisé et la convention de formation.' },
              { n: '02', t: 'Identification du financeur', d: 'OPCO, CPF, France Travail, employeur : on identifie le bon dispositif.' },
              { n: '03', t: 'Montage du dossier', d: 'Nous remplissons et déposons le dossier complet pour vous.' },
              { n: '04', t: 'Subrogation', d: 'Le financeur règle C-KIM directement. Vous n\'avancez pas les frais.' },
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

      {/* ========== QUALIOPI — bandeau de réassurance ========== */}
      <QualiopiBanner
        variant="compact"
        eyebrow="Condition d'éligibilité"
        title="Notre certification Qualiopi rend votre formation finançable."
        description="La certification Qualiopi est la condition légale pour qu'une action de formation soit prise en charge par les financeurs publics (OPCO, CPF, Pôle Emploi, État, collectivités). C-KIM Formation la détient pour l'ensemble de son catalogue."
      />

      {/* ========== CTA FINAL ========== */}
      <section className="bg-light py-24 md:py-28">
        <Container>
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-teal mb-4">Étudions votre cas</p>
              <h2 className="font-display text-4xl md:text-6xl tracking-wide leading-[0.95]">
                Quelle prise en charge pour <em className="not-italic text-teal">votre formation</em> ?
              </h2>
              <p className="mt-6 text-dark/70 text-lg">
                Indiquez-nous votre situation et la formation visée. Nous identifions sous 24h
                le dispositif adapté et le reste à charge éventuel.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink href="/contact" variant="primary">Étudier mon financement</ButtonLink>
                <Link
                  href="/formations"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark/30 text-dark hover:bg-dark hover:text-white transition-all"
                >
                  Voir les formations
                </Link>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------------------- */

function Card({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-dark/5 p-7 md:p-8 relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />
      <h3 className="font-display text-xl md:text-2xl tracking-wide" style={{ color }}>
        {title}
      </h3>
      <div className="mt-4 text-dark/75 leading-relaxed text-base space-y-3">{children}</div>
    </div>
  );
}

function ComparTable({
  titre,
  color,
  rows,
}: {
  titre: string;
  color: string;
  rows: [string, string][];
}) {
  return (
    <div className="bg-white rounded-2xl border border-dark/10 overflow-hidden">
      <div className="p-6 border-b border-dark/10" style={{ backgroundColor: `${color}10` }}>
        <h3 className="font-display text-3xl tracking-wide" style={{ color }}>
          {titre}
        </h3>
      </div>
      <dl>
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-dark/5 last:border-0"
          >
            <dt className="text-xs uppercase tracking-[0.18em] text-dark/50 font-semibold col-span-1">
              {k}
            </dt>
            <dd className="col-span-2 text-sm text-dark/85">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
