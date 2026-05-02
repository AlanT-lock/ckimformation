import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact — C-KIM Formation',
  description: 'Demandez un devis ou contactez C-KIM Formation. Réponse sous 24h. Tél : 06 62 51 56 59.',
};

export default function ContactPage() {
  return <ContactClient />;
}
