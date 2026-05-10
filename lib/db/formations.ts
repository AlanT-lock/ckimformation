import { createPublicClient } from '@/lib/supabase/public';
import type { Formation, FormationRecommandee, Module, Parcours, TarifTier } from '@/lib/types/formation';

export interface FormationRow {
  id: string;
  slug: string;
  titre: string;
  sous_titre: string | null;
  parcours: string | null;
  ref: string | null;
  hero_image: string | null;
  hero_alt: string | null;
  duree: string | null;
  public_concerne: string | null;
  public_detail: string | null;
  prerequis: string | null;
  prix_indicatif: string | null;
  modalite: string | null;
  inscription: string | null;
  recyclage: string | null;
  objectifs: string | null;
  programme: Module[] | null;
  tarifs: TarifTier[] | null;
  evaluation: string | null;
  references_reglementaires: string | null;
  formations_liees: string[] | null;
  secteurs_cibles: string[] | null;
  formations_recommandees: FormationRecommandee[] | null;
  seo_title: string | null;
  seo_description: string | null;
  actif: boolean;
  ordre: number | null;
  created_at: string;
  updated_at: string | null;
}

export function rowToFormation(r: FormationRow): Formation {
  return {
    slug: r.slug,
    titre: r.titre,
    sousTitre: r.sous_titre ?? undefined,
    parcours: (r.parcours ?? 'securite') as Parcours,
    ref: r.ref ?? '',
    hero: {
      image: r.hero_image ?? '',
      alt: r.hero_alt ?? '',
    },
    infosPratiques: {
      duree: r.duree ?? '',
      public: r.public_concerne ?? '',
      prerequis: r.prerequis ?? '',
      prixIndicatif: r.prix_indicatif ?? '',
      modalite: r.modalite ?? '',
      inscription: r.inscription ?? '',
      recyclage: r.recyclage ?? undefined,
    },
    publicDetail: r.public_detail ?? undefined,
    objectifs: r.objectifs ?? '',
    programme: Array.isArray(r.programme) ? r.programme : [],
    tarifs: Array.isArray(r.tarifs) ? r.tarifs : [],
    evaluation: r.evaluation ?? '',
    referencesReglementaires: r.references_reglementaires ?? '',
    formationsLiees: Array.isArray(r.formations_liees) ? r.formations_liees : [],
    secteursCibles: Array.isArray(r.secteurs_cibles) ? r.secteurs_cibles : [],
    formationsRecommandees: Array.isArray(r.formations_recommandees) ? r.formations_recommandees : [],
    seo: {
      title: r.seo_title ?? r.titre,
      description: r.seo_description ?? '',
    },
  };
}

const SELECT_COLS = `
  id, slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
  duree, public_concerne, public_detail, prerequis, prix_indicatif,
  modalite, inscription, recyclage,
  objectifs, programme, tarifs, evaluation, references_reglementaires, formations_liees,
  secteurs_cibles, formations_recommandees,
  seo_title, seo_description, actif, ordre, created_at, updated_at
`;

export async function getAllFormations(): Promise<Formation[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('formations')
    .select(SELECT_COLS)
    .eq('actif', true)
    .order('ordre', { ascending: true });
  return (data ?? []).map((r) => rowToFormation(r as unknown as FormationRow));
}

export async function getFormationBySlug(slug: string): Promise<Formation | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('formations')
    .select(SELECT_COLS)
    .eq('slug', slug)
    .eq('actif', true)
    .maybeSingle();
  if (!data) return null;
  return rowToFormation(data as unknown as FormationRow);
}

export async function getFormationsByParcours(parcours: Parcours): Promise<Formation[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('formations')
    .select(SELECT_COLS)
    .eq('parcours', parcours)
    .eq('actif', true)
    .order('ordre');
  return (data ?? []).map((r) => rowToFormation(r as unknown as FormationRow));
}
