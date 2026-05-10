import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

const KIND_LABEL: Record<string, string> = {
  quiz: 'Quiz / Test',
  enquete: 'Enquête',
  info: 'Informatif',
};

export default async function AdminTestsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: tests } = await supabase
    .from('tests')
    .select(`
      id, nom, kind, actif, created_at,
      formation:formations(slug, titre),
      questions:questions(count)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tests & enquêtes"
        description="Crée des questionnaires que les formateurs déclencheront pendant la session."
        actions={<ButtonLink href="/admin/tests/nouveau">+ Nouveau test</ButtonLink>}
      />

      <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
        {(!tests || tests.length === 0) ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            Aucun test pour l&apos;instant.{' '}
            <a href="/admin/tests/nouveau" className="text-teal underline">Créer le premier</a>.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Questions</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {tests.map((t) => {
                const f = Array.isArray(t.formation) ? t.formation[0] : t.formation;
                const qCount = Array.isArray(t.questions) ? (t.questions[0]?.count ?? 0) : 0;
                return (
                  <tr key={t.id} className="hover:bg-light/50">
                    <td className="py-3 px-4 font-medium">{t.nom}</td>
                    <td className="py-3 px-4 text-dark/70">{KIND_LABEL[t.kind] ?? t.kind}</td>
                    <td className="py-3 px-4 text-dark/70">{f?.titre ?? '—'}</td>
                    <td className="py-3 px-4 text-dark/70">{qCount}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
                        t.actif ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'
                      }`}>
                        {t.actif ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a href={`/admin/tests/${t.id}`} className="text-teal text-xs uppercase tracking-wider hover:underline">
                        Éditer →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
