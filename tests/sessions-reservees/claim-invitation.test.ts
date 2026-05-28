import { describe, it, expect } from 'vitest';
import { generateInvitationToken } from '@/lib/supabase/session-invitations';

describe('generateInvitationToken', () => {
  it('produit une chaîne ≥ 32 caractères, unique', () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(b.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]*$/);
  });
});
