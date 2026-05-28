import { describe, it, expect } from 'vitest';

describe('reservation-actions module', () => {
  it('exports expected symbols', async () => {
    const mod = await import('@/app/(app)/admin/sessions/reservation-actions');
    expect(typeof mod.searchEtablissements).toBe('function');
    expect(typeof mod.createInvitationForSession).toBe('function');
    expect(typeof mod.resendInvitation).toBe('function');
    expect(typeof mod.cancelInvitation).toBe('function');
    expect(typeof mod.sendInvitationEmail).toBe('function');
  });
});
