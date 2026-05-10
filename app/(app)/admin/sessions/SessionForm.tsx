'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createSession, updateSession, type CreneauInput } from './actions';
import type { SessionStatut } from '@/lib/supabase/types';

interface FormationOpt { id: string; slug: string; titre: string }
interface FormateurOpt { id: string; full_name: string; email: string }

interface Initial {
  id?: string;
  formation_id?: string;
  formateur_id?: string | null;
  statut?: SessionStatut;
  adresse?: { rue?: string; code_postal?: string; ville?: string; complement?: string };
  notes_internes?: string | null;
  creneaux?: CreneauInput[];
}

export function SessionForm({
  formations,
  formateurs,
  initial,
}: {
  formations: FormationOpt[];
  formateurs: FormateurOpt[];
  initial?: Initial;
}) {
  const isEdit = !!initial?.id;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formation_id, setFormationId] = useState(initial?.formation_id ?? '');
  const [formateur_id, setFormateurId] = useState(initial?.formateur_id ?? '');
  const [statut, setStatut] = useState<SessionStatut>(initial?.statut ?? 'draft');
  const [rue, setRue] = useState(initial?.adresse?.rue ?? '');
  const [code_postal, setCp] = useState(initial?.adresse?.code_postal ?? '');
  const [ville, setVille] = useState(initial?.adresse?.ville ?? '');
  const [complement, setComplement] = useState(initial?.adresse?.complement ?? '');
  const [notes_internes, setNotes] = useState(initial?.notes_internes ?? '');
  const [creneaux, setCreneaux] = useState<CreneauInput[]>(
    initial?.creneaux?.length ? initial.creneaux : [{ date: '', heure_debut: '09:00', heure_fin: '12:30' }]
  );

  function updateCreneau(i: number, patch: Partial<CreneauInput>) {
    setCreneaux((arr) => arr.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCreneau() {
    setCreneaux((arr) => [...arr, { date: '', heure_debut: '14:00', heure_fin: '17:30' }]);
  }
  function removeCreneau(i: number) {
    setCreneaux((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formation_id) { setError('Choisis une formation.'); return; }
    if (!isEdit && creneaux.some((c) => !c.date || !c.heure_debut || !c.heure_fin)) {
      setError('Tous les créneaux doivent avoir date + heures.');
      return;
    }
    const payload = {
      formation_id,
      formateur_id: formateur_id || null,
      statut,
      adresse: { rue, code_postal, ville, complement },
      notes_internes: notes_internes || null,
    };

    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateSession(initial.id, payload);
        } else {
          await createSession({ ...payload, creneaux });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">
          {error}
        </div>
      )}

      <Card title="Formation">
        <Select
          label="Formation"
          value={formation_id}
          onChange={(e) => setFormationId(e.target.value)}
          required
        >
          <option value="">— Choisir —</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.titre}</option>
          ))}
        </Select>
      </Card>

      <Card title="Formateur (optionnel)">
        <Select
          label="Assigner un formateur"
          value={formateur_id ?? ''}
          onChange={(e) => setFormateurId(e.target.value)}
        >
          <option value="">— Non assigné —</option>
          {formateurs.map((f) => (
            <option key={f.id} value={f.id}>{f.full_name || f.email}</option>
          ))}
        </Select>
        {formateurs.length === 0 && (
          <p className="text-xs text-dark/50">
            Aucun formateur enregistré. Tu pourras en inviter depuis <code>/admin/utilisateurs</code> (à venir).
          </p>
        )}
      </Card>

      <Card title="Statut">
        <Select
          label="Visibilité"
          value={statut}
          onChange={(e) => setStatut(e.target.value as SessionStatut)}
        >
          <option value="draft">Brouillon (invisible sur le site)</option>
          <option value="published">Publiée (visible sur le site vitrine)</option>
          <option value="cancelled">Annulée</option>
          <option value="completed">Terminée</option>
        </Select>
      </Card>

      <Card title="Adresse">
        <Field label="Rue" value={rue} onChange={(e) => setRue(e.target.value)} placeholder="12 avenue de la République" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Code postal" value={code_postal} onChange={(e) => setCp(e.target.value)} placeholder="83300" />
          <div className="col-span-2">
            <Field label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Draguignan" />
          </div>
        </div>
        <Textarea
          label="Complément (étage, code, accès…)"
          value={complement}
          onChange={(e) => setComplement(e.target.value)}
          rows={2}
        />
      </Card>

      {!isEdit && (
        <Card
          title={`Créneaux (${creneaux.length})`}
          description="Une session peut avoir plusieurs créneaux : J1 matin, J1 aprem, J2…"
        >
          <div className="space-y-3">
            {creneaux.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <Field
                    label={`J${i + 1} — Date`}
                    type="date"
                    value={c.date}
                    onChange={(e) => updateCreneau(i, { date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <Field
                    label="Début"
                    type="time"
                    value={c.heure_debut}
                    onChange={(e) => updateCreneau(i, { heure_debut: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <Field
                    label="Fin"
                    type="time"
                    value={c.heure_fin}
                    onChange={(e) => updateCreneau(i, { heure_fin: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1 flex">
                  {creneaux.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCreneau(i)}
                      className="text-orange/80 hover:text-orange p-2"
                      title="Supprimer"
                      aria-label="Supprimer le créneau"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCreneau}
            className="mt-3 text-sm text-teal hover:underline"
          >
            + Ajouter un créneau
          </button>
        </Card>
      )}

      <Card title="Notes internes (optionnel)">
        <Textarea
          label="Visible uniquement par l'admin"
          value={notes_internes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Particularités, contact entreprise, infos logistiques…"
        />
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la session'}
        </Button>
      </div>
    </form>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-white border border-dark/10 rounded-lg p-6 space-y-4">
      <legend className="px-2 -ml-2">
        <span className="text-xs uppercase tracking-[0.3em] text-teal">{title}</span>
      </legend>
      {description && <p className="text-xs text-dark/60 -mt-2">{description}</p>}
      {children}
    </fieldset>
  );
}
