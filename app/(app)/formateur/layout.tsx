import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';

export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur') {
    const home = profile.role === 'admin' ? '/admin' : '/stagiaire';
    redirect(home);
  }
  return <>{children}</>;
}
