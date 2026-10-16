import { FinanceurView } from '../../../../tests/_views/FinanceurView';

export const dynamic = 'force-dynamic';

export default async function FormationFinanceurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinanceurView formationId={id} />;
}
