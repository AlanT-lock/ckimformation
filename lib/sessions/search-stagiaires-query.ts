import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { escapeIlikeExact, normalizeEmployeeEmail } from '@/lib/employees/linkability';
import {
  filterStagiaireSearchHits,
  normalizeSearchText,
  type SessionSearchOccupant,
  type StagiaireSearchCandidate,
  type StagiaireSearchHit,
} from '@/lib/sessions/stagiaire-search';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Participants d'une session (hors inscriptions refusées).
 * Par défaut une erreur de lecture renvoie [] (recherche tolérante) ;
 * `strict: true` la lève — à utiliser quand le résultat sert de garde anti-doublon.
 */
export async function loadSessionOccupants(
  admin: AdminClient,
  sessionId: string,
  opts: { strict?: boolean } = {},
): Promise<SessionSearchOccupant[]> {
  function fail(step: string, err: unknown): SessionSearchOccupant[] {
    console.error(`[admin] loadSessionOccupants ${step}`, err);
    if (opts.strict) throw new Error('Lecture des participants de la session impossible.');
    return [];
  }

  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .select('id')
    .eq('session_id', sessionId)
    .neq('statut', 'refusee');
  if (inscErr) return fail('inscriptions', inscErr);
  const inscriptionIds = (insc ?? []).map((i) => i.id);
  if (inscriptionIds.length === 0) return [];

  const { data: parts, error: partsErr } = await admin
    .from('inscription_participants')
    .select('participant_profile_id, employee_id')
    .in('inscription_id', inscriptionIds);
  if (partsErr) return fail('participants', partsErr);

  const employeeIds = [...new Set((parts ?? []).map((p) => p.employee_id).filter((id): id is string => !!id))];
  const empById = new Map<string, { profile_id: string | null; email: string }>();
  if (employeeIds.length > 0) {
    const { data: employees, error: empErr } = await admin
      .from('employees')
      .select('id, profile_id, email')
      .in('id', employeeIds);
    if (empErr) {
      fail('employees', empErr);
    } else {
      for (const emp of employees ?? []) {
        empById.set(emp.id, { profile_id: emp.profile_id, email: emp.email });
      }
    }
  }

  return (parts ?? []).map((row) => {
    const emp = row.employee_id ? empById.get(row.employee_id) : undefined;
    return {
      profileId: row.participant_profile_id,
      profileEmail: null,
      employeeProfileId: emp?.profile_id ?? null,
      employeeEmail: emp?.email ?? null,
      employeeId: row.employee_id,
    };
  });
}

export function occupantProfileIds(occupants: SessionSearchOccupant[]): Set<string> {
  const ids = new Set<string>();
  for (const occupant of occupants) {
    if (occupant.profileId) ids.add(occupant.profileId);
    if (occupant.employeeProfileId) ids.add(occupant.employeeProfileId);
  }
  return ids;
}

export async function searchStagiairesForSessionQuery(
  sessionId: string,
  query: string,
): Promise<StagiaireSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const select = 'id, full_name, email, account_type';
  const byId = new Map<string, StagiaireSearchCandidate>();

  const addRows = (rows: StagiaireSearchCandidate[] | null | undefined) => {
    for (const row of rows ?? []) {
      if (row?.id) byId.set(row.id, row);
    }
  };

  const email = normalizeEmployeeEmail(q);
  const isEmail = email.includes('@');
  const tokens = normalizeSearchText(q).split(' ').filter((t) => t.length >= 2);
  const namePatterns = [...new Set([q, ...tokens])].slice(0, 6).map((t) => `%${escapeIlikeExact(t)}%`);

  const profileSearches = [
    isEmail
      ? admin.from('profiles').select(select).ilike('email', escapeIlikeExact(email)).limit(20)
      : Promise.resolve({ data: [] as StagiaireSearchCandidate[], error: null }),
    isEmail
      ? admin.from('profiles').select(select).ilike('email', `%${escapeIlikeExact(email)}%`).limit(20)
      : Promise.resolve({ data: [] as StagiaireSearchCandidate[], error: null }),
    admin.from('profiles').select(select).eq('role', 'stagiaire').ilike('email', `%${escapeIlikeExact(q)}%`).limit(40),
    ...namePatterns.map((pattern) =>
      admin.from('profiles').select(select).eq('role', 'stagiaire').ilike('full_name', pattern).limit(40),
    ),
  ];

  const employeeSearches = isEmail
    ? [
        admin.from('employees').select('profile_id').ilike('email', escapeIlikeExact(email)).limit(20),
        admin.from('employees').select('profile_id').ilike('email', `%${escapeIlikeExact(email)}%`).limit(20),
      ]
    : [];

  const [occupants, profileResults, employeeResults] = await Promise.all([
    loadSessionOccupants(admin, sessionId),
    Promise.all(profileSearches),
    Promise.all(employeeSearches),
  ]);

  for (const result of profileResults) {
    if (result.error) throw new Error(result.error.message);
    addRows(result.data as StagiaireSearchCandidate[] | null);
  }

  const extraIds = [
    ...new Set(
      employeeResults.flatMap((result) => {
        if (result.error) return [];
        return (result.data ?? []).map((row) => row.profile_id).filter((id): id is string => !!id);
      }),
    ),
  ].filter((id) => !byId.has(id));

  if (extraIds.length > 0) {
    const { data, error } = await admin.from('profiles').select(select).in('id', extraIds);
    if (error) throw new Error(error.message);
    addRows(data as StagiaireSearchCandidate[] | null);
  }

  return filterStagiaireSearchHits([...byId.values()], occupants).sort((a, b) => {
    const rank = (t: StagiaireSearchHit['account_type']) => (t === 'particulier' ? 0 : 1);
    const byType = rank(a.account_type) - rank(b.account_type);
    if (byType !== 0) return byType;
    return (a.full_name || a.email).localeCompare(b.full_name || b.email, 'fr', { sensitivity: 'base' });
  });
}
