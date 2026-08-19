import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InscriptionStatut, SessionAdresse } from '@/lib/supabase/types';
import type {
  ConvocationCreneau,
  ConvocationParticipant,
  SessionConvocationData,
} from './convocation-types';

export type { ConvocationCreneau, ConvocationParticipant, SessionConvocationData };

export const ORGANISME = {
  nomComplet: 'CKIM SECURITE FORMATION',
  siret: '991 764 580 00015',
  adresse: '391 avenue du Maréchal Koenig, 83300 Draguignan',
  nda: '93830858883',
  qualiopi: '772911-1',
  telephone: '06 62 51 55 59',
  email: 'contact@ckimformation.fr',
};

export function safePdfFilename(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function splitStagiaireName(
  emp: { prenom: string; nom: string } | null | undefined,
  fullName: string | null | undefined
): { prenom: string; nom: string; nomComplet: string } {
  if (emp) {
    const prenom = emp.prenom.trim();
    const nom = emp.nom.trim();
    return { prenom, nom, nomComplet: `${prenom} ${nom}`.trim() || '—' };
  }
  const raw = (fullName ?? '').trim();
  if (!raw) return { prenom: '', nom: '', nomComplet: '—' };
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: '', nomComplet: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' '), nomComplet: raw };
}

export function formatSessionLieu(adresse: SessionAdresse | null | undefined): string {
  if (!adresse) return '';
  return [adresse.rue, adresse.complement, [adresse.code_postal, adresse.ville].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ckim-formation.fr';
}

export function logoUrl(): string {
  return `${siteUrl()}/logo-ckim.png`;
}

export async function requireAdminOrFormateurOfSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile) return { ok: false as const, status: 401 };
  if (profile.role === 'admin') return { ok: true as const };
  if (profile.role === 'formateur') {
    const { data: s } = await supabase
      .from('sessions')
      .select('formateur_id')
      .eq('id', sessionId)
      .single();
    if (s?.formateur_id === user.id) return { ok: true as const };
  }
  return { ok: false as const, status: 403 };
}

export interface ParticipantContext {
  participantId: string;
  sessionId: string;
  inscriptionId: string;
  prenom: string;
  nom: string;
  nomComplet: string;
  email: string;
  profileId: string | null;
  entreprise: { raisonSociale: string; siret: string | null } | null;
  formationTitre: string;
  session: {
    lieu: string;
    formateurNom: string | null;
    dateDebut: string | null;
    dateFin: string | null;
  };
}

export async function loadParticipantContext(
  sessionId: string,
  participantId: string
): Promise<ParticipantContext | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('inscription_participants')
    .select(`
      id, inscription_id, participant_profile_id,
      employee:employees(prenom, nom, email),
      profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email),
      inscription:inscriptions!inner(
        id, session_id, payer_profile_id,
        session:sessions(
          id, adresse,
          formation:formations(titre),
          formateur:profiles!sessions_formateur_id_fkey(full_name),
          creneaux:session_creneaux(date, ordre)
        )
      )
    `)
    .eq('id', participantId)
    .single();
  if (!data) return null;
  const ins = Array.isArray(data.inscription) ? data.inscription[0] : data.inscription;
  if (!ins || ins.session_id !== sessionId) return null;

  const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
  const formateur = sess && (Array.isArray(sess.formateur) ? sess.formateur[0] : sess.formateur);
  const creneaux = (sess?.creneaux ?? []) as { date: string; ordre: number }[];
  const sorted = creneaux.slice().sort((a, b) => a.ordre - b.ordre);

  const emp = Array.isArray(data.employee) ? data.employee[0] : data.employee;
  const prof = Array.isArray(data.profile) ? data.profile[0] : data.profile;
  const { prenom, nom, nomComplet } = splitStagiaireName(emp, prof?.full_name);
  const email = emp?.email ?? prof?.email ?? '';
  const profileId =
    (data as { participant_profile_id?: string | null }).participant_profile_id ?? null;

  // Entreprise (payer si compte entreprise)
  let entreprise: ParticipantContext['entreprise'] = null;
  if (ins.payer_profile_id) {
    const { data: payer } = await admin
      .from('profiles')
      .select('account_type')
      .eq('id', ins.payer_profile_id)
      .single();
    if (payer?.account_type === 'entreprise') {
      const { data: company } = await admin
        .from('company_details')
        .select('raison_sociale, siret')
        .eq('profile_id', ins.payer_profile_id)
        .maybeSingle();
      if (company?.raison_sociale) {
        entreprise = { raisonSociale: company.raison_sociale, siret: company.siret ?? null };
      }
    }
  }

  const lieu = formatSessionLieu((sess?.adresse ?? null) as SessionAdresse | null);

  return {
    participantId: data.id,
    sessionId,
    inscriptionId: ins.id,
    prenom,
    nom,
    nomComplet,
    email,
    profileId,
    entreprise,
    formationTitre: formation?.titre ?? 'Formation',
    session: {
      lieu,
      formateurNom: formateur?.full_name ?? null,
      dateDebut: sorted[0]?.date ?? null,
      dateFin: sorted[sorted.length - 1]?.date ?? null,
    },
  };
}

export async function loadSessionCreneaux(sessionId: string): Promise<ConvocationCreneau[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('session_creneaux')
    .select('date, heure_debut, heure_fin, ordre')
    .eq('session_id', sessionId)
    .order('ordre');
  return (data ?? []).map((c) => ({
    date: c.date,
    heureDebut: c.heure_debut,
    heureFin: c.heure_fin,
  }));
}

export async function loadSessionConvocationData(
  sessionId: string
): Promise<SessionConvocationData | null> {
  const admin = createAdminClient();
  const [{ data: session }, creneaux, { data: inscriptions }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, adresse, formation:formations(titre)')
      .eq('id', sessionId)
      .single(),
    loadSessionCreneaux(sessionId),
    admin
      .from('inscriptions')
      .select(`
        id, statut,
        participants:inscription_participants(
          id, participant_profile_id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at'),
  ]);

  if (!session) return null;

  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;
  const participants: ConvocationParticipant[] = [];
  for (const ins of inscriptions ?? []) {
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      participant_profile_id?: string | null;
      employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
      profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    }>;
    for (const p of parts) {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      const names = splitStagiaireName(emp, prof?.full_name);
      participants.push({
        id: p.id,
        prenom: names.prenom,
        nom: names.nom,
        email: emp?.email ?? prof?.email ?? '',
        statut: ins.statut as InscriptionStatut,
        lastSentAt: null,
      });
    }
  }

  if (participants.length > 0) {
    const ids = participants.map((p) => p.id);
    const { data: logs } = await admin
      .from('email_logs')
      .select('ref_id, sent_at')
      .eq('kind', 'convocation')
      .eq('ref_table', 'inscription_participants')
      .eq('status', 'sent')
      .in('ref_id', ids)
      .order('sent_at', { ascending: false });

    const lastByParticipant = new Map<string, string>();
    for (const log of logs ?? []) {
      if (log.ref_id && !lastByParticipant.has(log.ref_id)) {
        lastByParticipant.set(log.ref_id, log.sent_at);
      }
    }
    for (const p of participants) {
      p.lastSentAt = lastByParticipant.get(p.id) ?? null;
    }
  }

  return {
    sessionId,
    formationTitre: formation?.titre ?? 'Formation',
    lieu: formatSessionLieu(session.adresse as SessionAdresse | null),
    creneaux,
    participants,
  };
}
