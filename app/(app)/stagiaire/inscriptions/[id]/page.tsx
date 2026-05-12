import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';
import { DocumentRequestItem, type DocumentRequestData } from './DocumentRequestItem';
import { SubmitDocumentsButton } from './SubmitDocumentsButton';
import type { InscriptionStatut } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ id: string }> }

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente:          { label: 'En attente',          className: 'bg-orange/10 text-orange' },
  documents_demandes:  { label: 'Documents demandés',  className: 'bg-orange/10 text-orange' },
  documents_recus:     { label: 'Documents reçus',     className: 'bg-teal/10 text-teal' },
  confirmee:           { label: 'Confirmée',           className: 'bg-teal/10 text-teal' },
  refusee:             { label: 'Refusée',             className: 'bg-dark/10 text-dark/60' },
};

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const dynamic = 'force-dynamic';

export default async function StagiaireDemandeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  redirectEmployeeStagiaire(profile);

  const supabase = await createClient();
  const { data: ins } = await supabase
    .from('inscriptions')
    .select(`
      id, statut, created_at, refus_motif, analyse_besoins, payer_profile_id,
      session:sessions(
        id, statut,
        formation:formations(slug, titre),
        creneaux:session_creneaux(date, ordre)
      ),
      participants:inscription_participants(
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      ),
      document_demandes:inscription_document_demandes(*),
      admin_documents:inscription_admin_documents(id, file_name, file_size, mime_type, created_at)
    `)
    .eq('id', id)
    .single();

  if (!ins) notFound();
  if (ins.payer_profile_id !== profile.id) redirect('/stagiaire/inscriptions');

  const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
  const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
  const creneaux = sess?.creneaux ?? [];
  const sortedCreneaux = [...creneaux].sort((a, b) => a.ordre - b.ordre);
  const first = sortedCreneaux[0]?.date;
  const last = sortedCreneaux[sortedCreneaux.length - 1]?.date;
  const statut = STATUT_LABEL[ins.statut as InscriptionStatut] ?? STATUT_LABEL.en_attente;
  const participants = (ins.participants ?? []) as Array<{
    id: string;
    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  }>;
  const docDemandes = ((ins.document_demandes ?? []) as DocumentRequestData[])
    .slice()
    .sort((a, b) => (a.nom).localeCompare(b.nom));
  const adminDocs = (ins.admin_documents ?? []) as Array<{
    id: string; file_name: string; file_size: number | null; mime_type: string | null; created_at: string;
  }>;

  const isStaticStatus = ins.statut === 'confirmee' || ins.statut === 'refusee' || ins.statut === 'documents_recus';
  const showDocsRequest = docDemandes.length > 0;
  const showAdminDocs = adminDocs.length > 0;

  // Compteurs documents
  const docsImported = docDemandes.filter((d) => d.storage_path).length;
  const docsDeclined = docDemandes.filter((d) => d.declined).length;
  const docsPending = docDemandes.length - docsImported - docsDeclined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ma demande"
        title={form?.titre ?? 'Demande d\'inscription'}
        description={`Envoyée le ${new Date(ins.created_at).toLocaleDateString('fr-FR')}`}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${statut.className}`}>
              {statut.label}
            </span>
            <ButtonLink href="/stagiaire/inscriptions" variant="secondary">← Mes demandes</ButtonLink>
          </div>
        }
      />

      {/* Session */}
      <section className="bg-white rounded-lg border border-dark/10 p-5">
        <h2 className="font-display text-xl mb-3">Session</h2>
        <dl className="space-y-1 text-sm">
          <div><dt className="inline text-dark/60">Formation : </dt><dd className="inline">{form?.titre}</dd></div>
          {first && (
            <div>
              <dt className="inline text-dark/60">Dates : </dt>
              <dd className="inline">
                {FR_DATE.format(new Date(first))}
                {last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
              </dd>
            </div>
          )}
        </dl>
        <Link
          href={`/stagiaire/formations/${form?.slug ?? ''}`}
          className="mt-3 inline-block text-xs uppercase tracking-[0.15em] text-teal hover:underline"
        >
          Voir la formation →
        </Link>
      </section>

      {/* Participants */}
      <section className="bg-white rounded-lg border border-dark/10 p-5">
        <h2 className="font-display text-xl mb-3">Participants ({participants.length})</h2>
        <ul className="space-y-1 text-sm">
          {participants.map((p) => {
            const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
            const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
            if (emp) return <li key={p.id}>{emp.prenom} {emp.nom} <span className="text-dark/60 text-xs">({emp.email})</span></li>;
            if (prof) return <li key={p.id}>{prof.full_name} <span className="text-dark/60 text-xs">({prof.email})</span></li>;
            return null;
          })}
        </ul>
      </section>

      {/* Documents demandés par C-KIM */}
      {showDocsRequest && (
        <section>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <h2 className="font-display text-2xl tracking-wide">Documents demandés</h2>
              <p className="text-xs text-dark/60 mt-1">
                {ins.statut === 'documents_recus'
                  ? 'Vous avez envoyé votre réponse. C-KIM va l\'examiner.'
                  : `Importez ou justifiez l\'absence de chaque document. Tous types acceptés (PDF, image, photo, etc.) — 10 Mo max par fichier.`
                }
              </p>
            </div>
            {!isStaticStatus && (
              <div className="text-xs text-dark/60">
                {docsImported} importé{docsImported > 1 ? 's' : ''} · {docsDeclined} justifié{docsDeclined > 1 ? 's' : ''} · {docsPending} en attente
              </div>
            )}
          </div>

          <ul className="space-y-3">
            {docDemandes.map((d) => (
              <DocumentRequestItem
                key={d.id}
                demande={d}
                disabled={isStaticStatus}
              />
            ))}
          </ul>

          {ins.statut === 'documents_demandes' && docsPending === 0 && (
            <div className="mt-4 bg-teal/5 border border-teal/30 rounded-lg p-4">
              <p className="text-sm text-dark/80 mb-3">
                Toutes vos réponses sont prêtes. Cliquez pour les envoyer à C-KIM.
              </p>
              <SubmitDocumentsButton inscriptionId={ins.id} />
            </div>
          )}
        </section>
      )}

      {/* Documents envoyés par C-KIM */}
      {showAdminDocs && (
        <section>
          <h2 className="font-display text-2xl tracking-wide">Documents transmis par C-KIM</h2>
          <ul className="mt-3 space-y-2">
            {adminDocs.map((doc) => (
              <li key={doc.id} className="bg-white border border-dark/10 rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-all">{doc.file_name}</p>
                  <p className="text-xs text-dark/60 mt-0.5">
                    {fmtSize(doc.file_size)} · transmis le {FR_DATETIME.format(new Date(doc.created_at))}
                  </p>
                </div>
                <a
                  href={`/api/documents/download/admin/${doc.id}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
                >
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Motif refus */}
      {ins.statut === 'refusee' && ins.refus_motif && (
        <section className="bg-orange/5 border border-orange/30 rounded-lg p-5">
          <h2 className="font-display text-xl text-orange mb-2">Motif du refus</h2>
          <p className="whitespace-pre-wrap text-sm text-dark/80">{ins.refus_motif}</p>
        </section>
      )}

      {/* Analyse besoins (rappel) */}
      {ins.analyse_besoins && (
        <section className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl mb-2">Analyse des besoins (envoyée à l&apos;inscription)</h2>
          <p className="whitespace-pre-wrap text-sm text-dark/80">{ins.analyse_besoins}</p>
        </section>
      )}
    </div>
  );
}
