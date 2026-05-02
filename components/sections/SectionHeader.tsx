import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  titre: string;
  accent?: string;
  description?: string;
  align?: 'left' | 'center';
  invert?: boolean;
}

export function SectionHeader({ eyebrow, titre, accent, description, align = 'left', invert = false }: Props) {
  let titleNode: React.ReactNode = titre;
  if (accent && titre.includes(accent)) {
    const [before, after] = titre.split(accent);
    titleNode = (
      <>
        {before}
        <em className={cn('not-italic', invert ? 'text-teal-l' : 'text-teal')}>{accent}</em>
        {after}
      </>
    );
  }
  return (
    <header className={cn('mb-12', align === 'center' && 'text-center')}>
      {eyebrow && (
        <p className={cn('text-xs uppercase tracking-[0.3em] mb-4', invert ? 'text-teal-l' : 'text-orange')}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn('font-display text-4xl md:text-6xl tracking-wide leading-none', invert ? 'text-white' : 'text-dark')}>
        {titleNode}
      </h2>
      {description && (
        <p className={cn('mt-6 max-w-2xl text-base md:text-lg leading-relaxed', invert ? 'text-muted' : 'text-dark/70')}>
          {description}
        </p>
      )}
    </header>
  );
}
