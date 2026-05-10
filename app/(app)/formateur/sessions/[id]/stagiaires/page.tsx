import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { StagiaireRow, type StagiaireRowData } from './StagiaireRow';

interface PageProps { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic';

export default async function StagiairesPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formateur_id, formation:formations(titre)')
    .eq('id', id)
    .single();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    redirect('/formateur/sessions');
  }
  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;

  // Toutes les inscriptions confirmées de cette session + leurs participants
  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select(`
      id, statut,
      participants:inscription_participants(
        id,
        employee:employees(id, prenom, nom, email, profile_id),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      )
    `)
    .eq('session_id', id)
    .eq('statut', 'confirmee');

  const rows: StagiaireRowData[] = [];
  for (const ins of inscriptions ?? []) {
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      employee: { id: string; prenom: string; nom: string; email: string; profile_id: string | null } | { id: string; prenom: string; nom: string; email: string; profile_id: string | null }[] | null;
      profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    }>;
    for (const p of parts) {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      if (emp) {
        rows.push({
          inscriptionParticipantId: p.id,
          type: 'employee',
          employeeId: emp.id,
          prenom: emp.prenom,
          nom: emp.nom,
          email: emp.email,
          hasAccount: !!emp.profile_id,
        });
      } else if (prof) {
        const parts = prof.full_name.split(' ');
        rows.push({
          inscriptionParticipantId: p.id,
          type: 'particulier',
          employeeId: null,
          prenom: parts[0] ?? '',
          nom: parts.slice(1).join(' '),
          email: prof.email,
          hasAccount: true,
        });
      }
    }
  }

  const sansCompte = rows.filter((r) => r.type === 'employee' && !r.hasAccount).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Session"
        title={`Stagiaires — ${formation?.titre ?? ''}`}
        description="Liste des stagiaires inscrits sur les demandes confirmées."
        actions={<ButtonLink href={`/formateur/sessions/${id}`} variant="secondary">← Session</ButtonLink>}
      />

      {sansCompte > 0 && (
        <div className="bg-orange/10 border border-orange/30 rounded p-4 text-sm text-orange">
          {sansCompte} stagiaire{sansCompte > 1 ? 's' : ''} sans compte. Envoyez l&apos;invitation pour qu&apos;ils puissent
          signer les émargements et compléter les questionnaires le jour J.
        </div>
      )}

      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            Aucun stagiaire inscrit (confirmé) pour cette session.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.15em] text-dark/60 bg-light/50">
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Compte</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <StagiaireRow key={r.inscriptionParticipantId} sessionId={id} row={r} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
