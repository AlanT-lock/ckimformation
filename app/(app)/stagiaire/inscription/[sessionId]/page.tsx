import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';
import { InscriptionParticulierForm } from './InscriptionParticulierForm';
import { InscriptionEntrepriseForm } from './InscriptionEntrepriseForm';
import type { Employee } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ sessionId: string }> }

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const FR_TIME = (h: string) => h.slice(0, 5);

export default async function InscriptionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;
  redirectEmployeeStagiaire(profile);

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, adresse, statut,
      formation:formations(slug, titre),
      formateur:profiles!sessions_formateur_id_fkey(full_name),
      creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)
    `)
    .eq('id', sessionId)
    .single();
  if (!session || session.statut !== 'published') notFound();

  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;
  const formateur = Array.isArray(session.formateur) ? session.formateur[0] : session.formateur;
  const creneaux = (session.creneaux ?? []).slice().sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre);
  const adr = session.adresse as { rue?: string; ville?: string; code_postal?: string; complement?: string } | null;
  const ville = [adr?.ville, adr?.code_postal].filter(Boolean).join(' ');

  const isEntreprise = profile.account_type === 'entreprise';

  // Détection demande existante :
  //  - Particulier : une demande en_attente/confirmée de l'utilisateur pour cette session
  //  - Entreprise : on autorise plusieurs demandes (l'employeur peut compléter)
  let alreadyHasDemande = false;
  if (!isEntreprise) {
    const { data: existing } = await supabase
      .from('inscriptions')
      .select('id, statut')
      .eq('session_id', sessionId)
      .eq('payer_profile_id', profile.id)
      .in('statut', ['en_attente', 'confirmee']);
    alreadyHasDemande = !!existing && existing.length > 0;
  }

  // Charge les employés du compte entreprise pour le formulaire
  let employees: Employee[] = [];
  if (isEntreprise) {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('employer_profile_id', profile.id)
      .order('nom', { ascending: true });
    employees = (data ?? []) as Employee[];
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inscription"
        title={formation?.titre ?? 'Session'}
        actions={
          <ButtonLink href={`/stagiaire/formations/${formation?.slug ?? ''}`} variant="secondary">
            ← Retour
          </ButtonLink>
        }
      />

      <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Créneaux</p>
          <ul className="mt-2 space-y-1 text-sm">
            {creneaux.map((c: { date: string; heure_debut: string; heure_fin: string; ordre: number }) => (
              <li key={c.ordre} className="text-dark/80">
                <span className="capitalize">{FR_DATE.format(new Date(c.date))}</span>
                <span className="ml-2 text-dark/60">· {FR_TIME(c.heure_debut)}–{FR_TIME(c.heure_fin)}</span>
              </li>
            ))}
          </ul>
        </div>
        {(adr?.rue || ville) && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Lieu</p>
            <p className="mt-1 text-sm text-dark/80">
              {adr?.rue && <>{adr.rue}<br /></>}
              {ville}
              {adr?.complement && <><br /><span className="text-dark/60">{adr.complement}</span></>}
            </p>
          </div>
        )}
        {formateur?.full_name && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Formateur</p>
            <p className="mt-1 text-sm text-dark/80">{formateur.full_name}</p>
          </div>
        )}
      </section>

      {alreadyHasDemande ? (
        <div className="bg-teal/10 border border-teal/30 rounded-lg p-6 text-sm">
          <p className="font-medium text-teal">Une demande d&apos;inscription est déjà enregistrée pour cette session.</p>
          <p className="mt-2 text-dark/70">
            Retrouvez son statut dans{' '}
            <a href="/stagiaire/inscriptions" className="text-teal underline">Mes demandes</a>.
          </p>
        </div>
      ) : isEntreprise ? (
        <InscriptionEntrepriseForm sessionId={sessionId} employees={employees} />
      ) : (
        <InscriptionParticulierForm sessionId={sessionId} />
      )}
    </div>
  );
}
