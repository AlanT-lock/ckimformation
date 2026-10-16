import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SearchInput } from './SearchInput';
import { formatDate } from '@/lib/date';
import { stagiaireKind, type StagiaireKind } from '@/lib/companies/status';
import { createdAtBounds, parseStagiairesFilters } from '@/lib/stagiaires/filters';
import { StagiairesFilters, type EntrepriseOption } from './StagiairesFilters';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; du?: string; au?: string; entreprise?: string; tri?: string }>;
}

interface Row {
  kind: 'profile' | 'employee';
  id: string;            // profile_id ou employee_id
  full_name: string;
  email: string;
  phone: string | null;
  typeKind: StagiaireKind | null;
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

  const filters = parseStagiairesFilters(await searchParams);
  const { q } = filters;
  const supabase = await createClient();
  const { gte, lt } = createdAtBounds(filters.du, filters.au);

  // Liste des entreprises (dropdown + nom d'employeur des salariés avec compte)
  const { data: entrepriseProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, company:company_details!company_details_profile_id_fkey(raison_sociale)')
    .eq('account_type', 'entreprise');
  const entreprises: EntrepriseOption[] = (entrepriseProfiles ?? [])
    .map((e) => {
      const comp = Array.isArray(e.company) ? e.company[0] : e.company;
      return { id: e.id, label: comp?.raison_sociale || e.full_name || e.email };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  const entrepriseLabel = new Map(entreprises.map((e) => [e.id, e.label]));

  // Filtre entreprise : profils rattachés (employer_profile_id ou fiche salarié liée,
  // y compris l'entreprise elle-même si elle s'est ajoutée comme salariée)
  let profileIdsForEntreprise: string[] | null = null;
  if (filters.entreprise) {
    const [{ data: linkedEmployees }, { data: linkedProfiles }] = await Promise.all([
      supabase.from('employees').select('profile_id').eq('employer_profile_id', filters.entreprise).not('profile_id', 'is', null),
      supabase.from('profiles').select('id').eq('employer_profile_id', filters.entreprise),
    ]);
    profileIdsForEntreprise = Array.from(new Set([
      ...(linkedEmployees ?? []).map((e) => e.profile_id as string),
      ...(linkedProfiles ?? []).map((p) => p.id),
    ]));
  }

  // 1. Profiles (stagiaires connectés ou pouvant se connecter) + 2. employees sans profile_id
  const like = q ? `%${escapeLikeChars(q)}%` : null;

  const profilesQuery = supabase
    .from('profiles')
    .select(`
      id, full_name, email, phone, account_type, employer_profile_id, created_at,
      company:company_details!company_details_profile_id_fkey(raison_sociale)
    `)
    .eq('role', 'stagiaire')
    .order('created_at', { ascending: false })
    .limit(500);

  if (like) {
    profilesQuery.or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }
  if (gte) profilesQuery.gte('created_at', gte);
  if (lt) profilesQuery.lt('created_at', lt);
  if (profileIdsForEntreprise) {
    // Aucun id → aucun résultat (uuid nul jamais attribué)
    profilesQuery.in('id', profileIdsForEntreprise.length > 0 ? profileIdsForEntreprise : ['00000000-0000-0000-0000-000000000000']);
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
  if (gte) employeesQuery.gte('created_at', gte);
  if (lt) employeesQuery.lt('created_at', lt);
  if (filters.entreprise) employeesQuery.eq('employer_profile_id', filters.entreprise);

  const [{ data: profiles }, { data: employees }] = await Promise.all([profilesQuery, employeesQuery]);

  const rows: Row[] = [];

  for (const p of (profiles ?? []) as Array<{
    id: string; full_name: string; email: string; phone: string | null;
    account_type: 'particulier' | 'entreprise' | null; employer_profile_id: string | null; created_at: string | null;
    company: { raison_sociale: string } | { raison_sociale: string }[] | null;
  }>) {
    const comp = Array.isArray(p.company) ? p.company[0] : p.company;
    rows.push({
      kind: 'profile',
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      typeKind: stagiaireKind({ rowKind: 'profile', accountType: p.account_type, hasEmployer: !!p.employer_profile_id }),
      companyName: comp?.raison_sociale
        ?? (p.employer_profile_id ? entrepriseLabel.get(p.employer_profile_id) ?? null : null),
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
      typeKind: 'salarie',
      companyName: comp?.raison_sociale ?? null,
      createdAt: e.created_at,
      hasAccount: false,
    });
  }

  if (filters.tri === 'recent') {
    rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  } else {
    rows.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }));
  }
  const hasFilters = !!(q || filters.du || filters.au || filters.entreprise);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Stagiaires"
        description="Annuaire des stagiaires (comptes existants et salariés invités). Recherchez par nom, email ou téléphone."
      />

      <SearchInput initial={q} />

      <StagiairesFilters
        entreprises={entreprises}
        du={filters.du}
        au={filters.au}
        entreprise={filters.entreprise}
        tri={filters.tri}
      />

      <div className="text-xs text-dark/60">
        {rows.length} résultat{rows.length > 1 ? 's' : ''}
        {q && <> pour <strong>« {q} »</strong></>}
        {filters.entreprise && <> · entreprise <strong>{entrepriseLabel.get(filters.entreprise) ?? '—'}</strong></>}
        {(filters.du || filters.au) && (
          <> · inscrits {filters.du ? <>du <strong>{formatDate(filters.du)}</strong></> : null}
          {filters.au ? <> au <strong>{formatDate(filters.au)}</strong></> : null}</>
        )}
      </div>

      <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            {hasFilters ? 'Aucun stagiaire ne correspond à ces critères.' : 'Aucun stagiaire pour le moment.'}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Téléphone</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Société / Employeur</th>
                <th className="text-left py-3 px-4">Inscrit le</th>
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
                      <TypeBadge kind={r.typeKind} />
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <span className="text-dark/70">{r.companyName ?? <span className="text-dark/40">—</span>}</span>
                    </Cell>
                    <Cell href={cellsLink ? href : null}>
                      <span className="text-dark/70 whitespace-nowrap">
                        {r.createdAt ? formatDate(r.createdAt) : <span className="text-dark/40">—</span>}
                      </span>
                    </Cell>
                    <td className="py-3 px-4 text-right">
                      {r.hasAccount && (
                        <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">
                          Voir →
                        </Link>
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

function TypeBadge({ kind }: { kind: StagiaireKind | null }) {
  const base = 'text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium';
  if (kind === 'entreprise') return <span className={`${base} bg-orange/10 text-orange`}>Entreprise</span>;
  if (kind === 'salarie') return <span className={`${base} bg-teal/10 text-teal`}>Salarié</span>;
  if (kind === 'particulier') return <span className={`${base} bg-dark/10 text-dark/70`}>Particulier</span>;
  return <span className="text-xs text-dark/40">—</span>;
}
