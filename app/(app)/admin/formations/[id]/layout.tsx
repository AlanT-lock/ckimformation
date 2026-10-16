import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { DeleteFormationButton } from './DeleteFormationButton';
import { FormationTabs } from './FormationTabs';

export default async function AdminFormationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: f } = await supabase
    .from('formations')
    .select('id, slug, titre, sous_titre')
    .eq('id', id)
    .single();
  if (!f) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Formation"
        title={f.titre}
        description={f.sous_titre ?? undefined}
        actions={
          <>
            <ButtonLink href="/admin/formations" variant="secondary">← Retour</ButtonLink>
            <ButtonLink href={`/formations/${f.slug}`} variant="secondary">Voir le site →</ButtonLink>
            <DeleteFormationButton formationId={f.id} />
          </>
        }
      />
      <FormationTabs formationId={f.id} />
      {children}
    </div>
  );
}
