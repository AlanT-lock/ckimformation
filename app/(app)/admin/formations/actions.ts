'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { FormationRecommandee, TarifTier } from '@/lib/types/formation';

export interface FormationInput {
  slug: string;
  titre: string;
  sous_titre: string | null;
  parcours: string;
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
  programme: { titre: string; points: string[] }[];
  tarifs: TarifTier[];
  evaluation: string | null;
  references_reglementaires: string | null;
  formations_liees: string[];
  secteurs_cibles: string[];
  formations_recommandees: FormationRecommandee[];
  seo_title: string | null;
  seo_description: string | null;
  ordre: number;
  actif: boolean;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
  return profile;
}

function revalidatePublic(slug?: string) {
  revalidatePath('/admin/formations');
  revalidatePath('/');
  revalidatePath('/formations');
  if (slug) revalidatePath(`/formations/${slug}`);
  revalidatePath('/contact');
  revalidatePath('/sitemap.xml');
}

export async function createFormation(input: FormationInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formations')
    .insert({
      slug: input.slug,
      titre: input.titre,
      sous_titre: input.sous_titre,
      parcours: input.parcours,
      ref: input.ref,
      hero_image: input.hero_image,
      hero_alt: input.hero_alt,
      duree: input.duree,
      public_concerne: input.public_concerne,
      public_detail: input.public_detail,
      prerequis: input.prerequis,
      prix_indicatif: input.prix_indicatif,
      modalite: input.modalite,
      inscription: input.inscription,
      recyclage: input.recyclage,
      objectifs: input.objectifs,
      programme: input.programme,
      tarifs: input.tarifs,
      secteurs_cibles: input.secteurs_cibles,
      formations_recommandees: input.formations_recommandees,
      evaluation: input.evaluation,
      references_reglementaires: input.references_reglementaires,
      formations_liees: input.formations_liees,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      ordre: input.ordre,
      actif: input.actif,
    })
    .select('id')
    .single();

  if (error || !data) {
    if (error?.code === '23505') throw new Error('Ce slug est déjà utilisé.');
    throw new Error(error?.message ?? 'Création échouée');
  }
  revalidatePublic(input.slug);
  redirect(`/admin/formations/${data.id}`);
}

export async function updateFormation(id: string, input: FormationInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('formations')
    .update({
      slug: input.slug,
      titre: input.titre,
      sous_titre: input.sous_titre,
      parcours: input.parcours,
      ref: input.ref,
      hero_image: input.hero_image,
      hero_alt: input.hero_alt,
      duree: input.duree,
      public_concerne: input.public_concerne,
      public_detail: input.public_detail,
      prerequis: input.prerequis,
      prix_indicatif: input.prix_indicatif,
      modalite: input.modalite,
      inscription: input.inscription,
      recyclage: input.recyclage,
      objectifs: input.objectifs,
      programme: input.programme,
      tarifs: input.tarifs,
      secteurs_cibles: input.secteurs_cibles,
      formations_recommandees: input.formations_recommandees,
      evaluation: input.evaluation,
      references_reglementaires: input.references_reglementaires,
      formations_liees: input.formations_liees,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      ordre: input.ordre,
      actif: input.actif,
    })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') throw new Error('Ce slug est déjà utilisé.');
    throw new Error(error.message);
  }
  revalidatePublic(input.slug);
}

export async function deleteFormation(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Vérifie qu'il n'y a pas de session active liée
  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('formation_id', id);
  if (count && count > 0) {
    throw new Error(
      `Impossible de supprimer : ${count} session(s) sont rattachée(s) à cette formation. Supprimez d'abord les sessions.`
    );
  }
  const { error } = await supabase.from('formations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect('/admin/formations');
}

export async function toggleFormationActif(id: string, actif: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('formations').update({ actif }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePublic();
}
