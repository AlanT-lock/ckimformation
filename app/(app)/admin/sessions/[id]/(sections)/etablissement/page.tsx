import { redirect } from 'next/navigation';
import { BesoinsAnswersView } from '@/components/app/besoins/BesoinsAnswersView';
import { loadBesoinsReponses } from '@/lib/besoins/data';
import { formatDate } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';
import { cancelInvitationFormAction, resendInvitationFormAction } from '../../../reservation-actions';
import { requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

type One<T> = T | T[] | null;

export default async function AdminSessionEtablissementPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);
  // Section réservée aux sessions dédiées à un établissement
  if (session.visibility !== 'reserved') redirect(`/admin/sessions/${id}`);

  const supabase = await createClient();
  const [
    { data: claimedRaw },
    { data: pendingRaw },
    { data: detailsRaw },
    { data: requestsRaw },
    { data: adminDocsRaw },
    besoins,
  ] = await Promise.all([
    session.reserved_company_id
      ? supabase
          .from('profiles')
          .select('email, company_details(raison_sociale)')
          .eq('id', session.reserved_company_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('session_invitations')
      .select('id, raison_sociale, email, expires_at, claimed_by')
      .eq('session_id', id)
      .is('claimed_by', null)
      .maybeSingle(),
    supabase
      .from('session_reserved_details')
      .select('analyse_besoins, completed_at')
      .eq('session_id', id)
      .maybeSingle(),
    supabase
      .from('session_document_requests')
      .select('id, label, required, session_document_uploads(id)')
      .eq('session_id', id)
      .order('ordre'),
    supabase
      .from('session_admin_documents')
      .select('id, label, filename')
      .eq('session_id', id)
      .order('uploaded_at'),
    loadBesoinsReponses({ sessionId: id }),
  ]);

  let claimedCompany: { raison_sociale: string; email: string } | null = null;
  if (claimedRaw) {
    const raw = claimedRaw as { email: string; company_details: One<{ raison_sociale: string }> };
    const cd = Array.isArray(raw.company_details) ? raw.company_details[0] : raw.company_details;
    claimedCompany = { raison_sociale: cd?.raison_sociale ?? '', email: raw.email };
  }
  const pendingInvitation = pendingRaw as
    | { id: string; raison_sociale: string; email: string; expires_at: string }
    | null;
  const reservedDetails = detailsRaw as
    | { analyse_besoins: string | null; completed_at: string | null }
    | null;
  const docRequests = ((requestsRaw ?? []) as Array<{
    id: string;
    label: string;
    required: boolean;
    session_document_uploads: unknown[] | null;
  }>).map((r) => ({
    id: r.id,
    label: r.label,
    required: r.required,
    uploadsCount: (r.session_document_uploads ?? []).length,
  }));
  const adminDocs = (adminDocsRaw ?? []) as Array<{ id: string; label: string | null; filename: string }>;

  return (
    <section>
      <SectionHeading title="Établissement réservé" />
      <div className="mt-4 border-2 border-emerald-200 rounded p-4 space-y-4">
        {claimedCompany && (
          <div>
            <div className="font-medium">{claimedCompany.raison_sociale}</div>
            <div className="text-sm text-gray-600">{claimedCompany.email}</div>
          </div>
        )}

        {pendingInvitation && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <div className="font-medium">Invitation en attente</div>
            <div className="text-sm">
              {pendingInvitation.raison_sociale} — {pendingInvitation.email}
              <br />
              Expire le {formatDate(pendingInvitation.expires_at)}
            </div>
            <div className="mt-2 flex gap-2">
              <form action={resendInvitationFormAction}>
                <input type="hidden" name="id" value={pendingInvitation.id} />
                <button className="px-3 py-1 border rounded">Relancer</button>
              </form>
              <form action={cancelInvitationFormAction}>
                <input type="hidden" name="id" value={pendingInvitation.id} />
                <button className="px-3 py-1 border rounded text-red-600">Annuler</button>
              </form>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium">Analyse des besoins</h3>
          <div className="mt-2">
            <BesoinsAnswersView
              answers={besoins?.answers ?? null}
              updatedAt={besoins?.updatedAt ?? null}
              legacyText={reservedDetails?.analyse_besoins}
            />
          </div>
          {reservedDetails?.completed_at && (
            <p className="text-emerald-700 text-sm mt-2">
              ✓ Finalisée le {formatDate(reservedDetails.completed_at)}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-medium">Documents demandés</h3>
          {docRequests.length === 0 ? (
            <p className="text-gray-500 italic">Aucune demande</p>
          ) : (
            <ul className="space-y-1">
              {docRequests.map((r) => (
                <li key={r.id}>
                  {r.label}
                  {r.required && <span className="text-red-600"> *</span>}{' '}
                  — {r.uploadsCount > 0 ? `${r.uploadsCount} fourni(s)` : 'en attente'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium">Documents transmis</h3>
          {adminDocs.length === 0 ? (
            <p className="text-gray-500 italic">Aucun document</p>
          ) : (
            <ul className="space-y-1">
              {adminDocs.map((d) => (
                <li key={d.id}>{d.label ?? d.filename}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
