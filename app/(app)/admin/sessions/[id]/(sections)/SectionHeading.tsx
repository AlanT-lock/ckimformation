import type { ReactNode } from 'react';

/** Titre d'une sous-page de session (titre, texte d'aide, action éventuelle à droite). */
export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 className="font-display text-2xl tracking-wide">{title}</h2>
        {description && <p className="text-xs text-dark/60 mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Encart affiché quand une section n'a encore rien à montrer. */
export function EmptySection({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">{children}</div>
  );
}
