import { describe, it, expect } from 'vitest';
import { companyInvitationEmailHtml, companyInvitationEmailSubject } from '@/lib/email/templates/company-invitation';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';

describe('company-invitation', () => {
  it('échappe le HTML et contient le lien', () => {
    const html = companyInvitationEmailHtml({ contactNom: 'Jo <b>', raisonSociale: 'A&B', invitationUrl: 'https://x/y' });
    expect(html).toContain('Jo &lt;b&gt;');
    expect(html).toContain('A&amp;B');
    expect(html).toContain('href="https://x/y"');
    expect(html).toContain('Créer mon mot de passe');
  });
  it('variante renvoi', () => {
    const html = companyInvitationEmailHtml({ contactNom: 'Jo', raisonSociale: 'ACME', invitationUrl: 'https://x', isResend: true });
    expect(html).toContain('Définir mon mot de passe');
    expect(companyInvitationEmailSubject('ACME', true)).toBe("[C-KIM] Nouveau lien d'accès — ACME");
    expect(companyInvitationEmailSubject('ACME')).toBe('[C-KIM] Activez l’espace entreprise de ACME');
  });
});

describe('invitation salarié sans formation', () => {
  it('ne mentionne pas de formation', () => {
    const html = invitationEmailHtml({ prenom: 'Léa', nom: 'Roy', entrepriseLabel: 'ACME', formationTitre: null, invitationUrl: 'https://x' });
    expect(html).toContain('ACME vous a créé un accès');
    expect(html).not.toContain('Formation :');
    expect(invitationEmailSubject(null)).toBe('[C-KIM] Créez votre accès');
    expect(invitationEmailSubject(null, true)).toBe("[C-KIM] Nouveau lien d'accès");
  });
  it('garde le comportement avec formation', () => {
    const html = invitationEmailHtml({ prenom: 'Léa', nom: 'Roy', entrepriseLabel: 'ACME', formationTitre: 'SST', invitationUrl: 'https://x' });
    expect(html).toContain('Formation : <strong>SST</strong>');
    expect(invitationEmailSubject('SST')).toBe('[C-KIM] Créez votre accès — SST');
  });
});
