// Documents de fin de formation : certificat de réalisation et attestation de
// fin de formation. Logique pure (aucun accès base ni rendu) : contenu des deux
// documents, repris de l'outil « Attestations et certificats » C-KIM, et règles
// partagées par l'admin, l'entreprise et le stagiaire.
// NE PAS marquer 'server-only' — utilisé aussi côté client (pop-up d'envoi).

export const FIN_FORMATION_KINDS = ['certificat', 'attestation'] as const;
export type FinFormationKind = (typeof FIN_FORMATION_KINDS)[number];

export const KIND_LABEL: Record<FinFormationKind, string> = {
  certificat: 'Certificat de réalisation',
  attestation: 'Attestation de fin de formation',
};

/** Préfixe du numéro de document (CR-2026-0001, AFF-2026-0001). */
export const KIND_PREFIX: Record<FinFormationKind, string> = {
  certificat: 'CR',
  attestation: 'AFF',
};

export function isFinFormationKind(value: unknown): value is FinFormationKind {
  return typeof value === 'string' && (FIN_FORMATION_KINDS as readonly string[]).includes(value);
}

/** Mentions de l'organisme et du signataire portées sur les deux documents. */
export const FIN_FORMATION_PARAMS = {
  raison: 'C-KIM SÉCURITÉ FORMATION',
  forme: 'SAS',
  adresse: '391 avenue du Maréchal Koenig, 83300 Draguignan',
  siret: '991 764 580 00015',
  nda: '93830858883',
  qualiopi: '772911-1',
  qualiopiCertificateur: 'Certifopac',
  qualiopiFin: '22/02/2029',
  email: 'contact@ckimformation.fr',
  signNom: 'Camel ATIL',
  signQualite: 'Président',
  lieuEdition: 'Draguignan',
};

// -----------------------------------------------------------------------------
// Session terminée, heures, numéros
// -----------------------------------------------------------------------------

/**
 * Les documents de fin de formation ne s'envoient que pour une session
 * terminée : statut « Terminée », ou session publiée dont le dernier créneau
 * est passé (heure de Paris).
 */
export function isSessionTerminee(statut: string, lastDate: string | null, today: string): boolean {
  if (statut === 'completed') return true;
  return statut === 'published' && !!lastDate && lastDate < today;
}

/**
 * Contrôles avant l'envoi : `blocker` empêche l'envoi, `warnings` sont montrés
 * à l'admin avant qu'il valide.
 */
export function sessionChecks(input: {
  hasCreneaux: boolean;
  formateurNom: string | null;
  lieu: string;
  competencesTotal: number;
}): { blocker: string | null; warnings: string[] } {
  const warnings: string[] = [];
  if (!input.formateurNom) {
    warnings.push("Aucun formateur n'est affecté à la session : son nom n'apparaîtra pas sur l'attestation.");
  }
  if (!input.lieu.trim()) {
    warnings.push("Le lieu de la session n'est pas renseigné : il n'apparaîtra pas sur l'attestation.");
  }
  if (input.competencesTotal === 0) {
    warnings.push(
      "Aucune compétence n'est définie pour cette formation : l'attestation ne comportera pas de tableau des compétences."
    );
  }
  return {
    blocker: input.hasCreneaux
      ? null
      : "Cette session n'a aucun créneau : les dates et la durée de la formation sont inconnues, les documents ne peuvent pas être édités.",
    warnings,
  };
}

/** Durée d'un créneau en heures (0 si les horaires sont invalides). */
export function creneauHours(heureDebut: string, heureFin: string): number {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
  };
  const diff = toMin(heureFin) - toMin(heureDebut);
  return Number.isFinite(diff) && diff > 0 ? diff / 60 : 0;
}

/**
 * Heures prévues (tous les créneaux) et réalisées (créneaux où le stagiaire
 * n'est pas marqué absent).
 */
export function computeHeures(
  creneaux: Array<{ id: string; heure_debut: string; heure_fin: string }>,
  absentCreneauIds: ReadonlySet<string>
): { prevues: number; realisees: number } {
  let prevues = 0;
  let realisees = 0;
  for (const c of creneaux) {
    const h = creneauHours(c.heure_debut, c.heure_fin);
    prevues += h;
    if (!absentCreneauIds.has(c.id)) realisees += h;
  }
  return { prevues, realisees };
}

