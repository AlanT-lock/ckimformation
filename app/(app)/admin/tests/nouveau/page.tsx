import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { NewTestForm } from './NewTestForm';
import type { TestKind, EnqueteKind } from '@/lib/supabase/types';

interface PageProps {
  searchParams: Promise<{ formation?: string; kind?: string; enquete_kind?: string }>;
}

export default async function AdminNewTestPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formations } = await supabase
    .from('formations')
    .select('id, slug, titre')
    .eq('actif', true)
    .order('titre');

  // Pré-sélection si query params (vient de /admin/tests/formation/[id])
  const presetFormationId = sp.formation;
  const presetKind = (sp.kind === 'quiz' || sp.kind === 'enquete' || sp.kind === 'info' || sp.kind === 'evaluation_formateur') ? sp.kind as TestKind : null;
  const presetEnqueteKind = (sp.enquete_kind === 'a_chaud' || sp.enquete_kind === 'a_froid') ? sp.enquete_kind as EnqueteKind : null;

  let presetFormation: { id: string; titre: string } | null = null;
  if (presetFormationId) {
    const found = (formations ?? []).find((f) => f.id === presetFormationId);
    if (!found) notFound();
    presetFormation = { id: found.id, titre: found.titre };
  }

  const eyebrow = presetKind === 'enquete'
    ? presetEnqueteKind === 'a_froid' ? 'Nouvelle enquête à froid' : 'Nouvelle enquête à chaud'
    : presetKind === 'evaluation_formateur'
      ? 'Nouvelle évaluation formateur'
      : 'Nouveau test';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tests & enquêtes"
        title={eyebrow}
        description={presetFormation ? `Pour la formation : ${presetFormation.titre}` : 'Choisissez la formation et donnez un nom.'}
        actions={
          presetFormation
            ? <ButtonLink href={`/admin/tests/formation/${presetFormation.id}`} variant="secondary">← Retour</ButtonLink>
            : <ButtonLink href="/admin/tests" variant="secondary">← Retour</ButtonLink>
        }
      />
      <NewTestForm
        formations={formations ?? []}
        presetFormationId={presetFormation?.id ?? null}
        presetKind={presetKind ?? 'quiz'}
        presetEnqueteKind={presetEnqueteKind}
      />
    </div>
  );
}
