'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createEmployee } from './actions';

export function AddEmployeeForm() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await createEmployee({ prenom, nom, email });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPrenom('');
      setNom('');
      setEmail('');
      setSuccess(true);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-dark/10 rounded-lg p-6">
      <h2 className="font-display text-xl mb-4">Ajouter un salarié</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mt-4 flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter le salarié'}
        </Button>
        {error && <p className="text-sm text-orange">{error}</p>}
        {success && <p className="text-sm text-teal">Salarié ajouté.</p>}
      </div>
    </form>
  );
}
