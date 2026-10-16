import Link from 'next/link';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';
import { loadEntrepriseSuivis } from '@/lib/suivi/data';
import { SuiviCard } from '@/components/app/suivi/SuiviCard';

export default async function StagiaireHome() {
  const profile = await getCurrentProfile();
  redirectEmployeeStagiaire(profile);
  const supabase = await createClient();
  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select('id, statut, session:sessions(id, formation:formations(slug, titre))')
    .eq('payer_profile_id', profile!.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const isEntreprise = profile!.account_type === 'entreprise';
  // Suivi gamifié des formations en cours de ses salariés (une section par session)
  const suivis = isEntreprise ? await loadEntrepriseSuivis(profile!.id) : [];

  const STATUT_LABEL: Record<string, string> = {
    en_attente: 'Demande en attente',
    confirmee: 'Confirmée',
    refusee: 'Refusée',
    pending_payment: 'Demande en attente',
    paid: 'Confirmée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal">
          {isEntreprise ? 'Espace entreprise' : 'Espace stagiaire'}
        </p>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
          Bonjour {profile!.full_name?.split(' ')[0] || ''}.
        </h1>
      </div>

      {suivis.length > 0 && (
        <section>
          <h2 className="font-display text-2xl tracking-wide">
            Formation{suivis.length > 1 ? 's' : ''} en cours de vos salariés
          </h2>
          <p className="text-sm text-dark/60 mt-1">
            Suivez jour après jour les compétences travaillées et les retours du formateur.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {suivis.map((s) => (
              <SuiviCard key={s.sessionId} suivi={s} stagiaires={s.stagiaires} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/stagiaire/formations"
          className="block bg-white rounded-lg border border-dark/10 p-6 hover:shadow-lg transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-teal">Catalogue</p>
          <h2 className="font-display text-2xl tracking-wide mt-2">Découvrir les formations</h2>
          <p className="text-sm text-dark/60 mt-2">
            Parcourez les formations et inscrivez-vous à une session.
          </p>
        </Link>
        <Link
          href="/stagiaire/parcours"
          className="block bg-white rounded-lg border border-dark/10 p-6 hover:shadow-lg transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-orange">En formation</p>
          <h2 className="font-display text-2xl tracking-wide mt-2">Mon parcours</h2>
          <p className="text-sm text-dark/60 mt-2">
            Émargements, tests et enquêtes pour vos sessions en cours.
          </p>
        </Link>
      </div>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Mes demandes récentes</h2>
        <div className="mt-4 bg-white rounded-lg border border-dark/10 divide-y divide-dark/10">
          {(!inscriptions || inscriptions.length === 0) && (
            <p className="p-6 text-sm text-dark/60">
              Aucune demande pour l&apos;instant.{' '}
              <Link href="/stagiaire/formations" className="text-teal underline">
                Voir le catalogue
              </Link>
              .
            </p>
          )}
          {inscriptions?.map((ins) => {
            const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
            const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
            return (
              <div key={ins.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{form?.titre ?? '—'}</p>
                  <p className="text-xs text-dark/50">{STATUT_LABEL[ins.statut] ?? ins.statut}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
