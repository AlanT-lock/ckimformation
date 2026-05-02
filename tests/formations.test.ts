import { describe, it, expect } from 'vitest';
import { formations, getFormationBySlug } from '@/lib/formations';

describe('formations registry', () => {
  it('exposes at least one formation', () => {
    expect(formations.length).toBeGreaterThan(0);
  });

  it('finds a formation by slug', () => {
    const f = getFormationBySlug('incendie-extincteur-evacuation');
    expect(f).toBeDefined();
    expect(f?.titre).toContain('Incendie');
  });

  it('returns undefined for unknown slug', () => {
    expect(getFormationBySlug('does-not-exist')).toBeUndefined();
  });
});
