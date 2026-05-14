import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export default async function AdminTestsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formations } = await supabase
    .from('formations')
    .select(`
      id, slug, titre,
      tests:tests(id, kind, enquete_kind, actif)
    `)
    .eq('actif', true)
    .order('titre');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tests & enquêtes"
        description="Sélectionnez une formation pour gérer ses tests et enquêtes de satisfaction."
      />

      <Link
        href="/admin/tests/financeur"
        className="block bg-white rounded-lg border border-orange/30 bg-orange/5 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-orange">Enquête globale</p>
            <p className="font-medium mt-1">Enquête de satisfaction financeur</p>
            <p className="text-xs text-dark/60 mt-1 max-w-xl">
              S'applique à toutes les formations. Envoyée aux entreprises 1 semaine après la fin de la formation, avec relances 7j et max 2.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-orange whitespace-nowrap self-center">Configurer →</span>
        </div>
      </Link>

      {(!formations || formations.length === 0) ? (
        <div className="bg-white rounded-lg border border-dark/10 p-8 text-sm text-dark/60 text-center">
          Aucune formation. Créez-en une depuis l&apos;onglet Formations.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formations.map((f) => {
            const tests = (f.tests ?? []) as Array<{ kind: string; enquete_kind: string | null; actif: boolean }>;
            const testsCount = tests.filter((t) => t.kind === 'quiz' && t.actif).length;
            const chaudCount = tests.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_chaud' && t.actif).length;
            const froidCount = tests.filter((t) => t.kind === 'enquete' && t.enquete_kind === 'a_froid' && t.actif).length;
            return (
              <li key={f.id}>
                <Link
                  href={`/admin/tests/formation/${f.id}`}
                  className="block bg-white rounded-lg border border-dark/10 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <p className="font-medium">{f.titre}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge color="teal">{testsCount} test{testsCount > 1 ? 's' : ''}</Badge>
                    <Badge color="orange">{chaudCount} enquête{chaudCount > 1 ? 's' : ''} à chaud</Badge>
                    <Badge color="dark">{froidCount} enquête{froidCount > 1 ? 's' : ''} à froid</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'teal' | 'orange' | 'dark' }) {
  const cls = color === 'teal'
    ? 'bg-teal/10 text-teal'
    : color === 'orange'
      ? 'bg-orange/10 text-orange'
      : 'bg-dark/10 text-dark/70';
  return <span className={`px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${cls}`}>{children}</span>;
}
