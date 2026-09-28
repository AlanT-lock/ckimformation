import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  row: null as null | Record<string, unknown>,
  download: vi.fn(),
  render: vi.fn(async () => Buffer.from('%PDF-generated')),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ storage: { from: () => ({ download: m.download }) } }),
}));
vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: m.render }));
vi.mock('@/lib/pdf/FormationPDF', () => ({ FormationPDF: () => null }));
vi.mock('@/lib/db/formations', () => ({
  rowToFormation: (r: Record<string, unknown>) => ({ ...r }),
}));

import { loadFormationFiche } from '@/lib/formations/fiche-pdf';

function client() {
  const b = {
    select: () => b,
    eq: () => b,
    maybeSingle: async () => ({ data: m.row, error: null }),
  };
  return { from: () => b } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  m.row = { id: 'f1', slug: 'sst', ref: 'SST', titre: 'SST', fiche_pdf_path: null };
});

describe('loadFormationFiche', () => {
  it('génère la fiche quand aucun PDF n’a été déposé', async () => {
    const f = await loadFormationFiche(client(), 'sst');
    expect(f).toMatchObject({ source: 'generated', filename: 'CKIM-SST-sst.pdf' });
    expect(m.render).toHaveBeenCalled();
    expect(m.download).not.toHaveBeenCalled();
  });

  it('sert le PDF déposé quand il existe', async () => {
    m.row = { ...m.row, fiche_pdf_path: 'f1/fiche.pdf' };
    m.download.mockResolvedValue({ data: new Blob(['%PDF-custom']), error: null });
    const f = await loadFormationFiche(client(), 'sst');
    expect(f?.source).toBe('custom');
    expect(Buffer.from(f!.buffer).toString()).toBe('%PDF-custom');
    expect(m.render).not.toHaveBeenCalled();
  });

  it('retombe sur la fiche générée si le PDF déposé est introuvable', async () => {
    m.row = { ...m.row, fiche_pdf_path: 'f1/perdu.pdf' };
    m.download.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const f = await loadFormationFiche(client(), 'sst');
    expect(f?.source).toBe('generated');
  });

  it('null si la formation n’existe pas (ou n’est pas visible)', async () => {
    m.row = null;
    expect(await loadFormationFiche(client(), 'inconnue')).toBeNull();
  });
});
