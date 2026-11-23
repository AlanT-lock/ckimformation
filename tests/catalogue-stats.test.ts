import { describe, it, expect } from 'vitest';
import { summarizeCatalogue } from '@/lib/db/formations';

describe('summarizeCatalogue', () => {
  it('ne compte que les parcours ayant au moins une formation active', () => {
    const stats = summarizeCatalogue(['securite', 'securite', 'certifiant', 'qualite']);
    expect(stats.parcours).toEqual(['securite', 'qualite', 'certifiant']);
    expect(stats.nbFormations).toBe(4);
  });

  it('rattache une formation sans parcours à « securite », comme le catalogue', () => {
    const stats = summarizeCatalogue([null, 'alimentaire']);
    expect(stats.parcours).toEqual(['securite', 'alimentaire']);
    expect(stats.nbFormations).toBe(2);
  });

  it("ignore un parcours inconnu, que le catalogue n'affiche pas", () => {
    const stats = summarizeCatalogue(['securite', 'parcours-inconnu']);
    expect(stats.parcours).toEqual(['securite']);
    expect(stats.nbFormations).toBe(1);
  });

  it('renvoie un catalogue vide sans formation', () => {
    expect(summarizeCatalogue([])).toEqual({ nbFormations: 0, parcours: [] });
  });
});
