'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RgpdCheckbox } from '@/components/forms/RgpdCheckbox';
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
  const [rgpd, setRgpd] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return 'Le nom et prénom sont obligatoires.';
    if (!form.email.trim()) return "L'email est obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email invalide.';
    if (!form.phone.trim()) return 'Le téléphone est obligatoire.';
    if (form.password.length < 8) return 'Mot de passe : 8 caractères minimum.';
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas.';
    if (!rgpd) return "Vous devez accepter la politique de confidentialité pour créer un compte.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    const { error: signErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=/stagiaire`,
        data: {
          role: 'stagiaire',
          account_type: 'particulier',
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          secteur_activite: form.secteur_activite,
        },
      },
    });
    setLoading(false);
    if (signErr) { setError(signErr.message); return; }
    setMessage(
      'Compte créé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation pour vous connecter.'
    );
    setTimeout(() => router.push('/login?message=Confirmez%20votre%20email%20pour%20vous%20connecter'), 4000);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="ok">{message}</Alert>}

      <Section title="Vos informations">
        <Field
          label="Nom et prénom"
          required
          value={form.full_name}
          onChange={(v) => set('full_name', v)}
          autoComplete="name"
        />
        <Field
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(v) => set('email', v)}
          autoComplete="email"
        />
        <Field
          label="Téléphone"
          type="tel"
          required
          value={form.phone}
          onChange={(v) => set('phone', v)}
          autoComplete="tel"
        />
        <SelectField
          label="Secteur d'activité (optionnel)"
          value={form.secteur_activite}
          onChange={(v) => set('secteur_activite', v)}
          options={[{ value: '', label: '— Non précisé —' }, ...secteurs.map((s) => ({ value: s.code, label: s.label }))]}
        />
      </Section>

      <Section title="Sécurité">
        <Field
          label="Mot de passe (8 caractères minimum)"
          type="password"
          required
          value={form.password}
          onChange={(v) => set('password', v)}
          autoComplete="new-password"
        />
        <Field
          label="Confirmer le mot de passe"
          type="password"
          required
          value={form.confirm}
          onChange={(v) => set('confirm', v)}
          autoComplete="new-password"
        />
      </Section>

      <div className="pt-2">
        <RgpdCheckbox checked={rgpd} onChange={setRgpd} variant="dark" />
      </div>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs uppercase tracking-[0.3em] text-teal-l mb-2">{title}</legend>
      {children}
    </fieldset>
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
      <span className="text-xs uppercase tracking-[0.2em] text-muted">
        {label}{required && <span className="text-orange ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white placeholder-muted/40 focus:outline-none focus:border-teal-l transition"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white focus:outline-none focus:border-teal-l transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-dark">{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Alert({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const cls = tone === 'error'
    ? 'text-orange bg-orange/10 border-orange/30'
    : 'text-teal-l bg-teal-l/10 border-teal-l/30';
  return <div className={`text-sm border rounded p-3 ${cls}`}>{children}</div>;
}
