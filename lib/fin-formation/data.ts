import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatSessionLieu, splitStagiaireName } from '@/lib/pdf/data';
import { todayIsoParis } from '@/lib/date';
import type { SessionAdresse } from '@/lib/supabase/types';
import {
  computeHeures,
  isFinFormationKind,
  isNiveau,
  isSessionTerminee,
  modaliteCourte,
  stagiaireNomComplet,
  typeSessionLabel,
  type FinFormationInput,
  type FinFormationKind,
  type Niveau,
} from './model';

// Chargement des données des documents de fin de formation. Tout passe par le
// client service-role : les appelants vérifient les droits AVANT d'appeler
// (admin pour une session entière ; payeur ou stagiaire pour ses propres
// participations).

type Maybe<T> = T | T[] | null;
const one = <T,>(v: Maybe<T> | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

/** Un document déjà émis (fichier conservé dans le bucket privé). */
export interface FinFormationDocRef {
  id: string;
  participantId: string;
  kind: FinFormationKind;
  numero: string;
  fileName: string;
  storagePath: string;
  dateEdition: string;
  sentAt: string;
}

export interface FinFormationParticipant {
  id: string;
  inscriptionId: string;
  prenom: string;
  nom: string;
  /** « Prénom NOM », tel qu'il figure sur les documents. */
  nomComplet: string;
  email: string;
  /** Compte du stagiaire (direct ou lié à sa fiche salarié), s'il en a un. */
  profileId: string | null;
  /** Entreprise payeuse, pour un stagiaire inscrit via une fiche salarié. */
  entreprise: { payerProfileId: string; raisonSociale: string; email: string } | null;
  heuresRealisees: number;
  /** Niveau attribué par le formateur, par identifiant de compétence. */
  niveaux: Record<string, Niveau>;
  docs: Partial<Record<FinFormationKind, FinFormationDocRef>>;
}

export interface FinFormationSession {
  sessionId: string;
  statut: string;
  formationTitre: string;
  formationRef: string | null;
  modalite: string;
  typeSession: string;
  lieu: string;
  formateurNom: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  heuresPrevues: number;
  /** Session terminée : statut « Terminée » ou dernier créneau passé. */
  terminee: boolean;
  competences: Array<{ id: string; libelle: string }>;
  /** Stagiaires des inscriptions confirmées, triés par nom. */
  participants: FinFormationParticipant[];
}

interface DocRow {
  id: string;
  inscription_participant_id: string;
  kind: string;
  numero: string;
  file_name: string;
  storage_path: string;
  date_edition: string;
  sent_at: string;
}

const DOC_COLS = 'id, inscription_participant_id, kind, numero, file_name, storage_path, date_edition, sent_at';

function toDocRef(row: DocRow): FinFormationDocRef | null {
  if (!isFinFormationKind(row.kind)) return null;
  return {
    id: row.id,
    participantId: row.inscription_participant_id,
    kind: row.kind,
    numero: row.numero,
    fileName: row.file_name,
    storagePath: row.storage_path,
    dateEdition: row.date_edition,
    sentAt: row.sent_at,
  };
}

export async function loadFinFormationSession(sessionId: string): Promise<FinFormationSession | null> {
  const admin = createAdminClient();
  const [{ data: session }, { data: inscriptions }] = await Promise.all([
    admin
      .from('sessions')
      .select(`
        id, statut, adresse, visibility, formation_id,
        formation:formations(titre, ref, modalite),
        formateur:profiles!sessions_formateur_id_fkey(full_name),
        creneaux:session_creneaux(id, date, heure_debut, heure_fin, ordre)
      `)
      .eq('id', sessionId)
      .single(),
    admin
      .from('inscriptions')
      .select(`
        id, payer_profile_id,
        payer:profiles!inscriptions_payer_profile_id_fkey(
          account_type, full_name, email,
          company:company_details!company_details_profile_id_fkey(raison_sociale)
        ),
        participants:inscription_participants(
          id, participant_profile_id, employee_id,
          employee:employees(prenom, nom, email, profile_id),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .eq('statut', 'confirmee'),
  ]);
  if (!session) return null;

  const formation = one(session.formation as Maybe<{ titre: string; ref: string | null; modalite: string | null }>);
  const formateur = one(session.formateur as Maybe<{ full_name: string | null }>);
  const creneaux = ((session.creneaux ?? []) as Array<{
    id: string; date: string; heure_debut: string; heure_fin: string; ordre: number;
  }>).slice().sort((a, b) => a.ordre - b.ordre);
  const dates = creneaux.map((c) => c.date).sort();
  const dateDebut = dates[0] ?? null;
  const dateFin = dates[dates.length - 1] ?? null;

  type RawParticipant = {
    id: string;
    participant_profile_id: string | null;
    employee_id: string | null;
    employee: Maybe<{ prenom: string; nom: string; email: string | null; profile_id: string | null }>;
    profile: Maybe<{ full_name: string | null; email: string | null }>;
  };
  type RawPayer = {
    account_type: string | null;
    full_name: string | null;
    email: string | null;
    company: Maybe<{ raison_sociale: string | null }>;
  };

  const base: Array<Omit<FinFormationParticipant, 'heuresRealisees' | 'niveaux' | 'docs'>> = [];
  for (const ins of inscriptions ?? []) {
    const payer = one(ins.payer as Maybe<RawPayer>);
    const isEntreprise = payer?.account_type === 'entreprise';
    for (const p of (ins.participants ?? []) as RawParticipant[]) {
      const emp = one(p.employee);
      const prof = one(p.profile);
      const names = splitStagiaireName(emp, prof?.full_name);
      base.push({
        id: p.id,
        inscriptionId: ins.id,
        prenom: names.prenom,
        nom: names.nom,
        nomComplet: stagiaireNomComplet(names.prenom, names.nom),
        email: (emp?.email ?? prof?.email ?? '').trim(),
        profileId: p.participant_profile_id ?? emp?.profile_id ?? null,
        entreprise:
          isEntreprise && p.employee_id && ins.payer_profile_id
            ? {
                payerProfileId: ins.payer_profile_id,
                raisonSociale: one(payer!.company)?.raison_sociale || payer!.full_name || 'Entreprise',
                email: (payer!.email ?? '').trim(),
              }
            : null,
      });
    }
  }
  base.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
  const participantIds = base.map((p) => p.id);

  // Les niveaux par stagiaire (bilan de fin de formation) et les documents déjà
  // émis vivent dans des tables ajoutées par migration : une table absente
  // renvoie une erreur PostgREST, traitée comme « aucune ligne ».
  const [{ data: competences }, { data: absences }, { data: niveauRows }, { data: docRows }] = await Promise.all([
    admin
      .from('formation_competences')
      .select('id, libelle, ordre')
      .eq('formation_id', session.formation_id)
      .order('ordre'),
    participantIds.length > 0
      ? admin
          .from('creneau_absences')
          .select('creneau_id, inscription_participant_id')
          .in('inscription_participant_id', participantIds)
      : Promise.resolve({ data: [] as Array<{ creneau_id: string; inscription_participant_id: string }> }),
    participantIds.length > 0
      ? admin
          .from('inscription_participant_competences')
          .select('inscription_participant_id, competence_id, niveau')
          .in('inscription_participant_id', participantIds)
      : Promise.resolve({ data: [] as Array<{ inscription_participant_id: string; competence_id: string; niveau: string }> }),
    admin.from('fin_formation_documents').select(DOC_COLS).eq('session_id', sessionId),
  ]);

  const absentByParticipant = new Map<string, Set<string>>();
  for (const a of absences ?? []) {
    const set = absentByParticipant.get(a.inscription_participant_id) ?? new Set<string>();
    set.add(a.creneau_id);
    absentByParticipant.set(a.inscription_participant_id, set);
  }
  const niveauxByParticipant = new Map<string, Record<string, Niveau>>();
  for (const row of niveauRows ?? []) {
    if (!isNiveau(row.niveau)) continue;
    const rec = niveauxByParticipant.get(row.inscription_participant_id) ?? {};
    rec[row.competence_id] = row.niveau;
    niveauxByParticipant.set(row.inscription_participant_id, rec);
  }
  const docsByParticipant = new Map<string, Partial<Record<FinFormationKind, FinFormationDocRef>>>();
  for (const row of (docRows ?? []) as DocRow[]) {
    const ref = toDocRef(row);
    if (!ref) continue;
    const rec = docsByParticipant.get(ref.participantId) ?? {};
    rec[ref.kind] = ref;
    docsByParticipant.set(ref.participantId, rec);
  }

  const none = new Set<string>();
  const heuresPrevues = computeHeures(creneaux, none).prevues;

  return {
    sessionId,
    statut: session.statut,
    formationTitre: formation?.titre ?? 'Formation',
    formationRef: formation?.ref?.trim() || null,
    modalite: modaliteCourte(formation?.modalite),
    typeSession: typeSessionLabel(session.visibility),
    lieu: formatSessionLieu((session.adresse ?? null) as SessionAdresse | null),
    formateurNom: formateur?.full_name?.trim() || null,
    dateDebut,
    dateFin,
    heuresPrevues,
    terminee: isSessionTerminee(session.statut, dateFin, todayIsoParis()),
    competences: (competences ?? []).map((c) => ({ id: c.id, libelle: c.libelle })),
    participants: base.map((p) => ({
      ...p,
      heuresRealisees: computeHeures(creneaux, absentByParticipant.get(p.id) ?? none).realisees,
      niveaux: niveauxByParticipant.get(p.id) ?? {},
      docs: docsByParticipant.get(p.id) ?? {},
    })),
  };
}

/** Données d'un document pour un stagiaire de la session. */
export function buildFinFormationInput(
  session: FinFormationSession,
  participant: FinFormationParticipant,
  numero: string,
  dateEdition: string
): FinFormationInput {
  return {
    numero,
    dateEdition,
    formationTitre: session.formationTitre,
    formationRef: session.formationRef,
    dateDebut: session.dateDebut,
    dateFin: session.dateFin,
    lieu: session.lieu,
    modalite: session.modalite,
    typeSession: session.typeSession,
    formateurNom: session.formateurNom,
    heuresPrevues: session.heuresPrevues,
    stagiaire: {
      prenom: participant.prenom,
      nom: participant.nom,
      entreprise: participant.entreprise?.raisonSociale ?? null,
      heuresRealisees: participant.heuresRealisees,
    },
    competences: session.competences.map((c) => ({
      libelle: c.libelle,
      niveau: participant.niveaux[c.id] ?? null,
    })),
  };
}

/**
 * Documents émis pour des participations données, par participation
 * (certificat puis attestation). L'appelant doit avoir vérifié que ces
 * participations appartiennent bien à l'utilisateur connecté.
 */
export async function loadFinFormationDocs(participantIds: string[]): Promise<Map<string, FinFormationDocRef[]>> {
  const out = new Map<string, FinFormationDocRef[]>();
  if (participantIds.length === 0) return out;
  const admin = createAdminClient();
  const { data } = await admin
    .from('fin_formation_documents')
    .select(DOC_COLS)
    .in('inscription_participant_id', participantIds);
  for (const row of (data ?? []) as DocRow[]) {
    const ref = toDocRef(row);
    if (!ref) continue;
    const list = out.get(ref.participantId) ?? [];
    list.push(ref);
    out.set(ref.participantId, list);
  }
  for (const list of out.values()) {
    list.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'certificat' ? -1 : 1));
  }
  return out;
}
