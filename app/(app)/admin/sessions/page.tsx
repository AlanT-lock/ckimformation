import { ButtonLink } from '@/components/app/Button';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient } from '@/lib/supabase/server';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon',  className: 'bg-dark/10 text-dark/70' },
  published: { label: 'Publiée',    className: 'bg-teal/10 text-teal' },
  cancelled: { label: 'Annulée',    className: 'bg-orange/10 text-orange' },
  completed: { label: 'Terminée',   className: 'bg-dark/5 text-dark/50' },
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, statut, created_at,
      formation:formations(slug, titre),
      formateur:profiles!sessions_formateur_id_fkey(full_name, email),
      creneaux:session_creneaux(date, ordre)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Sessions"
        description="Toutes les sessions de formation. Crée, édite et publie."
        actions={<ButtonLink href="/admin/sessions/nouvelle">+ Nouvelle session</ButtonLink>}
      />

      <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
        {(!sessions || sessions.length === 0) ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            Aucune session pour l&apos;instant.{' '}
            <a href="/admin/sessions/nouvelle" className="text-teal underline">Créer la première</a>.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Dates</th>
                <th className="text-left py-3 px-4">Formateur</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {sessions.map((s) => {
                const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
                const form = Array.isArray(s.formateur) ? s.formateur[0] : s.formateur;
                const creneaux = (s.creneaux ?? []).slice().sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre);
                const first = creneaux[0]?.date;
                const last = creneaux[creneaux.length - 1]?.date;
                const statut = STATUT_LABEL[s.statut] ?? STATUT_LABEL.draft;
                return (
                  <tr key={s.id} className="hover:bg-light/50">
                    <td className="py-3 px-4 font-medium">{f?.titre ?? '—'}</td>
                    <td className="py-3 px-4 text-dark/70">
                      {first ? (
                        <>
                          {FR_DATE.format(new Date(first))}
                          {last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-dark/70">{form?.full_name || form?.email || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${statut.className}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a href={`/admin/sessions/${s.id}`} className="text-teal text-xs uppercase tracking-wider hover:underline">
                        Éditer →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
