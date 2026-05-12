import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';

type Variant = 'feature' | 'compact';
type Tone = 'light' | 'dark';

interface Props {
  variant?: Variant;
  tone?: Tone;
  /** Eyebrow (sur-titre) personnalisé — sinon défaut "Notre engagement qualité". */
  eyebrow?: string;
  /** Titre principal personnalisé pour adapter le ton à la page. */
  title?: string;
  /** Texte descriptif personnalisé. */
  description?: string;
}

const PILLARS = [
  {
    title: 'Processus certifié',
    body: "Pédagogie auditée selon le RNQ — analyse des besoins, conception, animation, évaluation et amélioration continue.",
  },
  {
    title: 'Formateurs experts',
    body: 'Certifiés INRS, AFNOR, FPA. Une exigence terrain documentée pour chaque session, sur site client.',
  },
  {
    title: 'Satisfaction stagiaires',
    body: 'Évaluation à chaud et à froid, suivi qualité systématique, plan d\'action sur chaque retour identifié.',
  },
];

export function QualiopiBanner({
  variant = 'feature',
  tone = 'light',
  eyebrow = 'Notre engagement qualité',
  title = "La qualité au cœur de chaque formation.",
  description = "C-KIM Formation est certifié Qualiopi — la marque de garantie de la qualité des processus mis en œuvre par les prestataires d'actions concourant au développement des compétences. Une exigence portée par notre équipe à chaque étape, de la conception au suivi post-formation.",
}: Props) {
  if (variant === 'compact') {
    // Bandeau compact — pour les pages de formation et autres pages secondaires.
    const isDark = tone === 'dark';
    return (
      <section
        className={`py-10 border-y ${
          isDark
            ? 'bg-dark text-white border-white/10'
            : 'bg-light border-dark/5'
        }`}
        aria-label="Certification Qualiopi"
      >
        <Container>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="shrink-0 bg-white rounded-md p-3 shadow-sm">
              <Image
                src="/logo-qualiopi.png"
                alt="Logo Qualiopi — Processus certifié — République française"
                width={633}
                height={338}
                className="h-16 w-auto md:h-20"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p
                className={`text-xs uppercase tracking-[0.3em] mb-2 ${
                  isDark ? 'text-teal-l' : 'text-teal'
                }`}
              >
                Certification qualité
              </p>
              <h3 className="font-display text-2xl md:text-3xl tracking-wide leading-tight">
                Certifié <em className={`not-italic ${isDark ? 'text-teal-l' : 'text-teal'}`}>Qualiopi</em>{' '}
                — Catégorie « Actions de formation »
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed max-w-2xl ${
                  isDark ? 'text-muted' : 'text-dark/70'
                }`}
              >
                Une démarche qualité auditée, des processus pédagogiques rigoureux,
                un suivi systématique des stagiaires. La garantie d&apos;une formation
                éligible aux financements publics (OPCO, CPF, Pôle Emploi, plan de
                développement des compétences).
              </p>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // Variant "feature" — bloc complet avec 3 piliers.
  const isDark = tone === 'dark';
  return (
    <section
      className={`relative py-20 md:py-24 overflow-hidden ${
        isDark ? 'bg-dark text-white' : 'bg-white'
      }`}
      aria-label="Engagement qualité Qualiopi"
    >
      {isDark && (
        <>
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 80% 60% at 95% 15%, rgba(27,143,160,.22), transparent 55%), radial-gradient(ellipse 60% 70% at -10% 100%, rgba(232,105,42,.12), transparent 50%)',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        </>
      )}

      <Container className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <FadeUp className="lg:col-span-4">
            <div
              className={`inline-flex items-center justify-center rounded-lg p-5 shadow-sm ${
                isDark ? 'bg-white' : 'bg-light'
              }`}
            >
              <Image
                src="/logo-qualiopi.png"
                alt="Logo Qualiopi — Processus certifié — République française"
                width={633}
                height={338}
                className="h-24 md:h-28 w-auto"
              />
            </div>
          </FadeUp>

          <div className="lg:col-span-8">
            <FadeUp>
              <p
                className={`text-xs uppercase tracking-[0.3em] mb-4 ${
                  isDark ? 'text-teal-l' : 'text-teal'
                }`}
              >
                {eyebrow}
              </p>
              <h2 className="font-display text-3xl md:text-5xl tracking-wide leading-[1.05]">
                {title.split('qualité').map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <em
                        className={`not-italic ${isDark ? 'text-teal-l' : 'text-teal'}`}
                      >
                        qualité
                      </em>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </h2>
              <p
                className={`mt-5 text-base md:text-lg leading-relaxed max-w-2xl ${
                  isDark ? 'text-muted' : 'text-dark/75'
                }`}
              >
                {description}
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-10">
              {PILLARS.map((p, i) => (
                <FadeUp key={p.title} delay={0.1 + i * 0.06}>
                  <div
                    className={`relative pl-4 border-l-2 ${
                      isDark ? 'border-teal-l/60' : 'border-teal'
                    }`}
                  >
                    <p
                      className={`font-display text-lg md:text-xl tracking-wide leading-tight ${
                        isDark ? 'text-white' : 'text-dark'
                      }`}
                    >
                      {p.title}
                    </p>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        isDark ? 'text-muted' : 'text-dark/65'
                      }`}
                    >
                      {p.body}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>

            <FadeUp delay={0.35}>
              <p
                className={`mt-8 text-xs ${
                  isDark ? 'text-muted' : 'text-dark/50'
                }`}
              >
                Certifié au titre de la catégorie d&apos;actions :{' '}
                <strong className={isDark ? 'text-white/90' : 'text-dark/80'}>
                  Actions de formation
                </strong>
                .
              </p>
            </FadeUp>
          </div>
        </div>
      </Container>
    </section>
  );
}
