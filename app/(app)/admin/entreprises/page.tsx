import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listCompanies } from '@/lib/companies/queries';
import { companyMatchesQuery } from '@/lib/companies/search';
import { formatDate } from '@/lib/date';
import { SearchInput } from '../stagiaires/SearchInput';

export const dynamic = 'force-dynamic';

export default async function AdminEntreprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');

  const q = ((await searchParams).q ?? '').trim();
  const all = await listCompanies(createAdminClient());
  const rows = all.filter((r) => companyMatchesQuery(r, q));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Entreprises"
        description="Comptes entreprise de l'établissement : informations, salariés et sessions."
        actions={<ButtonLink href="/admin/entreprises/nouvelle">+ Ajouter une entreprise</ButtonLink>}
      />

      <SearchInput initial={q} basePath="/admin/entreprises" placeholder="Raison sociale, SIRET, contact ou email…" />

      <div className="text-xs text-dark/60">
        {rows.length} entreprise{rows.length > 1 ? 's' : ''}
        {q && <> pour <strong>« {q} »</strong></>}
      </div>

      <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            {q ? 'Aucune entreprise ne correspond à votre recherche.' : 'Aucune entreprise pour le moment.'}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Raison sociale</th>
                <th className="text-left py-3 px-4">SIRET</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-right py-3 px-4">Salariés</th>
                <th className="text-left py-3 px-4">Compte</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((r) => {
                const href = `/admin/entreprises/${r.id}`;
                return (
                  <tr key={r.id} className="hover:bg-light/50">
                    <td className="py-3 px-4">
                      <Link href={href} className="block">
                        <p className="font-medium">{r.raison_sociale}</p>
                        <p className="text-xs text-dark/50">Créée le {formatDate(r.created_at)}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-dark/70">{r.siret || <span className="text-dark/40">—</span>}</td>
                    <td className="py-3 px-4">
                      <p>{r.contact || '—'}</p>
                      <p className="text-xs text-dark/60">{r.email}</p>
                    </td>
                    <td className="py-3 px-4 text-right">{r.employeeCount}</td>
                    <td className="py-3 px-4">
                      {r.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Actif</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Invitation en attente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">Voir →</Link>
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
