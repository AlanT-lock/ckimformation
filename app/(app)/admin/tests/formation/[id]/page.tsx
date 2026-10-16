import { redirect } from 'next/navigation';

export default async function LegacyFormationTestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/formations/${id}/tests`);
}
