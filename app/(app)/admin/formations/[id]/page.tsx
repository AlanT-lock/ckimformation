import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { FormationForm } from '../FormationForm';
import { DeleteFormationButton } from './DeleteFormationButton';
import { getAllSecteurs } from '@/lib/db/secteurs';

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminEditFormationPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: f }, { data: all }, secteurs] = await Promise.all([
    supabase.from('formations').select('*').eq('id', id).single(),
    supabase.from('formations').select('id, slug, titre').order('titre'),
    getAllSecteurs(),
  ]);
  if (!f) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Formation"
        title={f.titre}
        description={f.sous_titre ?? undefined}
        actions={
          <>
            <ButtonLink href="/admin/formations" variant="secondary">← Retour</ButtonLink>
            <ButtonLink href={`/formations/${f.slug}`} variant="secondary">Voir le site →</ButtonLink>
            <DeleteFormationButton formationId={f.id} />
          </>
        }
      />
      <FormationForm
        allFormations={all ?? []}
        allSecteurs={secteurs}
        initial={{
          id: f.id,
          slug: f.slug,
          titre: f.titre,
          sous_titre: f.sous_titre,
          parcours: f.parcours,
          ref: f.ref,
          hero_image: f.hero_image,
          hero_alt: f.hero_alt,
          duree: f.duree,
          public_concerne: f.public_concerne,
          public_detail: f.public_detail,
          prerequis: f.prerequis,
          prix_indicatif: f.prix_indicatif,
          modalite: f.modalite,
          inscription: f.inscription,
          recyclage: f.recyclage,
          objectifs: f.objectifs,
          programme: Array.isArray(f.programme) ? f.programme : [],
          tarifs: Array.isArray(f.tarifs) ? f.tarifs : [],
          evaluation: f.evaluation,
          references_reglementaires: f.references_reglementaires,
          formations_liees: Array.isArray(f.formations_liees) ? f.formations_liees : [],
          secteurs_cibles: Array.isArray(f.secteurs_cibles) ? f.secteurs_cibles : [],
          formations_recommandees: Array.isArray(f.formations_recommandees) ? f.formations_recommandees : [],
          seo_title: f.seo_title,
          seo_description: f.seo_description,
          ordre: f.ordre ?? 0,
          actif: f.actif,
        }}
      />
    </div>
  );
}
