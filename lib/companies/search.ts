import { normalizeSearchText } from '@/lib/sessions/stagiaire-search';

/** Raison sociale, SIRET, contact ou email — accents et ordre des mots indifférents. */
export function companyMatchesQuery(
  row: { raison_sociale: string; siret: string | null; contact: string; email: string },
  query: string,
): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const hay = normalizeSearchText(`${row.raison_sociale} ${row.siret ?? ''} ${row.contact} ${row.email}`);
  return q.split(' ').every((token) => hay.includes(token));
}
