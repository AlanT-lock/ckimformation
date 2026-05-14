import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

interface PageProps { params: Promise<{ id: string }> }

interface TestRow {
  id: string;
  nom: string;
  description: string | null;
  kind: string;
  enquete_kind: string | null;
  actif: boolean;
  questions: { count: number }[] | null;
}

export const dynamic = 'force-dynamic';

export default async function AdminTestsFormationPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [{ data: formation }, { data: tests }] = await Promise.all([
    supabase.from('formations').select('id, slug, titre').eq('id', id).single(),
    supabase
      .from('tests')
      .select(`
        id, nom, description, kind, enquete_kind, actif,
        questions:questions(count)
      `)
      .eq('formation_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!formation) notFound();

  const rows = (tests ?? []) as TestRow[];
  const realTests = rows.filter((t) => t.kind === 'quiz');
  const enquetesChaud = rows.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_chaud');
  const enquetesFroid = rows.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_froid');
  // Vieilles enquêtes sans enquete_kind (legacy) : on les met dans "à chaud" par défaut côté affichage
  const enquetesLegacy = rows.filter((t) => t.kind === 'enquete' && !t.enquete_kind);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tests & enquêtes"
        title={formation.titre}
        description="Gérez les tests et enquêtes de satisfaction de cette formation."
        actions={<ButtonLink href="/admin/tests" variant="secondary">← Formations</ButtonLink>}
      />

      <Section
        title="Tests"
        description="Quiz et évaluations avec bonnes réponses pour scorer les stagiaires."
        rows={realTests}
        createHref={`/admin/tests/nouveau?formation=${id}&kind=quiz`}
        createLabel="+ Nouveau test"
      />

      <Section
        title="Enquêtes de satisfaction à chaud"
        description="Le formateur déclenche l'enquête en fin de session, depuis son espace."
        rows={[...enquetesChaud, ...enquetesLegacy]}
        createHref={`/admin/tests/nouveau?formation=${id}&kind=enquete&enquete_kind=a_chaud`}
        createLabel="+ Nouvelle enquête à chaud"
        tone="orange"
      />

      <Section
        title="Enquêtes de satisfaction à froid"
        description="Envoyée automatiquement par email 15 jours après la fin de la formation, puis relancée tous les 15 jours jusqu'à réponse."
        rows={enquetesFroid}
        createHref={`/admin/tests/nouveau?formation=${id}&kind=enquete&enquete_kind=a_froid`}
        createLabel="+ Nouvelle enquête à froid"
        tone="dark"
      />
    </div>
  );
}

function Section({
  title, description, rows, createHref, createLabel, tone = 'teal',
}: {
  title: string; description?: string; rows: TestRow[];
  createHref: string; createLabel: string;
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
                    <Link href={`/admin/tests/${t.id}`} className="min-w-0 flex-1">
                      <p className="font-medium">{t.nom}</p>
                      {t.description && <p className="text-xs text-dark/60 mt-0.5 line-clamp-1">{t.description}</p>}
                      <p className="text-xs text-dark/50 mt-1">
                        {qc} question{qc > 1 ? 's' : ''}
                        {!t.actif && <> · <span className="text-orange">Désactivé</span></>}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3 self-center whitespace-nowrap">
                      {isEnquete && (
                        <Link href={`/admin/tests/${t.id}/resultats`} className="text-xs uppercase tracking-[0.2em] text-orange hover:underline">
                          Résultats →
                        </Link>
                      )}
                      <Link href={`/admin/tests/${t.id}`} className="text-xs uppercase tracking-[0.2em] text-teal hover:underline">
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
