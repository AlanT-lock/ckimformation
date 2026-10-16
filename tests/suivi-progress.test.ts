import { describe, expect, it } from 'vitest';
import {
  addDays,
  badgesFor,
  canCloseDay,
  isSessionEditable,
  isSuiviVisible,
  sessionDays,
  sessionProgress,
} from '@/lib/suivi/progress';

describe('sessionDays', () => {
  it('regroupe les créneaux par date, triées', () => {
    expect(
      sessionDays([{ date: '2026-10-13' }, { date: '2026-10-12' }, { date: '2026-10-12' }])
    ).toEqual(['2026-10-12', '2026-10-13']);
  });
});

describe('isSuiviVisible', () => {
  const days = ['2026-10-12', '2026-10-13'];
  it('pas avant le premier jour', () => expect(isSuiviVisible(days, '2026-10-11')).toBe(false));
  it('pendant la formation', () => expect(isSuiviVisible(days, '2026-10-12')).toBe(true));
  it('jusqu\'à 30 jours après la fin', () => {
    expect(isSuiviVisible(days, '2026-11-12')).toBe(true);
    expect(isSuiviVisible(days, '2026-11-13')).toBe(false);
  });
  it('aucune journée', () => expect(isSuiviVisible([], '2026-10-12')).toBe(false));
});

describe('sessionProgress', () => {
  it('sur les compétences quand la formation en a', () => {
    expect(sessionProgress({ competencesTotal: 12, competencesVues: 8, journeesTotal: 3, journeesTerminees: 1 }))
      .toEqual({ percent: 67, basis: 'competences' });
  });
  it('sur les journées sinon', () => {
    expect(sessionProgress({ competencesTotal: 0, competencesVues: 0, journeesTotal: 4, journeesTerminees: 1 }))
      .toEqual({ percent: 25, basis: 'journees' });
  });
});

describe('badgesFor', () => {
  it('débloque les paliers atteints', () => {
    expect(badgesFor(67).map((b) => b.atteint)).toEqual([true, true, false, false]);
    expect(badgesFor(100).every((b) => b.atteint)).toBe(true);
    expect(badgesFor(0).some((b) => b.atteint)).toBe(false);
  });
});

describe('règles formateur', () => {
  it('journée terminable dès sa date', () => {
    expect(canCloseDay('2026-10-12', '2026-10-11')).toBe(false);
    expect(canCloseDay('2026-10-12', '2026-10-12')).toBe(true);
  });
  it('session modifiable sauf terminée ou annulée', () => {
    expect(isSessionEditable('published')).toBe(true);
    expect(isSessionEditable('completed')).toBe(false);
    expect(isSessionEditable('cancelled')).toBe(false);
  });
  it('addDays gère les fins de mois', () => expect(addDays('2026-10-31', 1)).toBe('2026-11-01'));
});
