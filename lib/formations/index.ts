import type { Formation } from '@/lib/types/formation';

import { formation as incendie } from './incendie-extincteur-evacuation';
import { formation as h0b0 } from './habilitation-electrique-h0-b0';
import { formation as b1vb2v } from './habilitation-electrique-b1v-b2v';
import { formation as haccp } from './hygiene-alimentaire-haccp';
import { formation as duerpForm } from './duerp-formation-accompagnement';
import { formation as duerpManager } from './elaboration-duerp-manager-sst';
import { formation as foSst } from './formateur-sst';
import { formation as macFoSst } from './mac-formateur-sst';
import { formation as foIncendie } from './formateur-incendie-gestes-postures';
import { formation as foInde } from './formateur-independant-interne';
import { formation as pnl } from './pnl-controle-qualiopi';

export const formations: Formation[] = [
  incendie,
  h0b0,
  b1vb2v,
  haccp,
  duerpForm,
  duerpManager,
  foSst,
  macFoSst,
  foIncendie,
  foInde,
  pnl,
];

export function getFormationBySlug(slug: string): Formation | undefined {
  return formations.find((f) => f.slug === slug);
}

export function getFormationsByParcours(parcours: Formation['parcours']): Formation[] {
  return formations.filter((f) => f.parcours === parcours);
}
