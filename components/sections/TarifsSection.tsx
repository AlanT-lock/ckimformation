import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import type { TarifTier } from '@/lib/types/formation';

interface Props {
  tarifs: TarifTier[];
  color: string;
}

const FR_NUMBER = new Intl.NumberFormat('fr-FR');

function formatPrice(t: TarifTier): { main: string; sub: string | null } {
  if (t.price === null || t.price === undefined) {
    return { main: t.note ?? 'Sur devis', sub: null };
  }
  return {
    main: `${FR_NUMBER.format(t.price)} €`,
    sub: t.unit ?? 'HT',
  };
}

export function TarifsSection({ tarifs, color }: Props) {
  // Aucun tarif → CTA "sur devis"
  if (!tarifs || tarifs.length === 0) {
    return (
      <section className="bg-white py-20 md:py-24 border-t border-dark/5">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em] flex items-center gap-3" style={{ color }}>
              <span className="inline-block w-8 h-[2px]" style={{ backgroundColor: color }} />
              Tarif
            </p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-4 leading-[1.05]">
              Cette formation est <em className="not-italic" style={{ color }}>sur devis</em>.
            </h2>
            <p className="mt-5 text-dark/70 leading-relaxed max-w-2xl">
              Selon le format souhaité (intra-entreprise, individuel ou collectif), nous établissons une proposition personnalisée
              adaptée à votre besoin et à votre budget.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider transition hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                Demander un devis →
              </Link>
              <a
                href="tel:0662515559"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider border border-dark/20 hover:border-dark transition"
              >
                06 62 51 55 59
              </a>
            </div>
          </FadeUp>
        </Container>
      </section>
    );
  }

  // Regroupement par "group" pour les formations multi-modes (ex. Incendie 2h / 5h)
  const groups = new Map<string | null, TarifTier[]>();
  for (const t of tarifs) {
    const key = t.group ?? null;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }

  const hasMultipleGroups = groups.size > 1;

  return (
    <section className="relative bg-white py-20 md:py-28 border-t border-dark/5 overflow-hidden">
      <div
        className="absolute -top-32 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.05] pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <Container className="relative max-w-6xl">
        <FadeUp>
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] flex items-center gap-3" style={{ color }}>
              <span className="inline-block w-8 h-[2px]" style={{ backgroundColor: color }} />
              Tarifs 2026
            </p>
            <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-5 leading-[0.95]">
              Choisissez votre <em className="not-italic" style={{ color }}>formule</em>.
            </h2>
            <p className="mt-5 text-dark/70 leading-relaxed">
              Tarifs dégressifs selon l&apos;effectif. Plus le groupe est grand, plus le coût par stagiaire baisse.
            </p>
          </div>
        </FadeUp>

        <div className="mt-12 md:mt-16 space-y-12">
          {Array.from(groups.entries()).map(([groupName, tiers], gi) => (
            <FadeUp key={groupName ?? 'default'} delay={gi * 0.06}>
              {hasMultipleGroups && groupName && (
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-7 w-1 rounded" style={{ backgroundColor: color }} />
                  <h3 className="font-display text-2xl md:text-3xl tracking-wide">{groupName}</h3>
                </div>
              )}
              <div className={`grid gap-5 ${tiers.length === 1 ? 'grid-cols-1 max-w-md' : tiers.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {tiers.map((t, i) => (
                  <TarifCard key={`${groupName}-${i}`} tier={t} color={color} />
                ))}
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Note légale + inclus */}
        <FadeUp delay={0.2}>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-light rounded-2xl p-6 border border-dark/5">
              <p className="text-xs uppercase tracking-[0.25em] text-dark/50 mb-2">TVA</p>
              <p className="text-sm text-dark/80 leading-relaxed">
                Tarifs <strong>HT</strong>. TVA non applicable — Art. 261-4-4° du CGI.
              </p>
            </div>
            <div className="bg-light rounded-2xl p-6 border border-dark/5">
              <p className="text-xs uppercase tracking-[0.25em] text-dark/50 mb-2">Inclus dans le tarif</p>
              <p className="text-sm text-dark/80 leading-relaxed">
                Déplacement sur site, matériel pédagogique, attestations, certification Qualiopi.
              </p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}

function TarifCard({ tier, color }: { tier: TarifTier; color: string }) {
  const { main, sub } = formatPrice(tier);
  const isSurDevis = tier.price === null || tier.price === undefined;

  return (
    <div className="group relative rounded-3xl border border-dark/10 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(10,26,30,0.18)]">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} />

      <div className="relative p-7 md:p-8 flex flex-col h-full">
        {/* Label */}
        <p className="text-xs uppercase tracking-[0.22em] font-semibold text-dark/50">
          {tier.label}
        </p>

        {/* Prix */}
        <div className="mt-5 flex items-baseline gap-2">
          <span
            className="font-display tracking-tight leading-none"
            style={{ fontSize: isSurDevis ? '2.1rem' : '3rem' }}
          >
            {main}
          </span>
          {sub && (
            <span className="text-sm font-medium text-dark/50">{sub}</span>
          )}
        </div>

        {/* Pour qui */}
        {tier.pour && (
          <p className="mt-2 text-sm text-dark/60">par {tier.pour}</p>
        )}

        {/* Note */}
        {tier.note && (
          <p className="mt-5 pt-5 border-t border-dark/10 text-sm leading-relaxed text-dark/65">
            {tier.note}
          </p>
        )}
      </div>
    </div>
  );
}
