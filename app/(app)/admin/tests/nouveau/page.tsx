import { redirect } from 'next/navigation';

export default async function LegacyNewTestPage({
  searchParams,
}: {
  searchParams: Promise<{ formation?: string; kind?: string; enquete_kind?: string }>;
}) {
  const { formation, ...rest } = await searchParams;
  if (!formation) redirect('/admin/formations');
  const qs = new URLSearchParams(Object.entries(rest).filter((e): e is [string, string] => !!e[1])).toString();
  redirect(`/admin/formations/${formation}/tests/nouveau${qs ? `?${qs}` : ''}`);
}
