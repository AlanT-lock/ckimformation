import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestResultsView } from '../../_views/TestResultsView';

export const dynamic = 'force-dynamic';

// Résultats d'un test de formation → onglet de la formation ; l'enquête financeur
// (sans formation) reste affichée ici, en page autonome.
export default async function LegacyTestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');
  const supabase = await createClient();
  const { data: test } = await supabase.from('tests').select('formation_id').eq('id', id).maybeSingle();
  if (!test) notFound();
  if (test.formation_id) redirect(`/admin/formations/${test.formation_id}/tests/${id}/resultats`);
  return <TestResultsView formationId={null} testId={id} />;
}
