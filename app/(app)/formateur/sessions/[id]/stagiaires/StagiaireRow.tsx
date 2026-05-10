'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { sendInvitationToEmployee, updateEmployeeEmailBeforeAccount } from './actions';

export interface StagiaireRowData {
  inscriptionParticipantId: string;
  type: 'employee' | 'particulier';
  employeeId: string | null;
  prenom: string;
  nom: string;
  email: string;
  hasAccount: boolean;
}

export function StagiaireRow({ sessionId, row }: { sessionId: string; row: StagiaireRowData }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(row.email);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function invite() {
    if (!row.employeeId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await sendInvitationToEmployee(sessionId, row.employeeId!);
      if (!res.ok) setError(res.error);
      else setSuccess('Invitation envoyée.');
    });
  }

  function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!row.employeeId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateEmployeeEmailBeforeAccount(sessionId, row.employeeId!, email);
      if (!res.ok) setError(res.error);
      else { setSuccess('Email mis à jour.'); setEditing(false); }
    });
  }

  return (
    <tr className="border-t border-dark/10 align-top">
      <td className="p-3">{row.prenom} {row.nom}</td>
      <td className="p-3 text-dark/80">
        {editing && row.type === 'employee' && !row.hasAccount ? (
          <form onSubmit={saveEmail} className="flex flex-wrap gap-2 items-end">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" disabled={pending}>{pending ? '…' : 'Enregistrer'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(false); setEmail(row.email); setError(null); }}>
              Annuler
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{row.email}</span>
            {row.type === 'employee' && !row.hasAccount && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-teal hover:underline"
              >
                Modifier
              </button>
            )}
          </div>
        )}
      </td>
      <td className="p-3">
        {row.type === 'particulier' ? (
          <span className="text-xs px-2 py-0.5 rounded bg-dark/5 text-dark/60">Particulier</span>
        ) : row.hasAccount ? (
          <span className="text-xs px-2 py-0.5 rounded bg-teal/15 text-teal">Compte créé</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-orange/15 text-orange">Sans compte</span>
        )}
      </td>
      <td className="p-3">
        {row.type === 'employee' && !row.hasAccount ? (
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={invite} disabled={pending}>
              {pending ? '…' : 'Envoyer l\'invitation'}
            </Button>
            {error && <span className="text-xs text-orange">{error}</span>}
            {success && <span className="text-xs text-teal">{success}</span>}
          </div>
        ) : (
          <span className="text-xs text-dark/40">—</span>
        )}
      </td>
    </tr>
  );
}
