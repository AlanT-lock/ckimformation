import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { splitStagiaireName } from '@/lib/pdf/data';
import { todayIsoParis } from '@/lib/date';
import { isSuiviVisible, sessionDays } from './progress';
import { isNiveau, type Niveau } from './bilan';

type Maybe<T> = T | T[] | null;
const one = <T,>(v: Maybe<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export interface SuiviCompetence {
  id: string;
  libelle: string;
  /** Date (YYYY-MM-DD) de la journée où elle a été vue, null si pas encore vue */
  vueLe: string | null;
}

export interface SuiviCommentaire {
  participantId: string;
  nom: string;
  commentaire: string;
}

export interface SuiviJournee {
  date: string;
  termineeAt: string | null;
  commentaireGeneral: string | null;
  competences: Array<{ id: string; libelle: string }>;
  commentaires: SuiviCommentaire[];
}

/** Bilan de fin de formation d'un stagiaire : niveau par compétence. */
export interface SuiviBilan {
  participantId: string;
  nom: string;
  niveaux: Record<string, Niveau>;
}

export interface SuiviSession {
  sessionId: string;
  formationId: string;
  formationTitre: string;
  statut: string;
  days: string[];
  competences: SuiviCompetence[];
  journees: SuiviJournee[];
  /** Bilans des stagiaires demandés (uniquement ceux déjà évalués par le formateur) */
  bilans: SuiviBilan[];
}

export interface SessionParticipant {
  id: string;
  nom: string;
  email: string;
}

const NO_ID = '00000000-0000-0000-0000-000000000000';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Stagiaires (inscriptions confirmées) d'une session, triés par nom. */
export async function loadSessionParticipants(admin: AdminClient, sessionId: string): Promise<SessionParticipant[]> {
  const { data: inscriptions } = await admin
    .from('inscriptions')
    .select(`
      id,
      participants:inscription_participants(
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      )
    `)
    .eq('session_id', sessionId)
    .eq('statut', 'confirmee');

  const out: SessionParticipant[] = [];
  for (const ins of inscriptions ?? []) {
    for (const p of (ins.participants ?? []) as Array<{
      id: string;
      employee: Maybe<{ prenom: string; nom: string; email: string | null }>;
      profile: Maybe<{ full_name: string | null; email: string | null }>;
    }>) {
      const emp = one(p.employee);
      const prof = one(p.profile);
      out.push({
        id: p.id,
        nom: splitStagiaireName(emp, prof?.full_name).nomComplet,
        email: emp?.email ?? prof?.email ?? '',
      });
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Niveaux d'acquisition enregistrés, par stagiaire puis par compétence. */
export async function loadNiveaux(
  admin: AdminClient,
  participantIds: string[]
): Promise<Map<string, Record<string, Niveau>>> {
  const out = new Map<string, Record<string, Niveau>>();
  if (participantIds.length === 0) return out;
  const { data } = await admin
    .from('inscription_participant_competences')
    .select('inscription_participant_id, competence_id, niveau')
    .in('inscription_participant_id', participantIds);
  for (const row of data ?? []) {
    if (!isNiveau(row.niveau)) continue;
    const rec = out.get(row.inscription_participant_id) ?? {};
    rec[row.competence_id] = row.niveau;
    out.set(row.inscription_participant_id, rec);
  }
  return out;
}

export interface RattacheParticipant {
  id: string;
  nom: string;
  entreprise: string;
  payerProfileId: string;
}

/**
 * Stagiaires d'une session rattachés à une entreprise : inscrits via une fiche
 * salarié, sur une inscription confirmée dont le payeur est un compte entreprise.
 */
export async function loadRattachedParticipants(sessionId: string): Promise<RattacheParticipant[]> {
  const admin = createAdminClient();
  const { data: inscriptions } = await admin
    .from('inscriptions')
    .select(`
      id, payer_profile_id,
      payer:profiles!inscriptions_payer_profile_id_fkey(
        account_type, full_name,
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      ),
      participants:inscription_participants(
        id, employee_id,
        employee:employees(prenom, nom)
      )
    `)
    .eq('session_id', sessionId)
    .eq('statut', 'confirmee');

  const out: RattacheParticipant[] = [];
  for (const ins of inscriptions ?? []) {
    const payer = one(ins.payer as Maybe<{ account_type: string | null; full_name: string | null; company: Maybe<{ raison_sociale: string }> }>);
    if (payer?.account_type !== 'entreprise') continue;
    const entreprise = one(payer.company)?.raison_sociale || payer.full_name || 'Entreprise';
    for (const p of (ins.participants ?? []) as Array<{ id: string; employee_id: string | null; employee: Maybe<{ prenom: string; nom: string }> }>) {
      if (!p.employee_id) continue;
      out.push({
        id: p.id,
        nom: splitStagiaireName(one(p.employee), null).nomComplet,
        entreprise,
        payerProfileId: ins.payer_profile_id as string,
      });
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/**
 * Suivi complet d'une session. `participantIds` limite les commentaires et les
 * bilans par stagiaire à ces participants (espace entreprise) ; `'all'` les
 * renvoie tous.
 */
export async function loadSessionSuivi(
  sessionId: string,
  participantIds: string[] | 'all'
): Promise<SuiviSession | null> {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('sessions')
    .select('id, statut, formation_id, formation:formations(titre), creneaux:session_creneaux(date)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return null;

  const [{ data: competences }, { data: journees }, { data: vues }] = await Promise.all([
    admin
      .from('formation_competences')
      .select('id, libelle, ordre')
      .eq('formation_id', session.formation_id)
      .order('ordre')
      .order('created_at'),
    admin
      .from('session_journees')
      .select('id, date, terminee_at, commentaire_general')
      .eq('session_id', sessionId),
    admin
      .from('session_competences_vues')
      .select('competence_id, journee_id')
      .eq('session_id', sessionId),
  ]);

  const journeeIds = (journees ?? []).map((j) => j.id);
  let commentairesQuery = admin
    .from('session_journee_commentaires')
    .select(`
      journee_id, inscription_participant_id, commentaire,
      participant:inscription_participants(employee:employees(prenom, nom),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name))
    `)
    .in('journee_id', journeeIds.length > 0 ? journeeIds : [NO_ID]);
  if (participantIds !== 'all') {
    commentairesQuery = commentairesQuery.in(
      'inscription_participant_id',
      participantIds.length > 0 ? participantIds : [NO_ID]
    );
  }
  const { data: commentaires } = await commentairesQuery;

  // Bilans de fin de formation : uniquement les stagiaires déjà évalués.
  const bilans: SuiviBilan[] = [];
  if (participantIds === 'all' || participantIds.length > 0) {
    const all = await loadSessionParticipants(admin, sessionId);
    const wanted = participantIds === 'all' ? all : all.filter((p) => participantIds.includes(p.id));
    const niveaux = await loadNiveaux(admin, wanted.map((p) => p.id));
    for (const p of wanted) {
      const rec = niveaux.get(p.id);
      if (rec) bilans.push({ participantId: p.id, nom: p.nom, niveaux: rec });
    }
  }

  const journeeById = new Map((journees ?? []).map((j) => [j.id, j]));
  const competenceById = new Map((competences ?? []).map((c) => [c.id, c]));
  const vueLeByCompetence = new Map<string, string>();
  const competencesByJournee = new Map<string, Array<{ id: string; libelle: string; ordre: number }>>();
  for (const v of vues ?? []) {
    const j = journeeById.get(v.journee_id);
    const c = competenceById.get(v.competence_id);
    if (!j || !c) continue;
    vueLeByCompetence.set(c.id, j.date);
    const arr = competencesByJournee.get(j.id) ?? [];
    arr.push(c);
    competencesByJournee.set(j.id, arr);
  }

  const commentairesByJournee = new Map<string, SuiviCommentaire[]>();
  for (const c of commentaires ?? []) {
    const part = one(c.participant as Maybe<{ employee: Maybe<{ prenom: string; nom: string }>; profile: Maybe<{ full_name: string }> }>);
    const arr = commentairesByJournee.get(c.journee_id) ?? [];
    arr.push({
      participantId: c.inscription_participant_id,
      nom: splitStagiaireName(one(part?.employee ?? null), one(part?.profile ?? null)?.full_name).nomComplet,
      commentaire: c.commentaire,
    });
    commentairesByJournee.set(c.journee_id, arr);
  }

  const days = sessionDays((session.creneaux ?? []) as Array<{ date: string }>);
  const journeeByDate = new Map((journees ?? []).map((j) => [j.date, j]));

  return {
    sessionId,
    formationId: session.formation_id,
    formationTitre: one(session.formation as Maybe<{ titre: string }>)?.titre ?? 'Formation',
    statut: session.statut,
    days,
    competences: (competences ?? []).map((c) => ({ id: c.id, libelle: c.libelle, vueLe: vueLeByCompetence.get(c.id) ?? null })),
    journees: days.map((date) => {
      const j = journeeByDate.get(date);
      return {
        date,
        termineeAt: j?.terminee_at ?? null,
        commentaireGeneral: j?.commentaire_general ?? null,
        competences: j
          ? (competencesByJournee.get(j.id) ?? []).sort((a, b) => a.ordre - b.ordre).map(({ id, libelle }) => ({ id, libelle }))
          : [],
        commentaires: j ? (commentairesByJournee.get(j.id) ?? []).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')) : [],
      };
    }),
    bilans,
  };
}

export interface BilanEvaluation {
  id: string;
  nom: string;
  description: string | null;
}

export interface BilanStagiaire extends SessionParticipant {
  /** Questionnaires d'évaluation formateur déjà remplis (ids de tests) */
  evaluationsRemplies: string[];
  niveaux: Record<string, Niveau>;
}

export interface SessionBilans {
  sessionId: string;
  formationId: string;
  formationTitre: string;
  formateurId: string | null;
  evaluations: BilanEvaluation[];
  competences: SuiviCompetence[];
  stagiaires: BilanStagiaire[];
}

/**
 * Bilans de fin de formation d'une session (espace formateur) : questionnaires
 * d'évaluation formateur + compétences de la formation, avec l'avancement de
 * chaque stagiaire. Le contrôle d'accès est à la charge de l'appelant.
 */
export async function loadSessionBilans(sessionId: string): Promise<SessionBilans | null> {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('sessions')
    .select('id, formateur_id, formation_id, formation:formations(titre)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return null;

  const [{ data: evaluations }, { data: competences }, { data: vues }, stagiaires] = await Promise.all([
    admin
      .from('tests')
      .select('id, nom, description')
      .eq('formation_id', session.formation_id)
      .eq('kind', 'evaluation_formateur')
      .eq('actif', true)
      .order('ordre'),
    admin
      .from('formation_competences')
      .select('id, libelle, ordre')
      .eq('formation_id', session.formation_id)
      .order('ordre')
      .order('created_at'),
    admin
      .from('session_competences_vues')
      .select('competence_id, journee:session_journees(date)')
      .eq('session_id', sessionId),
    loadSessionParticipants(admin, sessionId),
  ]);

  const participantIds = stagiaires.map((s) => s.id);
  const evaluationIds = (evaluations ?? []).map((t) => t.id);
  const [niveaux, { data: completions }] = await Promise.all([
    loadNiveaux(admin, participantIds),
    evaluationIds.length > 0 && participantIds.length > 0
      ? admin
          .from('test_completions')
          .select('test_id, inscription_participant_id')
          .in('test_id', evaluationIds)
          .in('inscription_participant_id', participantIds)
          .not('completed_at', 'is', null)
      : Promise.resolve({ data: [] as Array<{ test_id: string; inscription_participant_id: string }> }),
  ]);

  const vueLe = new Map<string, string>();
  for (const v of vues ?? []) {
    const date = one(v.journee as Maybe<{ date: string }>)?.date;
    if (date) vueLe.set(v.competence_id, date);
  }
  const remplies = new Map<string, string[]>();
  for (const c of completions ?? []) {
    const arr = remplies.get(c.inscription_participant_id) ?? [];
    arr.push(c.test_id);
    remplies.set(c.inscription_participant_id, arr);
  }

  return {
    sessionId,
    formationId: session.formation_id,
    formationTitre: one(session.formation as Maybe<{ titre: string }>)?.titre ?? 'Formation',
    formateurId: session.formateur_id ?? null,
    evaluations: (evaluations ?? []).map((t) => ({ id: t.id, nom: t.nom, description: t.description ?? null })),
    competences: (competences ?? []).map((c) => ({ id: c.id, libelle: c.libelle, vueLe: vueLe.get(c.id) ?? null })),
    stagiaires: stagiaires.map((s) => ({
      ...s,
      evaluationsRemplies: remplies.get(s.id) ?? [],
      niveaux: niveaux.get(s.id) ?? {},
    })),
  };
}

export interface StagiaireBilan {
  participantId: string;
  competences: Array<{ id: string; libelle: string; niveau: Niveau }>;
}

/**
 * Bilans de compétences d'un stagiaire (espace stagiaire). L'appelant doit
 * avoir vérifié que ces participations sont bien celles de l'utilisateur.
 */
export async function loadStagiaireBilans(participantIds: string[]): Promise<StagiaireBilan[]> {
  if (participantIds.length === 0) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from('inscription_participant_competences')
    .select('inscription_participant_id, niveau, competence:formation_competences(id, libelle, ordre)')
    .in('inscription_participant_id', participantIds);

  const byParticipant = new Map<string, Array<{ id: string; libelle: string; ordre: number; niveau: Niveau }>>();
  for (const row of data ?? []) {
    const c = one(row.competence as Maybe<{ id: string; libelle: string; ordre: number }>);
    if (!c || !isNiveau(row.niveau)) continue;
    const arr = byParticipant.get(row.inscription_participant_id) ?? [];
    arr.push({ ...c, niveau: row.niveau });
    byParticipant.set(row.inscription_participant_id, arr);
  }
  return Array.from(byParticipant, ([participantId, list]) => ({
    participantId,
    competences: list.sort((a, b) => a.ordre - b.ordre).map(({ id, libelle, niveau }) => ({ id, libelle, niveau })),
  }));
}

/**
 * Sessions suivies par une entreprise : inscriptions confirmées qu'elle a payées,
 * affichées du premier jour à 30 jours après le dernier. Les commentaires par
 * stagiaire sont limités à ses propres salariés.
 */
export async function loadEntrepriseSuivis(
  payerProfileId: string,
  onlySessionId?: string
): Promise<Array<SuiviSession & { stagiaires: string[] }>> {
  const admin = createAdminClient();
  let query = admin
    .from('inscriptions')
    .select(`
      session_id,
      session:sessions(statut, creneaux:session_creneaux(date)),
      participants:inscription_participants(id, employee:employees(prenom, nom),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name))
    `)
    .eq('payer_profile_id', payerProfileId)
    .eq('statut', 'confirmee');
  if (onlySessionId) query = query.eq('session_id', onlySessionId);
  const { data: inscriptions } = await query;

  const today = todayIsoParis();
  const bySession = new Map<string, { ids: string[]; noms: string[] }>();
  for (const ins of inscriptions ?? []) {
    const sess = one(ins.session as Maybe<{ statut: string; creneaux: Array<{ date: string }> }>);
    if (!sess || sess.statut === 'cancelled' || sess.statut === 'draft') continue;
    if (!isSuiviVisible(sessionDays(sess.creneaux ?? []), today)) continue;
    const entry = bySession.get(ins.session_id) ?? { ids: [], noms: [] };
    for (const p of (ins.participants ?? []) as Array<{ id: string; employee: Maybe<{ prenom: string; nom: string }>; profile: Maybe<{ full_name: string }> }>) {
      entry.ids.push(p.id);
      entry.noms.push(splitStagiaireName(one(p.employee), one(p.profile)?.full_name).nomComplet);
    }
    bySession.set(ins.session_id, entry);
  }

  const out: Array<SuiviSession & { stagiaires: string[] }> = [];
  for (const [sessionId, { ids, noms }] of bySession) {
    const suivi = await loadSessionSuivi(sessionId, ids);
    if (suivi) out.push({ ...suivi, stagiaires: noms.sort((a, b) => a.localeCompare(b, 'fr')) });
  }
  return out.sort((a, b) => (a.days[0] ?? '').localeCompare(b.days[0] ?? ''));
}
