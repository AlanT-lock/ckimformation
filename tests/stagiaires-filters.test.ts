import { describe, expect, it } from 'vitest';
import { createdAtBounds, parisDayStartIso, parseStagiairesFilters } from '@/lib/stagiaires/filters';

describe('parseStagiairesFilters', () => {
  it('garde les valeurs valides', () => {
    const f = parseStagiairesFilters({
      q: '  dupont ',
      du: '2026-01-31',
      au: '2026-02-28',
      entreprise: '3f1c2a9e-1b2c-4d5e-8f90-123456789abc',
      tri: 'recent',
    });
    expect(f).toEqual({
      q: 'dupont',
      du: '2026-01-31',
      au: '2026-02-28',
      entreprise: '3f1c2a9e-1b2c-4d5e-8f90-123456789abc',
      tri: 'recent',
    });
  });

  it('ignore les valeurs invalides', () => {
    const f = parseStagiairesFilters({ du: '2026-02-30', au: 'hier', entreprise: "x') or 1=1", tri: 'nimp' });
    expect(f).toEqual({ q: '', du: null, au: null, entreprise: null, tri: 'nom' });
  });
});

describe('bornes Europe/Paris', () => {
  it('minuit Paris en hiver (UTC+1)', () => {
    expect(parisDayStartIso('2026-01-15')).toBe('2026-01-14T23:00:00.000Z');
  });

  it('minuit Paris en été (UTC+2)', () => {
    expect(parisDayStartIso('2026-07-15')).toBe('2026-07-14T22:00:00.000Z');
  });

  it('jour « au » inclus', () => {
    expect(createdAtBounds('2026-03-01', '2026-03-31')).toEqual({
      gte: '2026-02-28T23:00:00.000Z',
      lt: '2026-03-31T22:00:00.000Z',
    });
  });

  it('bornes optionnelles', () => {
    expect(createdAtBounds(null, null)).toEqual({ gte: null, lt: null });
  });
});
