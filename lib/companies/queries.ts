import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, todayIsoParis } from '@/lib/date';
import { loadSignedInIds } from './auth-status';
import { isSessionEligibleForCompany } from './enrollment';
import { employeeAccountStatus, type EmployeeAccountStatus } from './status';
import { buildCompanySessionRows, firstAndLastDate, type CompanySessionRow, type RawCompanySession } from './sessions';

export type AdminClient = ReturnType<typeof createAdminClient>;

type One<T> = T | T[] | null;
function one<T>(v: One<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export interface CompanyListRow {
  id: string;
  raison_sociale: string;
  siret: string | null;
  contact: string;
  email: string;
  phone: string | null;
  employeeCount: number;
  active: boolean;
  created_at: string;
}

export async function listCompanies(admin: AdminClient): Promise<CompanyListRow[]> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, created_at,
      company:company_details!company_details_profile_id_fkey(raison_sociale, siret)
    `)
    .eq('role', 'stagiaire')
    .eq('account_type', 'entreprise');
  if (error) throw new Error(error.message);

  const ids = (profiles ?? []).map((p) => p.id);
  const [{ data: emps }, signedIn] = await Promise.all([
    ids.length === 0
      ? Promise.resolve({ data: [] as { employer_profile_id: string }[] })
      : admin.from('employees').select('employer_profile_id').in('employer_profile_id', ids),
    loadSignedInIds(admin, ids),
  ]);
  const counts = new Map<string, number>();
  for (const e of emps ?? []) counts.set(e.employer_profile_id, (counts.get(e.employer_profile_id) ?? 0) + 1);

  return (profiles ?? [])
    .map((p) => {
      const c = one(p.company as One<{ raison_sociale: string; siret: string | null }>);
      return {
        id: p.id,
        raison_sociale: c?.raison_sociale || p.full_name || '—',
        siret: c?.siret ?? null,
        contact: p.full_name,
        email: p.email,
        phone: p.phone,
        employeeCount: counts.get(p.id) ?? 0,
        active: signedIn.has(p.id),
        created_at: p.created_at,
      };
    })
    .sort((a, b) => a.raison_sociale.localeCompare(b.raison_sociale, 'fr', { sensitivity: 'base' }));
}

export interface CompanyEmployeeRow {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  profile_id: string | null;
  status: EmployeeAccountStatus;
}

export interface CompanyDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  secteur: string | null;
  created_at: string;
  active: boolean;
  company: {
    raison_sociale: string;
    siret: string | null;
    tva_intra: string | null;
    contact_fonction: string | null;
    billing_address: { rue?: string; code_postal?: string; ville?: string; pays?: string } | null;
  };
  employees: CompanyEmployeeRow[];
  sessions: CompanySessionRow[];
}

const SESSION_SELECT = `
  id, statut, visibility, reserved_company_id,
  formation:formations(titre),
  creneaux:session_creneaux(date, ordre)
`;

/** Fiche entreprise : infos, salariés (avec statut de compte) et sessions liées. Null si pas une entreprise. */
export async function loadCompanyDetail(admin: AdminClient, id: string): Promise<CompanyDetail | null> {
  const { data: prof } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, created_at, account_type,
      secteur:secteurs_activite(label),
      company:company_details!company_details_profile_id_fkey(raison_sociale, siret, tva_intra, contact_fonction, billing_address)
    `)
    .eq('id', id)
    .maybeSingle();
  if (!prof || prof.account_type !== 'entreprise') return null;

  const { data: emps } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id')
    .eq('employer_profile_id', id)
    .order('nom');
  const employees = emps ?? [];
  const employeeIds = employees.map((e) => e.id);

  const [signedIn, { data: pendingLinks }, { data: reserved }, { data: paid }, { data: parts }] = await Promise.all([
    loadSignedInIds(admin, [id, ...employees.map((e) => e.profile_id).filter((p): p is string => !!p)]),
    employeeIds.length === 0
      ? Promise.resolve({ data: [] as { employee_id: string }[] })
      : admin.from('employee_invitations').select('employee_id').in('employee_id', employeeIds).is('claimed_at', null),
    admin.from('sessions').select('id').eq('reserved_company_id', id),
    admin.from('inscriptions').select('session_id').eq('payer_profile_id', id),
    employeeIds.length === 0
      ? Promise.resolve({ data: [] as { employee_id: string | null; inscription: unknown }[] })
      : admin
          .from('inscription_participants')
          .select('employee_id, inscription:inscriptions!inner(session_id)')
          .in('employee_id', employeeIds),
  ]);

  const pendingSet = new Set((pendingLinks ?? []).map((p) => p.employee_id));
  const employeeRows: CompanyEmployeeRow[] = employees.map((e) => ({
    ...e,
    status: employeeAccountStatus({
      profileId: e.profile_id,
      signedIn: !!e.profile_id && signedIn.has(e.profile_id),
      pendingLink: pendingSet.has(e.id),
    }),
  }));

  const nameById = new Map(employees.map((e) => [e.id, `${e.prenom} ${e.nom}`.trim()]));
  const participantsBySession = new Map<string, string[]>();
  for (const p of parts ?? []) {
    const insc = one(p.inscription as One<{ session_id: string }>);
    if (!insc || !p.employee_id) continue;
    const list = participantsBySession.get(insc.session_id) ?? [];
    const name = nameById.get(p.employee_id);
    if (name && !list.includes(name)) list.push(name);
    participantsBySession.set(insc.session_id, list);
  }

  const sessionIds = [...new Set([
    ...(reserved ?? []).map((s) => s.id),
    ...(paid ?? []).map((i) => i.session_id),
    ...participantsBySession.keys(),
  ])];
  const { data: sessions } = sessionIds.length === 0
    ? { data: [] as RawCompanySession[] }
    : await admin.from('sessions').select(SESSION_SELECT).in('id', sessionIds);

  const c = one(prof.company as One<CompanyDetail['company']>);
  const secteur = one(prof.secteur as One<{ label: string }>);
  return {
    id: prof.id,
    full_name: prof.full_name,
    email: prof.email,
    phone: prof.phone,
    secteur: secteur?.label ?? null,
    created_at: prof.created_at,
    active: signedIn.has(prof.id),
    company: c ?? { raison_sociale: prof.full_name, siret: null, tva_intra: null, contact_fonction: null, billing_address: null },
    employees: employeeRows,
    sessions: buildCompanySessionRows((sessions ?? []) as RawCompanySession[], participantsBySession),
  };
}

