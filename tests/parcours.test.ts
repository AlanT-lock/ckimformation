import { describe, it, expect } from 'vitest';
import { PARCOURS_META, getParcoursMeta } from '@/lib/parcours';

describe('parcours metadata', () => {
  it('has all 8 parcours defined', () => {
    expect(Object.keys(PARCOURS_META)).toHaveLength(8);
  });

  it('returns metadata for a known parcours', () => {
    const meta = getParcoursMeta('securite');
    expect(meta.label).toBe('Sécurité');
    expect(meta.couleur).toBe('#1B8FA0');
  });
});