/** 14 → « 14 », 10.5 → « 10,5 » (deux décimales au plus). */
export function fmtHeures(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

/** 14 → « 14 heures », 1 → « 1 heure », 0 → « 0 heures ». */
export function heuresTxt(n: number): string {
  return `${fmtHeures(n)} ${n >= 2 || n === 0 ? 'heures' : 'heure'}`;
}

/** YYYY-MM-DD → JJ/MM/AAAA (sans conversion de fuseau). */
export function fmtIsoDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function formatNumero(kind: FinFormationKind, annee: number, n: number): string {
  return `${KIND_PREFIX[kind]}-${annee}-${String(n).padStart(4, '0')}`;
}

/** Numéro affiché dans l'aperçu, tant que le document n'est pas envoyé. */
export function previewNumero(kind: FinFormationKind, dateEdition: string): string {
  return `${KIND_PREFIX[kind]}-${dateEdition.slice(0, 4)}-…`;
}

/** « Prénom NOM » (le nom de famille en capitales, comme sur les documents). */
export function stagiaireNomComplet(prenom: string, nom: string): string {
  return [prenom.trim(), nom.trim().toUpperCase()].filter(Boolean).join(' ') || '—';
}

/** « Présentiel — sur site client » → « Présentiel » ; valeur ambiguë → « Présentiel ». */
export function modaliteCourte(modalite: string | null | undefined): string {
  const head = (modalite ?? '').split(/[—–]| - /)[0].trim();
  if (!head || head.includes('/')) return 'Présentiel';
  return head;
}

export function typeSessionLabel(visibility: string | null | undefined): string {
  return visibility === 'reserved' ? 'intra-entreprise' : 'inter-entreprises';
}

function safeFilePart(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Nom du fichier PDF remis au stagiaire et joint aux e-mails. */
export function documentFileName(kind: FinFormationKind, nomComplet: string, numero: string): string {
  const base = kind === 'certificat' ? 'Certificat-de-realisation' : 'Attestation-de-fin-de-formation';
  return [base, safeFilePart(nomComplet), safeFilePart(numero)].filter(Boolean).join('_') + '.pdf';
}

// -----------------------------------------------------------------------------
// Niveaux d'acquisition des compétences (bilan du formateur, par stagiaire)
// -----------------------------------------------------------------------------

export const NIVEAUX = ['acquise', 'en_cours', 'non_acquise'] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const NIVEAU_LABEL: Record<Niveau, string> = {
  acquise: 'Acquise',
  en_cours: 'En cours d’acquisition',
  non_acquise: 'Non acquise',
};

export function isNiveau(value: unknown): value is Niveau {
  return typeof value === 'string' && (NIVEAUX as readonly string[]).includes(value);
}

// -----------------------------------------------------------------------------
// Modèle des documents (commun à tous les rendus)
// -----------------------------------------------------------------------------

/** Fragment de texte : b = gras, i = italique, sup = appel de note. */
export interface Run {
  text: string;
  b?: boolean;
  i?: boolean;
  sup?: boolean;
}

export type DocBlock =
  | { t: 'intro'; runs: Run[] }
  | { t: 'p'; runs: Run[]; gap?: boolean }
  | { t: 'checks'; items: Array<{ label: string; checked: boolean; note?: string }> }
  | { t: 'clause'; runs: Run[] }
  | { t: 'foot'; notes: Array<[string, string]> }
  | { t: 'kv'; rows: Array<{ k: string; v: Run[] }> }
  | { t: 'h'; text: string }
  | { t: 'res'; head: string[]; withResult: boolean; rows: Array<{ libelle: string; niveau: Niveau | null }> }
  | { t: 'box'; title: string; lines: string[] }
  | { t: 'small'; runs: Run[] }
  | { t: 'sign'; left: Run[]; rightTitle: string };

export interface DocModel {
  kind: FinFormationKind;
  numero: string;
  title: string;
  legal: string;
  blocks: DocBlock[];
}

export interface FinFormationInput {
  /** Numéro définitif (CR-2026-0001) ou numéro d'aperçu (CR-2026-…). */
  numero: string;
  /** Date d'édition du document, YYYY-MM-DD. */
  dateEdition: string;
  formationTitre: string;
  formationRef: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  lieu: string;
  modalite: string;
  typeSession: string;
  formateurNom: string | null;
  heuresPrevues: number;
  stagiaire: {
    prenom: string;
    nom: string;
    /** Raison sociale de l'employeur ; null pour un particulier. */
    entreprise: string | null;
    heuresRealisees: number;
  };
  /** Toutes les compétences de la formation, avec le niveau du stagiaire. */
  competences: Array<{ libelle: string; niveau: Niveau | null }>;
  /**
   * Mention d'habilitation, d'agrément ou de certification propre à la
   * formation (habilitation INRS pour le SST, agrément SSIAP…), saisie par
   * l'admin. Vide : le NDA et Qualiopi de l'en-tête suffisent.
   */
  mention?: string | null;
}

const R = (text: string, o: Omit<Run, 'text'> = {}): Run => ({ text, ...o });

/** Longueur maximale de la mention propre à une formation. */
export const MENTION_MAX_LENGTH = 600;

/** Encadré « Habilitation, agrément et certification » ; null si la mention est vide. */
function mentionBlock(mention: string | null | undefined): DocBlock | null {
  const lines = (mention ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return { t: 'box', title: 'Habilitation, agrément et certification', lines };
}

function actionRuns(input: FinFormationInput): Run[] {
  return [
    R(input.formationTitre, { b: true }),
    ...(input.formationRef ? [R(` (${input.formationRef})`)] : []),
  ];
}

/**
 * Certificat de réalisation : texte du modèle officiel du ministère du Travail
 * (certificat de réalisation des actions concourant au développement des
 * compétences), sur l'en-tête du dispensateur.
 */
export function certificatModel(input: FinFormationInput): DocModel {
  const P = FIN_FORMATION_PARAMS;
  const st = input.stagiaire;
  return {
    kind: 'certificat',
    numero: input.numero,
    title: 'CERTIFICAT DE RÉALISATION',
    legal: '',
    blocks: [
      { t: 'p', runs: [R('Je soussigné(e) '), R(P.signNom, { b: true }), R(',')] },
      {
        t: 'p',
        runs: [
          R("représentant légal du dispensateur de l'action concourant au développement des compétences ", { b: true }),
          R(P.raison, { b: true }),
          R(','),
        ],
      },
      { t: 'p', gap: true, runs: [R('atteste que :', { b: true })] },
      { t: 'p', runs: [R(stagiaireNomComplet(st.prenom, st.nom), { b: true })] },
      ...(st.entreprise
        ? [{ t: 'p' as const, runs: [R("salarié(e) de l'entreprise "), R(st.entreprise, { b: true })] }]
        : []),
      { t: 'p', gap: true, runs: [R("a suivi l'action "), ...actionRuns(input)] },
      { t: 'p', runs: [R("Nature de l'action concourant au développement des compétences :", { i: true })] },
      {
        t: 'checks',
        items: [
          { label: 'action de formation', checked: true, note: '1' },
          { label: 'bilan de compétences', checked: false },
          { label: 'action de VAE', checked: false },
          { label: 'action de formation par apprentissage', checked: false },
        ],
      },
      {
        t: 'p',
        runs: [
          R("qui s'est déroulée du "),
          R(fmtIsoDate(input.dateDebut) || '—', { b: true }),
          R(' au '),
          R(fmtIsoDate(input.dateFin) || '—', { b: true }),
        ],
      },
      {
        t: 'p',
        gap: true,
        runs: [R('pour une durée de '), R(heuresTxt(st.heuresRealisees), { b: true }), R('.'), R('2', { sup: true })],
      },
      {
        t: 'clause',
        runs: [
          R(
            "Sans préjudice des délais imposés par les règles fiscales, comptables ou commerciales, je m'engage à conserver l'ensemble des pièces justificatives qui ont permis d'établir le présent certificat pendant une durée de 3 ans à compter de la fin de l'année du dernier paiement. En cas de cofinancement des fonds européens la durée de conservation est étendue conformément aux obligations conventionnelles spécifiques."
          ),
        ],
      },
      {
        t: 'sign',
        left: [
          R('Fait à : '),
          R(P.lieuEdition, { b: true }),
          R('\nLe : '),
          R(fmtIsoDate(input.dateEdition), { b: true }),
        ],
        rightTitle: 'Cachet et signature du responsable du dispensateur de formation',
      },
      {
        t: 'foot',
        notes: [
          [
            '1',
            "Lorsque l'action est mise en œuvre dans le cadre d'un projet de transition professionnelle, le certificat de réalisation doit être transmis mensuellement.",
          ],
          [
            '2',
            'Dans le cadre des formations à distance prendre en compte la réalisation des activités pédagogiques et le temps estimé pour les réaliser.',
          ],
        ],
      },
    ],
  };
}

/**
 * Attestation de fin de formation (article L.6353-1 du Code du travail) :
 * action suivie, puis toutes les compétences de la formation avec le niveau
 * d'acquisition du stagiaire. Tant que le formateur n'a pas rempli le bilan du
 * stagiaire, les compétences sont listées sans colonne « Résultat ».
 */
export function attestationModel(input: FinFormationInput): DocModel {
  const P = FIN_FORMATION_PARAMS;
  const st = input.stagiaire;

  const intro: Run[] = [R(`${P.raison} atteste que `), R(stagiaireNomComplet(st.prenom, st.nom), { b: true })];
  if (st.entreprise) intro.push(R(", salarié(e) de l'entreprise "), R(st.entreprise, { b: true }), R(','));
  intro.push(R(" a suivi l'action de formation suivante :"));

  const sameDay = !!input.dateDebut && input.dateDebut === input.dateFin;
  const dates = input.dateDebut
    ? sameDay
      ? `Le ${fmtIsoDate(input.dateDebut)}`
      : `Du ${fmtIsoDate(input.dateDebut)} au ${fmtIsoDate(input.dateFin)}`
    : '';
  const modalite = [input.modalite, input.typeSession].filter(Boolean).join(', ');
  const datesLieu = [dates, input.lieu.trim(), modalite].filter(Boolean).join(' – ');

  const duree: Run[] = [
    R(`${heuresTxt(st.heuresRealisees)} réalisées sur ${fmtHeures(input.heuresPrevues)} heures prévues`),
    ...(input.formateurNom ? [R(` – formateur : ${input.formateurNom}`)] : []),
  ];

  const blocks: DocBlock[] = [
    { t: 'intro', runs: intro },
    {
      t: 'kv',
      rows: [
        { k: 'Intitulé', v: actionRuns(input) },
        { k: "Nature de l'action", v: [R('Action de formation (article L.6313-1 du Code du travail)')] },
        { k: 'Dates, lieu et modalité', v: [R(datesLieu || '—')] },
        { k: input.formateurNom ? 'Durée et formateur' : 'Durée', v: duree },
      ],
    },
  ];

  if (input.competences.length > 0) {
    const withResult = input.competences.some((c) => c.niveau !== null);
    blocks.push({
      t: 'h',
      text: withResult ? "Compétences et résultats de l'évaluation des acquis" : 'Compétences visées par la formation',
    });
    blocks.push({
      t: 'res',
      withResult,
      head: withResult ? ['Compétence', 'Résultat'] : ['Compétence'],
      rows: input.competences.map((c) => ({ libelle: c.libelle, niveau: c.niveau })),
    });
    const mentionBox = mentionBlock(input.mention);
    if (mentionBox) blocks.push(mentionBox);
    if (withResult) {
      blocks.push({
        t: 'small',
        runs: [
          R(
            "Légende : Acquise = la compétence est acquise ; En cours d'acquisition = la compétence est partiellement acquise et demande à être consolidée ; Non acquise = la compétence n'est pas acquise à l'issue de la formation."
          ),
        ],
      });
    }
  }

  if (input.competences.length === 0) {
    const mentionBox = mentionBlock(input.mention);
    if (mentionBox) blocks.push(mentionBox);
  }

  blocks.push({
    t: 'sign',
    left: [R('Fait à '), R(P.lieuEdition, { b: true }), R(', le '), R(fmtIsoDate(input.dateEdition), { b: true })],
    rightTitle: `Pour ${P.raison}`,
  });

  return {
    kind: 'attestation',
    numero: input.numero,
    title: 'ATTESTATION DE FIN DE FORMATION',
    legal: 'Article L.6353-1 du Code du travail',
    blocks,
  };
}

export function buildDocModel(kind: FinFormationKind, input: FinFormationInput): DocModel {
  return kind === 'certificat' ? certificatModel(input) : attestationModel(input);
}

/**
 * En-tête (bandeau), sous la raison sociale : mentions communes à tous les
 * documents, une entrée par ligne imprimée. La phrase sur la déclaration
 * d'activité est celle imposée par l'article L.6352-12 du Code du travail.
 */
export function headLines(): string[] {
  const P = FIN_FORMATION_PARAMS;
  return [
    `${P.adresse} – SIRET ${P.siret}`,
    `Déclaration d'activité enregistrée sous le n° ${P.nda} auprès du préfet de région PACA.`,
    "Cet enregistrement ne vaut pas agrément de l'État.",
    `Certification Qualiopi : certificat n° ${P.qualiopi}, délivré par ${P.qualiopiCertificateur}`,
    `au titre de la catégorie « actions de formation », valable jusqu'au ${P.qualiopiFin}.`,
  ];
}

/** Pied de page. */
export function footLine(): string {
  const P = FIN_FORMATION_PARAMS;
  return `${P.raison} – ${P.forme} – ${P.adresse} – SIRET ${P.siret} – ${P.email}`;
}
