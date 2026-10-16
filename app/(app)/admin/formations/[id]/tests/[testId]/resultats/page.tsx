import { TestResultsView } from '../../../../../tests/_views/TestResultsView';

export const dynamic = 'force-dynamic';

export default async function FormationTestResultsPage({
  params,
}: {
  params: Promise<{ id: string; testId: string }>;
}) {
  const { id, testId } = await params;
  return <TestResultsView formationId={id} testId={testId} />;
}
