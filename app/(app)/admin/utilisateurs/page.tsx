import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { InviteFormateurForm } from './InviteFormateurForm';
import { DeleteUserButton } from './DeleteUserButton';

const ROLE_LABEL: Record<string, { label: string; className: string }> = {
  admin:     { label: 'Admin',     className: 'bg-orange/10 text-orange' },
  formateur: { label: 'Formateur', className: 'bg-teal/10 text-teal' },
  stagiaire: { label: 'Stagiaire', className: 'bg-dark/10 text-dark/70' },
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const sp = await searchParams;
  const tab = sp.tab ?? 'formateurs';

  const supabase = await createClient();
  const filterRole =
    tab === 'admins' ? 'admin' :
    tab === 'stagiaires' ? 'stagiaire' : 'formateur';

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, account_type, phone, created_at')
    .eq('role', filterRole)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Gère les administrateurs, formateurs et comptes stagiaires."
      />

      <div className="flex gap-2 border-b border-dark/10">
        {[
          { k: 'formateurs', l: 'Formateurs' },
          { k: 'stagiaires', l: 'Stagiaires' },
          { k: 'admins',     l: 'Admins' },
        ].map((t) => (
          <a
            key={t.k}
            href={`/admin/utilisateurs?tab=${t.k}`}
            className={`px-4 py-2 text-sm border-b-2 transition ${
              tab === t.k ? 'border-teal text-teal font-medium' : 'border-transparent text-dark/60 hover:text-dark'
            }`}
          >
            {t.l}
          </a>
        ))}
      </div>

      {tab === 'formateurs' && (
        <section className="bg-white rounded-lg border border-dark/10 p-6">
          <h2 className="font-display text-2xl tracking-wide">Inviter un formateur</h2>
          <p className="text-sm text-dark/60 mt-1 mb-4">
            Le formateur recevra un email avec un lien pour définir son mot de passe et accéder à son espace.
          </p>
          <InviteFormateurForm />
        </section>
      )}

      <section>
        <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
          {(!users || users.length === 0) ? (
            <p className="p-8 text-sm text-dark/60 text-center">Aucun utilisateur dans cette catégorie.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                <tr>
                  <th className="text-left py-3 px-4">Nom</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Rôle</th>
                  <th className="text-right py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {users.map((u) => {
                  const role = ROLE_LABEL[u.role] ?? ROLE_LABEL.stagiaire;
                  return (
                    <tr key={u.id}>
                      <td className="py-3 px-4 font-medium">
                        {u.full_name || '—'}
                        {u.account_type === 'entreprise' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">Entreprise</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-dark/70">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${role.className}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== profile.id && (
                          <DeleteUserButton userId={u.id} email={u.email} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
