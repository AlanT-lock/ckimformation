import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  employee: null as null | Record<string, unknown>,
  generateLink: vi.fn(),
  sendAndLog: vi.fn(async () => ({ ok: true })),
  findProfileByEmail: vi.fn(async () => null as unknown),
  sendEmployeeLinkInvitation: vi.fn(async () => ({ ok: true, resent: false })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: m.employee }) }) }) }),
    auth: { admin: { generateLink: m.generateLink } },
  }),
}));
vi.mock('@/lib/email/log', () => ({ sendAndLog: m.sendAndLog }));
vi.mock('@/lib/employees/invitations', () => ({
  findProfileByEmail: m.findProfileByEmail,
  sendEmployeeLinkInvitation: m.sendEmployeeLinkInvitation,
  getEntrepriseLabel: async () => 'ACME',
}));

import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';

const EMP = { id: 'e1', prenom: 'Léa', nom: 'Roy', email: 'lea@x.fr', profile_id: null, employer_profile_id: 'c1' };

beforeEach(() => {
  vi.clearAllMocks();
  m.employee = { ...EMP };
  m.findProfileByEmail.mockResolvedValue(null);
  m.generateLink.mockResolvedValue({ data: { properties: { action_link: 'https://link' } }, error: null });
});

describe('sendEmployeeAccountInvitation', () => {
  it('crée le compte (invite) avec employee_id et envoie un mail sans formation', async () => {
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res).toEqual({ ok: true, resent: false, mode: 'create' });
    const arg = m.generateLink.mock.calls[0][0];
    expect(arg.type).toBe('invite');
    expect(arg.options.data).toMatchObject({ employee_id: 'e1', employer_profile_id: 'c1', account_type: 'particulier' });
    expect(m.sendAndLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'employee_account_invitation', to: 'lea@x.fr', subject: '[C-KIM] Créez votre accès' }));
  });

  it('bascule en invitation de rattachement si un compte existe déjà', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p9', role: 'stagiaire', account_type: 'particulier', email: 'lea@x.fr', employer_profile_id: null, full_name: 'Léa' });
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res).toEqual({ ok: true, resent: false, mode: 'link' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('renvoie un lien recovery si la fiche a déjà un profil', async () => {
    m.employee = { ...EMP, profile_id: 'p1' };
    const res = await sendEmployeeAccountInvitation('e1', 'admin1', { formationTitre: 'SST' });
    expect(res).toEqual({ ok: true, resent: true, mode: 'recovery' });
    expect(m.generateLink.mock.calls[0][0].type).toBe('recovery');
  });

  it('erreur si le mail échoue', async () => {
    m.sendAndLog.mockResolvedValueOnce({ ok: false, error: 'boom' } as never);
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res.ok).toBe(false);
  });
});
