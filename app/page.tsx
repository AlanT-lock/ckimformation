import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Container } from '@/components/ui/Container';

export default function Home() {
  return (
    <main className="min-h-screen bg-white py-12">
      <Container>
        <div className="flex flex-wrap gap-3 mb-6">
          <Tag>Qualiopi</Tag>
          <Tag color="#E8692A" variant="solid">Sécurité</Tag>
          <Tag color="#2E9E6A">Alimentaire</Tag>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Demander un devis</Button>
          <Button variant="secondary">Voir les formations</Button>
          <Button variant="ghost">En savoir plus</Button>
          <Button variant="dark">Contact</Button>
        </div>
      </Container>
    </main>
  );
}
