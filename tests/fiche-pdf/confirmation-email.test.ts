import { describe, it, expect } from 'vitest';
import { confirmationEmailHtml } from '@/lib/email/templates/inscription';

const BASE = {
  payer: { type: 'particulier' as const, raison_sociale: null, full_name: 'Léa Roy', email: 'lea@x.fr', phone: null },
  session: { formation_titre: 'SST', creneaux: [], adresse: null, formateur_nom: null },
  participants: [{ prenom: 'Léa', nom: 'Roy', email: 'lea@x.fr' }],
};

describe('mail de confirmation — fiche de la formation', () => {
  it('mentionne la fiche jointe et donne un lien de consultation', () => {
    const html = confirmationEmailHtml({ ...BASE, ficheUrl: 'https://site/api/formations/sst/pdf' });
    expect(html).toContain('Fiche de la formation');
    expect(html).toContain('href="https://site/api/formations/sst/pdf"');
  });
  it('sans fiche : pas de bloc', () => {
    expect(confirmationEmailHtml(BASE)).not.toContain('Fiche de la formation');
  });
});
