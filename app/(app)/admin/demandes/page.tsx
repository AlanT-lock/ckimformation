import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient } from '@/lib/supabase/server';
import type { InscriptionStatut } from '@/lib/supabase/types';

const STATUTS: { value: InscriptionStatut | 'all'; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'documents_demandes', label: 'Docs demandés' },
  { value: 'documents_recus', label: 'Docs reçus' },
  { value: 'confirmee', label: 'Confirmées' },
  { value: 'refusee', label: 'Refusées' },
  { value: 'all', label: 'Toutes' },
];

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente:          { label: 'En attente',          className: 'bg-orange/10 text-orange' },
  documents_demandes:  { label: 'Docs demandés',       className: 'bg-orange/15 text-orange' },
  documents_recus:     { label: 'Docs reçus',          className: 'bg-teal/15 text-teal' },
  confirmee:           { label: 'Confirmée',           className: 'bg-teal/10 text-teal' },
  refusee:             { label: 'Refusée',             className: 'bg-dark/10 text-dark/60' },
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface PageProps {
  searchParams: Promise<{ statut?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminDemandesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statutFilter = (sp.statut ?? 'en_attente') as InscriptionStatut | 'all';

  const supabase = await createClient();
  let q = supabase
    .from('inscriptions')
    .select(`
      id, statut, created_at, analyse_besoins,
      session:sessions(formation:formations(titre), creneaux:session_creneaux(date, ordre)),
      payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, account_type),
      participants:inscription_participants(id)
    `)
    .order('created_at', { ascending: false });

  if (statutFilter !== 'all') {
    q = q.eq('statut', statutFilter);
  }

  const { data: rows } = await q;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Demandes d'inscription"
        description="Liste des demandes envoyées par les entreprises et particuliers."
      />

      <nav className="flex gap-2 flex-wrap">
        {STATUTS.map((s) => {
          const active = s.value === statutFilter;
          return (
            <Link
              key={s.value}
              href={`/admin/demandes${s.value === 'en_attente' ? '' : `?statut=${s.value}`}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                active ? 'bg-teal text-white border-teal' : 'bg-white text-dark/70 border-dark/15 hover:border-dark/40'
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
        {!rows || rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">Aucune demande dans cette catégorie.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Demande</th>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Demandeur</th>
                <th className="text-left py-3 px-4">Participants</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((r) => {
                const sess = Array.isArray(r.session) ? r.session[0] : r.session;
                const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
                const payer = Array.isArray(r.payer) ? r.payer[0] : r.payer;
                const creneaux = sess?.creneaux ?? [];
                const sortedCreneaux = [...creneaux].sort((a, b) => a.ordre - b.ordre);
                const firstDate = sortedCreneaux[0]?.date;
                const statut = STATUT_LABEL[r.statut] ?? STATUT_LABEL.en_attente;
                const participantsCount = (r.participants ?? []).length;
                return (
                  <tr key={r.id} className="hover:bg-light/50">
                    <td className="py-3 px-4 font-mono text-xs text-dark/50">
                      {FR_DATE.format(new Date(r.created_at))}
                    </td>
                    <td className="py-3 px-4 font-medium">{form?.titre ?? '—'}</td>
                    <td className="py-3 px-4 text-dark/70">
                      <div>{payer?.full_name || payer?.email}</div>
                      <div className="text-xs text-dark/50">
                        {payer?.account_type === 'entreprise' ? 'Entreprise' : 'Particulier'} · {payer?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-dark/70">{participantsCount}</td>
                    <td className="py-3 px-4 text-dark/70">
                      {firstDate ? FR_DATE.format(new Date(firstDate)) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${statut.className}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/demandes/${r.id}`} className="text-teal hover:underline text-sm">
                        Voir →
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
