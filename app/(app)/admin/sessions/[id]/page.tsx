import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SessionForm } from '../SessionForm';
import { CreneauxManager } from './CreneauxManager';
import { DeleteSessionButton } from './DeleteSessionButton';
import type { SessionStatut, SessionAdresse } from '@/lib/supabase/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const [
    { data: session },
    { data: formations },
    { data: formateurs },
    { data: creneaux },
    { data: inscriptions },
  ] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('formations').select('id, slug, titre').eq('actif', true).order('titre'),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'formateur').order('full_name'),
    supabase.from('session_creneaux').select('*').eq('session_id', id).order('ordre'),
    supabase
      .from('inscriptions')
      .select(`
        id, statut, created_at,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, account_type),
        participants:inscription_participants(
          id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', id)
      .order('created_at'),
  ]);

  if (!session) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Session"
        title="Édition"
        description={`ID ${session.id.slice(0, 8)}…`}
        actions={
          <>
            <ButtonLink href="/admin/sessions" variant="secondary">← Retour</ButtonLink>
            <DeleteSessionButton sessionId={session.id} />
          </>
        }
      />

      <SessionForm
        formations={formations ?? []}
        formateurs={formateurs ?? []}
        initial={{
          id: session.id,
          formation_id: session.formation_id,
          formateur_id: session.formateur_id,
          statut: session.statut as SessionStatut,
          adresse: session.adresse as SessionAdresse,
          notes_internes: session.notes_internes,
        }}
      />

      <div>
        <h2 className="font-display text-2xl tracking-wide">Créneaux</h2>
        <p className="text-xs text-dark/60 mt-1">Ajoute, supprime des créneaux. Les modifications sont sauvegardées automatiquement.</p>
        <div className="mt-4">
          <CreneauxManager sessionId={session.id} initial={creneaux ?? []} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wide">Demandes d&apos;inscription ({inscriptions?.length ?? 0})</h2>
        <div className="mt-4 bg-white border border-dark/10 rounded-lg overflow-hidden">
          {(!inscriptions || inscriptions.length === 0) ? (
            <p className="p-6 text-sm text-dark/60">Aucune demande pour l&apos;instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                <tr>
                  <th className="text-left py-2 px-4">Demandeur</th>
                  <th className="text-left py-2 px-4">Participants</th>
                  <th className="text-left py-2 px-4">Statut</th>
                  <th className="text-left py-2 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {inscriptions.map((ins) => {
                  const pay = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
                  const parts = (ins.participants ?? []) as Array<{
                    id: string;
                    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
                    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
                  }>;
                  return (
                    <tr key={ins.id}>
                      <td className="py-2 px-4">
                        {pay?.full_name || pay?.email}
                        {pay?.account_type === 'entreprise' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">Entreprise</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-dark/70">
                        <ul className="space-y-0.5">
                          {parts.map((p) => {
                            const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
                            const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
                            const label = emp ? `${emp.prenom} ${emp.nom}` : prof?.full_name ?? '—';
                            const sub = emp?.email ?? prof?.email ?? '';
                            return (
                              <li key={p.id}>
                                <Link
                                  href={`/admin/sessions/${session.id}/participants/${p.id}`}
                                  className="text-teal hover:underline"
                                >
                                  {label}
                                </Link>
                                {sub && <span className="text-dark/50 text-xs ml-1">({sub})</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td className="py-2 px-4">{ins.statut}</td>
                      <td className="py-2 px-4 text-right">
                        <a href={`/admin/demandes/${ins.id}`} className="text-teal hover:underline text-sm">Voir →</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
