import { describe, it, expect } from 'vitest';
import { summarizeCatalogue } from '@/lib/db/formations';
import { summarizeTitres } from '@/lib/parcours';

const row = (parcours: string | null, titre: string) => ({ parcours, titre });

describe('summarizeCatalogue', () => {
  it('ne compte que les parcours ayant au moins une formation active', () => {
    const stats = summarizeCatalogue([
      row('securite', 'SST'),
      row('certifiant', 'FPA'),
      row('securite', 'Incendie'),
      row('qualite', 'Qualiopi'),
    ]);
    expect(stats.parcours.map((p) => p.key)).toEqual(['securite', 'qualite', 'certifiant']);
    expect(stats.parcours[0].titres).toEqual(['SST', 'Incendie']);
    expect(stats.nbFormations).toBe(4);
  });

  it('rattache une formation sans parcours à « securite », comme le catalogue', () => {
    const stats = summarizeCatalogue([row(null, 'A'), row('alimentaire', 'B')]);
    expect(stats.parcours.map((p) => p.key)).toEqual(['securite', 'alimentaire']);
    expect(stats.nbFormations).toBe(2);
  });

  it("ignore un parcours inconnu, que le catalogue n'affiche pas", () => {
    const stats = summarizeCatalogue([row('securite', 'A'), row('parcours-inconnu', 'B')]);
    expect(stats.parcours.map((p) => p.key)).toEqual(['securite']);
    expect(stats.nbFormations).toBe(1);
  });

  it('renvoie un catalogue vide sans formation', () => {
    expect(summarizeCatalogue([])).toEqual({ nbFormations: 0, parcours: [] });
  });
});

describe('summarizeTitres', () => {
  it('liste tous les intitulés quand ils sont peu nombreux', () => {
    expect(summarizeTitres(['A', 'B'])).toBe('A · B');
  });

  it('indique le nombre de formations restantes', () => {
    expect(summarizeTitres(['A', 'B', 'C', 'D'])).toBe('A · B · C · + 1 autre');
    expect(summarizeTitres(['A', 'B', 'C', 'D', 'E'])).toBe('A · B · C · + 2 autres');
  });
});
