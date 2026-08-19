'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { formatDate, formatDateLong } from '@/lib/date';
import type { ConvocationParticipant, SessionConvocationData } from '@/lib/pdf/convocation-types';
import { sendConvocation, sendConvocations } from './convocation-actions';

function statutLabel(statut: ConvocationParticipant['statut']): string {
  switch (statut) {
    case 'en_attente':
      return 'En attente';
    case 'documents_demandes':
      return 'Documents demandés';
    case 'documents_recus':
      return 'Documents reçus';
    case 'confirmee':
      return 'Confirmée';
    case 'refusee':
      return 'Refusée';
    case 'pending_payment':
      return 'Paiement en attente';
    case 'paid':
      return 'Payée';
    case 'cancelled':
      return 'Annulée';
    case 'refunded':
      return 'Remboursée';
    default: {
      const _exhaustive: never = statut;
      return _exhaustive;
    }
  }
}

function nomComplet(p: ConvocationParticipant): string {
  return `${p.prenom} ${p.nom}`.trim() || '—';
}

function defaultSelectedIds(participants: ConvocationParticipant[]): string[] {
  return participants
    .filter((p) => p.statut === 'confirmee' && p.email.trim() !== '')
    .map((p) => p.id);
}

export function ConvocationsPanel({ data }: { data: SessionConvocationData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelectedIds(data.participants))
  );
  const [message, setMessage] = useState<string | null>(null);

  const selectable = useMemo(
    () => data.participants.filter((p) => p.email.trim() !== ''),
    [data.participants]
  );

  function toggle(id: string, enabled: boolean) {
    if (!enabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const allIds = selectable.map((p) => p.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function previewHref(participantId: string) {
    return `/api/pdf/convocations/${participantId}?session=${data.sessionId}`;
  }

  function handleSendOne(participantId: string, label: string) {
    if (!confirm(`Envoyer la convocation à ${label} ?`)) return;
    setMessage(null);
    startTransition(async () => {
      const res = await sendConvocation(data.sessionId, participantId);
      if (res.ok) {
        setMessage('Convocation envoyée.');
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  function handleSendSelected() {
    const ids = data.participants
      .filter((p) => selected.has(p.id) && p.email.trim() !== '')
      .map((p) => p.id);
    if (ids.length === 0) {
      setMessage('Aucun destinataire sélectionné avec un email.');
      return;
    }
    if (!confirm(`Envoyer la convocation à ${ids.length} stagiaire${ids.length > 1 ? 's' : ''} ?`)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await sendConvocations(data.sessionId, ids);
      const parts = [`${res.sent} envoyée${res.sent > 1 ? 's' : ''}`];
      if (res.failed > 0) parts.push(`${res.failed} échec${res.failed > 1 ? 's' : ''}`);
      if (res.skipped > 0) parts.push(`${res.skipped} ignorée${res.skipped > 1 ? 's' : ''} (email manquant)`);
      setMessage(parts.join(' · '));
      router.refresh();
    });
  }

  const allSelectableChecked =
    selectable.length > 0 && selectable.every((p) => selected.has(p.id));

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide">Convocations</h2>
      <p className="text-xs text-dark/60 mt-1">
        Aperçu PDF par stagiaire, puis envoi unitaire ou groupé. La lettre est jointe à l’email.
      </p>

      <div className="mt-4 bg-white border border-dark/10 rounded-lg p-4 text-sm space-y-1">
        <p>
          <span className="text-dark/50">Formation :</span>{' '}
          <strong>{data.formationTitre}</strong>
        </p>
        <p>
          <span className="text-dark/50">Lieu :</span>{' '}
          {data.lieu.trim() || 'À préciser'}
        </p>
        {data.creneaux.length === 0 ? (
          <p className="text-dark/50">Aucun créneau renseigné.</p>
        ) : (
          <ul className="mt-2 space-y-0.5 text-dark/80">
            {data.creneaux.map((c, i) => (
              <li key={i}>
                {formatDateLong(c.date)} — {c.heureDebut.slice(0, 5)} à {c.heureFin.slice(0, 5)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.participants.length === 0 ? (
        <p className="mt-4 text-sm text-dark/60">Aucun stagiaire inscrit pour l’instant.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={toggleAll}
              disabled={selectable.length === 0 || pending}
            >
              {allSelectableChecked ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
            <Button
              type="button"
              onClick={handleSendSelected}
              disabled={pending || selected.size === 0}
            >
              {pending ? 'Envoi…' : `Envoyer aux sélectionnés (${selected.size})`}
            </Button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-teal">{message}</p>
          )}

          <div className="mt-4 bg-white border border-dark/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                <tr>
                  <th className="text-left py-2 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelectableChecked}
                      onChange={toggleAll}
                      disabled={selectable.length === 0 || pending}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="text-left py-2 px-4">Stagiaire</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Statut</th>
                  <th className="text-left py-2 px-4">Dernier envoi</th>
                  <th className="text-right py-2 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {data.participants.map((p) => {
                  const hasEmail = p.email.trim() !== '';
                  const label = nomComplet(p);
                  return (
                    <tr key={p.id} className={!hasEmail ? 'opacity-60' : undefined}>
                      <td className="py-2 px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id, hasEmail)}
                          disabled={!hasEmail || pending}
                          aria-label={`Sélectionner ${label}`}
                        />
                      </td>
                      <td className="py-2 px-4">{label}</td>
                      <td className="py-2 px-4 text-dark/70">
                        {hasEmail ? p.email : (
                          <span className="text-orange">Email manquant</span>
                        )}
                      </td>
                      <td className="py-2 px-4">{statutLabel(p.statut)}</td>
                      <td className="py-2 px-4 text-dark/60">
                        {p.lastSentAt ? formatDate(p.lastSentAt) : '—'}
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <a
                          href={previewHref(p.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal hover:underline mr-3"
                        >
                          Aperçu
                        </a>
                        <button
                          type="button"
                          className="text-teal hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!hasEmail || pending}
                          onClick={() => handleSendOne(p.id, label)}
                        >
                          Envoyer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
