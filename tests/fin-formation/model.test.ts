import { describe, expect, it } from 'vitest';
import {
  attestationModel,
  certificatModel,
  computeHeures,
  creneauHours,
  documentFileName,
  fmtIsoDate,
  formatNumero,
  headLines,
  heuresTxt,
  isSessionTerminee,
  modaliteCourte,
  previewNumero,
  sessionChecks,
  stagiaireNomComplet,
  typeSessionLabel,
  type DocBlock,
  type DocModel,
  type FinFormationInput,
} from '@/lib/fin-formation/model';

const input: FinFormationInput = {
  numero: 'CR-2026-0007',
  dateEdition: '2026-11-23',
  formationTitre: 'Sauveteur Secouriste du Travail',
  formationRef: 'SECU-01',
  dateDebut: '2026-11-19',
  dateFin: '2026-11-20',
  lieu: '13 boulevard Foch, 83300 Draguignan',
  modalite: 'Présentiel',
  typeSession: 'inter-entreprises',
  formateurNom: 'Jean Formateur',
  heuresPrevues: 14,
  stagiaire: { prenom: 'Marie', nom: 'Durand', entreprise: 'Exemple SARL', heuresRealisees: 10.5 },
  competences: [
    { libelle: 'Protéger', niveau: 'acquise' },
    { libelle: 'Examiner', niveau: 'en_cours' },
    { libelle: 'Secourir', niveau: null },
  ],
};

/** Tout le texte d'un document, pour vérifier les mentions. */
function textOf(model: DocModel): string {
  const runs = (b: DocBlock): string => {
    switch (b.t) {
      case 'intro':
      case 'p':
      case 'clause':
      case 'small':
        return b.runs.map((r) => r.text).join('');
      case 'checks':
        return b.items.map((i) => `${i.checked ? '[X]' : '[ ]'} ${i.label}`).join('\n');
      case 'foot':
        return b.notes.map(([n, t]) => `${n} ${t}`).join('\n');
      case 'kv':
        return b.rows.map((r) => `${r.k} : ${r.v.map((x) => x.text).join('')}`).join('\n');
      case 'h':
        return b.text;
      case 'box':
        return [b.title, ...b.lines].join('\n');
      case 'res':
        return [b.head.join(' | '), ...b.rows.map((r) => `${r.libelle} | ${r.niveau ?? ''}`)].join('\n');
      case 'sign':
        return `${b.left.map((r) => r.text).join('')}\n${b.rightTitle}`;
    }
  };
  return [model.title, model.legal, ...model.blocks.map(runs)].join('\n');
}

describe('isSessionTerminee', () => {
  it('statut « Terminée », quelles que soient les dates', () => {
    expect(isSessionTerminee('completed', '2026-12-01', '2026-11-23')).toBe(true);
    expect(isSessionTerminee('completed', null, '2026-11-23')).toBe(true);
  });
  it('session publiée dont le dernier créneau est passé', () => {
    expect(isSessionTerminee('published', '2026-11-22', '2026-11-23')).toBe(true);
  });
  it('pas le jour même du dernier créneau, ni avant', () => {
    expect(isSessionTerminee('published', '2026-11-23', '2026-11-23')).toBe(false);
    expect(isSessionTerminee('published', '2026-11-24', '2026-11-23')).toBe(false);
  });
  it('jamais pour un brouillon, une session annulée ou sans créneau', () => {
    expect(isSessionTerminee('draft', '2026-01-01', '2026-11-23')).toBe(false);
    expect(isSessionTerminee('cancelled', '2026-01-01', '2026-11-23')).toBe(false);
    expect(isSessionTerminee('published', null, '2026-11-23')).toBe(false);
  });
});

describe('heures', () => {
  it('durée d’un créneau', () => {
    expect(creneauHours('09:00:00', '12:30:00')).toBe(3.5);
    expect(creneauHours('13:30', '17:00')).toBe(3.5);
    expect(creneauHours('12:00', '09:00')).toBe(0);
    expect(creneauHours('', '09:00')).toBe(0);
  });
  it('prévues = tous les créneaux ; réalisées = hors créneaux d’absence', () => {
    const creneaux = [
      { id: 'a', heure_debut: '09:00:00', heure_fin: '12:30:00' },
      { id: 'b', heure_debut: '13:30:00', heure_fin: '17:00:00' },
      { id: 'c', heure_debut: '09:00:00', heure_fin: '12:30:00' },
      { id: 'd', heure_debut: '13:30:00', heure_fin: '17:00:00' },
    ];
    expect(computeHeures(creneaux, new Set())).toEqual({ prevues: 14, realisees: 14 });
    expect(computeHeures(creneaux, new Set(['d']))).toEqual({ prevues: 14, realisees: 10.5 });
    expect(computeHeures([], new Set())).toEqual({ prevues: 0, realisees: 0 });
  });
  it('libellé', () => {
    expect(heuresTxt(14)).toBe('14 heures');
    expect(heuresTxt(10.5)).toBe('10,5 heures');
    expect(heuresTxt(1)).toBe('1 heure');
    expect(heuresTxt(0)).toBe('0 heures');
  });
});

