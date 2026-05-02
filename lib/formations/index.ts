import type { Formation } from '@/lib/types/formation';

import { formation as incendie } from './incendie-extincteur-evacuation';
import { formation as h0b0 } from './habilitation-electrique-h0-b0';
import { formation as b1vb2v } from './habilitation-electrique-b1v-b2v';
import { formation as haccp } from './hygiene-alimentaire-haccp';

export const formations: Formation[] = [incendie, h0b0, b1vb2v, haccp];

export function getFormationBySlug(slug: string): Formation | undefined {
  return formations.find((f) => f.slug === slug);
}

export function getFormationsByParcours(parcours: Formation['parcours']): Formation[] {
  return formations.filter((f) => f.parcours === parcours);
}
