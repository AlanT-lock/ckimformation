import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';

export function LegalDocHero({
  eyebrow,
  title,
  subtitle,
  meta,
  pdfHref,
  pdfLabel = 'Télécharger le PDF',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: string;
  pdfHref: string;
  pdfLabel?: string;
}) {
  return (
    <section className="relative bg-dark text-white py-20 md:py-28 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 95% 15%, rgba(27,143,160,.22), transparent 55%), radial-gradient(ellipse 60% 70% at -10% 100%, rgba(232,105,42,.12), transparent 50%)',
        }}
      />
      <Container className="relative max-w-4xl">
        <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-6 flex items-center gap-3">
          <span className="inline-block w-8 h-[2px] bg-teal-l" />
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-6 text-lg text-muted max-w-2xl leading-relaxed">{subtitle}</p>}
        {meta && <p className="mt-4 text-sm text-white/50">{meta}</p>}
        <a
          href={pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider transition-all duration-200 bg-orange text-white hover:bg-orange-l"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {pdfLabel}
        </a>
      </Container>
    </section>
  );
}

export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white py-16 md:py-20">
      <Container className="max-w-4xl">
        <div className="text-dark/80 leading-relaxed space-y-10">{children}</div>
      </Container>
    </section>
  );
}

export function LegalArticle({
  number,
  title,
  children,
}: {
  number?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl tracking-wide text-dark pb-3 border-b border-dark/10">
        {number && <span className="text-teal mr-3">{number}</span>}
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function LegalCallout({
  title,
  tone = 'teal',
  children,
}: {
  title?: string;
  tone?: 'teal' | 'orange';
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-l-4 rounded-r-lg p-5 space-y-2',
        tone === 'teal' ? 'border-teal bg-teal/5' : 'border-orange bg-orange/5',
      )}
    >
      {title && <p className="font-semibold text-dark">{title}</p>}
      {children}
    </div>
  );
}

export function LegalList({ items, ordered = false }: { items: React.ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn('space-y-1.5 pl-5', ordered ? 'list-decimal' : 'list-disc marker:text-teal')}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

export function LegalTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-dark/10">
      <table className="w-full min-w-[560px] text-sm text-left">
        <thead className="bg-light">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-dark/60">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-dark/10 align-top">
              {row.map((cell, j) => (
                <td key={j} className={cn('px-4 py-3', j === 0 && 'font-semibold text-dark')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
