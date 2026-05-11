import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon',  className: 'bg-dark/10 text-dark/60' },
  published: { label: 'Publiée',    className: 'bg-teal/10 text-teal' },
  cancelled: { label: 'Annulée',    className: 'bg-orange/10 text-orange' },
  completed: { label: 'Terminée',   className: 'bg-dark/5 text-dark/40' },
};

export default async function FormateurSessionsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'formateur') redirect('/login');

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, statut,
      formation:formations(titre),
      creneaux:session_creneaux(date, ordre),
      inscriptions:inscriptions(count)
    `)
    .eq('formateur_id', profile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Espace formateur" title="Mes sessions" />

      {(!sessions || sessions.length === 0) ? (
        <div className="bg-white rounded-lg border border-dark/10 p-8 text-sm text-dark/60 text-center">
          Aucune session ne vous est assignée pour l&apos;instant.
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
            const cre = (s.creneaux ?? []).slice().sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre);
            const first = cre[0]?.date;
            const last = cre[cre.length - 1]?.date;
            const inscCount = Array.isArray(s.inscriptions) ? (s.inscriptions[0]?.count ?? 0) : 0;
            const statut = STATUT_LABEL[s.statut] ?? STATUT_LABEL.draft;
            return (
              <li key={s.id}>
                <Link
                  href={`/formateur/sessions/${s.id}`}
                  className="block bg-white rounded-lg border border-dark/10 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{f?.titre ?? '—'}</p>
                      <p className="text-xs text-dark/60 mt-1">
                        {first ? FR_DATE.format(new Date(first)) : 'Dates à définir'}
                        {last && first && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                      </p>
                      <p className="text-xs text-dark/60 mt-1">
                        {inscCount} demande{inscCount > 1 ? 's' : ''} d&apos;inscription
                      </p>
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
    </div>
  );
}
