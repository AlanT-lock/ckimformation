'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';

/**
 * Fiche PDF de la formation : aperçu intégré, dépôt d'un PDF personnalisé
 * (remplace la fiche générée) et retour à la fiche automatique.
 */
export function FichePdfManager({ formationId, isCustom }: { formationId: string; isCustom: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pdfUrl = `/api/formations/${formationId}/pdf`;

  async function send(method: 'POST' | 'DELETE', body?: FormData) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/formations/${formationId}/fiche`, { method, body });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Opération impossible.');
      setMsg({
        ok: true,
        text: method === 'POST' ? 'Nouvelle fiche enregistrée.' : 'Retour à la fiche générée automatiquement.',
      });
      setVersion((v) => v + 1);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Erreur.' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    void send('POST', fd);
  }

  return (
    <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Fiche PDF</h2>
          <p className="text-sm text-dark/60 mt-1">
            {isCustom
              ? 'Fiche personnalisée déposée. Elle est proposée sur le site et jointe aux mails de confirmation.'
              : 'Fiche générée automatiquement à partir des informations de la formation. Vous pouvez la remplacer par votre propre PDF.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />
          <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Envoi…' : isCustom ? 'Remplacer le PDF' : 'Déposer un PDF'}
          </Button>
          {isCustom && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void send('DELETE')}>
              Revenir à la fiche automatique
            </Button>
          )}
          <a href={pdfUrl} target="_blank" rel="noopener" className="inline-flex items-center px-4 py-2 rounded text-sm font-medium border border-dark/15 hover:border-dark/40">
            Ouvrir
          </a>
          <a href={`${pdfUrl}?download=1`} className="inline-flex items-center px-4 py-2 rounded text-sm font-medium border border-dark/15 hover:border-dark/40">
            ↓ Télécharger
          </a>
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</p>}
      <p className="text-xs text-dark/50">PDF uniquement, 4 Mo maximum.</p>
      <iframe
        key={version}
        src={`${pdfUrl}?v=${version}`}
        title="Aperçu de la fiche PDF"
        className="w-full h-[70vh] rounded border border-dark/10 bg-light"
      />
    </section>
  );
}
