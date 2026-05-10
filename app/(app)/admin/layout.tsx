import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') {
    const home = profile.role === 'formateur' ? '/formateur' : '/stagiaire';
    redirect(home);
  }
  return <>{children}</>;
}
