import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { InviteFormateurForm } from '../utilisateurs/InviteFormateurForm';
import { DeleteUserButton } from '../utilisateurs/DeleteUserButton';

export const dynamic = 'force-dynamic';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function AdminFormateursPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formateurs } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, created_at')
    .eq('role', 'formateur')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Formateurs"
        description="Invitation et gestion des comptes formateurs."
      />

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide">Inviter un formateur</h2>
        <p className="text-sm text-dark/60 mt-1 mb-4">
          Le formateur recevra un email avec un lien pour définir son mot de passe et accéder à son espace.
        </p>
        <InviteFormateurForm />
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide mb-3">
          Formateurs ({formateurs?.length ?? 0})
        </h2>
        <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
          {(!formateurs || formateurs.length === 0) ? (
            <p className="p-8 text-sm text-dark/60 text-center">Aucun formateur pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                  <tr>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Téléphone</th>
                    <th className="text-left py-3 px-4">Ajouté le</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/10">
                  {formateurs.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4 font-medium">{u.full_name || '—'}</td>
                      <td className="py-3 px-4 text-dark/70">{u.email}</td>
                      <td className="py-3 px-4 text-dark/70">{u.phone || <span className="text-dark/40">—</span>}</td>
                      <td className="py-3 px-4 text-xs text-dark/60">
                        {u.created_at ? FR_DATE.format(new Date(u.created_at)) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== profile.id && (
                          <DeleteUserButton userId={u.id} email={u.email} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
