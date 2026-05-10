'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createQuestion, updateQuestion, deleteQuestion } from '../actions';
import type { QuestionType } from '@/lib/supabase/types';

interface QuestionRow {
  id: string;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
}

const TYPE_LABEL: Record<QuestionType, string> = {
  qcm_unique:   'QCM (1 bonne réponse)',
  qcm_multiple: 'QCM (plusieurs réponses)',
  texte_libre:  'Réponse libre (texte)',
  echelle:      'Échelle (1 à N)',
  liste:        'Liste (réponse courte)',
};

const EMPTY: Omit<QuestionRow, 'id'> = {
  libelle: '',
  type_reponse: 'qcm_unique',
  options: ['', ''],
  echelle_max: null,
  required: true,
};

export function QuestionsManager({
  testId,
  initial,
}: {
  testId: string;
  initial: QuestionRow[];
}) {
  const [rows, setRows] = useState<QuestionRow[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<QuestionRow, 'id'>>(EMPTY);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditing('new');
    setDraft({ ...EMPTY });
    setError(null);
  }

  function startEdit(q: QuestionRow) {
    setEditing(q.id);
    setDraft({
      libelle: q.libelle,
      type_reponse: q.type_reponse,
      options: q.options.length ? q.options : ['', ''],
      echelle_max: q.echelle_max,
      required: q.required,
    });
    setError(null);
  }

  function cancel() {
    setEditing(null);
    setDraft(EMPTY);
    setError(null);
  }

  function save() {
    setError(null);
    if (!draft.libelle.trim()) { setError('Libellé requis.'); return; }

    // Sanitize options
    let options = draft.options.map((o) => o.trim()).filter(Boolean);
    if ((draft.type_reponse === 'qcm_unique' || draft.type_reponse === 'qcm_multiple') && options.length < 2) {
      setError('Au moins 2 options pour un QCM.');
      return;
    }
    if (draft.type_reponse !== 'qcm_unique' && draft.type_reponse !== 'qcm_multiple' && draft.type_reponse !== 'liste') {
      options = [];
    }

    let echelle_max = draft.echelle_max;
    if (draft.type_reponse === 'echelle') {
      if (!echelle_max || echelle_max < 2) { setError('Échelle : choisis un maximum (5, 7 ou 10).'); return; }
    } else {
      echelle_max = null;
    }

    const payload = {
      libelle: draft.libelle.trim(),
      type_reponse: draft.type_reponse,
      options,
      echelle_max,
      required: draft.required,
    };

    startTransition(async () => {
      try {
        if (editing === 'new') {
          await createQuestion(testId, payload);
          setRows((r) => [...r, { id: crypto.randomUUID(), ...payload }]);
        } else if (editing) {
          await updateQuestion(editing, testId, payload);
          setRows((r) => r.map((q) => (q.id === editing ? { ...q, ...payload } : q)));
        }
        cancel();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm('Supprimer cette question ?')) return;
    startTransition(async () => {
      try {
        await deleteQuestion(id, testId);
        setRows((r) => r.filter((q) => q.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  function setOption(i: number, v: string) {
    setDraft((d) => ({ ...d, options: d.options.map((o, idx) => (idx === i ? v : o)) }));
  }
  function addOption() {
    setDraft((d) => ({ ...d, options: [...d.options, ''] }));
  }
  function removeOption(i: number) {
    setDraft((d) => ({ ...d, options: d.options.filter((_, idx) => idx !== i) }));
  }

  const showOptions = draft.type_reponse === 'qcm_unique' || draft.type_reponse === 'qcm_multiple' || draft.type_reponse === 'liste';
  const showEchelle = draft.type_reponse === 'echelle';

  return (
    <div className="space-y-4">
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-dark/60">
            Aucune question pour l&apos;instant. Clique sur « Ajouter une question » ci-dessous.
          </p>
        ) : (
          <ul className="divide-y divide-dark/10">
            {rows.map((q, i) => (
              <li key={q.id} className="p-4 flex items-start gap-4">
                <span className="text-dark/40 text-sm font-mono mt-1">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{q.libelle}</p>
                  <p className="text-xs text-dark/60 mt-1">
                    {TYPE_LABEL[q.type_reponse]}
                    {q.type_reponse === 'echelle' && q.echelle_max ? ` · 1 à ${q.echelle_max}` : ''}
                    {q.options.length > 0 ? ` · ${q.options.length} option${q.options.length > 1 ? 's' : ''}` : ''}
                    {q.required ? ' · obligatoire' : ' · facultative'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(q)}
                    className="text-teal text-xs uppercase tracking-wider hover:underline"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => onDelete(q.id)}
                    disabled={pending}
                    className="text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!editing && (
        <Button onClick={startNew} variant="secondary">+ Ajouter une question</Button>
      )}

      {editing && (
        <div className="bg-white border border-teal/30 rounded-lg p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-teal">
            {editing === 'new' ? 'Nouvelle question' : 'Édition'}
          </p>
          {error && (
            <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
          )}

          <Textarea
            label="Libellé de la question"
            value={draft.libelle}
            onChange={(e) => setDraft({ ...draft, libelle: e.target.value })}
            rows={2}
            required
          />

          <Select
            label="Type de réponse attendu"
            value={draft.type_reponse}
            onChange={(e) => setDraft({ ...draft, type_reponse: e.target.value as QuestionType })}
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => (
              <option key={k} value={k}>{TYPE_LABEL[k]}</option>
            ))}
          </Select>

          {showOptions && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-dark/60">Options</p>
              {draft.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={o}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal"
                  />
                  {draft.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-orange/80 hover:text-orange px-2"
                      aria-label="Supprimer l'option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-teal hover:underline"
              >
                + Ajouter une option
              </button>
            </div>
          )}

          {showEchelle && (
            <Select
              label="Maximum de l'échelle"
              value={draft.echelle_max ?? ''}
              onChange={(e) => setDraft({ ...draft, echelle_max: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">— Choisir —</option>
              <option value="5">1 à 5</option>
              <option value="7">1 à 7</option>
              <option value="10">1 à 10</option>
            </Select>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
            />
            Réponse obligatoire
          </label>

          <div className="flex gap-2">
            <Button onClick={save} disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer la question'}
            </Button>
            <Button variant="secondary" onClick={cancel} type="button">
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
