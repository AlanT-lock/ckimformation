import { Container } from '@/components/ui/Container';
import type { Formation } from '@/lib/types/formation';

export function MetaBlock({ formation, color }: { formation: Formation; color: string }) {
  const i = formation.infosPratiques;
  const items = [
    { label: 'Durée', value: i.duree },
    { label: 'Public', value: i.public },
    { label: 'Prix indicatif', value: i.prixIndicatif },
    { label: 'Modalité', value: i.modalite },
    { label: 'Inscription', value: i.inscription },
    ...(i.recyclage ? [{ label: 'Recyclage', value: i.recyclage }] : []),
  ];
  return (
    <div className="bg-white sticky top-20 z-30 border-b border-light">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 py-4">
          {items.map((it) => (
            <div key={it.label}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-dark/50">{it.label}</p>
              <p className="text-sm font-semibold mt-1" style={{ color }}>{it.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
