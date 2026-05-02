import { describe, it, expect } from 'vitest';
import { devisSchema } from '@/lib/validation/devis';
import { contactEntrepriseSchema, contactParticulierSchema } from '@/lib/validation/contact';

describe('devisSchema', () => {
  it('accepts a valid payload', () => {
    const r = devisSchema.safeParse({
      formation: 'incendie-extincteur-evacuation',
      nom: 'Jean Dupont',
      email: 'jean@test.com',
      telephone: '0612345678',
      message: 'Bonjour',
      honeypot: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing email', () => {
    const r = devisSchema.safeParse({ formation: 'x', nom: 'X', telephone: '06', message: '', honeypot: '' });
    expect(r.success).toBe(false);
  });

  it('rejects when honeypot is filled (bot)', () => {
    const r = devisSchema.safeParse({
      formation: 'x', nom: 'X', email: 'a@b.c', telephone: '06', message: '', honeypot: 'bot',
    });
    expect(r.success).toBe(false);
  });
});

describe('contactEntrepriseSchema', () => {
  it('requires raisonSociale', () => {
    const r = contactEntrepriseSchema.safeParse({
      nom: 'X', email: 'a@b.c', telephone: '06', message: 'm', honeypot: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('contactParticulierSchema', () => {
  it('accepts a valid payload', () => {
    const r = contactParticulierSchema.safeParse({
      nom: 'Jean', email: 'jean@test.com', telephone: '0612345678', message: 'Bonjour', honeypot: '',
    });
    expect(r.success).toBe(true);
  });
});
