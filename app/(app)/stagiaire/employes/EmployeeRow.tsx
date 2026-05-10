'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { updateEmployee, deleteEmployee } from './actions';
import type { Employee } from '@/lib/supabase/types';

export function EmployeeRow({ employee }: { employee: Employee }) {
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
      <tr className="border-t border-dark/10 bg-light/50">
        <td className="p-3">
          <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        </td>
        <td className="p-3">
          <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </td>
        <td className="p-3">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </td>
        <td className="p-3" colSpan={2}>
          <div className="flex gap-2 items-center flex-wrap">
            <Button onClick={save} disabled={pending}>{pending ? '…' : 'Enregistrer'}</Button>
            <Button variant="secondary" onClick={() => setEdit(false)} disabled={pending}>Annuler</Button>
            {error && <span className="text-xs text-orange">{error}</span>}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-dark/10">
      <td className="p-3">{employee.prenom}</td>
      <td className="p-3">{employee.nom}</td>
      <td className="p-3 text-dark/80">{employee.email}</td>
      <td className="p-3 text-xs">
        {hasAccount ? (
          <span className="inline-block px-2 py-0.5 rounded bg-teal/15 text-teal">Compte créé</span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded bg-dark/10 text-dark/60">Fiche</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="secondary" onClick={() => setEdit(true)} disabled={pending}>Modifier</Button>
          <Button variant="ghost" onClick={remove} disabled={pending} className="text-orange hover:text-orange/80">
            Supprimer
          </Button>
          {error && <span className="text-xs text-orange">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
