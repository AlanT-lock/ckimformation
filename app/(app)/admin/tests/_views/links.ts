// Liens des pages Tests & enquêtes. Avec une formation : sous les onglets de la
// formation (`/admin/formations/[id]/tests/...`) ; sans formation (enquête
// financeur commune ouverte seule) : routes `/admin/tests/...`.

export interface TestLinks {
  list: string;
  test: (testId: string) => string;
  results: (testId: string) => string;
  nouveau: (query: string) => string;
  financeur: string;
}

export function testLinks(formationId: string | null): TestLinks {
  if (!formationId) {
    return {
      list: '/admin/formations',
      test: (id) => `/admin/tests/${id}`,
      results: (id) => `/admin/tests/${id}/resultats`,
      nouveau: () => '/admin/formations',
      financeur: '/admin/tests/financeur',
    };
  }
  const base = `/admin/formations/${formationId}/tests`;
  return {
    list: base,
    test: (id) => `${base}/${id}`,
    results: (id) => `${base}/${id}/resultats`,
    nouveau: (query) => `${base}/nouveau${query ? `?${query}` : ''}`,
    financeur: `${base}/financeur`,
  };
}
