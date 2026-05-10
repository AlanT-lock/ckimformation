import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Mentions légales — C-KIM Formation',
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">Légal</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Mentions légales</h1>
        <div className="mt-8 text-dark/80 leading-relaxed space-y-4">
          <h2 className="font-display text-2xl mt-8">Éditeur</h2>
          <p>C-KIM Formation — [À compléter par le client : statut juridique, capital, SIRET, RCS, siège social].</p>
          <h2 className="font-display text-2xl mt-8">Directeur de la publication</h2>
          <p>[Nom du directeur de la publication]</p>
          <h2 className="font-display text-2xl mt-8">Hébergement</h2>
          <p>Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
          <h2 className="font-display text-2xl mt-8">Contact</h2>
          <p>ckimsecuriteformation@gmail.com — 06 62 51 55 59</p>
          <h2 className="font-display text-2xl mt-8">Numéro Qualiopi</h2>
          <p>[Numéro de certification Qualiopi à insérer]</p>
        </div>
      </Container>
    </section>
  );
}
