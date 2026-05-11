import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { PageHeader } from '@/components/app/PageHeader';
import { AddEmployeeForm } from './AddEmployeeForm';
import { EmployeeCard } from './EmployeeRow';
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

      <section>
        <h2 className="font-display text-xl mb-3">Liste des salariés ({list.length})</h2>
        {list.length === 0 ? (
          <p className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
            Aucun salarié pour le moment. Utilisez le formulaire ci-dessus pour en ajouter.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((e) => (
              <EmployeeCard key={e.id} employee={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
