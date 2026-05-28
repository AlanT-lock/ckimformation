import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SessionDedieeClient } from './SessionDedieeClient';
import { claimInvitationFromTokenAction } from '@/app/actions/claim-session-invitation';

export default async function SessionDedieePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ invitation_token?: string }>;
}) {
  const { sessionId } = await params;
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/stagiaire/session-dediee/${sessionId}`);

  if (sp.invitation_token) {
    try {
      await claimInvitationFromTokenAction(sp.invitation_token);
    } catch {
      /* ignore */
    }
  }

  const sb = await createClient();
  const { data: session } = await sb
    .from('sessions')
    .select(`
      id, statut, adresse, reserved_company_id, visibility,
      formations(titre, slug),
      session_creneaux(date, heure_debut, heure_fin),
      session_reserved_details(analyse_besoins, completed_at),
      session_document_requests(
        id, ordre, label, description, required,
        session_document_uploads(id, filename, uploaded_at, storage_path)
      ),
      session_admin_documents(id, filename, label, storage_path, uploaded_at)
    `)
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) notFound();
  if ((session as { reserved_company_id: string | null }).reserved_company_id !== profile.id) {
    notFound();
  }
  if ((session as { statut: string }).statut !== 'published') {
    return <div className="p-6">Cette session n&apos;est pas encore publiée.</div>;
  }

  const { data: employes } = await sb
    .from('employees')
    .select('id, prenom, nom, email')
    .eq('employer_profile_id', profile.id)
    .order('nom');

  // Récupère les employee_id déjà inscrits (via inscription_participants)
  // sur une inscription liée à cette session avec un statut actif.
  const { data: inscParts } = await sb
    .from('inscription_participants')
    .select('employee_id, inscription:inscriptions!inner(session_id, statut)')
    .eq('inscription.session_id', sessionId)
    .not('employee_id', 'is', null);

  const inscritEmployeeIds = (inscParts ?? [])
    .filter((row) => {
      const rel = (row as unknown as { inscription: unknown }).inscription;
      const insc = Array.isArray(rel)
        ? (rel[0] as { statut: string } | undefined)
        : (rel as { statut: string } | null);
      return insc != null && insc.statut !== 'refusee';
    })
    .map((row) => (row as unknown as { employee_id: string }).employee_id);

  const raw = session as Record<string, unknown>;
  const formationRel = raw.formations as
    | { titre?: string | null; slug?: string | null }
    | Array<{ titre?: string | null; slug?: string | null }>
    | null;
  const formation = Array.isArray(formationRel) ? formationRel[0] ?? null : formationRel;
  const detailsRel = raw.session_reserved_details as
    | { analyse_besoins: string | null; completed_at: string | null }
    | Array<{ analyse_besoins: string | null; completed_at: string | null }>
    | null;
  const details = Array.isArray(detailsRel) ? detailsRel[0] ?? null : detailsRel;

  const sessionForClient = {
    id: (raw.id as string),
    formations: formation,
    session_reserved_details: details,
    session_admin_documents: (raw.session_admin_documents ?? []) as Array<{
      id: string;
      filename: string;
      label: string | null;
      storage_path: string;
      uploaded_at: string;
    }>,
    session_document_requests: (raw.session_document_requests ?? []) as Array<{
      id: string;
      ordre: number;
      label: string;
      description: string | null;
      required: boolean;
      session_document_uploads: Array<{
        id: string;
        filename: string;
        uploaded_at: string;
        storage_path: string;
      }>;
    }>,
  };

  return (
    <SessionDedieeClient
      session={sessionForClient}
      employes={employes ?? []}
      inscriptions={inscritEmployeeIds}
    />
  );
}
