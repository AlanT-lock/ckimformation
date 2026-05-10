'use client';

import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours } from '@/lib/types/formation';

const PARCOURS_KEYS = Object.keys(PARCOURS_META) as Parcours[];

export interface FormationOption {
  slug: string;
  titre: string;
  sousTitre?: string;
  parcours: Parcours;
}

export function FormationSelect({ formations }: { formations: FormationOption[] }) {
  const groups = PARCOURS_KEYS
    .map((key) => ({
      key,
      label: PARCOURS_META[key].label,
      items: formations
        .filter((f) => f.parcours === key)
        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr')),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">
        Formation qui vous intéresse
      </span>
      <select
        name="formation"
        defaultValue=""
        className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal bg-white"
      >
        <option value="">Pas renseigné</option>
        {groups.map((g) => (
          <optgroup key={g.key} label={g.label}>
            {g.items.map((f) => {
              const label = f.sousTitre ? `${f.titre} — ${f.sousTitre}` : f.titre;
              return (
                <option key={f.slug} value={label}>
                  {label}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
