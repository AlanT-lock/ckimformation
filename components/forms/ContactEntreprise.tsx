'use client';
import { useState } from 'react';
import { submitContactEntreprise } from '@/app/actions/contact';
import { FormationSelect, type FormationOption } from './FormationSelect';
import { RgpdCheckbox } from './RgpdCheckbox';

export function ContactEntreprise({ formations }: { formations: FormationOption[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const [rgpdError, setRgpdError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message?: string; errors?: Record<string, string> } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRgpdError(null);
    if (!rgpd) {
      setRgpdError('Vous devez accepter la politique de confidentialité.');
      return;
    }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitContactEntreprise(Object.fromEntries(fd));
    setResult(r);
    setSubmitting(false);
    if (r.ok) { e.currentTarget.reset(); setRgpd(false); }
  }

  if (result?.ok) {
    return (
      <div className="bg-light p-8 rounded-lg text-center">
        <p className="font-display text-2xl text-teal">Message envoyé ✓</p>
        <p className="mt-2 text-dark/70">{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
      <Row>
        <Field name="raisonSociale" label="Raison sociale *" error={result?.errors?.raisonSociale} />
        <Field name="secteur" label="Secteur d'activité" />
      </Row>
      <Row>
        <Field name="nom" label="Nom *" error={result?.errors?.nom} />
        <Field name="fonction" label="Fonction" />
      </Row>
      <Row>
        <Field name="email" label="Email pro *" type="email" error={result?.errors?.email} />
        <Field name="telephone" label="Téléphone *" error={result?.errors?.telephone} />
      </Row>
      <FormationSelect formations={formations} />
      <label className="block">
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Message *</span>
        <textarea name="message" rows={5} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
        {result?.errors?.message && <span className="text-xs text-red-600 mt-1 block">{result.errors.message}</span>}
      </label>
      {result?.message && !result.ok && <p className="text-sm text-red-600">{result.message}</p>}
      <div className="pt-1">
        <RgpdCheckbox checked={rgpd} onChange={setRgpd} variant="light" />
        {rgpdError && <p className="mt-1 text-xs text-red-600">{rgpdError}</p>}
      </div>
      <button type="submit" disabled={submitting} className="w-full bg-orange text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider hover:bg-orange-l transition disabled:opacity-60">
        {submitting ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ name, label, type = 'text', error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <input name={name} type={type} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}
