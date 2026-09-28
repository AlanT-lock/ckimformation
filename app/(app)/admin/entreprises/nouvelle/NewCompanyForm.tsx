'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import type { Secteur } from '@/lib/db/secteurs';
import { EMPTY_COMPANY_INPUT, validateCompanyInput, type CompanyInput } from '@/lib/validation/company';
import { createCompanyByAdmin } from '../actions';

export function NewCompanyForm({ secteurs }: { secteurs: Secteur[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyInput>(EMPTY_COMPANY_INPUT);
  const [error, setError] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setConvertId(null);
    const err = validateCompanyInput(form);
    if (err) { setError(err); return; }
    setError(null);
    startTransition(async () => {
      const res = await createCompanyByAdmin(form);
      if (!res.ok) {
        setError(res.error);
        setConvertId(res.convertibleProfileId ?? null);
        return;
      }
      router.push(`/admin/entreprises/${res.id}?invitation=${res.emailSent ? 'sent' : 'failed'}`);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-dark/10 rounded-lg p-6 space-y-6 max-w-3xl">
      <CompanyFormFields value={form} onChange={setForm} secteurs={secteurs} theme="light" headings />
      <div className="flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : "Créer l'entreprise et envoyer l'invitation"}
        </Button>
        {error && (
          <p className="text-sm text-orange">
            {error}{' '}
            {convertId && (
              <Link href={`/admin/stagiaires/${convertId}`} className="underline">Ouvrir la fiche</Link>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
