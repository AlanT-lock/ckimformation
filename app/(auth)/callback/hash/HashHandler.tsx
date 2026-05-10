'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Lit la session depuis le hash fragment (flow implicit / legacy) et
 * la persiste avant de rediriger. Sert de filet de sécurité pour les
 * templates email anciens. La majorité des flows passent par /callback
 * en query params et n'arrivent jamais ici.
 */
export function HashHandler({ redirect }: { redirect: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const errorDescription = params.get('error_description');
    const type = params.get('type');

    async function run() {
      if (errorDescription) {
        router.replace(`/login?error=${encodeURIComponent(errorDescription)}`);
        return;
      }
      if (!accessToken || !refreshToken) {
        router.replace(`/login?error=${encodeURIComponent('Lien invalide. Demandez un nouveau lien.')}`);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }
      const dest = type === 'invite' || type === 'recovery'
        ? `/setup-password?next=${encodeURIComponent(redirect)}`
        : redirect;
      router.replace(dest);
      router.refresh();
    }
    run();
  }, [redirect, router]);

  return null;
}
