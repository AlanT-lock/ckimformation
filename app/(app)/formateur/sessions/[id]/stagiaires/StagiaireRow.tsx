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

export function StagiaireCard({ sessionId, row }: { sessionId: string; row: StagiaireRowData }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(row.email);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function invite() {
    if (!row.employeeId) return;
    if (row.hasAccount && !confirm('Renvoyer un nouveau lien d\'invitation à ce stagiaire ?\nLe précédent ne sera plus valable.')) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await sendInvitationToEmployee(sessionId, row.employeeId!);
      if (!res.ok) setError(res.error);
      else setSuccess(res.resent ? 'Nouveau lien envoyé.' : 'Invitation envoyée.');
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
    <li className="bg-white border border-dark/10 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{row.prenom} {row.nom}</p>
          {!editing && (
            <p className="text-xs text-dark/60 mt-0.5 break-all">{row.email}</p>
          )}
        </div>
        {row.type === 'particulier' ? (
          <span className="text-xs px-2 py-0.5 rounded bg-dark/5 text-dark/60 whitespace-nowrap">Particulier</span>
        ) : row.hasAccount ? (
          <span className="text-xs px-2 py-0.5 rounded bg-teal/15 text-teal whitespace-nowrap">Compte créé</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-orange/15 text-orange whitespace-nowrap">Sans compte</span>
        )}
      </div>

      {editing && row.type === 'employee' && !row.hasAccount && (
        <form onSubmit={saveEmail} className="space-y-3 pt-2 border-t border-dark/10">
          <Field label="Nouvel email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={pending}>{pending ? '…' : 'Enregistrer'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(false); setEmail(row.email); setError(null); }}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {!editing && row.type === 'employee' && !row.hasAccount && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-dark/10">
          <Button onClick={invite} disabled={pending} className="sm:flex-1">
            {pending ? '…' : 'Envoyer l\'invitation'}
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)} disabled={pending} className="sm:flex-1">
            Modifier l&apos;email
          </Button>
        </div>
      )}

      {!editing && row.type === 'employee' && row.hasAccount && (
        <div className="flex pt-2 border-t border-dark/10">
          <Button variant="secondary" onClick={invite} disabled={pending} className="w-full sm:w-auto">
            {pending ? '…' : 'Renvoyer l\'invitation'}
          </Button>
        </div>
      )}

      {(error || success) && (
        <p className={`text-xs ${error ? 'text-orange' : 'text-teal'}`}>
          {error ?? success}
        </p>
      )}
    </li>
  );
}
