import Link from 'next/link';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon',  className: 'bg-dark/10 text-dark/60' },
  published: { label: 'Publiée',    className: 'bg-teal/10 text-teal' },
  cancelled: { label: 'Annulée',    className: 'bg-orange/10 text-orange' },
  completed: { label: 'Terminée',   className: 'bg-dark/5 text-dark/40' },
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function FormateurHome() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, statut,
      formation:formations(slug, titre),
      creneaux:session_creneaux(date, ordre)
    `)
    .eq('formateur_id', profile!.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Espace formateur</p>
        <h1 className="font-display text-3xl md:text-5xl tracking-wide mt-2">
          Bonjour {profile!.full_name?.split(' ')[0] || ''}.
        </h1>
      </div>

      <section>
        <h2 className="font-display text-xl md:text-2xl tracking-wide">Mes sessions</h2>
        <div className="mt-4 space-y-2">
          {(!sessions || sessions.length === 0) && (
            <p className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
              Aucune session ne vous est encore assignée. L&apos;administrateur vous l&apos;assignera depuis son espace.
            </p>
          )}
          {sessions?.map((s) => {
            const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
            const cre = s.creneaux ? [...s.creneaux].sort((a, b) => a.ordre - b.ordre) : [];
            const first = cre[0]?.date;
            const last = cre[cre.length - 1]?.date;
            const statut = STATUT_LABEL[s.statut] ?? STATUT_LABEL.draft;
            return (
              <Link
                key={s.id}
                href={`/formateur/sessions/${s.id}`}
                className="block bg-white rounded-lg border border-dark/10 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{f?.titre ?? '—'}</p>
                    <p className="text-xs text-dark/60 mt-1">
                      {first ? FR_DATE.format(new Date(first)) : 'Date à définir'}
                      {last && first && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium whitespace-nowrap ${statut.className}`}>
                    {statut.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
