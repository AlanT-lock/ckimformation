import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string; testId: string; participantId: string }>;
}

// Ancienne adresse (une page par questionnaire et par stagiaire) : tout le bilan
// d'un stagiaire tient désormais sur une seule page.
export default async function FormateurEvaluationLegacyPage({ params }: PageProps) {
  const { id, participantId } = await params;
  redirect(`/formateur/sessions/${id}/evaluations/stagiaire/${participantId}`);
}
