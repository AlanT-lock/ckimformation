import { notFound, redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { ViewHeader } from '@/components/app/ViewHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { NewTestForm } from '../nouveau/NewTestForm';
import type { TestKind, EnqueteKind } from '@/lib/supabase/types';
import { testLinks } from './links';

/** Création d'un test / d'une enquête pour une formation (formation figée). */
export async function NewTestView({
  formationId,
  sp,
}: {
  formationId: string;
  sp: { kind?: string; enquete_kind?: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formations } = await supabase
    .from('formations')
    .select('id, slug, titre')
    .eq('actif', true)
    .order('titre');

  const presetFormationId = formationId;
  const presetKind = (sp.kind === 'quiz' || sp.kind === 'enquete' || sp.kind === 'info' || sp.kind === 'evaluation_formateur') ? sp.kind as TestKind : null;
  const presetEnqueteKind = (sp.enquete_kind === 'a_chaud' || sp.enquete_kind === 'a_froid') ? sp.enquete_kind as EnqueteKind : null;

  const found = (formations ?? []).find((f) => f.id === presetFormationId);
  if (!found) notFound();
  const presetFormation = { id: found.id, titre: found.titre };

  const eyebrow = presetKind === 'enquete'
    ? presetEnqueteKind === 'a_froid' ? 'Nouvelle enquête à froid' : 'Nouvelle enquête à chaud'
    : presetKind === 'evaluation_formateur'
      ? 'Nouvelle évaluation formateur'
      : 'Nouveau test';

  return (
    <div className="space-y-6">
      <ViewHeader
        nested
        eyebrow="Tests & enquêtes"
        title={eyebrow}
        actions={<ButtonLink href={testLinks(presetFormation.id).list} variant="secondary">← Retour</ButtonLink>}
      />
      <NewTestForm
        formations={formations ?? []}
        presetFormationId={presetFormation.id}
        presetKind={presetKind ?? 'quiz'}
        presetEnqueteKind={presetEnqueteKind}
      />
    </div>
  );
}
