import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { NewTestForm } from './NewTestForm';

export default async function AdminNewTestPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formations } = await supabase
    .from('formations')
    .select('id, slug, titre')
    .eq('actif', true)
    .order('titre');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tests"
        title="Nouveau test"
        description="Choisis la formation et donne un nom. Tu ajouteras les questions à l'étape suivante."
      />
      <NewTestForm formations={formations ?? []} />
    </div>
  );
}
