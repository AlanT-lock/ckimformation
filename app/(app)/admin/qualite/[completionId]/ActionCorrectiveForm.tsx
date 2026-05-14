'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { saveActionCorrective } from '../actions';

interface Props {
  completionId: string;
  initial: { action_corrective: string | null; resolved: boolean };
}

export function ActionCorrectiveForm({ completionId, initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [text, setText] = useState(initial.action_corrective ?? '');
  const [resolved, setResolved] = useState(initial.resolved);

  function submit(target: 'save' | 'resolve' | 'reopen') {
    setError(null);
    setSuccess(null);
    let finalResolved = resolved;
    if (target === 'resolve') finalResolved = true;
    if (target === 'reopen') finalResolved = false;

    if (target === 'resolve' && !text.trim()) {
      setError("Renseignez l'action corrective avant de marquer comme résolue.");
      return;
    }

    startTransition(async () => {
      const r = await saveActionCorrective(completionId, { action_corrective: text, resolved: finalResolved });
      if (!r.ok) { setError(r.error); return; }
      setResolved(finalResolved);
      if (target === 'save') setSuccess('Brouillon enregistré.');
      else if (target === 'resolve') setSuccess('Alerte marquée comme résolue.');
      else setSuccess('Alerte rouverte.');
    });
  }

  return (
    <div className="space-y-4 bg-white border border-dark/10 rounded-lg p-6">
      {error && <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>}
      {success && <div className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3">{success}</div>}

      <div>
        <Textarea
          label="Action corrective"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Décrivez l'analyse du mauvais résultat et les actions mises en place pour y remédier (échange avec le stagiaire, ajustement du contenu, formation complémentaire, etc.)."
        />
        <p className="text-xs text-dark/50 mt-2">
          Ce contenu est conservé pour les audits Qualiopi. Soyez précis (date, contexte, action concrète, suivi).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-dark/10">
        <Button onClick={() => submit('save')} disabled={pending} variant="secondary">
          {pending ? 'Enregistrement…' : 'Enregistrer le brouillon'}
        </Button>
        {!resolved ? (
          <Button onClick={() => submit('resolve')} disabled={pending}>
            ✓ Marquer comme résolue
          </Button>
        ) : (
          <Button onClick={() => submit('reopen')} disabled={pending} variant="secondary">
            Rouvrir l&apos;alerte
          </Button>
        )}
      </div>
    </div>
  );
}
