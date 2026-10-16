import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { formatDate } from '@/lib/date';
import { loadEntrepriseSuivis } from '@/lib/suivi/data';
import { SuiviProgress } from '@/components/app/suivi/SuiviProgress';
import { SuiviDetail } from '@/components/app/suivi/SuiviDetail';

export const dynamic = 'force-dynamic';

/** Détail du suivi d'une session pour l'entreprise qui a inscrit ses salariés. */
export default async function EntrepriseSuiviPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?redirect=${encodeURIComponent(`/stagiaire/suivi/${sessionId}`)}`);
  if (profile.account_type !== 'entreprise' || profile.employer_profile_id) redirect('/stagiaire');

  const [suivi] = await loadEntrepriseSuivis(profile.id, sessionId);
  if (!suivi) notFound();

  const first = suivi.days[0];
  const last = suivi.days[suivi.days.length - 1];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Suivi de formation"
        title={suivi.formationTitre}
        description={[
          first && last ? (first === last ? formatDate(first) : `Du ${formatDate(first)} au ${formatDate(last)}`) : null,
          suivi.stagiaires.length > 0 ? `Salarié${suivi.stagiaires.length > 1 ? 's' : ''} : ${suivi.stagiaires.join(', ')}` : null,
        ].filter(Boolean).join(' · ')}
        actions={<ButtonLink href="/stagiaire" variant="secondary">← Tableau de bord</ButtonLink>}
      />

      <section className="bg-white rounded-xl border border-dark/10 p-5 md:p-6">
        <SuiviProgress suivi={suivi} />
      </section>

      <SuiviDetail suivi={suivi} commentairesLabel="Retours du formateur sur vos salariés" />
    </div>
  );
}
