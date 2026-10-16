import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

// Ancienne URL d'édition : redirige vers l'onglet Tests & enquêtes de la formation.
export default async function LegacyTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');
  const supabase = await createClient();
  const { data: test } = await supabase.from('tests').select('formation_id').eq('id', id).maybeSingle();
  if (!test) notFound();
  redirect(test.formation_id ? `/admin/formations/${test.formation_id}/tests/${id}` : '/admin/tests/financeur');
}
