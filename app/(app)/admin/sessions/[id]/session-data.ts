import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { SessionAdresse, SessionStatut, SessionVisibility } from '@/lib/supabase/types';
import type { SessionParticipantRow } from './SessionParticipantsManager';

// Chargements partagés par le layout et les sous-pages d'une session (admin).
// `cache` dédoublonne les requêtes entre layout et page au sein d'un même rendu.

type One<T> = T | T[] | null;
const first = <T,>(v: One<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export interface AdminSession {
  id: string;
  formation_id: string;
  formateur_id: string | null;
  statut: SessionStatut;
  adresse: SessionAdresse | null;
  notes_internes: string | null;
  visibility: SessionVisibility;
  reserved_company_id: string | null;
  formationTitre: string | null;
}

/** Vérifie le rôle admin et charge la session (404 si elle n'existe pas). */
export const requireAdminSession = cache(async (id: string): Promise<AdminSession> => {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sessions')
    .select('*, formation:formations(titre)')
    .eq('id', id)
    .single();
  if (!data) notFound();

  const formation = first(data.formation as One<{ titre: string }>);
  return {
    id: data.id,
    formation_id: data.formation_id,
    formateur_id: data.formateur_id,
    statut: data.statut,
    adresse: data.adresse,
    notes_internes: data.notes_internes,
    visibility: data.visibility,
    reserved_company_id: data.reserved_company_id,
    formationTitre: formation?.titre ?? null,
  };
});

export interface CreneauRow {
  id: string;
  ordre: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
}

export const loadCreneaux = cache(async (sessionId: string): Promise<CreneauRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('session_creneaux')
    .select('id, ordre, date, heure_debut, heure_fin')
    .eq('session_id', sessionId)
    .order('ordre');
  return (data ?? []) as CreneauRow[];
});

export interface InscriptionParticipant {
  id: string;
  label: string;
  email: string;
}

export interface InscriptionRow {
  id: string;
  statut: string;
  payerLabel: string;
  payerIsEntreprise: boolean;
  participants: InscriptionParticipant[];
}

interface RawInscription {
  id: string;
  statut: string;
  payer: One<{ full_name: string | null; email: string | null; account_type: string | null }>;
  participants: Array<{
    id: string;
    employee: One<{ prenom: string; nom: string; email: string; profile_id: string | null }>;
    profile: One<{ full_name: string | null; email: string }>;
  }> | null;
}

/** Demandes d'inscription de la session + liste à plat de leurs participants. */
export const loadInscriptions = cache(async (sessionId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('inscriptions')
    .select(`
      id, statut, created_at,
      payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, account_type),
      participants:inscription_participants(
        id,
        employee:employees(prenom, nom, email, profile_id),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at');

  const inscriptions: InscriptionRow[] = [];
  const participantRows: SessionParticipantRow[] = [];

  for (const ins of (data ?? []) as RawInscription[]) {
    const pay = first(ins.payer);
    const payerLabel = pay?.full_name || pay?.email || '';
    const participants: InscriptionParticipant[] = [];

    for (const p of ins.participants ?? []) {
      const emp = first(p.employee);
      const prof = first(p.profile);
      participants.push({
        id: p.id,
        label: emp ? `${emp.prenom} ${emp.nom}` : prof?.full_name ?? '—',
        email: emp?.email ?? prof?.email ?? '',
      });

      const common = { id: p.id, inscriptionId: ins.id, inscriptionStatut: ins.statut, payerLabel };
      if (emp) {
        participantRows.push({
          ...common,
          prenom: emp.prenom,
          nom: emp.nom,
          email: emp.email,
          kind: 'employee',
          hasAccount: !!emp.profile_id,
        });
      } else if (prof) {
        const bits = (prof.full_name ?? '').split(' ');
        participantRows.push({
          ...common,
          prenom: bits[0] ?? '',
          nom: bits.slice(1).join(' '),
          email: prof.email,
          kind: 'profile',
          hasAccount: true,
        });
      }
    }

    inscriptions.push({
      id: ins.id,
      statut: ins.statut,
      payerLabel,
      payerIsEntreprise: pay?.account_type === 'entreprise',
      participants,
    });
  }

  return { inscriptions, participantRows };
});
