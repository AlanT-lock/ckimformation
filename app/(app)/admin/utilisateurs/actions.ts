'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
  return profile;
}

export async function inviteFormateur(input: { email: string; full_name: string; phone?: string }) {
  await requireAdmin();
  const admin = createAdminClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: {
      role: 'formateur',
      full_name: input.full_name,
      phone: input.phone ?? '',
    },
    redirectTo: `${siteUrl}/callback?redirect=${encodeURIComponent('/formateur')}`,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/utilisateurs');
  return { id: data.user?.id };
}

export async function deleteUser(userId: string) {
  const profile = await requireAdmin();
  if (userId === profile.id) throw new Error('Tu ne peux pas supprimer ton propre compte.');
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/utilisateurs');
}
