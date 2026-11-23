import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { loadSessionBilans } from '@/lib/suivi/data';
import { bilanStatut, type BilanStatut } from '@/lib/suivi/bilan';

interface PageProps { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic';

const STATUT_BADGE: Record<BilanStatut, { label: string; className: string }> = {
  complet: { label: '✅ rempli — modifier →', className: 'text-teal' },
  en_cours: { label: '✏️ à compléter →', className: 'text-orange' },
  a_remplir: { label: '⏳ à remplir →', className: 'text-orange' },
};

/** Bilans de fin de formation : une ligne par stagiaire, une seule page à remplir pour chacun. */
export default async function FormateurBilansPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const bilans = await loadSessionBilans(id);
  if (!bilans) notFound();
  if (profile.role === 'formateur' && bilans.formateurId !== profile.id) redirect('/formateur/sessions');

  const evaluationsTotal = bilans.evaluations.length;
  const competencesTotal = bilans.competences.length;
  const rows = bilans.stagiaires.map((s) => {
    const competencesEvaluees = bilans.competences.filter((c) => s.niveaux[c.id]).length;
    const evaluationsRemplies = bilans.evaluations.filter((e) => s.evaluationsRemplies.includes(e.id)).length;
    return {
      ...s,
      competencesEvaluees,
      evaluationsRemplies,
      statut: bilanStatut({ evaluationsTotal, evaluationsRemplies, competencesTotal, competencesEvaluees }),
    };
  });
  const doneCount = rows.filter((r) => r.statut === 'complet').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Session"
        title={`Bilans par stagiaire — ${bilans.formationTitre}`}
        description="En fin de formation, remplis le bilan de chaque stagiaire : évaluation et niveau d'acquisition des compétences, sur une seule page."
        actions={<ButtonLink href={`/formateur/sessions/${id}`} variant="secondary">← Session</ButtonLink>}
      />

      {evaluationsTotal === 0 && competencesTotal === 0 ? (
        <div className="bg-white border border-dark/10 rounded-lg p-8 text-sm text-dark/60 text-center">
          Aucune évaluation formateur ni compétence n&apos;est configurée pour cette formation.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-dark/10 rounded-lg p-8 text-sm text-dark/60 text-center">
          Aucun stagiaire inscrit (confirmé) pour cette session.
        </div>
      ) : (
        <section className="bg-white border border-dark/10 rounded-lg overflow-hidden">
          <header className="p-4 border-b border-dark/10 flex items-start justify-between gap-3 flex-wrap">
            <p className="text-xs text-dark/60">
              {[
                evaluationsTotal > 0 ? `${evaluationsTotal} évaluation${evaluationsTotal > 1 ? 's' : ''}` : null,
                competencesTotal > 0 ? `${competencesTotal} compétence${competencesTotal > 1 ? 's' : ''}` : null,
              ].filter(Boolean).join(' · ')}{' '}
              par stagiaire
            </p>
            <span className="text-xs uppercase tracking-[0.2em] text-dark/60 whitespace-nowrap">
              {doneCount} / {rows.length} rempli{doneCount > 1 ? 's' : ''}
            </span>
          </header>
          <ul className="divide-y divide-dark/10">
            {rows.map((s) => {
              const badge = STATUT_BADGE[s.statut];
              return (
                <li key={s.id}>
                  <Link
                    href={`/formateur/sessions/${id}/evaluations/stagiaire/${s.id}`}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-dark/5 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{s.nom}</p>
                      <p className="text-xs text-dark/60 mt-0.5 truncate">
                        {[
                          evaluationsTotal > 0 ? `Évaluations ${s.evaluationsRemplies} / ${evaluationsTotal}` : null,
                          competencesTotal > 0 ? `Compétences ${s.competencesEvaluees} / ${competencesTotal}` : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={`text-xs uppercase tracking-[0.2em] whitespace-nowrap ${badge.className}`}>
                      {badge.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
