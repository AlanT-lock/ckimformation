'use client';

import { useState, useTransition } from 'react';
import { Select, Textarea } from '@/components/app/Field';
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
  bonne_reponse: unknown;
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
  bonne_reponse: null,
};

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export function QuestionsManager({
  testId,
  testKind,
  initial,
}: {
  testId: string;
  testKind: 'quiz' | 'enquete' | 'info';
  initial: QuestionRow[];
}) {
  const [rows, setRows] = useState<QuestionRow[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<QuestionRow, 'id'>>(EMPTY);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const scoringEnabled = testKind === 'quiz';

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
      bonne_reponse: q.bonne_reponse,
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

    // Normalisation des bonnes réponses
    let bonne_reponse: unknown = null;
    if (scoringEnabled) {
      if (draft.type_reponse === 'qcm_unique') {
        const v = typeof draft.bonne_reponse === 'string' ? draft.bonne_reponse : null;
        if (v && !options.includes(v)) bonne_reponse = null;
        else bonne_reponse = v;
        if (!bonne_reponse) {
          setError('Choisissez la bonne réponse parmi les options.');
          return;
        }
      } else if (draft.type_reponse === 'qcm_multiple') {
        const arr = asArray(draft.bonne_reponse).filter((v) => options.includes(v));
        if (arr.length === 0) {
          setError('Cochez au moins une bonne réponse.');
          return;
        }
        bonne_reponse = arr;
      }
    }

    const payload = {
      libelle: draft.libelle.trim(),
      type_reponse: draft.type_reponse,
      options,
      echelle_max,
      required: draft.required,
      bonne_reponse,
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
    setDraft((d) => {
      const oldVal = d.options[i];
      const newOptions = d.options.map((o, idx) => (idx === i ? v : o));
      // Si la valeur d'une option change, on met à jour bonne_reponse si nécessaire
      let bonne_reponse = d.bonne_reponse;
      if (d.type_reponse === 'qcm_unique' && bonne_reponse === oldVal) {
        bonne_reponse = v;
      } else if (d.type_reponse === 'qcm_multiple') {
        const arr = asArray(bonne_reponse);
        if (arr.includes(oldVal)) bonne_reponse = arr.map((x) => (x === oldVal ? v : x));
      }
      return { ...d, options: newOptions, bonne_reponse };
    });
  }
  function addOption() {
    setDraft((d) => ({ ...d, options: [...d.options, ''] }));
  }
  function removeOption(i: number) {
    setDraft((d) => {
      const removed = d.options[i];
      const newOptions = d.options.filter((_, idx) => idx !== i);
      let bonne_reponse = d.bonne_reponse;
      if (d.type_reponse === 'qcm_unique' && bonne_reponse === removed) {
        bonne_reponse = null;
      } else if (d.type_reponse === 'qcm_multiple') {
        bonne_reponse = asArray(bonne_reponse).filter((x) => x !== removed);
      }
      return { ...d, options: newOptions, bonne_reponse };
    });
  }

  function toggleCorrectMulti(opt: string) {
    setDraft((d) => {
      const arr = asArray(d.bonne_reponse);
      const next = arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt];
      return { ...d, bonne_reponse: next };
    });
  }
  function setCorrectUnique(opt: string) {
    setDraft((d) => ({ ...d, bonne_reponse: opt }));
  }

  function changeType(t: QuestionType) {
    setDraft((d) => ({ ...d, type_reponse: t, bonne_reponse: null }));
  }

  const showOptions = draft.type_reponse === 'qcm_unique' || draft.type_reponse === 'qcm_multiple' || draft.type_reponse === 'liste';
  const showEchelle = draft.type_reponse === 'echelle';
  const isQcm = draft.type_reponse === 'qcm_unique' || draft.type_reponse === 'qcm_multiple';

  return (
    <div className="space-y-4">
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-dark/60">
            Aucune question. Cliquez sur « Ajouter une question » ci-dessous.
          </p>
        ) : (
          <ul className="divide-y divide-dark/10">
            {rows.map((q, i) => {
              const bonneCount = q.type_reponse === 'qcm_unique'
                ? (q.bonne_reponse ? 1 : 0)
                : q.type_reponse === 'qcm_multiple'
                  ? asArray(q.bonne_reponse).length
                  : 0;
              return (
                <li key={q.id} className="p-4 flex items-start gap-4">
                  <span className="text-dark/40 text-sm font-mono mt-1">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{q.libelle}</p>
                    <p className="text-xs text-dark/60 mt-1">
                      {TYPE_LABEL[q.type_reponse]}
                      {q.type_reponse === 'echelle' && q.echelle_max ? ` · 1 à ${q.echelle_max}` : ''}
                      {q.options.length > 0 ? ` · ${q.options.length} option${q.options.length > 1 ? 's' : ''}` : ''}
                      {q.required ? ' · obligatoire' : ' · facultative'}
                      {scoringEnabled && (q.type_reponse === 'qcm_unique' || q.type_reponse === 'qcm_multiple') && (
                        <> · <span className={bonneCount > 0 ? 'text-teal' : 'text-orange'}>
                          {bonneCount > 0 ? `${bonneCount} bonne${bonneCount > 1 ? 's' : ''} réponse${bonneCount > 1 ? 's' : ''}` : 'aucune bonne réponse définie'}
                        </span></>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 self-center">
                    <button onClick={() => startEdit(q)} className="text-teal text-xs uppercase tracking-wider hover:underline">
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
              );
            })}
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
            label="Type de réponse"
            value={draft.type_reponse}
            onChange={(e) => changeType(e.target.value as QuestionType)}
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => (
              <option key={k} value={k}>{TYPE_LABEL[k]}</option>
            ))}
          </Select>

          {showOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-dark/60">Options</p>
                {scoringEnabled && isQcm && (
                  <p className="text-xs text-teal">
                    {draft.type_reponse === 'qcm_unique' ? 'Cochez la bonne réponse →' : 'Cochez les bonnes réponses →'}
                  </p>
                )}
              </div>
              {draft.options.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  {scoringEnabled && isQcm && (
                    <input
                      type={draft.type_reponse === 'qcm_unique' ? 'radio' : 'checkbox'}
                      name={`bonne-rep-${editing}`}
                      checked={
                        draft.type_reponse === 'qcm_unique'
                          ? draft.bonne_reponse === o
                          : asArray(draft.bonne_reponse).includes(o)
                      }
                      onChange={() => {
                        if (!o.trim()) return;
                        if (draft.type_reponse === 'qcm_unique') setCorrectUnique(o);
                        else toggleCorrectMulti(o);
                      }}
                      disabled={!o.trim()}
                      className="h-4 w-4 accent-teal"
                      aria-label="Bonne réponse"
                    />
                  )}
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
              <button type="button" onClick={addOption} className="text-sm text-teal hover:underline">
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
