'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { FieldLabel } from '@/components/app/Field';
import {
  addProfileToSession,
  removeParticipantFromSession,
  searchStagiairesForSession,
  type StagiaireSearchHit,
} from './participant-actions';

export interface SessionParticipantRow {
  id: string;
  inscriptionId: string;
  inscriptionStatut: string;
  prenom: string;
  nom: string;
  email: string;
  kind: 'employee' | 'profile';
  hasAccount: boolean;
  payerLabel: string;
}

export function SessionParticipantsManager({
  sessionId,
  initial,
}: {
  sessionId: string;
  initial: SessionParticipantRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<StagiaireSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      const t0 = setTimeout(() => setHits([]), 0);
      return () => clearTimeout(t0);
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setSearching(true);
      setError(null);
      void searchStagiairesForSession(sessionId, q)
        .then((r) => {
          if (cancelled) return;
          if (!r.ok) {
            setError(r.error);
            setHits([]);
            return;
          }
          setError(null);
          setHits(r.hits);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setHits([]);
          setError(err instanceof Error ? err.message : 'La recherche n’a pas pu aboutir.');
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, sessionId]);

  function onRemove(row: SessionParticipantRow) {
    const name = `${row.prenom} ${row.nom}`.trim() || row.email;
    if (
      !confirm(
        `Retirer ${name} de cette session ?\nLes émargements et réponses liés à cette participation seront supprimés.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await removeParticipantFromSession(sessionId, row.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function onAdd(hit: StagiaireSearchHit) {
    setError(null);
    startTransition(async () => {
      const res = await addProfileToSession(sessionId, hit.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setQ('');
      setHits([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden">
        {initial.length === 0 ? (
          <p className="p-4 text-sm text-dark/60">Aucun stagiaire inscrit sur cette session.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-2 px-4">Stagiaire</th>
                <th className="text-left py-2 px-4">Via</th>
                <th className="text-left py-2 px-4">Compte</th>
                <th className="text-left py-2 px-4">Statut</th>
                <th className="py-2 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {initial.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 px-4">
                    <div className="font-medium">{row.prenom} {row.nom}</div>
                    <div className="text-xs text-dark/50 break-all">{row.email}</div>
                  </td>
                  <td className="py-2 px-4 text-dark/70">
                    {row.kind === 'employee' ? 'Fiche salarié' : 'Compte'}
                    {row.payerLabel && (
                      <div className="text-xs text-dark/50">{row.payerLabel}</div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {row.hasAccount ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-teal/15 text-teal">Oui</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange/15 text-orange">Non</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-dark/70">{row.inscriptionStatut}</td>
                  <td className="py-2 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(row)}
                      disabled={pending}
                      className="text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-dark/10 rounded-lg p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Ajouter un stagiaire (compte existant)</p>
        <p className="text-sm text-dark/60">
          Seuls les comptes avec connexion, pas encore inscrits à cette session, sont proposés.
          L’email permet de distinguer deux personnes homonymes.
        </p>
        {error && (
          <div className="text-xs text-orange bg-orange/10 border border-orange/30 rounded p-2">{error}</div>
        )}
        <label className="block">
          <FieldLabel>Rechercher</FieldLabel>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, prénom ou email (2 caractères min.)"
            className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal"
          />
        </label>
        {hits.length > 0 && (
          <ul className="border border-dark/10 rounded divide-y divide-dark/10 max-h-64 overflow-auto">
            {hits.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{h.full_name || h.email}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-dark/10 text-dark/70">
                      {h.account_type === 'particulier' ? 'Compte particulier' : 'Compte stagiaire'}
                    </span>
                  </div>
                  <div className="text-xs text-dark/50 break-all">{h.email}</div>
                  {h.orphanEmployeeOnSession && (
                    <p className="text-xs text-orange mt-0.5">
                      Fiche salarié sans compte déjà inscrite — ajoutez ce compte pour rétablir l’accès.
                    </p>
                  )}
                </div>
                <Button type="button" onClick={() => onAdd(h)} disabled={pending}>
                  {pending ? '…' : 'Ajouter'}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {q.trim().length >= 2 && hits.length === 0 && !searching && !error && (
          <p className="text-sm text-dark/50">Aucun compte correspondant, ou déjà inscrit à cette session.</p>
        )}
      </div>
    </div>
  );
}
