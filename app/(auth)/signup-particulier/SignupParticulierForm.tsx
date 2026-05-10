'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Secteur } from '@/lib/db/secteurs';

export function SignupParticulierForm({ secteurs }: { secteurs: Secteur[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    secteur_activite: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Mot de passe : 8 caractères minimum.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=/stagiaire`,
        data: {
          role: 'stagiaire',
          account_type: 'particulier',
          full_name: form.full_name,
          phone: form.phone,
          secteur_activite: form.secteur_activite,
        },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMessage(
      'Compte créé. Vérifie ta boîte mail et clique sur le lien de confirmation pour te connecter.'
    );
    setTimeout(() => router.push('/login?message=Confirme%20ton%20email%20pour%20te%20connecter'), 4000);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="ok">{message}</Alert>}

      <Field label="Nom et prénom" value={form.full_name} onChange={(v) => set('full_name', v)} required autoComplete="name" />
      <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required autoComplete="email" />
      <Field label="Téléphone" type="tel" value={form.phone} onChange={(v) => set('phone', v)} autoComplete="tel" />
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Secteur d&apos;activité</span>
        <select
          value={form.secteur_activite}
          onChange={(e) => set('secteur_activite', e.target.value)}
          className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-l"
        >
          <option value="">— Non précisé —</option>
          {secteurs.map((s) => (
            <option key={s.code} value={s.code} className="text-dark">{s.label}</option>
          ))}
        </select>
      </label>
      <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => set('password', v)} required autoComplete="new-password" />
      <Field label="Confirmer le mot de passe" type="password" value={form.confirm} onChange={(v) => set('confirm', v)} required autoComplete="new-password" />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal hover:bg-teal-l text-white font-medium py-3 rounded transition disabled:opacity-50"
      >
        {loading ? 'Création…' : 'Créer mon compte'}
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

function Alert({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const cls = tone === 'error'
    ? 'text-orange bg-orange/10 border-orange/30'
    : 'text-teal-l bg-teal-l/10 border-teal-l/30';
  return <div className={`text-sm border rounded p-3 ${cls}`}>{children}</div>;
}
