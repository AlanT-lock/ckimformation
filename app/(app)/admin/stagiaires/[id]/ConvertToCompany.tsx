'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import type { Secteur } from '@/lib/db/secteurs';
import { EMPTY_COMPANY_INPUT, validateCompanyInput, type CompanyInput } from '@/lib/validation/company';
import { convertToCompany } from './convert-actions';

export function ConvertToCompany({
  profileId,
  secteurs,
  prefill,
}: {
  profileId: string;
  secteurs: Secteur[];
  prefill: { full_name: string; email: string; phone: string; secteur_activite: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyInput>({ ...EMPTY_COMPANY_INPUT, ...prefill });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Transformer en compte entreprise
        </Button>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateCompanyInput(form);
    if (err) { setError(err); return; }
    setError(null);
    startTransition(async () => {
      const res = await convertToCompany(profileId, form);
      if (!res.ok) { setError(res.error); return; }
      router.push(`/admin/entreprises/${profileId}`);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-teal/30 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="font-display text-xl">Transformer en compte entreprise</h2>
        <p className="text-sm text-dark/60 mt-1">
          Le compte garde son email, son mot de passe et son historique. La personne devient le contact référent de l&apos;entreprise.
        </p>
      </div>
      <CompanyFormFields value={form} onChange={setForm} secteurs={secteurs} theme="light" headings emailReadOnly />
      <div className="flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>{pending ? 'Transformation…' : 'Confirmer la transformation'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        {error && <p className="text-sm text-orange">{error}</p>}
      </div>
    </form>
  );
}
