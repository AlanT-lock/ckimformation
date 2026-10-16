import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnswerFormFinanceur } from './AnswerFormFinanceur';
import type { QuestionType } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ token: string }> }

export const dynamic = 'force-dynamic';

export default async function EnqueteFinanceurPage({ params }: PageProps) {
  const { token } = await params;

  // Pas de connexion : le token (unique, aléatoire) identifie l'inscription et
  // donc l'entreprise payeuse. Il reste valable tant que l'enquête n'est pas envoyée.
  const admin = createAdminClient();
  const { data: envoi } = await admin
    .from('enquete_financeur_envois')
    .select(`
      id, test_id, responded_at, inscription_id,
      test:tests(id, nom, description),
      inscription:inscriptions(
        id, payer_profile_id,
        payer:profiles!inscriptions_payer_profile_id_fkey(
          full_name,
          company:company_details!company_details_profile_id_fkey(raison_sociale)
        ),
        session:sessions(formation:formations(titre))
      )
    `)
    .eq('token', token)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-light flex flex-col">
      <header className="px-6 md:px-10 py-6 bg-white border-b border-dark/10">
        <Link href="/" aria-label="C-KIM Formation — Accueil" className="inline-block">
          <Image
            src="/logo-ckim.png"
            alt="C-KIM Formation"
            width={512}
            height={353}
            className="h-12 w-auto"
          />
        </Link>
      </header>

      <div className="flex-1 px-4 sm:px-6 py-10">
        <div className="w-full max-w-2xl mx-auto">
          {!envoi ? (
            <EmptyState
              title="Lien invalide"
              message="Ce lien d'enquête est introuvable. Vérifiez que vous avez copié l'URL complète depuis l'email reçu."
            />
          ) : envoi.responded_at ? (
            <EmptyState
              title="Merci, c'est déjà fait !"
              message="Vous avez déjà répondu à cette enquête. Merci pour votre retour."
            />
          ) : (
            <EnqueteContent envoi={envoi} token={token} />
          )}
        </div>
      </div>

      <footer className="px-6 md:px-10 py-4 text-xs text-dark/50 text-center border-t border-dark/10">
        © {new Date().getFullYear()} C-KIM Formation
      </footer>
    </main>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-8 text-center">
      <h1 className="font-display text-3xl tracking-wide">{title}</h1>
      <p className="mt-3 text-sm text-dark/70">{message}</p>
      <p className="mt-6 text-xs text-dark/50">
        Une question ? <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>
      </p>
    </div>
  );
}

interface EnvoiData {
  id: string;
  test_id: string;
  inscription_id: string;
  test: unknown;
  inscription: unknown;
}

async function EnqueteContent({ envoi, token }: { envoi: EnvoiData; token: string }) {
  const admin = createAdminClient();
  const test = Array.isArray(envoi.test) ? envoi.test[0] : envoi.test;
  const inscription = Array.isArray(envoi.inscription) ? envoi.inscription[0] : envoi.inscription;
  const sess = inscription && (Array.isArray(inscription.session) ? inscription.session[0] : inscription.session);
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
  const payer = inscription && (Array.isArray(inscription.payer) ? inscription.payer[0] : inscription.payer);
  const company = payer && (Array.isArray(payer.company) ? payer.company[0] : payer.company);
  const entrepriseNom = company?.raison_sociale || payer?.full_name || null;

  const { data: questions } = await admin
    .from('questions')
    .select('id, ordre, libelle, type_reponse, options, echelle_max, required, follow_up_options')
    .eq('test_id', envoi.test_id)
    .order('ordre');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-dark/10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Enquête de satisfaction financeur</p>
        <h1 className="font-display text-2xl md:text-3xl tracking-wide mt-2">
          {test?.nom ?? 'Votre retour'}
        </h1>
        {formation?.titre && (
          <p className="mt-1 text-sm text-dark/60">Formation : <strong className="text-dark/80">{formation.titre}</strong></p>
        )}
        {entrepriseNom && (
          <p className="mt-1 text-sm text-dark/60">Entreprise : <strong className="text-dark/80">{entrepriseNom}</strong></p>
        )}
        <p className="mt-4 text-sm text-dark/70 leading-relaxed">
          Merci de prendre quelques minutes pour partager votre retour sur l&apos;organisation et la qualité
          de la prestation. Vos réponses nous aident à améliorer nos services.
        </p>
      </div>

      <AnswerFormFinanceur
        token={token}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          ordre: q.ordre,
          libelle: q.libelle,
          type_reponse: q.type_reponse as QuestionType,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          echelle_max: q.echelle_max,
          required: q.required,
          follow_up_options: Array.isArray(q.follow_up_options) ? (q.follow_up_options as string[]) : [],
        }))}
      />
    </div>
  );
}