describe('numéros, noms et libellés', () => {
  it('numéro définitif et numéro d’aperçu', () => {
    expect(formatNumero('certificat', 2026, 7)).toBe('CR-2026-0007');
    expect(formatNumero('attestation', 2026, 123)).toBe('AFF-2026-0123');
    expect(previewNumero('certificat', '2026-11-23')).toBe('CR-2026-…');
  });
  it('nom du stagiaire : nom de famille en capitales', () => {
    expect(stagiaireNomComplet('Marie', 'Durand')).toBe('Marie DURAND');
    expect(stagiaireNomComplet('Marie', '')).toBe('Marie');
    expect(stagiaireNomComplet('', '')).toBe('—');
  });
  it('nom de fichier sans accent ni espace', () => {
    expect(documentFileName('certificat', 'Marie-Hélène DURAND', 'CR-2026-0007')).toBe(
      'Certificat-de-realisation_Marie-Helene-DURAND_CR-2026-0007.pdf'
    );
    expect(documentFileName('attestation', 'Marie DURAND', 'AFF-2026-0007')).toBe(
      'Attestation-de-fin-de-formation_Marie-DURAND_AFF-2026-0007.pdf'
    );
  });
  it('date sans conversion de fuseau', () => {
    expect(fmtIsoDate('2026-11-01')).toBe('01/11/2026');
    expect(fmtIsoDate(null)).toBe('');
  });
  it('modalité courte de la formation', () => {
    expect(modaliteCourte('Présentiel — sur site client')).toBe('Présentiel');
    expect(modaliteCourte('Distanciel')).toBe('Distanciel');
    expect(modaliteCourte('Présentiel / Distanciel / Mixte')).toBe('Présentiel');
    expect(modaliteCourte(null)).toBe('Présentiel');
  });
  it('type de session', () => {
    expect(typeSessionLabel('reserved')).toBe('intra-entreprise');
    expect(typeSessionLabel('public')).toBe('inter-entreprises');
  });
});

describe('certificat de réalisation (modèle du ministère)', () => {
  const text = textOf(certificatModel(input));
  it('porte le numéro, le titre de la formation et les mentions officielles', () => {
    const model = certificatModel(input);
    expect(model.numero).toBe('CR-2026-0007');
    expect(model.title).toBe('CERTIFICAT DE RÉALISATION');
    expect(text).toContain('Je soussigné(e) Camel ATIL,');
    expect(text).toContain(
      "représentant légal du dispensateur de l'action concourant au développement des compétences C-KIM SÉCURITÉ FORMATION,"
    );
    expect(text).toContain("a suivi l'action Sauveteur Secouriste du Travail (SECU-01)");
    expect(text).toContain("m'engage à conserver l'ensemble des pièces justificatives");
    expect(text).toContain('Cachet et signature du responsable du dispensateur de formation');
  });
  it('stagiaire, entreprise, dates et heures réalisées', () => {
    expect(text).toContain('Marie DURAND');
    expect(text).toContain("salarié(e) de l'entreprise Exemple SARL");
    expect(text).toContain("qui s'est déroulée du 19/11/2026 au 20/11/2026");
    expect(text).toContain('pour une durée de 10,5 heures.');
    expect(text).toContain('Fait à : Draguignan\nLe : 23/11/2026');
  });
  it('seule « action de formation » est cochée', () => {
    expect(text).toContain('[X] action de formation');
    expect(text).toContain('[ ] bilan de compétences');
    expect(text).toContain('[ ] action de VAE');
    expect(text).toContain('[ ] action de formation par apprentissage');
  });
  it('sans entreprise pour un particulier, sans référence si la formation n’en a pas', () => {
    const t = textOf(
      certificatModel({ ...input, formationRef: null, stagiaire: { ...input.stagiaire, entreprise: null } })
    );
    expect(t).not.toContain('salarié(e)');
    expect(t).toContain("a suivi l'action Sauveteur Secouriste du Travail\n");
  });
});

