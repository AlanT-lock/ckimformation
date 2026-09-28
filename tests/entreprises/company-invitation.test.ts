import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  generateLink: vi.fn(),
  getUserById: vi.fn(),
  sendAndLog: vi.fn(async () => ({ ok: true })),
  findProfileByEmail: vi.fn(async () => null as unknown),
  linkedCount: 0,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ count: m.linkedCount }) }),
    }),
    auth: { admin: { generateLink: m.generateLink, getUserById: m.getUserById } },
  }),
}));
vi.mock('@/lib/email/log', () => ({ sendAndLog: m.sendAndLog }));
vi.mock('@/lib/employees/invitations', () => ({ findProfileByEmail: m.findProfileByEmail }));

import { inviteNewCompany } from '@/lib/companies/invitation';

const INPUT = {
  raison_sociale: 'ACME', siret: '', tva_intra: '', secteur_activite: '',
  addr_rue: '1 rue A', addr_cp: '75001', addr_ville: 'Paris',
  full_name: 'Jeanne Martin', contact_fonction: 'DRH', email: 'RH@acme.fr', phone: '01',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.linkedCount = 0;
  m.findProfileByEmail.mockResolvedValue(null);
  m.generateLink.mockResolvedValue({ data: { user: { id: 'new-id' }, properties: { action_link: 'https://link' } }, error: null });
});

describe('inviteNewCompany', () => {
  it('refuse une saisie invalide sans rien créer', async () => {
    const res = await inviteNewCompany({ ...INPUT, raison_sociale: '' });
    expect(res).toEqual({ ok: false, error: 'La raison sociale est obligatoire.' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('crée le compte avec les métadonnées entreprise et envoie le mail', async () => {
    const res = await inviteNewCompany(INPUT);
    expect(res).toEqual({ ok: true, id: 'new-id', emailSent: true });
    const arg = m.generateLink.mock.calls[0][0];
    expect(arg).toMatchObject({ type: 'invite', email: 'rh@acme.fr' });
    expect(arg.options.data).toMatchObject({ account_type: 'entreprise', raison_sociale: 'ACME' });
    expect(m.sendAndLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'company_invitation', to: 'rh@acme.fr', toProfileId: 'new-id' }));
  });

  it('refuse un email déjà utilisé et propose la conversion si particulier', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p1', role: 'stagiaire', account_type: 'particulier', employer_profile_id: null, email: 'rh@acme.fr', full_name: 'X' });
    const res = await inviteNewCompany(INPUT);
    expect(res).toMatchObject({ ok: false, convertibleProfileId: 'p1' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('refuse un email de compte non convertible sans proposer de conversion', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p2', role: 'formateur', account_type: null, employer_profile_id: null, email: 'rh@acme.fr', full_name: 'X' });
    const res = await inviteNewCompany(INPUT);
    expect(res.ok).toBe(false);
    expect(res).not.toHaveProperty('convertibleProfileId');
  });

  it('compte créé mais mail en échec → ok avec emailSent=false', async () => {
    m.sendAndLog.mockResolvedValueOnce({ ok: false, error: 'boom' } as never);
    expect(await inviteNewCompany(INPUT)).toEqual({ ok: true, id: 'new-id', emailSent: false });
  });
});
