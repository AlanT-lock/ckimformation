import type { Formation } from '@/lib/types/formation';
import { formation as incendie } from './incendie-extincteur-evacuation';

export const formations: Formation[] = [incendie];

export function getFormationBySlug(slug: string): Formation | undefined {
  return formations.find((f) => f.slug === slug);
}

export function getFormationsByParcours(parcours: Formation['parcours']): Formation[] {
  return formations.filter((f) => f.parcours === parcours);
}
