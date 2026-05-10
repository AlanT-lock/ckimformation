import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

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
      <PageHeader
        eyebrow="Espace formateur"
        title="Mes sessions"
      />
      <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
        {(!sessions || sessions.length === 0) ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            Aucune session ne t&apos;est assignée pour l&apos;instant.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Dates</th>
                <th className="text-left py-3 px-4">Stagiaires</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {sessions.map((s) => {
                const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
                const cre = (s.creneaux ?? []).slice().sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre);
                const first = cre[0]?.date;
                const last = cre[cre.length - 1]?.date;
                const inscCount = Array.isArray(s.inscriptions) ? (s.inscriptions[0]?.count ?? 0) : 0;
                return (
                  <tr key={s.id} className="hover:bg-light/50">
                    <td className="py-3 px-4 font-medium">{f?.titre ?? '—'}</td>
                    <td className="py-3 px-4 text-dark/70">
                      {first ? <>{FR_DATE.format(new Date(first))}{last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}</> : '—'}
                    </td>
                    <td className="py-3 px-4 text-dark/70">{inscCount}</td>
                    <td className="py-3 px-4 text-dark/70 capitalize">{s.statut}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/formateur/sessions/${s.id}`} className="text-teal text-xs uppercase tracking-wider hover:underline">
                        Ouvrir →
                      </Link>
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
