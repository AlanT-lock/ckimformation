import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDate, formatTime, formatDateLong } from '@/lib/date';

describe('lib/date — fuseau Europe/Paris figé', () => {
  it('formatDateTime applique CEST (UTC+2) en été', () => {
    const out = formatDateTime('2026-06-22T15:30:00Z');
    expect(out).toContain('22/06/2026');
    expect(out).toContain('17:30'); // 15:30 UTC + 2h
  });

  it('formatDateTime applique CET (UTC+1) en hiver', () => {
    const out = formatDateTime('2026-01-22T15:30:00Z');
    expect(out).toContain('22/01/2026');
    expect(out).toContain('16:30'); // 15:30 UTC + 1h
  });

  it('formatTime renvoie l\'heure Paris', () => {
    expect(formatTime('2026-06-22T15:30:00Z')).toContain('17:30');
  });

  it('formatDate sur une date seule ne décale pas le jour', () => {
    expect(formatDate('2026-06-22')).toContain('22/06/2026');
  });

  it('formatDateLong renvoie le format long fr', () => {
    const out = formatDateLong('2026-06-22T10:00:00Z');
    expect(out).toContain('juin');
    expect(out).toContain('2026');
  });

  it('entrée vide → chaîne vide', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatTime('')).toBe('');
    expect(formatDateTime('pas-une-date')).toBe('');
  });
});
