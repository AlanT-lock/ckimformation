export type UserRole = 'admin' | 'formateur' | 'stagiaire';
export type AccountType = 'particulier' | 'entreprise';
export type SessionStatut = 'draft' | 'published' | 'cancelled' | 'completed';
export type InscriptionStatut =
  | 'en_attente'
  | 'documents_demandes'
  | 'documents_recus'
  | 'confirmee'
  | 'refusee'
  // Dormant : ancien workflow paiement Stripe, conservé pour compat enum BDD
  | 'pending_payment'
  | 'paid'
  | 'cancelled'
  | 'refunded';
export type TestKind = 'quiz' | 'enquete' | 'info';
export type EnqueteKind = 'a_chaud' | 'a_froid';
export type QuestionType =
  | 'qcm_unique'
  | 'qcm_multiple'
  | 'texte_libre'
  | 'echelle'
  | 'liste';

export interface BillingAddress {
  rue?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
}

export interface SessionAdresse {
  rue?: string;
  ville?: string;
  code_postal?: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
}

export interface Profile {
  id: string;
  role: UserRole;
  account_type: AccountType | null;
  full_name: string;
  phone: string | null;
  email: string;
  employer_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyDetails {
  profile_id: string;
  raison_sociale: string;
  siret: string | null;
  tva_intra: string | null;
  contact_fonction: string | null;
  billing_address: BillingAddress;
  created_at: string;
}

export interface Formation {
  id: string;
  slug: string;
  titre: string;
  parcours: string | null;
  actif: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  formation_id: string;
  formateur_id: string | null;
  statut: SessionStatut;
  adresse: SessionAdresse;
  notes_internes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionCreneau {
  id: string;
  session_id: string;
  ordre: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  created_at: string;
}

export interface Employee {
  id: string;
  employer_profile_id: string;
  profile_id: string | null;
  prenom: string;
  nom: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Inscription {
  id: string;
  session_id: string;
  payer_profile_id: string;
  participant_profile_id: string | null;
  statut: InscriptionStatut;
  analyse_besoins: string | null;
  refus_motif: string | null;
  confirmed_at: string | null;
  refused_at: string | null;
  montant_centimes: number | null;
  stripe_session_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InscriptionParticipant {
  id: string;
  inscription_id: string;
  employee_id: string | null;
  participant_profile_id: string | null;
  created_at: string;
}

export interface CreneauEmargementTrigger {
  id: string;
  session_id: string;
  creneau_id: string;
  triggered_at: string;
  triggered_by: string | null;
  closed_at: string | null;
}

export interface SessionTestTrigger {
  id: string;
  session_id: string;
  test_id: string;
  triggered_at: string;
  triggered_by: string | null;
}

export interface InscriptionDocumentDemande {
  id: string;
  inscription_id: string;
  nom: string;
  ordre: number;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string | null;
  declined: boolean;
  decline_reason: string | null;
  requested_by: string | null;
  requested_at: string;
}

export interface InscriptionAdminDocument {
  id: string;
  inscription_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface CreneauAbsence {
  id: string;
  creneau_id: string;
  inscription_participant_id: string;
  marked_by: string | null;
  marked_at: string;
  reason: string | null;
}
