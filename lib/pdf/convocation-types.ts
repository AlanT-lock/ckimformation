import type { InscriptionStatut } from '@/lib/supabase/types';

export interface ConvocationCreneau {
  date: string;
  heureDebut: string;
  heureFin: string;
}

export interface ConvocationParticipant {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  statut: InscriptionStatut;
  lastSentAt: string | null;
}

export interface SessionConvocationData {
  sessionId: string;
  formationTitre: string;
  lieu: string;
  creneaux: ConvocationCreneau[];
  participants: ConvocationParticipant[];
}
