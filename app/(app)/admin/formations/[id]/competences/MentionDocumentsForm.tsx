'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { Textarea } from '@/components/app/Field';
import { MENTION_MAX_LENGTH } from '@/lib/fin-formation/model';
import { saveMentionDocuments } from './actions';

/**
 * Mention d'habilitation / d'agrément de la formation, reprise dans un encadré
 * de l'attestation de fin de formation.
 */
export function MentionDocumentsForm({ formationId, initial }: { formationId: string; initial: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveMentionDocuments(formationId, value);
      if (!res.ok) {
        setMessage({ ok: false, text: res.error });
        return;
      }
      setSaved(value.trim());
      setValue(value.trim());
      setMessage({
        ok: true,
        text: value.trim()
          ? 'Mention enregistrée : elle figurera sur les prochaines attestations.'
          : 'Mention retirée : les prochaines attestations n’en comporteront pas.',
      });
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-dark/10 rounded-lg p-5 space-y-3">
      <div>
        <h3 className="font-display text-xl tracking-wide">Habilitation, agrément et certification</h3>
        <p className="text-xs text-dark/60 mt-1 max-w-3xl leading-relaxed">
          Mention propre à cette formation, reprise dans un encadré de l&apos;attestation de fin de formation :
          habilitation INRS (SST), agrément préfectoral (SSIAP), enregistrement DRAAF (hygiène alimentaire), centre
          d&apos;examen (AIPR), autorisation CNAPS, code RNCP ou RS et certificateur, organisme testeur (CACES)…
          Laissez vide quand aucun agrément particulier n&apos;est requis : le numéro de déclaration d&apos;activité et
          la certification Qualiopi figurent déjà dans l&apos;en-tête de tous les documents.
        </p>
      </div>
      <Textarea
        label="Mention portée sur l’attestation"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={MENTION_MAX_LENGTH}
        placeholder="Ex. : C-KIM SÉCURITÉ FORMATION est habilité par l’INRS à dispenser la formation SST : habilitation n° …, valable jusqu’au …"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" onClick={save} disabled={pending || value.trim() === saved.trim()}>
          {pending ? 'Enregistrement…' : 'Enregistrer la mention'}
        </Button>
        <span className="text-xs text-dark/50">
          {value.length} / {MENTION_MAX_LENGTH} caractères
        </span>
        {message && <span className={`text-sm ${message.ok ? 'text-teal' : 'text-orange'}`}>{message.text}</span>}
      </div>
    </section>
  );
}
