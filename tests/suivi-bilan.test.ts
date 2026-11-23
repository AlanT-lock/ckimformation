import { describe, expect, it } from 'vitest';
import { bilanStatut, competencesManquantes, countNiveaux, isNiveau } from '@/lib/suivi/bilan';

describe('isNiveau', () => {
  it('accepte les trois niveaux et rien d’autre', () => {
    expect(isNiveau('acquise')).toBe(true);
    expect(isNiveau('en_cours')).toBe(true);
    expect(isNiveau('non_acquise')).toBe(true);
    expect(isNiveau('vue')).toBe(false);
    expect(isNiveau('')).toBe(false);
    expect(isNiveau(undefined)).toBe(false);
  });
});

describe('countNiveaux', () => {
  it('compte par niveau en ignorant les compétences sans niveau ou hors formation', () => {
    expect(
      countNiveaux(['a', 'b', 'c', 'd'], { a: 'acquise', b: 'acquise', c: 'en_cours', supprimee: 'non_acquise' })
    ).toEqual({ acquise: 2, en_cours: 1, non_acquise: 0 });
  });
});

describe('competencesManquantes', () => {
  it('liste les compétences de la formation sans niveau', () => {
    expect(competencesManquantes(['a', 'b', 'c'], { a: 'acquise', c: 'non_acquise' })).toEqual(['b']);
    expect(competencesManquantes(['a'], { a: 'en_cours' })).toEqual([]);
  });
});

describe('bilanStatut', () => {
  const base = { evaluationsTotal: 1, evaluationsRemplies: 0, competencesTotal: 3, competencesEvaluees: 0 };

  it('à remplir tant que rien n’est saisi', () => {
    expect(bilanStatut(base)).toBe('a_remplir');
  });

  it('en cours si seule une partie est faite (ex. évaluation remplie avant l’ajout des compétences)', () => {
    expect(bilanStatut({ ...base, evaluationsRemplies: 1 })).toBe('en_cours');
    expect(bilanStatut({ ...base, competencesEvaluees: 3 })).toBe('en_cours');
  });

  it('complet quand les évaluations et toutes les compétences sont renseignées', () => {
    expect(bilanStatut({ ...base, evaluationsRemplies: 1, competencesEvaluees: 3 })).toBe('complet');
  });

  it('fonctionne pour une formation sans questionnaire ou sans compétence', () => {
    expect(bilanStatut({ evaluationsTotal: 0, evaluationsRemplies: 0, competencesTotal: 2, competencesEvaluees: 2 })).toBe('complet');
    expect(bilanStatut({ evaluationsTotal: 2, evaluationsRemplies: 2, competencesTotal: 0, competencesEvaluees: 0 })).toBe('complet');
    expect(bilanStatut({ evaluationsTotal: 0, evaluationsRemplies: 0, competencesTotal: 0, competencesEvaluees: 0 })).toBe('a_remplir');
  });
});
