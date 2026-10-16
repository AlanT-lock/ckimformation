import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { ViewHeader } from '@/components/app/ViewHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { testLinks, type TestLinks } from './links';

interface TestRow {
  id: string;
  nom: string;
  description: string | null;
  kind: string;
  enquete_kind: string | null;
  actif: boolean;
  questions: { count: number }[] | null;
}

/** Tests & enquêtes d'une formation (onglet de la page formation). */
export async function TestsListView({ formationId: id }: { formationId: string }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: formation }, { data: tests }, { data: financeur }] = await Promise.all([
    supabase.from('formations').select('id, slug, titre').eq('id', id).single(),
    supabase
      .from('tests')
      .select(`
        id, nom, description, kind, enquete_kind, actif,
        questions:questions(count)
      `)
      .eq('formation_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tests')
      .select('id, actif, questions:questions(count)')
      .eq('kind', 'enquete')
      .eq('enquete_kind', 'financeur')
      .is('formation_id', null)
      .maybeSingle(),
  ]);

  if (!formation) notFound();

  const rows = (tests ?? []) as TestRow[];
  const realTests = rows.filter((t) => t.kind === 'quiz');
  const enquetesChaud = rows.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_chaud');
  const enquetesFroid = rows.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_froid');
  // Vieilles enquêtes sans enquete_kind (legacy) : on les met dans "à chaud" par défaut côté affichage
  const enquetesLegacy = rows.filter((t) => t.kind === 'enquete' && !t.enquete_kind);
  const evalsFormateur = rows.filter((t) => t.kind === 'evaluation_formateur');
  const links = testLinks(id);
  const financeurCount = (financeur?.questions as { count: number }[] | null)?.[0]?.count ?? 0;

  return (
    <div className="space-y-8">
      <ViewHeader
        nested
        title="Tests & enquêtes"
        description="Gérez les tests et enquêtes de satisfaction de cette formation."
      />

      <Section
        title="Tests"
        description="Quiz et évaluations avec bonnes réponses pour scorer les stagiaires."
        rows={realTests}
        createHref={links.nouveau('kind=quiz')}
        links={links}
        createLabel="+ Nouveau test"
      />

      <Section
        title="Enquêtes de satisfaction à chaud"
        description="Le formateur déclenche l'enquête en fin de session, depuis son espace."
        rows={[...enquetesChaud, ...enquetesLegacy]}
        createHref={links.nouveau('kind=enquete&enquete_kind=a_chaud')}
        links={links}
        createLabel="+ Nouvelle enquête à chaud"
        tone="orange"
      />

      <Section
        title="Enquêtes de satisfaction à froid"
        description="Envoyée automatiquement par email 15 jours après la fin de la formation, puis relancée tous les 15 jours jusqu'à réponse."
        rows={enquetesFroid}
        createHref={links.nouveau('kind=enquete&enquete_kind=a_froid')}
        links={links}
        createLabel="+ Nouvelle enquête à froid"
        tone="dark"
      />

      <Section
        title="Évaluations formateur"
        description="Évaluations remplies par le formateur pour chaque stagiaire à l'issue de la formation. Non visibles par le stagiaire."
        rows={evalsFormateur}
        createHref={links.nouveau('kind=evaluation_formateur')}
        links={links}
        createLabel="+ Nouvelle évaluation formateur"
        tone="dark"
      />

      <section>
        <Link
          href={links.financeur}
          className="block rounded-lg border border-orange/30 bg-orange/5 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-orange">Commune à toutes les formations</p>
              <p className="font-medium mt-1">Enquête de satisfaction financeur</p>
              <p className="text-xs text-dark/60 mt-1 max-w-xl">
                Envoyée aux entreprises 1 semaine après la fin de la formation (relances tous les 7 jours, 2 maximum).
                {' '}{financeurCount} question{financeurCount > 1 ? 's' : ''}
                {financeur && !financeur.actif && <> · <span className="text-orange">Désactivée</span></>}
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-orange whitespace-nowrap self-center">Configurer →</span>
          </div>
        </Link>
      </section>
    </div>
  );
}

function Section({
  title, description, rows, createHref, createLabel, links, tone = 'teal',
}: {
  title: string; description?: string; rows: TestRow[];
  createHref: string; createLabel: string; links: TestLinks;
  tone?: 'teal' | 'orange' | 'dark';
}) {
  const headerCls = tone === 'orange' ? 'text-orange' : tone === 'dark' ? 'text-dark' : 'text-teal';
  return (
    <section>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className={`font-display text-xl md:text-2xl tracking-wide ${headerCls}`}>{title}</h2>
          {description && <p className="text-xs text-dark/60 mt-1 max-w-2xl">{description}</p>}
        </div>
        <ButtonLink href={createHref} variant="primary">{createLabel}</ButtonLink>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <div className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
            Aucun élément pour le moment.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((t) => {
              const qc = t.questions?.[0]?.count ?? 0;
              const isEnquete = t.kind === 'enquete';
              return (
                <li key={t.id} className="bg-white rounded-lg border border-dark/10 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap p-4">
                    <Link href={links.test(t.id)} className="min-w-0 flex-1">
                      <p className="font-medium">{t.nom}</p>
                      {t.description && <p className="text-xs text-dark/60 mt-0.5 line-clamp-1">{t.description}</p>}
                      <p className="text-xs text-dark/50 mt-1">
                        {qc} question{qc > 1 ? 's' : ''}
                        {!t.actif && <> · <span className="text-orange">Désactivé</span></>}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3 self-center whitespace-nowrap">
                      {isEnquete && (
                        <Link href={links.results(t.id)} className="text-xs uppercase tracking-[0.2em] text-orange hover:underline">
                          Résultats →
                        </Link>
                      )}
                      <Link href={links.test(t.id)} className="text-xs uppercase tracking-[0.2em] text-teal hover:underline">
                        Éditer →
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