describe('attestation de fin de formation', () => {
  it('rappelle l’action suivie', () => {
    const model = attestationModel({ ...input, numero: 'AFF-2026-0007' });
    const text = textOf(model);
    expect(model.title).toBe('ATTESTATION DE FIN DE FORMATION');
    expect(model.legal).toBe('Article L.6353-1 du Code du travail');
    expect(text).toContain(
      "C-KIM SÉCURITÉ FORMATION atteste que Marie DURAND, salarié(e) de l'entreprise Exemple SARL, a suivi l'action de formation suivante :"
    );
    expect(text).toContain('Intitulé : Sauveteur Secouriste du Travail (SECU-01)');
    expect(text).toContain(
      'Dates, lieu et modalité : Du 19/11/2026 au 20/11/2026 – 13 boulevard Foch, 83300 Draguignan – Présentiel, inter-entreprises'
    );
    expect(text).toContain(
      'Durée et formateur : 10,5 heures réalisées sur 14 heures prévues – formateur : Jean Formateur'
    );
    expect(text).toContain('Fait à Draguignan, le 23/11/2026');
    expect(text).toContain('Pour C-KIM SÉCURITÉ FORMATION');
  });

  it('liste TOUTES les compétences de la formation avec le niveau du stagiaire', () => {
    const model = attestationModel(input);
    const res = model.blocks.find((b) => b.t === 'res');
    expect(res).toMatchObject({
      withResult: true,
      head: ['Compétence', 'Résultat'],
      rows: [
        { libelle: 'Protéger', niveau: 'acquise' },
        { libelle: 'Examiner', niveau: 'en_cours' },
        { libelle: 'Secourir', niveau: null },
      ],
    });
    expect(textOf(model)).toContain('Légende : Acquise');
  });

  it('bilan non rempli : compétences listées sans colonne Résultat ni légende', () => {
    const model = attestationModel({
      ...input,
      competences: input.competences.map((c) => ({ ...c, niveau: null })),
    });
    const res = model.blocks.find((b) => b.t === 'res');
    expect(res).toMatchObject({ withResult: false, head: ['Compétence'] });
    expect(res && res.t === 'res' && res.rows).toHaveLength(3);
    expect(textOf(model)).toContain('Compétences visées par la formation');
    expect(textOf(model)).not.toContain('Légende');
  });

  it('formation sans compétence : pas de tableau', () => {
    const model = attestationModel({ ...input, competences: [] });
    expect(model.blocks.some((b) => b.t === 'res' || b.t === 'h')).toBe(false);
  });

  it('une seule journée, sans formateur ni lieu', () => {
    const text = textOf(
      attestationModel({ ...input, dateFin: '2026-11-19', lieu: '', formateurNom: null })
    );
    expect(text).toContain('Dates, lieu et modalité : Le 19/11/2026 – Présentiel, inter-entreprises');
    expect(text).toContain('Durée : 10,5 heures réalisées sur 14 heures prévues\n');
    expect(text).not.toContain('formateur');
  });
});

describe('mentions réglementaires', () => {
  it('en-tête commun : SIRET, déclaration d’activité (phrase obligatoire) et Qualiopi', () => {
    expect(headLines()[0]).toBe('391 avenue du Maréchal Koenig, 83300 Draguignan – SIRET 991 764 580 00015');
    expect(headLines().slice(1).join(' ')).toBe(
      "Déclaration d'activité enregistrée sous le n° 93830858883 auprès du préfet de région PACA. Cet enregistrement ne vaut pas agrément de l'État. " +
        "Certification Qualiopi : certificat n° 772911-1, délivré par Certifopac au titre de la catégorie « actions de formation », valable jusqu'au 22/02/2029."
    );
  });

  const sst =
    "C-KIM SÉCURITÉ FORMATION est habilité par l'INRS à dispenser les formations SST et MAC SST : habilitation n° H38732/2026/SST-1/O/07, obtenue le 26/03/2026, valable jusqu'au 26/03/2031.";

  it('la mention de la formation figure dans un encadré de l’attestation, avant la légende', () => {
    const model = attestationModel({ ...input, mention: `  ${sst}\n\nSeconde ligne ` });
    const box = model.blocks.find((b) => b.t === 'box');
    expect(box).toEqual({
      t: 'box',
      title: 'Habilitation, agrément et certification',
      lines: [sst, 'Seconde ligne'],
    });
    const order = model.blocks.map((b) => b.t);
    expect(order.indexOf('res')).toBeLessThan(order.indexOf('box'));
    expect(order.indexOf('box')).toBeLessThan(order.indexOf('small'));
    expect(order.indexOf('small')).toBeLessThan(order.indexOf('sign'));
  });

  it('encadré présent aussi pour une formation sans compétence', () => {
    const model = attestationModel({ ...input, competences: [], mention: sst });
    expect(model.blocks.map((b) => b.t)).toEqual(['intro', 'kv', 'box', 'sign']);
  });

  it('pas d’encadré sans mention (NDA et Qualiopi suffisent)', () => {
    expect(attestationModel(input).blocks.some((b) => b.t === 'box')).toBe(false);
    expect(attestationModel({ ...input, mention: '  \n ' }).blocks.some((b) => b.t === 'box')).toBe(false);
  });

  it('le certificat de réalisation garde le texte du modèle officiel, sans encadré', () => {
    expect(certificatModel({ ...input, mention: sst }).blocks.some((b) => b.t === 'box')).toBe(false);
  });
});

describe('sessionChecks', () => {
  it('rien à signaler quand tout est renseigné', () => {
    expect(sessionChecks({ hasCreneaux: true, formateurNom: 'Jean', lieu: 'Draguignan', competencesTotal: 8 })).toEqual({
      blocker: null,
      warnings: [],
    });
  });
  it('bloque sans créneau, avertit pour le reste', () => {
    const res = sessionChecks({ hasCreneaux: false, formateurNom: null, lieu: ' ', competencesTotal: 0 });
    expect(res.blocker).toMatch(/aucun créneau/);
    expect(res.warnings).toHaveLength(3);
  });
});
