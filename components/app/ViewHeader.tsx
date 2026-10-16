import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

/**
 * En-tête d'une vue réutilisable : en-tête de page quand la vue est affichée
 * seule, en-tête de section quand elle est imbriquée (ex. sous les onglets
 * d'une formation, qui portent déjà le titre de la page).
 */
export function ViewHeader({
  nested,
  eyebrow,
  title,
  description,
  actions,
}: {
  nested: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  if (!nested) return <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />;
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-teal">{eyebrow}</p>}
        <h2 className="font-display text-2xl md:text-3xl tracking-wide mt-1 leading-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-dark/70">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
