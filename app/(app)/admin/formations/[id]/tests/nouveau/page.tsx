import { NewTestView } from '../../../../tests/_views/NewTestView';

export default async function FormationNewTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; enquete_kind?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  return <NewTestView formationId={id} sp={sp} />;
}
