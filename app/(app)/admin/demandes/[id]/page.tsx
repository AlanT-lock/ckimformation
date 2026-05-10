import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient } from '@/lib/supabase/server';
import { DemandeActions } from './DemandeActions';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const FR_TIME = (h: string) => h.slice(0, 5);

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmee?: string; refusee?: string }>;
}

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-orange/10 text-orange' },
  confirmee:  { label: 'Confirmée',  className: 'bg-teal/10 text-teal' },
  refusee:    { label: 'Refusée',    className: 'bg-dark/10 text-dark/60' },
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
      )
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Demande #${ins.id.slice(0, 8)}`}
        title={form?.titre ?? 'Demande d\'inscription'}
        description={`Reçue le ${new Date(ins.created_at).toLocaleString('fr-FR')}`}
        actions={
          <div className="flex items-center gap-3">
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
        <table className="w-full text-sm">
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
      </section>

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl mb-3">Analyse des besoins</h2>
        <div className="p-4 bg-light rounded border border-dark/10 whitespace-pre-wrap text-sm">
          {ins.analyse_besoins || <em className="text-dark/50">Non renseignée</em>}
        </div>
      </section>

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

      <DemandeActions inscriptionId={ins.id} statut={ins.statut} />
    </div>
  );
}
