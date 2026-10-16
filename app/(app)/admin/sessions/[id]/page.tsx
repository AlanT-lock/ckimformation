import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SessionForm } from '../SessionForm';
import { CreneauxManager } from './CreneauxManager';
import { DeleteSessionButton } from './DeleteSessionButton';
import { resendInvitationFormAction, cancelInvitationFormAction } from '../reservation-actions';
import type { SessionStatut, SessionAdresse } from '@/lib/supabase/types';
import { formatDate } from '@/lib/date';
import { loadSessionConvocationData } from '@/lib/pdf/data';
import { ConvocationsPanel } from './ConvocationsPanel';
import { SessionParticipantsManager, type SessionParticipantRow } from './SessionParticipantsManager';
import { EmargementBoard } from '@/components/app/EmargementBoard';
import { TestsExportPanel, type TestsExportRow } from './TestsExportPanel';
import { loadSessionSuivi } from '@/lib/suivi/data';
import { SuiviProgress } from '@/components/app/suivi/SuiviProgress';
import { SuiviDetail } from '@/components/app/suivi/SuiviDetail';
import { loadBesoinsReponses } from '@/lib/besoins/data';
import { BesoinsAnswersView } from '@/components/app/besoins/BesoinsAnswersView';
import type { EmargementBoardEntry } from '@/lib/emargements/board';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const maxDuration = 60;

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
          employee:employees(prenom, nom, email, profile_id),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', id)
      .order('created_at'),
  ]);

  if (!session) notFound();

  const participantRows: SessionParticipantRow[] = [];
  for (const ins of inscriptions ?? []) {
    const pay = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
    const payerLabel = pay?.full_name || pay?.email || '';
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      employee: {
        prenom: string; nom: string; email: string; profile_id: string | null;
      } | {
        prenom: string; nom: string; email: string; profile_id: string | null;
      }[] | null;
      profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    }>;
    for (const p of parts) {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      if (emp) {
        participantRows.push({
          id: p.id,
          inscriptionId: ins.id,
          inscriptionStatut: ins.statut,
          prenom: emp.prenom,
          nom: emp.nom,
          email: emp.email,
          kind: 'employee',
          hasAccount: !!emp.profile_id,
          payerLabel,
        });
      } else if (prof) {
        const bits = (prof.full_name ?? '').split(' ');
        participantRows.push({
          id: p.id,
          inscriptionId: ins.id,
          inscriptionStatut: ins.statut,
          prenom: bits[0] ?? '',
          nom: bits.slice(1).join(' '),
          email: prof.email,
          kind: 'profile',
          hasAccount: true,
          payerLabel,
        });
      }
    }
  }

  const [convocationData, suivi, besoinsDediee] = await Promise.all([
    loadSessionConvocationData(id),
    loadSessionSuivi(id, 'all'),
    loadBesoinsReponses({ sessionId: id }),
  ]);

  // Tests & enquêtes : stagiaires confirmés + nombre de complétions
  const confirmedRows = participantRows.filter((r) => r.inscriptionStatut === 'confirmee');
  const { data: completionRows } = confirmedRows.length > 0
    ? await supabase
        .from('test_completions')
        .select('inscription_participant_id')
        .in('inscription_participant_id', confirmedRows.map((r) => r.id))
        .not('completed_at', 'is', null)
    : { data: [] as Array<{ inscription_participant_id: string | null }> };
  const completedByParticipant = new Map<string, number>();
  for (const c of completionRows ?? []) {
    if (!c.inscription_participant_id) continue;
    completedByParticipant.set(c.inscription_participant_id, (completedByParticipant.get(c.inscription_participant_id) ?? 0) + 1);
  }
  const testsExportRows: TestsExportRow[] = confirmedRows
    .map((r) => ({
      participantId: r.id,
      nom: `${r.prenom} ${r.nom}`.trim() || r.email,
      // Seules les fiches salarié sont forcément rattachées à l'entreprise payeuse
      entreprise: r.kind === 'employee' ? r.payerLabel || null : null,
      completedCount: completedByParticipant.get(r.id) ?? 0,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  const creneauIds = (creneaux ?? []).map((c) => c.id);
  const [{ data: stagiaireEmargements }, { data: formateurEmargements }] = await Promise.all([
    creneauIds.length > 0
      ? supabase
          .from('emargements')
          .select('creneau_id, signed_at, signature_data, inscription_participant_id')
          .in('creneau_id', creneauIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('formateur_emargements')
      .select('creneau_id, signed_at, signature_data')
      .eq('session_id', id),
  ]);

  const formateurName =
    (formateurs ?? []).find((f) => f.id === session.formateur_id)?.full_name
    || 'Formateur';
  const boardEntries: EmargementBoardEntry[] = [];
  for (const fe of formateurEmargements ?? []) {
    boardEntries.push({
      id: `formateur-${fe.creneau_id}`,
      creneauId: fe.creneau_id,
      role: 'formateur',
      name: formateurName,
      signedAt: fe.signed_at,
      signatureDataUrl: fe.signature_data,
    });
  }
  const signedStagiaire = new Set(
    (stagiaireEmargements ?? [])
      .filter((e) => e.inscription_participant_id)
      .map((e) => `${e.inscription_participant_id}-${e.creneau_id}`),
  );
  for (const se of stagiaireEmargements ?? []) {
    if (!se.inscription_participant_id) continue;
    const part = participantRows.find((p) => p.id === se.inscription_participant_id);
    boardEntries.push({
      id: `${se.inscription_participant_id}-${se.creneau_id}`,
      creneauId: se.creneau_id,
      role: 'stagiaire',
      name: part ? `${part.prenom} ${part.nom}`.trim() : 'Stagiaire',
      signedAt: se.signed_at,
      signatureDataUrl: se.signature_data,
    });
  }
  for (const p of participantRows) {
    for (const c of creneaux ?? []) {
      const key = `${p.id}-${c.id}`;
      if (!signedStagiaire.has(key)) {
        boardEntries.push({
          id: key,
          creneauId: c.id,
          role: 'stagiaire',
          name: `${p.prenom} ${p.nom}`.trim(),
          signedAt: null,
          signatureDataUrl: null,
        });
      }
    }
  }

  // Reserved-session related data
  let claimedCompany: { raison_sociale: string; email: string } | null = null;
  let pendingInvitation:
    | { id: string; raison_sociale: string; email: string; expires_at: string }
    | null = null;
  let reservedDetails:
    | { analyse_besoins: string | null; completed_at: string | null }
    | null = null;
  let docRequests: Array<{
    id: string;
    label: string;
    required: boolean;
    uploadsCount: number;
  }> = [];
  let adminDocs: Array<{ id: string; label: string | null; filename: string }> = [];

  if (session.visibility === 'reserved') {
    const [
      { data: claimedRaw },
      { data: pendingRaw },
      { data: detailsRaw },
      { data: requestsRaw },
      { data: adminDocsRaw },
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
    ]);

    if (claimedRaw) {
      const cd = (claimedRaw as { email: string; company_details: { raison_sociale: string } | { raison_sociale: string }[] | null }).company_details;
      const raison = Array.isArray(cd) ? cd[0]?.raison_sociale ?? '' : cd?.raison_sociale ?? '';
      claimedCompany = {
        raison_sociale: raison,
        email: (claimedRaw as { email: string }).email,
      };
    }
    if (pendingRaw) {
      pendingInvitation = pendingRaw as {
        id: string;
        raison_sociale: string;
        email: string;
        expires_at: string;
      };
    }
    if (detailsRaw) {
      reservedDetails = detailsRaw as {
        analyse_besoins: string | null;
        completed_at: string | null;
      };
    }
    docRequests = (requestsRaw ?? []).map((r: { id: string; label: string; required: boolean; session_document_uploads: unknown[] | null }) => ({
      id: r.id,
      label: r.label,
      required: r.required,
      uploadsCount: (r.session_document_uploads ?? []).length,
    }));
    adminDocs = (adminDocsRaw ?? []) as Array<{ id: string; label: string | null; filename: string }>;
  }

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
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide">Feuille d&apos;émargement</h2>
            <p className="text-xs text-dark/60 mt-1">
              Cliquez sur un créneau pour afficher ou masquer les signatures (formateur encadré orange).
            </p>
          </div>
          <a
            href={`/api/pdf/emargements/session/${session.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
          >
            Feuille collective (PDF)
          </a>
        </div>
        <EmargementBoard
          creneaux={(creneaux ?? []).map((c) => ({
            id: c.id, date: c.date, heure_debut: c.heure_debut, heure_fin: c.heure_fin, ordre: c.ordre,
          }))}
          entries={boardEntries}
          formateurName={formateurName}
        />
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wide">Stagiaires ({participantRows.length})</h2>
        <p className="text-xs text-dark/60 mt-1">
          Retirez un participant ou ajoutez un compte déjà créé (pour rattacher manuellement un stagiaire à la session).
        </p>
        <div className="mt-4">
          <SessionParticipantsManager sessionId={session.id} initial={participantRows} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wide">Tests &amp; enquêtes</h2>
        <p className="text-xs text-dark/60 mt-1">
          Exportez en PDF les réponses aux tests et enquêtes (y compris l&apos;enquête financeur et les évaluations formateur),
          pour un stagiaire ou pour tous les stagiaires dans un seul fichier.
        </p>
        <div className="mt-4">
          <TestsExportPanel sessionId={session.id} rows={testsExportRows} />
        </div>
      </div>

      {suivi && suivi.journees.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <h2 className="font-display text-2xl tracking-wide inline">Suivi des journées</h2>
            <span className="ml-3 text-xs text-teal group-open:hidden">Afficher ▾</span>
            <span className="ml-3 text-xs text-teal hidden group-open:inline">Masquer ▴</span>
            <p className="text-xs text-dark/60 mt-1">
              Compétences cochées et commentaires du formateur en fin de journée (vue entreprise, tous les stagiaires).
            </p>
          </summary>
          <div className="mt-4 space-y-6">
            <div className="bg-white rounded-xl border border-dark/10 p-5">
              <SuiviProgress suivi={suivi} />
            </div>
            <SuiviDetail suivi={suivi} commentairesLabel="Commentaires par stagiaire" />
          </div>
        </details>
      )}

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

      {convocationData && <ConvocationsPanel data={convocationData} />}

      {session.visibility === 'reserved' && (
        <section className="border-2 border-emerald-200 rounded p-4 mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Établissement réservé</h2>

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
                Expire le{' '}
                {formatDate(pendingInvitation.expires_at)}
              </div>
              <div className="mt-2 flex gap-2">
                <form action={resendInvitationFormAction}>
                  <input type="hidden" name="id" value={pendingInvitation.id} />
                  <button className="px-3 py-1 border rounded">Relancer</button>
                </form>
                <form action={cancelInvitationFormAction}>
                  <input type="hidden" name="id" value={pendingInvitation.id} />
                  <button className="px-3 py-1 border rounded text-red-600">
                    Annuler
                  </button>
                </form>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium">Analyse des besoins</h3>
            <div className="mt-2">
              <BesoinsAnswersView
                answers={besoinsDediee?.answers ?? null}
                updatedAt={besoinsDediee?.updatedAt ?? null}
                legacyText={reservedDetails?.analyse_besoins}
              />
            </div>
            {reservedDetails?.completed_at && (
              <p className="text-emerald-700 text-sm mt-2">
                ✓ Finalisée le{' '}
                {formatDate(reservedDetails.completed_at)}
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
        </section>
      )}
    </div>
  );
}
