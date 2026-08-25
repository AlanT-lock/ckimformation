import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  filterStagiaireSearchHits,
  profileMatchesQuery,
  type SessionSearchOccupant,
  type StagiaireSearchCandidate,
  type StagiaireSearchHit,
} from '@/lib/sessions/stagiaire-search';

type AdminClient = ReturnType<typeof createAdminClient>;

export async function loadSessionOccupants(
  admin: AdminClient,
  sessionId: string,
): Promise<SessionSearchOccupant[]> {
  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .select('id')
    .eq('session_id', sessionId);
  if (inscErr) {
    console.error('[admin] loadSessionOccupants inscriptions', inscErr);
    return [];
  }
  const inscriptionIds = (insc ?? []).map((i) => i.id);
  if (inscriptionIds.length === 0) return [];

  const { data: parts, error: partsErr } = await admin
    .from('inscription_participants')
    .select('participant_profile_id, employee_id')
    .in('inscription_id', inscriptionIds);
  if (partsErr) {
    console.error('[admin] loadSessionOccupants participants', partsErr);
    return [];
  }

  const employeeIds = [...new Set((parts ?? []).map((p) => p.employee_id).filter((id): id is string => !!id))];
  const empById = new Map<string, { profile_id: string | null; email: string }>();
  if (employeeIds.length > 0) {
    const { data: employees, error: empErr } = await admin
      .from('employees')
      .select('id, profile_id, email')
      .in('id', employeeIds);
    if (empErr) {
      console.error('[admin] loadSessionOccupants employees', empErr);
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

  const [{ data, error }, occupants] = await Promise.all([
    admin.from('profiles').select(select).eq('role', 'stagiaire').limit(5000),
    loadSessionOccupants(admin, sessionId),
  ]);
  if (error) throw new Error(error.message);

  const matched = ((data ?? []) as StagiaireSearchCandidate[]).filter((row) =>
    profileMatchesQuery(row.full_name ?? '', row.email ?? '', q),
  );

  return filterStagiaireSearchHits(matched, occupants).sort((a, b) =>
    (a.full_name || a.email).localeCompare(b.full_name || b.email, 'fr', { sensitivity: 'base' }),
  );
}
