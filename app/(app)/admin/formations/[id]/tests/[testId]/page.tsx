import { TestEditView } from '../../../../tests/_views/TestEditView';

export default async function FormationTestEditPage({
  params,
}: {
  params: Promise<{ id: string; testId: string }>;
}) {
  const { id, testId } = await params;
  return <TestEditView formationId={id} testId={testId} />;
}
