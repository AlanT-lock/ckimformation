import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient } from '@/lib/supabase/server';
import { DemandeActions } from './DemandeActions';
import { EnqueteFinanceurSection } from './EnqueteFinanceurSection';
import type { InscriptionDocumentDemande, InscriptionAdminDocument } from '@/lib/supabase/types';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const FR_TIME = (h: string) => h.slice(0, 5);

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmee?: string; refusee?: string; docs_demandes?: string; tab?: string }>;
}

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente:          { label: 'En attente',          className: 'bg-orange/10 text-orange' },
  documents_demandes:  { label: 'Documents demandés',  className: 'bg-orange/15 text-orange' },
  documents_recus:     { label: 'Documents reçus',     className: 'bg-teal/10 text-teal' },
  confirmee:           { label: 'Confirmée',           className: 'bg-teal/10 text-teal' },
  refusee:             { label: 'Refusée',             className: 'bg-dark/10 text-dark/60' },
};

export const dynamic = 'force-dynamic';

export default async function AdminDemandeDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: ins } = await supabase
    .from('inscriptions')
    .select(`
      id, statut, created_at, analyse_besoins, refus_motif, confirmed_at, refused_at, payer_profile_id, session_id,
      session:sessions(
        id, adresse,
        formation:formations(slug, titre),
        formateur:profiles!sessions_formateur_id_fkey(full_name, email),
        creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)
      ),
      payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, phone, account_type),
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

  const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
  const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
  const formateur = sess && (Array.isArray(sess.formateur) ? sess.formateur[0] : sess.formateur);
  const payer = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
  const creneaux = ((sess?.creneaux ?? []) as { date: string; heure_debut: string; heure_fin: string; ordre: number }[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre);
  const adr = (sess?.adresse ?? null) as { rue?: string; ville?: string; code_postal?: string; complement?: string } | null;
  const statut = STATUT_LABEL[ins.statut] ?? STATUT_LABEL.en_attente;

  let raisonSociale: string | null = null;
  if (payer?.account_type === 'entreprise') {
    const { data: company } = await supabase
      .from('company_details')
      .select('raison_sociale')
      .eq('profile_id', ins.payer_profile_id)
      .maybeSingle();
    raisonSociale = company?.raison_sociale ?? null;
  }

  const participants = (ins.participants ?? []) as Array<{
    id: string;
    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  }>;

  const docDemandes = ((ins.document_demandes ?? []) as InscriptionDocumentDemande[])
    .slice()
    .sort((a, b) => (a.ordre - b.ordre) || a.nom.localeCompare(b.nom));
  const adminDocs = ((ins.admin_documents ?? []) as InscriptionAdminDocument[])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Demande #${ins.id.slice(0, 8)}`}
        title={form?.titre ?? 'Demande d\'inscription'}
        description={`Reçue le ${new Date(ins.created_at).toLocaleString('fr-FR')}`}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${statut.className}`}>
              {statut.label}
            </span>
            <ButtonLink href="/admin/demandes" variant="secondary">← Liste</ButtonLink>
          </div>
        }
      />

      {sp.confirmee && (
        <div className="bg-teal/10 border border-teal/30 rounded p-4 text-sm text-teal">
          Demande confirmée. Email envoyé au demandeur.
        </div>
      )}
      {sp.refusee && (
        <div className="bg-orange/10 border border-orange/30 rounded p-4 text-sm text-orange">
          Demande refusée. Email envoyé au demandeur avec le motif.
        </div>
      )}
      {sp.docs_demandes && (
        <div className="bg-teal/10 border border-teal/30 rounded p-4 text-sm text-teal">
          {sp.docs_demandes} document{Number(sp.docs_demandes) > 1 ? 's' : ''} demandé{Number(sp.docs_demandes) > 1 ? 's' : ''} au demandeur. Email envoyé.
        </div>
      )}

      {/* Onglets */}
      <nav className="border-b border-dark/10 flex gap-1 flex-wrap">
        <TabLink href={`/admin/demandes/${ins.id}`} active={sp.tab !== 'financeur'}>
          Détails
        </TabLink>
        <TabLink
          href={`/admin/demandes/${ins.id}?tab=financeur`}
          active={sp.tab === 'financeur'}
        >
          Enquête financeur
        </TabLink>
      </nav>

      {sp.tab === 'financeur' ? (
        <EnqueteFinanceurSection
          inscriptionId={ins.id}
          payerIsEntreprise={payer?.account_type === 'entreprise'}
        />
      ) : (
      <>
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-3">
          <h2 className="font-display text-xl">Demandeur</h2>
          <dl className="text-sm space-y-1">
            <div><dt className="inline text-dark/60">Type : </dt><dd className="inline">{payer?.account_type === 'entreprise' ? 'Entreprise' : 'Particulier'}</dd></div>
            {raisonSociale && <div><dt className="inline text-dark/60">Société : </dt><dd className="inline">{raisonSociale}</dd></div>}
            <div><dt className="inline text-dark/60">Contact : </dt><dd className="inline">{payer?.full_name}</dd></div>
            <div><dt className="inline text-dark/60">Email : </dt><dd className="inline">{payer?.email}</dd></div>
            {payer?.phone && <div><dt className="inline text-dark/60">Téléphone : </dt><dd className="inline">{payer.phone}</dd></div>}
          </dl>
        </section>

        <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-3">
          <h2 className="font-display text-xl">Session</h2>
          <dl className="text-sm space-y-1">
            <div><dt className="inline text-dark/60">Formation : </dt><dd className="inline">{form?.titre}</dd></div>
            {formateur?.full_name && <div><dt className="inline text-dark/60">Formateur : </dt><dd className="inline">{formateur.full_name}</dd></div>}
            {adr && (adr.rue || adr.ville) && (
              <div>
                <dt className="text-dark/60">Lieu :</dt>
                <dd>
                  {adr.rue}<br />
                  {[adr.code_postal, adr.ville].filter(Boolean).join(' ')}
                  {adr.complement && <><br /><span className="text-dark/60">{adr.complement}</span></>}
                </dd>
              </div>
            )}
            <div className="pt-2">
              <dt className="text-dark/60">Créneaux :</dt>
              <dd>
                <ul className="space-y-0.5 mt-1">
                  {creneaux.map((c, i) => (
                    <li key={i}>
                      <span className="capitalize">{FR_DATE.format(new Date(c.date))}</span>{' '}
                      <span className="text-dark/60">· {FR_TIME(c.heure_debut)}–{FR_TIME(c.heure_fin)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl mb-3">Participants ({participants.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="text-xs uppercase tracking-[0.15em] text-dark/60 bg-light">
              <tr>
                <th className="text-left py-2 px-3">Nom complet</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {participants.map((p) => {
                const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
                const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
                if (emp) {
                  return (
                    <tr key={p.id}>
                      <td className="py-2 px-3">{emp.prenom} {emp.nom}</td>
                      <td className="py-2 px-3 text-dark/70">{emp.email}</td>
                      <td className="py-2 px-3 text-xs text-dark/60">Salarié (entreprise)</td>
                    </tr>
                  );
                }
                if (prof) {
                  return (
                    <tr key={p.id}>
                      <td className="py-2 px-3">{prof.full_name}</td>
                      <td className="py-2 px-3 text-dark/70">{prof.email}</td>
                      <td className="py-2 px-3 text-xs text-dark/60">Particulier</td>
                    </tr>
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl mb-3">Analyse des besoins</h2>
        <div className="p-4 bg-light rounded border border-dark/10 whitespace-pre-wrap text-sm">
          {ins.analyse_besoins || <em className="text-dark/50">Non renseignée</em>}
        </div>
      </section>

      {/* Documents demandés au payer */}
      {docDemandes.length > 0 && (
        <section className="bg-white rounded-lg border border-dark/10 p-6">
          <h2 className="font-display text-xl mb-3">Documents demandés au demandeur ({docDemandes.length})</h2>
          <ul className="space-y-2">
            {docDemandes.map((d) => {
              const hasFile = !!d.storage_path;
              const isDeclined = d.declined;
              return (
                <li key={d.id} className="border border-dark/10 rounded p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{d.nom}</p>
                      {hasFile && (
                        <p className="text-xs text-dark/60 mt-1 break-all">
                          {d.file_name} ({fmtSize(d.file_size)})
                          {d.uploaded_at && <> · reçu le {FR_DATETIME.format(new Date(d.uploaded_at))}</>}
                        </p>
                      )}
                      {isDeclined && (
                        <p className="text-xs text-orange mt-1 whitespace-pre-wrap">
                          Non transmis — {d.decline_reason}
                        </p>
                      )}
                      {!hasFile && !isDeclined && (
                        <p className="text-xs text-dark/50 mt-1">En attente de réponse</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasFile && (
                        <a
                          href={`/api/documents/download/payer-demande/${d.id}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
                        >
                          Télécharger
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ins.statut === 'refusee' && ins.refus_motif && (
        <section className="bg-orange/5 rounded-lg border border-orange/30 p-6">
          <h2 className="font-display text-xl mb-3 text-orange">Motif du refus</h2>
          <div className="p-4 bg-white rounded border border-orange/20 whitespace-pre-wrap text-sm">
            {ins.refus_motif}
          </div>
          {ins.refused_at && (
            <p className="mt-2 text-xs text-dark/50">Refusée le {new Date(ins.refused_at).toLocaleString('fr-FR')}</p>
          )}
        </section>
      )}

      {ins.statut === 'confirmee' && ins.confirmed_at && (
        <section className="bg-teal/5 rounded-lg border border-teal/30 p-6 text-sm">
          Confirmée le {new Date(ins.confirmed_at).toLocaleString('fr-FR')}.
        </section>
      )}

      <DemandeActions
        inscriptionId={ins.id}
        statut={ins.statut}
        hasDocRequests={docDemandes.length > 0}
        adminDocs={adminDocs.map((d) => ({
          id: d.id,
          fileName: d.file_name,
          fileSize: d.file_size,
          createdAt: d.created_at,
        }))}
      />
      </>
      )}
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm uppercase tracking-[0.15em] font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-teal text-teal'
          : 'border-transparent text-dark/50 hover:text-dark'
      }`}
    >
      {children}
    </Link>
  );
}
