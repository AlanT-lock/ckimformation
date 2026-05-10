'use client';

import { useState, useTransition } from 'react';
import { Field, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { demanderInscriptionEntreprise, type NewEmployeeInput } from './actions';
import type { Employee } from '@/lib/supabase/types';

interface Props {
  sessionId: string;
  employees: Employee[];
}

interface NewLine extends NewEmployeeInput {
  key: string;
}

export function InscriptionEntrepriseForm({ sessionId, employees }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newLines, setNewLines] = useState<NewLine[]>([]);
  const [analyseBesoins, setAnalyseBesoins] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function addLine() {
    setNewLines((arr) => [...arr, { key: Math.random().toString(36).slice(2), prenom: '', nom: '', email: '' }]);
  }
  function updateLine(key: string, patch: Partial<NewEmployeeInput>) {
    setNewLines((arr) => arr.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setNewLines((arr) => arr.filter((l) => l.key !== key));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const newOnes = newLines
      .map((l) => ({ prenom: l.prenom.trim(), nom: l.nom.trim(), email: l.email.trim() }))
      .filter((l) => l.prenom || l.nom || l.email);
    for (const l of newOnes) {
      if (!l.prenom || !l.nom || !l.email) {
        setError('Chaque nouveau salarié doit avoir prénom, nom et email.');
        return;
      }
    }
    if (selected.size === 0 && newOnes.length === 0) {
      setError('Sélectionnez au moins un salarié à inscrire.');
      return;
    }
    if (analyseBesoins.trim().length < 10) {
      setError("Merci de détailler l'analyse des besoins (10 caractères minimum).");
      return;
    }
    startTransition(async () => {
      try {
        await demanderInscriptionEntreprise(sessionId, Array.from(selected), newOnes, analyseBesoins);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  const hasEmployees = employees.length > 0;
  const totalCount = selected.size + newLines.filter((l) => l.prenom && l.nom && l.email).length;

  return (
    <form onSubmit={submit} className="bg-white rounded-lg border border-dark/10 p-6 space-y-6">
      <section>
        <h2 className="font-display text-2xl tracking-wide">Participants à inscrire</h2>
        <p className="text-sm text-dark/60 mt-1">
          Sélectionnez les salariés à inscrire à cette session. Vous pouvez aussi en créer de nouveaux directement ci-dessous.
        </p>

        {hasEmployees ? (
          <ul className="mt-4 divide-y divide-dark/10 border border-dark/10 rounded">
            {employees.map((e) => {
              const checked = selected.has(e.id);
              return (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    id={`emp-${e.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(e.id)}
                    className="h-4 w-4 accent-teal"
                  />
                  <label htmlFor={`emp-${e.id}`} className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">{e.prenom} {e.nom}</span>
                    <span className="text-dark/60 ml-2">{e.email}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-dark/60 italic">
            Aucun salarié enregistré pour le moment. Ajoutez-les ci-dessous ou via la rubrique « Mes salariés ».
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-dark/70">
            Ajouter un salarié à la volée
          </h3>
          <Button type="button" variant="secondary" onClick={addLine}>+ Nouveau salarié</Button>
        </div>
        {newLines.length === 0 && (
          <p className="text-xs text-dark/50 mt-2">
            Le salarié ajouté ici sera également enregistré dans votre liste « Mes salariés ».
          </p>
        )}
        <div className="mt-3 space-y-3">
          {newLines.map((l) => (
            <div key={l.key} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 bg-light/50 rounded border border-dark/10">
              <Field label="Prénom" value={l.prenom} onChange={(e) => updateLine(l.key, { prenom: e.target.value })} required />
              <Field label="Nom" value={l.nom} onChange={(e) => updateLine(l.key, { nom: e.target.value })} required />
              <Field label="Email" type="email" value={l.email} onChange={(e) => updateLine(l.key, { email: e.target.value })} required />
              <Button type="button" variant="ghost" onClick={() => removeLine(l.key)} className="text-orange">Retirer</Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Textarea
          label="Analyse des besoins (obligatoire)"
          rows={5}
          required
          value={analyseBesoins}
          onChange={(e) => setAnalyseBesoins(e.target.value)}
          placeholder="Décrivez précisément pourquoi vous (ou vos salariés) souhaitez suivre cette formation : contexte, compétences visées, attentes…"
        />
        <p className="mt-1 text-xs text-dark/50">
          Cette information est exigée dans le cadre Qualiopi et nous aide à adapter la formation.
        </p>
      </section>

      {error && (
        <div className="bg-orange/10 border border-orange/30 rounded p-3 text-sm text-orange whitespace-pre-line">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Envoi de la demande…' : `Envoyer la demande${totalCount > 0 ? ` (${totalCount} participant${totalCount > 1 ? 's' : ''})` : ''}`}
        </Button>
        <span className="text-xs text-dark/50">
          Nous vous recontactons après validation pour finaliser les modalités.
        </span>
      </div>
    </form>
  );
}
