import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { PageHeader } from '@/components/app/PageHeader';
import { AddEmployeeForm } from './AddEmployeeForm';
import { EmployeeRow } from './EmployeeRow';
import type { Employee } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function EmployesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.employer_profile_id) redirect('/stagiaire/parcours');
  if (profile.role !== 'stagiaire' || profile.account_type !== 'entreprise') {
    redirect('/stagiaire');
  }

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('employer_profile_id', profile.id)
    .order('nom', { ascending: true });

  const list = (employees ?? []) as Employee[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Espace entreprise"
        title="Mes salariés"
        description="Ajoutez et gérez les fiches de vos salariés. Vous pourrez ensuite les inscrire à une session de formation."
      />

      <AddEmployeeForm />

      <section className="bg-white border border-dark/10 rounded-lg">
        <header className="px-6 py-4 border-b border-dark/10">
          <h2 className="font-display text-xl">Liste des salariés ({list.length})</h2>
        </header>
        {list.length === 0 ? (
          <p className="px-6 py-8 text-sm text-dark/60">
            Aucun salarié pour le moment. Utilisez le formulaire ci-dessus pour en ajouter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.15em] text-dark/60 bg-light/50">
                <tr>
                  <th className="p-3">Prénom</th>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <EmployeeRow key={e.id} employee={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
