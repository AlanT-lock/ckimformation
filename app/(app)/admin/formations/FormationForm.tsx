'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { HeroImageUpload } from '@/components/app/HeroImageUpload';
import { createFormation, updateFormation, type FormationInput } from './actions';
import { PARCOURS_META } from '@/lib/parcours';
import type {
  FormationRecommandee,
  Parcours,
  RecommandationType,
  TarifTier,
} from '@/lib/types/formation';

interface AllFormationOption {
  id: string;
  slug: string;
  titre: string;
}

interface SecteurOption {
  code: string;
  label: string;
}

interface Props {
  initial?: FormationInput & { id?: string };
  allFormations: AllFormationOption[];
  allSecteurs: SecteurOption[];
}

const RECO_TYPE_LABEL: Record<RecommandationType, string> = {
  recyclage: 'Recyclage obligatoire',
  suite: 'Suite logique',
  complementaire: 'Complémentaire',
};

const PARCOURS_KEYS = Object.keys(PARCOURS_META) as Parcours[];

const EMPTY: FormationInput = {
  slug: '',
  titre: '',
  sous_titre: '',
  parcours: 'securite',
  ref: '',
  hero_image: '',
  hero_alt: '',
  duree: '',
  public_concerne: '',
  public_detail: '',
  prerequis: '',
  prix_indicatif: '',
  modalite: 'Présentiel — sur site client',
  inscription: '',
  recyclage: '',
  objectifs: '',
  programme: [],
  tarifs: [],
  evaluation: '',
  references_reglementaires: '',
  formations_liees: [],
  secteurs_cibles: [],
  formations_recommandees: [],
  seo_title: '',
  seo_description: '',
  ordre: 0,
  actif: true,
};

