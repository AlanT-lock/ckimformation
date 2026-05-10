'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  redirectTo?: string;
  initialError?: string;
  initialMessage?: string;
}

export function LoginForm({ redirectTo, initialError, initialMessage }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Identifiants invalides.'
        : error.message);
      return;
    }
    // Récupère le rôle pour rediriger
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    const home =
      profile?.role === 'admin' ? '/admin' :
      profile?.role === 'formateur' ? '/formateur' : '/stagiaire';
    router.replace(redirectTo || home);
    router.refresh();
  }

  async function onForgot() {
    if (!email) { setError('Entre ton email d\'abord.'); return; }
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/setup-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMessage('Email envoyé. Vérifie ta boîte mail.');
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">
          {error}
        </div>
      )}
      {message && (
        <div className="text-sm text-teal-l bg-teal-l/10 border border-teal-l/30 rounded p-3">
          {message}
        </div>
      )}
      <Field label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field label="Mot de passe" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-muted hover:text-teal-l underline"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal hover:bg-teal-l text-white font-medium py-3 rounded transition disabled:opacity-50"
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

function Field({
  label, type = 'text', value, onChange, required, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-white placeholder-muted/60 focus:outline-none focus:border-teal-l"
      />
    </label>
  );
}
