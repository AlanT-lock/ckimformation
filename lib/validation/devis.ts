import { z } from 'zod';

export const devisSchema = z.object({
  formation: z.string().min(1),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone invalide'),
  entreprise: z.string().optional(),
  nbStagiaires: z.string().optional(),
  lieu: z.string().optional(),
  dates: z.string().optional(),
  message: z.string().optional(),
  honeypot: z.string().max(0, 'spam'),
});

export type DevisInput = z.infer<typeof devisSchema>;
