'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { escapeIlikeExact } from '@/lib/employees/linkability';
import {
  filterStagiaireSearchHits,
  type SessionSearchOccupant,
  type StagiaireSearchCandidate,
  type StagiaireSearchHit,
} from '@/lib/sessions/stagiaire-search';

export type { StagiaireSearchHit };

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès réservé à l\'administration.');
  }
  return profile;
}

function revalidateSession(sessionId: string) {
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  revalidatePath('/stagiaire/parcours');
}

async function loadSessionOccupants(
  admin: ReturnType<typeof createAdminClient>,
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

function occupantProfileIds(occupants: SessionSearchOccupant[]): Set<string> {
  const ids = new Set<string>();
  for (const occupant of occupants) {
    if (occupant.profileId) ids.add(occupant.profileId);
    if (occupant.employeeProfileId) ids.add(occupant.employeeProfileId);
  }
  return ids;
}

export async function searchStagiairesForSession(
  sessionId: string,
  query: string,
): Promise<{ ok: true; hits: StagiaireSearchHit[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const q = query.trim();
    if (q.length < 2) return { ok: true, hits: [] };

    const admin = createAdminClient();
    const pattern = `%${escapeIlikeExact(q)}%`;
    const select = 'id, full_name, email, account_type';

    const [byName, byEmail, occupants] = await Promise.all([
      admin.from('profiles').select(select).eq('role', 'stagiaire').ilike('full_name', pattern).limit(40),
      admin.from('profiles').select(select).eq('role', 'stagiaire').ilike('email', pattern).limit(40),
      loadSessionOccupants(admin, sessionId),
    ]);

    if (byName.error) throw new Error(byName.error.message);
    if (byEmail.error) throw new Error(byEmail.error.message);

    const byId = new Map<string, StagiaireSearchCandidate>();
    for (const row of [...(byName.data ?? []), ...(byEmail.data ?? [])]) {
      byId.set(row.id, row);
    }

    return { ok: true, hits: filterStagiaireSearchHits([...byId.values()], occupants) };
  } catch (err) {
    console.error('[admin] searchStagiairesForSession', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'La recherche n’a pas pu aboutir.',
    };
  }
}

export async function addProfileToSession(
  sessionId: string,
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: session } = await admin.from('sessions').select('id').eq('id', sessionId).maybeSingle();
  if (!session) return { ok: false, error: 'Session introuvable.' };

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, email, full_name, account_type')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Profil introuvable.' };
  if (profile.role !== 'stagiaire') {
    return { ok: false, error: 'Seuls les comptes stagiaires peuvent être inscrits.' };
  }
  if (profile.account_type === 'entreprise') {
    return { ok: false, error: 'Un compte entreprise ne peut pas être ajouté comme stagiaire.' };
  }

  const occupants = await loadSessionOccupants(admin, sessionId);
  if (occupantProfileIds(occupants).has(profileId)) {
    return { ok: false, error: 'Ce stagiaire est déjà inscrit à cette session.' };
  }

  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: profileId,
      participant_profile_id: profileId,
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (inscErr || !insc) {
    return { ok: false, error: inscErr?.message ?? 'Création de l’inscription impossible.' };
  }

  const { error: partErr } = await admin.from('inscription_participants').insert({
    inscription_id: insc.id,
    participant_profile_id: profileId,
  });
  if (partErr) {
    await admin.from('inscriptions').delete().eq('id', insc.id);
    return { ok: false, error: partErr.message };
  }

  revalidateSession(sessionId);
  return { ok: true };
}

export async function removeParticipantFromSession(
  sessionId: string,
  participantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: part } = await admin
    .from('inscription_participants')
    .select('id, inscription_id, inscription:inscriptions!inner(id, session_id)')
    .eq('id', participantId)
    .maybeSingle();
  if (!part) return { ok: false, error: 'Participant introuvable.' };

  const insc = Array.isArray(part.inscription) ? part.inscription[0] : part.inscription;
  if (!insc || insc.session_id !== sessionId) {
    return { ok: false, error: 'Ce participant n’appartient pas à cette session.' };
  }

  const { error: delErr } = await admin
    .from('inscription_participants')
    .delete()
    .eq('id', participantId);
  if (delErr) return { ok: false, error: delErr.message };

  const { count } = await admin
    .from('inscription_participants')
    .select('id', { count: 'exact', head: true })
    .eq('inscription_id', part.inscription_id);

  if ((count ?? 0) === 0) {
    const { error: inscDelErr } = await admin
      .from('inscriptions')
      .delete()
      .eq('id', part.inscription_id);
    if (inscDelErr) {
      console.error('[admin] inscription orpheline non supprimée', inscDelErr);
    }
  }

  revalidateSession(sessionId);
  return { ok: true };
}
