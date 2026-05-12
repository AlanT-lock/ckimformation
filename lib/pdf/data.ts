import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const ORGANISME = {
  nomComplet: 'CKIM SECURITE FORMATION',
  siret: '991 764 580 00015',
  adresse: '391 avenue du Maréchal Koenig, 83300 Draguignan',
  nda: '93830858883',
  qualiopi: '772911-1',
};

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
  nomComplet: string;
  email: string;
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
      id, inscription_id,
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
  const nomComplet = emp ? `${emp.prenom} ${emp.nom}` : prof?.full_name ?? '—';
  const email = emp?.email ?? prof?.email ?? '';

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

  const adr = (sess?.adresse ?? null) as { rue?: string; code_postal?: string; ville?: string; complement?: string } | null;
  const lieu = adr
    ? [adr.rue, adr.complement, [adr.code_postal, adr.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : '';

  return {
    participantId: data.id,
    sessionId,
    inscriptionId: ins.id,
    nomComplet,
    email,
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
