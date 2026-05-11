'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { updateEmployee, deleteEmployee } from './actions';
import type { Employee } from '@/lib/supabase/types';

export function EmployeeCard({ employee }: { employee: Employee }) {
  const [edit, setEdit] = useState(false);
  const [prenom, setPrenom] = useState(employee.prenom);
  const [nom, setNom] = useState(employee.nom);
  const [email, setEmail] = useState(employee.email);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasAccount = !!employee.profile_id;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateEmployee(employee.id, { prenom, nom, email });
      if (!res.ok) setError(res.error);
      else setEdit(false);
    });
  }

  function remove() {
    if (!confirm(`Supprimer ${employee.prenom} ${employee.nom} ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEmployee(employee.id);
      if (!res.ok) setError(res.error);
    });
  }

  if (edit) {
    return (
      <li className="bg-light/40 border border-dark/10 rounded-lg p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={save} disabled={pending}>{pending ? '…' : 'Enregistrer'}</Button>
          <Button variant="secondary" onClick={() => setEdit(false)} disabled={pending}>Annuler</Button>
          {error && <span className="text-xs text-orange self-center">{error}</span>}
        </div>
      </li>
    );
  }

  return (
    <li className="bg-white border border-dark/10 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{employee.prenom} {employee.nom}</p>
          <p className="text-xs text-dark/60 mt-0.5 break-all">{employee.email}</p>
        </div>
        {hasAccount ? (
          <span className="text-xs px-2 py-0.5 rounded bg-teal/15 text-teal whitespace-nowrap">Compte créé</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-dark/10 text-dark/60 whitespace-nowrap">Fiche</span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-dark/10">
        <Button variant="secondary" onClick={() => setEdit(true)} disabled={pending}>Modifier</Button>
        <Button variant="ghost" onClick={remove} disabled={pending} className="text-orange hover:text-orange/80">
          Supprimer
        </Button>
        {error && <span className="text-xs text-orange self-center">{error}</span>}
      </div>
    </li>
  );
}
