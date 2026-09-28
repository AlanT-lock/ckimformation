export function firstAndLastDate(
  creneaux: { date: string; ordre: number }[] | null,
): { firstDate: string | null; lastDate: string | null } {
  const sorted = (creneaux ?? []).slice().sort((a, b) => a.ordre - b.ordre);
  return { firstDate: sorted[0]?.date ?? null, lastDate: sorted[sorted.length - 1]?.date ?? null };
}

export interface RawCompanySession {
  id: string;
  statut: string;
  visibility: 'public' | 'reserved';
  reserved_company_id: string | null;
  formation: { titre: string } | { titre: string }[] | null;
  creneaux: { date: string; ordre: number }[] | null;
}

export interface CompanySessionRow {
  id: string;
  formationTitre: string;
  firstDate: string | null;
  lastDate: string | null;
  statut: string;
  reserved: boolean;
  participants: string[];
}

/** Lignes du bloc « Sessions » de la fiche entreprise : date de début décroissante, sans date en dernier. */
export function buildCompanySessionRows(
  sessions: RawCompanySession[],
  participantsBySession: Map<string, string[]>,
): CompanySessionRow[] {
  const rows = sessions.map((s) => {
    const formation = Array.isArray(s.formation) ? s.formation[0] : s.formation;
    return {
      id: s.id,
      formationTitre: formation?.titre ?? '—',
      ...firstAndLastDate(s.creneaux),
      statut: s.statut,
      reserved: s.visibility === 'reserved',
      participants: participantsBySession.get(s.id) ?? [],
    };
  });
  return rows.sort((a, b) => {
    if (!a.firstDate) return b.firstDate ? 1 : 0;
    if (!b.firstDate) return -1;
    return b.firstDate.localeCompare(a.firstDate);
  });
}