export function FormationForm({ initial, allFormations, allSecteurs }: Props) {
  const isEdit = !!initial?.id;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [data, setData] = useState<FormationInput>({
    ...EMPTY,
    ...(initial ?? {}),
    programme: initial?.programme ?? [],
    tarifs: initial?.tarifs ?? [],
    formations_liees: initial?.formations_liees ?? [],
    secteurs_cibles: initial?.secteurs_cibles ?? [],
    formations_recommandees: initial?.formations_recommandees ?? [],
  });

  function set<K extends keyof FormationInput>(key: K, val: FormationInput[K]) {
    setData((d) => ({ ...d, [key]: val }));
  }

  // ---- Programme manager ----
  function addModule() {
    set('programme', [...data.programme, { titre: '', points: [''] }]);
  }
  function removeModule(i: number) {
    set('programme', data.programme.filter((_, idx) => idx !== i));
  }
  function updateModuleTitre(i: number, titre: string) {
    set('programme', data.programme.map((m, idx) => (idx === i ? { ...m, titre } : m)));
  }
  function updateModulePoints(i: number, pointsText: string) {
    const points = pointsText.split('\n').map((p) => p.trim()).filter(Boolean);
    set('programme', data.programme.map((m, idx) => (idx === i ? { ...m, points } : m)));
  }

  // ---- Formations liées (checkboxes) ----
  function toggleLinked(slug: string) {
    set(
      'formations_liees',
      data.formations_liees.includes(slug)
        ? data.formations_liees.filter((s) => s !== slug)
        : [...data.formations_liees, slug]
    );
  }

  // ---- Secteurs cibles (checkboxes) ----
  function toggleSecteur(code: string) {
    set(
      'secteurs_cibles',
      data.secteurs_cibles.includes(code)
        ? data.secteurs_cibles.filter((s) => s !== code)
        : [...data.secteurs_cibles, code]
    );
  }

  // ---- Recommandations typées ----
  function addReco(type: RecommandationType) {
    const newReco: FormationRecommandee = { slug: '', type };
    if (type === 'recyclage') newReco.delai_mois = 24;
    set('formations_recommandees', [...data.formations_recommandees, newReco]);
  }
  function removeReco(i: number) {
    set('formations_recommandees', data.formations_recommandees.filter((_, idx) => idx !== i));
  }
  function updateReco(i: number, patch: Partial<FormationRecommandee>) {
    set(
      'formations_recommandees',
      data.formations_recommandees.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );
  }

  // ---- Tarifs manager ----
  function addTarif() {
    set('tarifs', [...data.tarifs, { label: '', price: null, unit: 'HT', pour: '' }]);
  }
  function removeTarif(i: number) {
    set('tarifs', data.tarifs.filter((_, idx) => idx !== i));
  }
  function updateTarif(i: number, patch: Partial<TarifTier>) {
    set(
      'tarifs',
      data.tarifs.map((t, idx) => (idx === i ? { ...t, ...patch } : t))
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation basique
    if (!data.slug.match(/^[a-z0-9-]+$/)) {
      setError('Le slug doit contenir uniquement lettres minuscules, chiffres et tirets.');
      return;
    }
    if (!data.titre.trim()) {
      setError('Le titre est requis.');
      return;
    }

    // Nettoyage : on remplace les '' par null pour les champs optionnels texte
    const payload: FormationInput = {
      ...data,
      sous_titre: data.sous_titre || null,
      ref: data.ref || null,
      hero_image: data.hero_image || null,
      hero_alt: data.hero_alt || null,
      duree: data.duree || null,
      public_concerne: data.public_concerne || null,
      public_detail: data.public_detail || null,
      prerequis: data.prerequis || null,
      prix_indicatif: data.prix_indicatif || null,
      modalite: data.modalite || null,
      inscription: data.inscription || null,
      recyclage: data.recyclage || null,
      objectifs: data.objectifs || null,
      evaluation: data.evaluation || null,
      references_reglementaires: data.references_reglementaires || null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
    };

    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateFormation(initial.id, payload);
          setSuccess(true);
        } else {
          await createFormation(payload);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3">
          Modifications enregistrées ✓
        </div>
      )}

      <Section title="Identité">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Slug (URL)"
            value={data.slug}
            onChange={(e) => set('slug', e.target.value.toLowerCase())}
            placeholder="exemple-de-slug"
            required
            disabled={isEdit && !!initial?.slug}
          />
          <Field
            label="Référence"
            value={data.ref ?? ''}
            onChange={(e) => set('ref', e.target.value)}
            placeholder="SECU-01"
          />
        </div>
        <Field
          label="Titre"
          value={data.titre}
          onChange={(e) => set('titre', e.target.value)}
          required
        />
        <Field
          label="Sous-titre (optionnel)"
          value={data.sous_titre ?? ''}
          onChange={(e) => set('sous_titre', e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Parcours"
            value={data.parcours}
            onChange={(e) => set('parcours', e.target.value)}
          >
            {PARCOURS_KEYS.map((k) => (
              <option key={k} value={k}>{PARCOURS_META[k].label}</option>
            ))}
          </Select>
          <Field
            label="Ordre d'affichage"
            type="number"
            value={String(data.ordre)}
            onChange={(e) => set('ordre', Number(e.target.value) || 0)}
          />
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={data.actif}
              onChange={(e) => set('actif', e.target.checked)}
            />
            <span className="text-sm">Visible sur le site</span>
          </label>
        </div>
      </Section>

      <Section title="Image hero">
        <HeroImageUpload
          value={data.hero_image ?? ''}
          onChange={(url) => set('hero_image', url)}
          alt={data.hero_alt ?? ''}
          onAltChange={(v) => set('hero_alt', v)}
          slugHint={data.slug || undefined}
        />
        <details className="text-xs">
          <summary className="cursor-pointer text-dark/50 hover:text-dark">
            Édition avancée — saisir un chemin manuellement
          </summary>
          <div className="mt-2">
            <Field
              label="Chemin / URL de l'image"
              value={data.hero_image ?? ''}
              onChange={(e) => set('hero_image', e.target.value)}
              placeholder="/images/formations/exemple.jpg"
            />
          </div>
        </details>
      </Section>

      <Section title="Infos pratiques">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Durée"
            value={data.duree ?? ''}
            onChange={(e) => set('duree', e.target.value)}
            placeholder="14 heures (2 jours)"
          />
          <Field
            label="Modalité"
            value={data.modalite ?? ''}
            onChange={(e) => set('modalite', e.target.value)}
          />
        </div>
        <Field
          label="Public visé (résumé)"
          value={data.public_concerne ?? ''}
          onChange={(e) => set('public_concerne', e.target.value)}
        />
        <Textarea
          label="Public visé (détail — optionnel)"
          value={data.public_detail ?? ''}
          onChange={(e) => set('public_detail', e.target.value)}
          rows={2}
        />
        <Textarea
          label="Prérequis"
          value={data.prerequis ?? ''}
          onChange={(e) => set('prerequis', e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Délai d'inscription"
            value={data.inscription ?? ''}
            onChange={(e) => set('inscription', e.target.value)}
            placeholder="7 jours avant la session"
          />
          <Field
            label="Recyclage (optionnel)"
            value={data.recyclage ?? ''}
            onChange={(e) => set('recyclage', e.target.value)}
            placeholder="Tous les 24 mois"
          />
        </div>
      </Section>

      <Section
        title="Tarifs"
        description="Une ligne par formule (Individuel, Groupe 4-6, Groupe 7-10, etc.). Laisse vide pour afficher « Sur devis » sur le site."
      >
        <div className="space-y-3">
          {data.tarifs.length === 0 && (
            <p className="text-xs text-dark/50 bg-light/50 border border-dashed border-dark/15 rounded-lg p-4">
              Aucun tarif → la page affichera <strong>« Cette formation est sur devis »</strong> avec un bouton de contact.
            </p>
          )}
          {data.tarifs.map((t, i) => (
            <div key={i} className="border border-dark/10 rounded-lg p-4 bg-light/30 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-dark/40">Tarif {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeTarif(i)}
                  className="ml-auto text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <Field
                    label="Libellé"
                    value={t.label}
                    onChange={(e) => updateTarif(i, { label: e.target.value })}
                    placeholder="Individuel / Groupe 4 à 6 pers."
                  />
                </div>
                <div className="md:col-span-3">
                  <Field
                    label="Prix (€)"
                    type="number"
                    value={t.price === null || t.price === undefined ? '' : String(t.price)}
                    onChange={(e) => updateTarif(i, { price: e.target.value ? Number(e.target.value) : null })}
                    placeholder="vide = sur devis"
                  />
                </div>
                <div className="md:col-span-2">
                  <Field
                    label="Unité"
                    value={t.unit ?? 'HT'}
                    onChange={(e) => updateTarif(i, { unit: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Field
                    label="par"
                    value={t.pour ?? ''}
                    onChange={(e) => updateTarif(i, { pour: e.target.value })}
                    placeholder="personne / groupe"
                  />
                </div>
                <div className="md:col-span-6">
                  <Field
                    label="Mode (optionnel)"
                    value={t.group ?? ''}
                    onChange={(e) => updateTarif(i, { group: e.target.value || undefined })}
                    placeholder="ex. Express 2h / Complet 5h"
                  />
                </div>
                <div className="md:col-span-6">
                  <Field
                    label="Note (optionnelle)"
                    value={t.note ?? ''}
                    onChange={(e) => updateTarif(i, { note: e.target.value || undefined })}
                    placeholder="ex. DUERP finalisé inclus"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTarif}
          className="text-sm text-teal hover:underline mt-3"
        >
          + Ajouter un tarif
        </button>
      </Section>

      <Section title="Objectifs pédagogiques">
        <Textarea
          label="Texte"
          value={data.objectifs ?? ''}
          onChange={(e) => set('objectifs', e.target.value)}
          rows={5}
        />
      </Section>

      <Section
        title="Programme"
        description="Découpe le programme en modules. Pour chaque module : un titre + plusieurs points (un point par ligne)."
      >
        <div className="space-y-4">
          {data.programme.map((m, i) => (
            <div key={i} className="border border-dark/10 rounded-lg p-4 bg-light/40 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-dark/40">Module {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeModule(i)}
                  className="ml-auto text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                >
                  Supprimer
                </button>
              </div>
              <Field
                label="Titre du module"
                value={m.titre}
                onChange={(e) => updateModuleTitre(i, e.target.value)}
              />
              <Textarea
                label="Points (un par ligne)"
                value={m.points.join('\n')}
                onChange={(e) => updateModulePoints(i, e.target.value)}
                rows={Math.max(3, m.points.length + 1)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addModule}
          className="text-sm text-teal hover:underline mt-3"
        >
          + Ajouter un module
        </button>
      </Section>

      <Section title="Évaluation">
        <Textarea
          label="Modalités d'évaluation"
          value={data.evaluation ?? ''}
          onChange={(e) => set('evaluation', e.target.value)}
          rows={4}
        />
      </Section>

      <Section title="Références réglementaires">
        <Textarea
          label="Texte"
          value={data.references_reglementaires ?? ''}
          onChange={(e) => set('references_reglementaires', e.target.value)}
          rows={4}
        />
      </Section>

      <Section title="Formations liées" description="Affichées en bas de la page formation (section « Pour aller plus loin »).">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto bg-light/40 border border-dark/10 rounded-lg p-3">
          {allFormations
            .filter((f) => f.slug !== data.slug)
            .map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/60 rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={data.formations_liees.includes(f.slug)}
                  onChange={() => toggleLinked(f.slug)}
                />
                <span className="truncate">{f.titre}</span>
              </label>
            ))}
        </div>
      </Section>

      <Section
        title="Secteurs d'activité cibles"
        description="Pour les recommandations email — la formation sera proposée aux comptes dont le secteur correspond."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto bg-light/40 border border-dark/10 rounded-lg p-3">
          {allSecteurs.map((s) => (
            <label key={s.code} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/60 rounded px-2 py-1">
              <input
                type="checkbox"
                checked={data.secteurs_cibles.includes(s.code)}
                onChange={() => toggleSecteur(s.code)}
              />
              <span className="truncate">{s.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-dark/50">
          Aucun secteur coché → la formation sera considérée comme transversale (proposable à tous les secteurs).
        </p>
      </Section>

      <Section
        title="Recommandations email"
        description="Formations à proposer après celle-ci dans les emails de relance. 3 types : recyclage obligatoire, suite logique, complémentaire."
      >
        <div className="space-y-3">
          {data.formations_recommandees.length === 0 && (
            <p className="text-xs text-dark/50 bg-light/50 border border-dashed border-dark/15 rounded-lg p-4">
              Aucune recommandation. Cliquez sur un bouton ci-dessous pour en ajouter.
            </p>
          )}
          {data.formations_recommandees.map((r, i) => (
            <div key={i} className="border border-dark/10 rounded-lg p-4 bg-light/30 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      r.type === 'recyclage' ? '#E8692A20' : r.type === 'suite' ? '#1B8FA020' : '#2E9E6A20',
                    color:
                      r.type === 'recyclage' ? '#E8692A' : r.type === 'suite' ? '#1B8FA0' : '#2E9E6A',
                  }}
                >
                  {RECO_TYPE_LABEL[r.type]}
                </span>
                <button
                  type="button"
                  onClick={() => removeReco(i)}
                  className="ml-auto text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className={r.type === 'recyclage' ? 'md:col-span-8' : 'md:col-span-12'}>
                  <Select
                    label="Formation à recommander"
                    value={r.slug}
                    onChange={(e) => updateReco(i, { slug: e.target.value })}
                  >
                    <option value="">— Choisir —</option>
                    {allFormations
                      .filter((f) => f.slug !== data.slug)
                      .map((f) => (
                        <option key={f.id} value={f.slug}>{f.titre}</option>
                      ))}
                  </Select>
                </div>
                {r.type === 'recyclage' && (
                  <div className="md:col-span-4">
                    <Field
                      label="Délai (mois)"
                      type="number"
                      value={String(r.delai_mois ?? 24)}
                      onChange={(e) => updateReco(i, { delai_mois: Number(e.target.value) || 24 })}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => addReco('recyclage')}
            className="text-xs uppercase tracking-wider font-semibold px-3 py-2 rounded-full bg-orange/10 text-orange hover:bg-orange/20 transition"
          >
            + Recyclage obligatoire
          </button>
          <button
            type="button"
            onClick={() => addReco('suite')}
            className="text-xs uppercase tracking-wider font-semibold px-3 py-2 rounded-full bg-teal/10 text-teal hover:bg-teal/20 transition"
          >
            + Suite logique
          </button>
          <button
            type="button"
            onClick={() => addReco('complementaire')}
            className="text-xs uppercase tracking-wider font-semibold px-3 py-2 rounded-full bg-green-600/10 text-green-700 hover:bg-green-600/20 transition"
          >
            + Complémentaire
          </button>
        </div>
      </Section>

      <Section title="SEO">
        <Field
          label="Titre SEO"
          value={data.seo_title ?? ''}
          onChange={(e) => set('seo_title', e.target.value)}
        />
        <Textarea
          label="Description SEO"
          value={data.seo_description ?? ''}
          onChange={(e) => set('seo_description', e.target.value)}
          rows={2}
        />
      </Section>

      <div className="flex gap-3 sticky bottom-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la formation'}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title, description, children,
}: { title: string; description?: string; children: React.ReactNode }) {
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
