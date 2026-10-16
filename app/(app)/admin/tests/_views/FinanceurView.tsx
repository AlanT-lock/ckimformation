import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { ViewHeader } from '@/components/app/ViewHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { getOrCreateEnqueteFinanceur } from '../actions';
import { QuestionsManager } from '../[id]/QuestionsManager';
import { FinanceurMetaForm } from '../financeur/FinanceurMetaForm';
import type { QuestionType } from '@/lib/supabase/types';
import { testLinks } from './links';

/**
 * Enquête financeur commune à toutes les formations. `formationId` : ouverte
 * depuis l'onglet d'une formation ; `null` : page autonome (Analyses enquêtes).
 */
export async function FinanceurView({ formationId }: { formationId: string | null }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const testId = await getOrCreateEnqueteFinanceur();
  const supabase = await createClient();
  const [{ data: test }, { data: questions }] = await Promise.all([
    supabase.from('tests').select('id, nom, description, actif').eq('id', testId).single(),
    supabase
      .from('questions')
      .select('id, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options')
      .eq('test_id', testId)
      .order('ordre'),
  ]);

  if (!test) redirect('/admin/formations');
  const links = testLinks(formationId);

  return (
    <div className="space-y-8">
      <ViewHeader
        nested={!!formationId}
        eyebrow="Tests & enquêtes"
        title="Enquête de satisfaction financeur"
        description="Enquête globale envoyée aux entreprises ayant financé une formation, 1 semaine après la fin du stage. Relances tous les 7 jours, maximum 2 relances."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ButtonLink href={formationId ? links.list : '/admin/analytics/enquetes'} variant="secondary">← Retour</ButtonLink>
            <ButtonLink href={links.results(testId)} variant="secondary">Voir les résultats</ButtonLink>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">
          Enquête financeur
        </span>
        <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/70">
          Globale (toutes formations)
        </span>
        {!test.actif && (
          <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60">
            Désactivée
          </span>
        )}
      </div>

      <FinanceurMetaForm
        testId={test.id}
        initial={{ nom: test.nom, description: test.description, actif: test.actif }}
      />

      <div>
        <h2 className="font-display text-2xl tracking-wide">Questions</h2>
        <p className="text-xs text-dark/60 mt-1">
          Ces questions s&apos;appliquent à toutes les formations. L&apos;entreprise y répond directement depuis le lien reçu par email, sans connexion.
        </p>
        <div className="mt-4">
          <QuestionsManager
            testId={test.id}
            testKind="enquete"
            initial={(questions ?? []).map((q) => ({
              id: q.id,
              libelle: q.libelle,
              type_reponse: q.type_reponse as QuestionType,
              options: Array.isArray(q.options) ? (q.options as string[]) : [],
              echelle_max: q.echelle_max,
              required: q.required,
              bonne_reponse: q.bonne_reponse,
              follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
