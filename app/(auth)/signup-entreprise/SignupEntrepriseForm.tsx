'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Secteur } from '@/lib/db/secteurs';

export function SignupEntrepriseForm({ secteurs }: { secteurs: Secteur[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    raison_sociale: '',
    siret: '',
    tva_intra: '',
    secteur_activite: '',
    full_name: '',
    contact_fonction: '',
    email: '',
    phone: '',
    addr_rue: '',
    addr_cp: '',
    addr_ville: '',
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
    const billing_address = {
      rue: form.addr_rue,
      code_postal: form.addr_cp,
      ville: form.addr_ville,
      pays: 'France',
    };
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=/stagiaire`,
        data: {
          role: 'stagiaire',
          account_type: 'entreprise',
          full_name: form.full_name,
          phone: form.phone,
          raison_sociale: form.raison_sociale,
          siret: form.siret,
          tva_intra: form.tva_intra,
          contact_fonction: form.contact_fonction,
          secteur_activite: form.secteur_activite,
          billing_address: JSON.stringify(billing_address),
        },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMessage(
      'Compte entreprise créé. Vérifie ta boîte mail et clique sur le lien de confirmation.'
    );
    setTimeout(() => router.push('/login?message=Confirme%20ton%20email%20pour%20te%20connecter'), 4000);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="ok">{message}</Alert>}

      <Section title="Société">
        <Field label="Raison sociale" value={form.raison_sociale} onChange={(v) => set('raison_sociale', v)} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="SIRET" value={form.siret} onChange={(v) => set('siret', v)} />
          <Field label="TVA intracom." value={form.tva_intra} onChange={(v) => set('tva_intra', v)} />
        </div>
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
      </Section>

      <Section title="Adresse de facturation">
        <Field label="Rue" value={form.addr_rue} onChange={(v) => set('addr_rue', v)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="CP" value={form.addr_cp} onChange={(v) => set('addr_cp', v)} />
          <div className="col-span-2">
            <Field label="Ville" value={form.addr_ville} onChange={(v) => set('addr_ville', v)} />
          </div>
        </div>
      </Section>

      <Section title="Contact principal">
        <Field label="Nom et prénom" value={form.full_name} onChange={(v) => set('full_name', v)} required autoComplete="name" />
        <Field label="Fonction" value={form.contact_fonction} onChange={(v) => set('contact_fonction', v)} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required autoComplete="email" />
        <Field label="Téléphone" type="tel" value={form.phone} onChange={(v) => set('phone', v)} autoComplete="tel" />
      </Section>

      <Section title="Mot de passe">
        <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => set('password', v)} required autoComplete="new-password" />
        <Field label="Confirmer" type="password" value={form.confirm} onChange={(v) => set('confirm', v)} required autoComplete="new-password" />
      </Section>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal hover:bg-teal-l text-white font-medium py-3 rounded transition disabled:opacity-50"
      >
        {loading ? 'Création…' : 'Créer le compte entreprise'}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs uppercase tracking-[0.3em] text-teal-l">{title}</legend>
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
