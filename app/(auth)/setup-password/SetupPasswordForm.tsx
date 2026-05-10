'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SetupPasswordForm({ next }: { next?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }

    // Récupère le rôle pour rediriger correctement
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    const home =
      profile?.role === 'admin' ? '/admin' :
      profile?.role === 'formateur' ? '/formateur' : '/stagiaire';
    router.replace(next || home);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">
          {error}
        </div>
      )}
      <Field label="Nouveau mot de passe" value={password} onChange={setPassword} />
      <Field label="Confirmer" value={confirm} onChange={setConfirm} />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal hover:bg-teal-l text-white font-medium py-3 rounded transition disabled:opacity-50"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer et se connecter'}
      </button>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete="new-password"
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-white placeholder-muted/60 focus:outline-none focus:border-teal-l"
      />
    </label>
  );
}
