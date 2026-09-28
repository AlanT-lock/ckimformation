import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listEnrollableSessions, loadCompanyDetail } from '@/lib/companies/queries';
import { EMPLOYEE_STATUS_LABEL } from '@/lib/companies/status';
import { formatDate } from '@/lib/date';
import { ResendCompanyInvitationButton } from './ResendCompanyInvitationButton';
import { AddCompanyEmployeeForm } from './AddCompanyEmployeeForm';
import { ResendEmployeeInvitationButton } from './ResendEmployeeInvitationButton';
import { EnrollEmployeesDialog } from './EnrollEmployeesDialog';

export const dynamic = 'force-dynamic';

const STATUT_LABEL: Record<string, string> = {
  draft: 'Brouillon', published: 'Publiée', cancelled: 'Annulée', completed: 'Terminée',
};

export default async function AdminEntrepriseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invitation?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');
  const { id } = await params;
  const sp = await searchParams;

  const admin = createAdminClient();
  const d = await loadCompanyDetail(admin, id);
  if (!d) notFound();
  const enrollable = await listEnrollableSessions(admin, id);

  const addr = d.company.billing_address;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entreprise"
        title={d.company.raison_sociale}
        description={`${d.full_name} · ${d.email}`}
        actions={<ButtonLink href="/admin/entreprises" variant="secondary">← Liste</ButtonLink>}
      />

      {sp.invitation === 'sent' && (
        <p className="text-sm border rounded p-3 text-teal bg-teal/10 border-teal/30">
          Entreprise créée. L&apos;invitation a été envoyée à {d.email}.
        </p>
      )}
      {sp.invitation === 'failed' && (
        <p className="text-sm border rounded p-3 text-orange bg-orange/10 border-orange/30">
          Entreprise créée, mais l&apos;email d&apos;invitation n&apos;a pas pu être envoyé. Utilisez « Renvoyer l&apos;invitation ».
        </p>
      )}

      {/* Infos */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Card title="Société">
          <Row k="Raison sociale" v={d.company.raison_sociale} />
          <Row k="SIRET" v={d.company.siret || '—'} />
          <Row k="TVA intra." v={d.company.tva_intra || '—'} />
          <Row k="Secteur" v={d.secteur || '—'} />
          <Row k="Créée le" v={formatDate(d.created_at)} />
        </Card>
        <Card title="Adresse de facturation">
          <p className="text-sm">{addr?.rue || '—'}</p>
          <p className="text-sm">{[addr?.code_postal, addr?.ville].filter(Boolean).join(' ')}</p>
          <p className="text-sm text-dark/60">{addr?.pays || ''}</p>
        </Card>
        <Card title="Contact">
          <Row k="Nom" v={d.full_name || '—'} />
          <Row k="Fonction" v={d.company.contact_fonction || '—'} />
          <Row k="Email" v={d.email} />
          <Row k="Téléphone" v={d.phone || '—'} />
          <Row k="Compte" v={d.active ? 'Actif' : 'Invitation en attente'} />
          {!d.active && <div className="pt-3"><ResendCompanyInvitationButton companyId={d.id} /></div>}
        </Card>
      </section>

      {/* Salariés */}
      <section className="bg-white rounded-lg border border-dark/10">
        <header className="flex items-center justify-between gap-3 p-6 pb-3">
          <h2 className="font-display text-xl">Salariés ({d.employees.length})</h2>
        </header>
        <AddCompanyEmployeeForm companyId={d.id} />
        {d.employees.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-dark/60">Aucun salarié pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {d.employees.map((e) => (
                <tr key={e.id}>
                  <td className="py-3 px-4">
                    {e.profile_id ? (
                      <Link href={`/admin/stagiaires/${e.profile_id}`} className="font-medium hover:underline">{e.prenom} {e.nom}</Link>
                    ) : (
                      <span className="font-medium">{e.prenom} {e.nom}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-dark/70">{e.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs ${e.status === 'actif' ? 'text-teal' : 'text-orange'}`}>{EMPLOYEE_STATUS_LABEL[e.status]}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {e.status !== 'actif' && <ResendEmployeeInvitationButton companyId={d.id} employeeId={e.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sessions */}
      <section className="bg-white rounded-lg border border-dark/10">
        <header className="flex items-center justify-between gap-3 p-6 pb-3">
          <h2 className="font-display text-xl">Sessions ({d.sessions.length})</h2>
          <EnrollEmployeesDialog
            companyId={d.id}
            sessions={enrollable}
            employees={d.employees.map((e) => ({ id: e.id, name: `${e.prenom} ${e.nom}`.trim() }))}
          />
        </header>
        {d.sessions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-dark/60">Aucune session liée à cette entreprise.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Dates</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-left py-3 px-4">Participants de l&apos;entreprise</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {d.sessions.map((s) => {
                const href = `/admin/sessions/${s.id}`;
                return (
                  <tr key={s.id} className="hover:bg-light/50">
                    <td className="py-3 px-4">
                      <Link href={href} className="block font-medium">
                        {s.formationTitre}
                        {s.reserved && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal uppercase tracking-wider">Réservée</span>}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-dark/70">
                      {s.firstDate ? formatDate(s.firstDate) : '—'}
                      {s.lastDate && s.lastDate !== s.firstDate && <> → {formatDate(s.lastDate)}</>}
                    </td>
                    <td className="py-3 px-4">{STATUT_LABEL[s.statut] ?? s.statut}</td>
                    <td className="py-3 px-4 text-dark/70">{s.participants.join(', ') || <span className="text-dark/40">—</span>}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">Voir →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-6">
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <dl className="text-sm space-y-1">{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-dark/60">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
