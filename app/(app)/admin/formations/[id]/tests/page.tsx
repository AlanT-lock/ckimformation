import { TestsListView } from '../../../tests/_views/TestsListView';

export const dynamic = 'force-dynamic';

export default async function FormationTestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestsListView formationId={id} />;
}
