import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SearchInput } from './SearchInput';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface Row {
  kind: 'profile' | 'employee';
  id: string;            // profile_id ou employee_id
  full_name: string;
  email: string;
  phone: string | null;
  accountType: 'particulier' | 'entreprise' | null;
  companyName: string | null;
  createdAt: string | null;
  hasAccount: boolean;
}

function escapeLikeChars(s: string): string {
  return s.replace(/[%_]/g, (c) => `\\${c}`);
}

export default async function AdminStagiairesPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const supabase = await createClient();

  // 1. Profiles (stagiaires connectés ou pouvant se connecter) + 2. employees sans profile_id
  const like = q ? `%${escapeLikeChars(q)}%` : null;

  const profilesQuery = supabase
    .from('profiles')
    .select(`
      id, full_name, email, phone, account_type, created_at,
      company:company_details!company_details_profile_id_fkey(raison_sociale)
    `)
    .eq('role', 'stagiaire')
    .order('created_at', { ascending: false })
    .limit(500);

  if (like) {
    profilesQuery.or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }

  const employeesQuery = supabase
    .from('employees')
    .select(`
      id, prenom, nom, email, profile_id, created_at,
      employer:profiles!employees_employer_profile_id_fkey(
        full_name,
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      )
    `)
    .is('profile_id', null)
    .order('created_at', { ascending: false })
    .limit(500);

  if (like) {
    employeesQuery.or(`prenom.ilike.${like},nom.ilike.${like},email.ilike.${like}`);
  }

  const [{ data: profiles }, { data: employees }] = await Promise.all([profilesQuery, employeesQuery]);

  const rows: Row[] = [];

  for (const p of (profiles ?? []) as Array<{
    id: string; full_name: string; email: string; phone: string | null;
    account_type: 'particulier' | 'entreprise' | null; created_at: string | null;
    company: { raison_sociale: string } | { raison_sociale: string }[] | null;
  }>) {
    const comp = Array.isArray(p.company) ? p.company[0] : p.company;
    rows.push({
      kind: 'profile',
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      accountType: p.account_type,
      companyName: comp?.raison_sociale ?? null,
      createdAt: p.created_at,
      hasAccount: true,
    });
  }

  for (const e of (employees ?? []) as Array<{
    id: string; prenom: string; nom: string; email: string; profile_id: string | null;
    created_at: string | null;
    employer: {
      full_name: string;
      company: { raison_sociale: string } | { raison_sociale: string }[] | null;
    } | Array<{
      full_name: string;
      company: { raison_sociale: string } | { raison_sociale: string }[] | null;
    }> | null;
  }>) {
    const emp = Array.isArray(e.employer) ? e.employer[0] : e.employer;
    const comp = emp && (Array.isArray(emp.company) ? emp.company[0] : emp.company);
    rows.push({
      kind: 'employee',
      id: e.id,
      full_name: `${e.prenom} ${e.nom}`.trim(),
      email: e.email,
      phone: null,
      accountType: 'entreprise',
      companyName: comp?.raison_sociale ?? null,
      createdAt: e.created_at,
      hasAccount: false,
    });
  }

  // Trie par nom asc
  rows.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Stagiaires"
        description="Annuaire des stagiaires (comptes existants et salariés invités). Recherchez par nom, email ou téléphone."
      />

      <SearchInput initial={q} />

      <div className="text-xs text-dark/60">
        {rows.length} résultat{rows.length > 1 ? 's' : ''}
        {q && <> pour <strong>« {q} »</strong></>}
      </div>

      <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            {q ? 'Aucun stagiaire ne correspond à votre recherche.' : 'Aucun stagiaire pour le moment.'}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Téléphone</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Société / Employeur</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((r) => {
                const cellsLink = r.hasAccount;
                const href = `/admin/stagiaires/${r.id}`;
                return (
                  <tr key={`${r.kind}-${r.id}`} className={cellsLink ? 'hover:bg-light/50 cursor-pointer' : ''}>
                    <Cell href={cellsLink ? href : null}>
                      <div>
                        <p className="font-medium">{r.full_name || <em className="text-dark/40">Sans nom</em>}</p>
                        {!r.hasAccount && (
                          <p className="text-xs text-orange mt-0.5">Sans compte</p>
                        )}
                      </div>
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <span className="text-dark/70">{r.email}</span>
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <span className="text-dark/70">{r.phone || <span className="text-dark/40">—</span>}</span>
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <TypeBadge accountType={r.accountType} />
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <span className="text-dark/70">{r.companyName ?? <span className="text-dark/40">—</span>}</span>
                    </Cell>
                    <td className="py-3 px-4 text-right">
                      {r.hasAccount ? (
                        <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">
                          Voir →
                        </Link>
                      ) : (
                        <span className="text-xs text-dark/40 whitespace-nowrap">
                          {r.createdAt && FR_DATE.format(new Date(r.createdAt))}
                        </span>
                      )}
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

function Cell({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <td className="py-3 px-4">{children}</td>;
  return (
    <td className="py-3 px-4">
      <Link href={href} className="block">{children}</Link>
    </td>
  );
}

function TypeBadge({ accountType }: { accountType: 'particulier' | 'entreprise' | null }) {
  if (accountType === 'entreprise') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Salarié</span>;
  if (accountType === 'particulier') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/70">Particulier</span>;
  return <span className="text-xs text-dark/40">—</span>;
}
