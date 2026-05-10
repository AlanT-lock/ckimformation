import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { FormationForm } from '../FormationForm';
import { getAllSecteurs } from '@/lib/db/secteurs';

export default async function AdminNewFormationPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: all }, secteurs] = await Promise.all([
    supabase.from('formations').select('id, slug, titre').order('titre'),
    getAllSecteurs(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Formations"
        title="Nouvelle formation"
        description="Crée une nouvelle formation. Les champs vides peuvent être complétés plus tard."
        actions={<ButtonLink href="/admin/formations" variant="secondary">← Retour</ButtonLink>}
      />
      <FormationForm allFormations={all ?? []} allSecteurs={secteurs} />
    </div>
  );
}
