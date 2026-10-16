// Case à cocher obligatoire avant le premier émargement d'une session.
// Le texte est découpé pour insérer les liens (pop-up) et réassemblé tel quel
// dans les PDF et la fiche admin.

export const REGLEMENT_URL = '/reglement-interieur';
export const LIVRET_URL = '/livret-accueil';

export const ACCEPTATION_PARTS = {
  before: "J'ai reçu le ",
  reglement: 'règlement intérieur',
  middle: ', pris connaissance du ',
  livret: "livret d'accueil",
  after:
    " et été informé(e) du cadre de respect mutuel et des moyens de signaler une situation de violence, de harcèlement ou de discrimination (référent : Camel ATIL, 06 62 51 55 59).",
} as const;

export const ACCEPTATION_TEXT =
  ACCEPTATION_PARTS.before +
  ACCEPTATION_PARTS.reglement +
  ACCEPTATION_PARTS.middle +
  ACCEPTATION_PARTS.livret +
  ACCEPTATION_PARTS.after;
