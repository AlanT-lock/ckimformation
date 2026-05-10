import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-dark/10">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-teal">{eyebrow}</p>}
        <h1 className="font-display text-3xl md:text-4xl tracking-wide mt-2 leading-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-dark/70">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
