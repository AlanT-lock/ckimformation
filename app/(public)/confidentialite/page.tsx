import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — C-KIM Formation',
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">RGPD</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Politique de confidentialité</h1>
        <div className="mt-8 text-dark/80 leading-relaxed space-y-4">
          <h2 className="font-display text-2xl mt-8">Données collectées</h2>
          <p>Lorsque vous remplissez un formulaire (devis ou contact), nous collectons : nom, email, téléphone, et les informations que vous nous transmettez (entreprise, message). Ces données sont uniquement utilisées pour vous répondre.</p>
          <h2 className="font-display text-2xl mt-8">Conservation</h2>
          <p>Les emails sont conservés tant que la relation commerciale est active, puis archivés conformément aux obligations légales.</p>
          <h2 className="font-display text-2xl mt-8">Vos droits</h2>
          <p>Conformément au RGPD, vous pouvez accéder, rectifier ou supprimer vos données en écrivant à ckimsecuriteformation@gmail.com.</p>
          <h2 className="font-display text-2xl mt-8">Cookies</h2>
          <p>Le site n&apos;utilise aucun cookie de tracking. Aucune donnée n&apos;est partagée avec des tiers à des fins publicitaires.</p>
        </div>
      </Container>
    </section>
  );
}
