import Link from 'next/link';
import { ButtonLink } from '@/components/app/Button';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient } from '@/lib/supabase/server';
import { SessionsFilters } from './SessionsFilters';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon',  className: 'bg-dark/10 text-dark/70' },
  published: { label: 'Publiée',    className: 'bg-teal/10 text-teal' },
  cancelled: { label: 'Annulée',    className: 'bg-orange/10 text-orange' },
  completed: { label: 'Terminée',   className: 'bg-dark/5 text-dark/50' },
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  statut: string;
  created_at: string;
  formation_id: string;
  formation: { slug: string; titre: string } | { slug: string; titre: string }[] | null;
  formateur: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  creneaux: { date: string; ordre: number }[] | null;
}

interface PageProps {
  searchParams: Promise<{ statut?: string; formation?: string }>;
}

export default async function AdminSessionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statutFilter = sp.statut ?? '';
  const formationFilter = sp.formation ?? '';

  const supabase = await createClient();

  const [{ data: sessions }, { data: formationsList }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id, statut, created_at, formation_id,
        formation:formations(slug, titre),
        formateur:profiles!sessions_formateur_id_fkey(full_name, email),
        creneaux:session_creneaux(date, ordre)
      `),
    supabase.from('formations').select('id, titre').order('titre'),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const allRows = (sessions ?? []) as SessionRow[];

  // Filtres
  let rows = allRows;
  if (statutFilter) rows = rows.filter((s) => s.statut === statutFilter);
  if (formationFilter) rows = rows.filter((s) => s.formation_id === formationFilter);

  // Tri par date du premier créneau (puis fallback created_at desc)
  function firstDate(s: SessionRow): string {
    const cre = (s.creneaux ?? []).slice().sort((a, b) => a.ordre - b.ordre);
    return cre[0]?.date ?? '';
  }

  // Split prochaines / terminées : terminée si statut='completed'/'cancelled' OU dernier créneau passé
  const upcoming: SessionRow[] = [];
  const past: SessionRow[] = [];
  for (const s of rows) {
    const cre = (s.creneaux ?? []).slice().sort((a, b) => a.ordre - b.ordre);
    const last = cre[cre.length - 1]?.date;
    const isPast = s.statut === 'completed' || s.statut === 'cancelled' || (last && last < today);
    (isPast ? past : upcoming).push(s);
  }

  // Tri : prochaines par date croissante (la plus proche en premier),
  // terminées par date décroissante (la plus récente en premier).
  upcoming.sort((a, b) => {
    const da = firstDate(a) || '9999-12-31';
    const db = firstDate(b) || '9999-12-31';
    return da.localeCompare(db);
  });
  past.sort((a, b) => {
    const da = firstDate(a) || '0000-01-01';
    const db = firstDate(b) || '0000-01-01';
    return db.localeCompare(da);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Sessions"
        description="Toutes les sessions de formation. Créez, éditez et publiez."
        actions={<ButtonLink href="/admin/sessions/nouvelle">+ Nouvelle session</ButtonLink>}
      />

      <SessionsFilters
        statut={statutFilter}
        formationId={formationFilter}
        formations={(formationsList ?? []) as { id: string; titre: string }[]}
      />

      <SessionsSection title="Prochaines sessions" rows={upcoming} emptyText="Aucune session à venir pour le moment." />
      <SessionsSection title="Sessions terminées" rows={past} emptyText="Aucune session terminée." muted />
    </div>
  );
}

function SessionsSection({
  title, rows, emptyText, muted = false,
}: {
  title: string; rows: SessionRow[]; emptyText: string; muted?: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 className={`font-display text-xl md:text-2xl tracking-wide ${muted ? 'text-dark/60' : ''}`}>{title}</h2>
        <p className="text-xs text-dark/50">{rows.length} session{rows.length > 1 ? 's' : ''}</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">{emptyText}</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((s) => {
            const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
            const form = Array.isArray(s.formateur) ? s.formateur[0] : s.formateur;
            const creneaux = (s.creneaux ?? []).slice().sort((a, b) => a.ordre - b.ordre);
            const first = creneaux[0]?.date;
            const last = creneaux[creneaux.length - 1]?.date;
            const statut = STATUT_LABEL[s.statut] ?? STATUT_LABEL.draft;
            return (
              <li key={s.id}>
                <Link
                  href={`/admin/sessions/${s.id}`}
                  className={`block bg-white rounded-lg border border-dark/10 p-4 sm:p-5 hover:shadow-sm hover:-translate-y-0.5 transition-all ${
                    muted ? 'opacity-90' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{f?.titre ?? '—'}</p>
                      <p className="text-xs text-dark/60 mt-1">
                        {first ? (
                          <>
                            {FR_DATE.format(new Date(first))}
                            {last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                          </>
                        ) : 'Dates à définir'}
                      </p>
                      {form && (form.full_name || form.email) && (
                        <p className="text-xs text-dark/50 mt-0.5">Formateur : {form.full_name || form.email}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium whitespace-nowrap ${statut.className}`}>
                      {statut.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
