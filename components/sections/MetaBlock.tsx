import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import type { Formation } from '@/lib/types/formation';

type IconKey = 'duree' | 'public' | 'modalite' | 'inscription' | 'recyclage';

const Icon = ({ name }: { name: IconKey }) => {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'duree':
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      );
    case 'public':
      return (
        <svg {...common}><path d="M16 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M21 19v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      );
    case 'modalite':
      return (
        <svg {...common}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
      );
    case 'inscription':
      return (
        <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /></svg>
      );
    case 'recyclage':
      return (
        <svg {...common}><path d="M21 12a9 9 0 1 1-3.5-7.1" /><path d="M21 4v5h-5" /></svg>
      );
  }
};

function InfoCard({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: IconKey;
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <div className="group relative h-full bg-white rounded-3xl border border-dark/5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(10,26,30,0.28)]">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} />
      <div
        className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-2xl opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.14]"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex flex-col h-full p-8 md:p-9">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-7 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}14`, color }}
        >
          <Icon name={icon} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dark/45">{label}</p>
        <p className="mt-3 font-display text-3xl md:text-[2rem] leading-[1.1] tracking-wide text-dark">
          {value}
        </p>
        {hint && (
          <p className="mt-4 pt-4 border-t border-dark/5 text-sm text-dark/60 leading-relaxed">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

const HINTS: Record<IconKey, string> = {
  duree: 'Format intensif, 60 à 80 % de pratique sur le terrain.',
  public: 'Adapté aux profils débutants comme expérimentés.',
  modalite: 'Présentiel sur site ou en centre, à Draguignan ou en région PACA.',
  inscription: 'Prise en charge possible OPCO, CPF ou employeur.',
  recyclage: 'Maintien et actualisation des compétences réglementaires.',
};

export function MetaBlock({ formation, color }: { formation: Formation; color: string }) {
  const i = formation.infosPratiques;
  const items: { icon: IconKey; label: string; value: string }[] = [
    { icon: 'duree', label: 'Durée', value: i.duree },
    { icon: 'public', label: 'Public', value: i.public },
    { icon: 'modalite', label: 'Modalité', value: i.modalite },
    { icon: 'inscription', label: 'Inscription', value: i.inscription },
    ...(i.recyclage ? [{ icon: 'recyclage' as IconKey, label: 'Recyclage', value: i.recyclage }] : []),
  ];

  return (
    <section className="relative bg-light py-24 md:py-32 border-b border-dark/5 overflow-hidden">
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <Container className="relative">
        <FadeUp>
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] flex items-center gap-3" style={{ color }}>
              <span className="inline-block w-8 h-[2px]" style={{ backgroundColor: color }} />
              L&apos;essentiel
            </p>
            <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-5 leading-[0.95]">
              Informations <em className="not-italic" style={{ color }}>pratiques</em>.
            </h2>
            <p className="mt-6 text-lg md:text-xl text-dark/70 leading-relaxed">
              Tout ce qu&apos;il faut savoir avant de vous inscrire : durée, public visé,
              tarif, modalités pédagogiques et calendrier.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <div className="mt-14 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {items.map((it) => (
              <InfoCard
                key={it.label}
                icon={it.icon}
                label={it.label}
                value={it.value}
                hint={HINTS[it.icon]}
                color={color}
              />
            ))}
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
