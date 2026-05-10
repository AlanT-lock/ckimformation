import { z } from 'zod';

const base = {
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone invalide'),
  message: z.string().min(5, 'Message trop court'),
  formation: z.string().optional(),
  honeypot: z.string().max(0, 'spam'),
};

export const contactEntrepriseSchema = z.object({
  ...base,
  raisonSociale: z.string().min(2, 'Raison sociale requise'),
  fonction: z.string().optional(),
  secteur: z.string().optional(),
});

export const contactParticulierSchema = z.object({ ...base });

export type ContactEntrepriseInput = z.infer<typeof contactEntrepriseSchema>;
export type ContactParticulierInput = z.infer<typeof contactParticulierSchema>;
