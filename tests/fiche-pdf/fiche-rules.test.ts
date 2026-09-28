import { describe, it, expect } from 'vitest';
import {
  MAX_FICHE_BYTES,
  ficheContentDisposition,
  ficheFilename,
  validateFichePdf,
} from '@/lib/formations/fiche-rules';

const PDF_HEAD = new TextEncoder().encode('%PDF-1.7\n');

describe('validateFichePdf', () => {
  it('accepte un vrai PDF', () => {
    expect(validateFichePdf({ size: 1000, type: 'application/pdf', name: 'fiche.pdf' }, PDF_HEAD)).toBeNull();
  });
  it('accepte un PDF dont le navigateur n’a pas donné le type', () => {
    expect(validateFichePdf({ size: 1000, type: '', name: 'fiche.PDF' }, PDF_HEAD)).toBeNull();
  });
  it('refuse un fichier vide', () => {
    expect(validateFichePdf({ size: 0, type: 'application/pdf', name: 'f.pdf' }, PDF_HEAD)).toMatch(/vide/);
  });
  it('refuse un fichier trop lourd', () => {
    expect(validateFichePdf({ size: MAX_FICHE_BYTES + 1, type: 'application/pdf', name: 'f.pdf' }, PDF_HEAD)).toMatch(/volumineux/);
  });
  it('refuse un fichier qui n’est pas un PDF même renommé en .pdf', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(validateFichePdf({ size: 1000, type: 'application/pdf', name: 'image.pdf' }, png)).toMatch(/PDF/);
  });
  it('refuse une extension non PDF', () => {
    expect(validateFichePdf({ size: 1000, type: 'image/png', name: 'image.png' }, PDF_HEAD)).toMatch(/PDF/);
  });
});

describe('ficheFilename', () => {
  it('construit un nom propre, sans accents', () => {
    expect(ficheFilename({ ref: 'SST-01', slug: 'sauveteur-secouriste' })).toBe('CKIM-SST-01-sauveteur-secouriste.pdf');
    expect(ficheFilename({ ref: '', slug: 'hygiène alimentaire' })).toBe('CKIM-CKIM-hygiene-alimentaire.pdf');
  });
});

describe('ficheContentDisposition', () => {
  it('inline par défaut (visualisation), attachment si téléchargement demandé', () => {
    expect(ficheContentDisposition('a.pdf', false)).toBe('inline; filename="a.pdf"');
    expect(ficheContentDisposition('a.pdf', true)).toBe('attachment; filename="a.pdf"');
  });
});
