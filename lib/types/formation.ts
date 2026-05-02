export type Parcours =
  | 'securite'
  | 'alimentaire'
  | 'prevention'
  | 'management'
  | 'formateurs'
  | 'developpement'
  | 'qualite'
  | 'certifiant';

export interface Module {
  titre: string;
  points: string[];
}

export interface Formation {
  slug: string;
  titre: string;
  sousTitre?: string;
  parcours: Parcours;
  ref: string;
  hero: {
    image: string;
    alt: string;
  };
  infosPratiques: {
    duree: string;
    public: string;
    prerequis: string;
    prixIndicatif: string;
    modalite: string;
    inscription: string;
    recyclage?: string;
  };
  objectifs: string;
  programme: Module[];
  publicDetail?: string;
  evaluation: string;
  referencesReglementaires: string;
  formationsLiees: string[];
  seo: {
    title: string;
    description: string;
  };
}
