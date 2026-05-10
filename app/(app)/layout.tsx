import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import { AppShell } from '@/components/app/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  return <AppShell profile={profile}>{children}</AppShell>;
}
