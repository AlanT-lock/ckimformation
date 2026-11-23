import { loadSessionConvocationData } from '@/lib/pdf/data';
import { ConvocationsPanel } from '../../ConvocationsPanel';
import { requireAdminSession } from '../../session-data';
import { EmptySection, SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Génération des PDF + envoi des e-mails depuis les actions de cette page.
export const maxDuration = 60;

export default async function AdminSessionConvocationsPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdminSession(id);
  const data = await loadSessionConvocationData(id);

  if (!data) {
    return (
      <section className="space-y-4">
        <SectionHeading title="Convocations" />
        <EmptySection>Les convocations ne sont pas disponibles pour cette session.</EmptySection>
      </section>
    );
  }

  return <ConvocationsPanel data={data} />;
}