export interface EnrollableSessionOption {
  id: string;
  label: string;
  reserved: boolean;
}

/** Sessions publiées à venir, publiques ou réservées à cette entreprise (tri par date croissante). */
export async function listEnrollableSessions(admin: AdminClient, companyId: string): Promise<EnrollableSessionOption[]> {
  const { data } = await admin
    .from('sessions')
    .select(SESSION_SELECT)
    .eq('statut', 'published');
  const today = todayIsoParis();
  return ((data ?? []) as RawCompanySession[])
    .map((s) => ({ s, ...firstAndLastDate(s.creneaux) }))
    .filter(({ s, firstDate }) => isSessionEligibleForCompany({ ...s, firstDate }, companyId, today))
    .sort((a, b) => (a.firstDate ?? '').localeCompare(b.firstDate ?? ''))
    .map(({ s, firstDate, lastDate }) => {
      const formation = one(s.formation);
      const dates = firstDate === lastDate || !lastDate
        ? formatDate(firstDate)
        : `${formatDate(firstDate)} → ${formatDate(lastDate)}`;
      return {
        id: s.id,
        label: `${formation?.titre ?? 'Formation'} — ${dates}${s.visibility === 'reserved' ? ' (réservée)' : ''}`,
        reserved: s.visibility === 'reserved',
      };
    });
}
