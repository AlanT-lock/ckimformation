import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SessionForm } from '../SessionForm';

export default async function AdminNewSessionPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: formations }, { data: formateurs }] = await Promise.all([
    supabase.from('formations').select('id, slug, titre').eq('actif', true).order('titre'),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'formateur').order('full_name'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sessions"
        title="Nouvelle session"
        description="Choisis une formation, ajoute un ou plusieurs créneaux, renseigne l'adresse."
      />
      <SessionForm
        formations={formations ?? []}
        formateurs={formateurs ?? []}
      />
    </div>
  );
}
