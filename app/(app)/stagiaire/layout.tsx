import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';

export default async function StagiaireLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'stagiaire') {
    const home = profile.role === 'admin' ? '/admin' : '/formateur';
    redirect(home);
  }
  return <>{children}</>;
}
