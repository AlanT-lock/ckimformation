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

export type RecommandationType = 'recyclage' | 'suite' | 'complementaire';

export interface FormationRecommandee {
  slug: string;
  type: RecommandationType;
  delai_mois?: number;       // Pour recyclage uniquement (ex. 24 pour SST)
}

export interface TarifTier {
  label: string;            // "Individuel", "Groupe 4 à 6 pers."
  price: number | null;     // null → "Sur devis"
  unit?: string;            // "HT" par défaut
  pour?: string;            // "personne" / "groupe"
  note?: string;            // ex. "DUERP finalisé inclus"
  group?: string;           // ex. "Express 2h" pour formations multi-modes
  highlight?: boolean;      // mettre en valeur
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
  tarifs?: TarifTier[];
  publicDetail?: string;
  evaluation: string;
  referencesReglementaires: string;
  formationsLiees: string[];
  secteursCibles?: string[];
  formationsRecommandees?: FormationRecommandee[];
  seo: {
    title: string;
    description: string;
  };
}
