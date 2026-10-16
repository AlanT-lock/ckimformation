import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { formatDateLong } from '@/lib/date';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadRattachedParticipants } from '@/lib/suivi/data';
import { loadJourneeContext } from '../../context';
import { CommentairesStep } from './CommentairesStep';

export const dynamic = 'force-dynamic';

export default async function JourneeCommentairesPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = await params;
  const ctx = await loadJourneeContext(id, date);

  const admin = createAdminClient();
  const { data: journee } = await admin
    .from('session_journees')
    .select('id, commentaire_general, email_sent_at')
    .eq('session_id', id)
    .eq('date', date)
    .maybeSingle();
  // L'étape 1 (compétences) termine la journée : passage obligé
  if (!journee) redirect(`/formateur/sessions/${id}/journees/${date}`);

  const [rattaches, { data: existing }] = await Promise.all([
    loadRattachedParticipants(id),
    admin
      .from('session_journee_commentaires')
      .select('inscription_participant_id, commentaire')
      .eq('journee_id', journee.id),
  ]);
  const byParticipant = new Map((existing ?? []).map((c) => [c.inscription_participant_id, c.commentaire]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Fin de journée · étape 2 / 2 · J${ctx.dayIndex} sur ${ctx.daysCount}`}
        title={ctx.formationTitre}
        description={`Journée du ${formatDateLong(date)} : tes commentaires (facultatifs).`}
        actions={<ButtonLink href={ctx.backHref} variant="secondary">← Session</ButtonLink>}
      />
      <CommentairesStep
        sessionId={id}
        date={date}
        initialGeneral={journee.commentaire_general ?? ''}
        emailAlreadySent={!!journee.email_sent_at}
        stagiaires={rattaches.map((p) => ({
          participantId: p.id,
          nom: p.nom,
          entreprise: p.entreprise,
          commentaire: byParticipant.get(p.id) ?? '',
        }))}
      />
    </div>
  );
}
