import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';
import { getAllFormations } from '@/lib/db/formations';

export const metadata: Metadata = {
  title: 'Contact — C-KIM Formation',
  description: 'Demandez un devis ou contactez C-KIM Formation. Réponse sous 24h. Tél : 06 62 51 55 59.',
};

export const revalidate = 300;

export default async function ContactPage() {
  const formations = await getAllFormations();
  return (
    <ContactClient
      formations={formations.map((f) => ({
        slug: f.slug,
        titre: f.titre,
        sousTitre: f.sousTitre,
        parcours: f.parcours,
      }))}
    />
  );
}
