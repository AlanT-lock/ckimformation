export type EmargementBoardRole = 'formateur' | 'stagiaire';

export interface EmargementBoardCreneau {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  ordre: number;
}

export interface EmargementBoardEntry {
  id: string;
  creneauId: string;
  role: EmargementBoardRole;
  name: string;
  signedAt: string | null;
  signatureDataUrl: string | null;
}
