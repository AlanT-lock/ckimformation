import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — C-KIM Formation',
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">RGPD</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Politique de confidentialité</h1>
        <p className="mt-4 text-sm text-dark/50">Dernière mise à jour : 10 mai 2026</p>

        <div className="mt-8 text-dark/80 leading-relaxed space-y-6">
          <section>
            <p>
              La présente politique décrit comment <strong>CKIM SECURITE FORMATION</strong>{' '}
              (ci-après « C-KIM ») collecte, utilise et protège vos données personnelles
              conformément au Règlement (UE) 2016/679 (RGPD) et à la loi française n° 78-17
              du 6 janvier 1978 modifiée (Informatique et Libertés).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">1. Responsable du traitement</h2>
            <p className="mt-3">
              CKIM SECURITE FORMATION — SAS au capital de 100 € — SIREN 991 764 580.<br />
              Siège social : 391 avenue du Maréchal Koenig, 83300 Draguignan.<br />
              Représentée par son Président, Camel ATIL.<br />
              Contact : <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>{' '}
              — <a href="tel:0662515559" className="text-teal hover:underline">06 62 51 55 59</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">2. Données collectées et finalités</h2>
            <p className="mt-3">
              Selon votre interaction avec le site, C-KIM peut collecter et traiter les
              catégories de données suivantes :
            </p>

            <h3 className="font-display text-lg mt-5">2.1 Formulaires de contact et de devis</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> nom, prénom, email, téléphone, entreprise, fonction,
              secteur d&apos;activité, formation souhaitée, message libre.<br />
              <strong>Finalité :</strong> répondre à votre demande, établir un devis, suivre la
              relation commerciale.<br />
              <strong>Base légale :</strong> mesures précontractuelles à votre demande
              (art. 6.1.b RGPD).
            </p>

            <h3 className="font-display text-lg mt-5">2.2 Création de compte (particulier ou entreprise)</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> nom, prénom, email, téléphone, mot de passe (chiffré),
              et pour les entreprises : raison sociale, SIRET, numéro de TVA, adresse de
              facturation, fonction du contact, secteur d&apos;activité.<br />
              <strong>Finalité :</strong> créer et gérer votre espace personnel, vous inscrire
              à une session de formation, vous adresser les confirmations et rappels.<br />
              <strong>Base légale :</strong> exécution du contrat de formation (art. 6.1.b RGPD).
            </p>

            <h3 className="font-display text-lg mt-5">2.3 Gestion des salariés (comptes entreprise)</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> nom, prénom, email des salariés inscrits par leur
              employeur. Lorsque le formateur déclenche la création de compte stagiaire, un
              compte d&apos;accès est créé pour le salarié.<br />
              <strong>Finalité :</strong> permettre la participation aux sessions de formation,
              l&apos;émargement et la réalisation des évaluations.<br />
              <strong>Base légale :</strong> exécution du contrat de formation entre l&apos;employeur
              et C-KIM (art. 6.1.b RGPD).
            </p>

            <h3 className="font-display text-lg mt-5">2.4 Suivi pédagogique de la formation</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> émargements (signature électronique des stagiaires),
              réponses aux tests et questionnaires, scores, analyse des besoins exprimés à
              l&apos;inscription, réponses aux enquêtes de satisfaction à chaud et à froid.<br />
              <strong>Finalité :</strong> attester de la participation effective à la formation
              (obligation Qualiopi et Code du travail), évaluer les acquis et la satisfaction,
              améliorer continuellement nos formations.<br />
              <strong>Base légale :</strong> obligation légale (art. 6.1.c RGPD) et intérêt
              légitime à l&apos;amélioration de nos services (art. 6.1.f RGPD).
            </p>

            <h3 className="font-display text-lg mt-5">2.5 Communications par email</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> historique d&apos;envoi des emails transactionnels
              (confirmation d&apos;inscription, invitation, rappel d&apos;enquête à froid envoyée
              tous les 15 jours jusqu&apos;à réponse).<br />
              <strong>Finalité :</strong> assurer la traçabilité des communications liées à votre
              formation et le suivi qualité Qualiopi.<br />
              <strong>Base légale :</strong> exécution du contrat (art. 6.1.b RGPD).
            </p>

            <h3 className="font-display text-lg mt-5">2.6 Mesure d&apos;audience du site vitrine</h3>
            <p className="mt-2 text-sm">
              <strong>Données :</strong> identifiant pseudonyme stocké dans votre navigateur
              (sans cookie tiers ni fingerprint), pages consultées, durée de visite, profondeur
              de défilement, clics sur les boutons d&apos;action, source de référence (site
              précédent), user agent.<br />
              Lorsque vous êtes connecté à votre espace personnel, ces données peuvent être
              rattachées à votre profil afin de mieux comprendre votre parcours utilisateur.<br />
              <strong>Finalité :</strong> mesurer l&apos;audience du site et améliorer l&apos;ergonomie.<br />
              <strong>Base légale :</strong> intérêt légitime (art. 6.1.f RGPD), dispensé du
              consentement préalable conformément aux lignes directrices de la CNIL relatives
              aux outils de mesure d&apos;audience exemptés.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">3. Destinataires des données</h2>
            <p className="mt-3">
              Vos données sont strictement réservées aux personnes habilitées au sein de C-KIM
              (administration, formateurs intervenants dans la session). Elles ne sont jamais
              cédées ni revendues à des tiers à des fins commerciales.
            </p>
            <p className="mt-3">
              Les sous-traitants techniques suivants interviennent pour le fonctionnement du
              service :
            </p>
            <ul className="mt-2 text-sm list-disc list-inside space-y-1">
              <li><strong>Vercel Inc.</strong> (États-Unis) — hébergement du site et exécution
                de l&apos;application.</li>
              <li><strong>Supabase Inc.</strong> (Singapour, infrastructure en région Europe –
                Francfort) — base de données, authentification, stockage.</li>
              <li><strong>Resend Inc.</strong> (États-Unis) — routage des emails transactionnels.</li>
            </ul>
            <p className="mt-3 text-sm">
              Les transferts hors Union Européenne sont encadrés par les Clauses Contractuelles
              Types (CCT) de la Commission Européenne (art. 46 RGPD).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">4. Durées de conservation</h2>
            <ul className="mt-3 text-sm list-disc list-inside space-y-1">
              <li>Données des comptes et inscriptions actifs : pendant toute la durée de la
                relation, puis archivage <strong>3 ans</strong> au-delà (obligation Qualiopi et
                Code du travail).</li>
              <li>Émargements, attestations, supports pédagogiques :{' '}
                <strong>3 ans minimum</strong> à compter de la fin de la session.</li>
              <li>Pièces comptables (factures) : <strong>10 ans</strong> (art. L. 123-22 Code de
                commerce).</li>
              <li>Demandes de contact non suivies d&apos;une inscription : <strong>3 ans</strong>{' '}
                à compter du dernier contact.</li>
              <li>Réponses aux enquêtes de satisfaction : <strong>3 ans</strong>.</li>
              <li>Données de mesure d&apos;audience anonymes : <strong>13 mois maximum</strong>{' '}
                conformément aux recommandations de la CNIL.</li>
              <li>Cookies / stockage local (identifiant visiteur, jeton de session, préférence
                d&apos;affichage) : <strong>13 mois maximum</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl">5. Vos droits</h2>
            <p className="mt-3">
              Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :
            </p>
            <ul className="mt-2 text-sm list-disc list-inside space-y-1">
              <li>Droit d&apos;accès et de copie de vos données ;</li>
              <li>Droit de rectification des données inexactes ou incomplètes ;</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »), sous réserve des
                obligations légales de conservation ;</li>
              <li>Droit à la limitation du traitement ;</li>
              <li>Droit à la portabilité des données que vous nous avez fournies ;</li>
              <li>Droit d&apos;opposition pour des motifs tenant à votre situation particulière ;</li>
              <li>Droit de définir des directives post-mortem.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, écrivez à{' '}
              <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>.
              Nous vous répondrons dans le délai légal d&apos;un mois.
            </p>
            <p className="mt-3 text-sm">
              Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés,
              vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> —{' '}
              <a href="https://www.cnil.fr/fr/plaintes" className="text-teal hover:underline">cnil.fr/fr/plaintes</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">6. Sécurité</h2>
            <p className="mt-3">
              Les mots de passe sont stockés sous forme chiffrée. Les communications avec le
              site sont protégées par HTTPS / TLS. Les accès aux espaces administrateur,
              formateur et stagiaire sont strictement individuels et nominatifs.
              Les écritures et lectures de données sont protégées par des règles de sécurité au
              niveau de la base de données (RLS Supabase).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">7. Cookies et stockage local</h2>
            <p className="mt-3">
              Le site n&apos;utilise <strong>aucun cookie publicitaire ni cookie tiers</strong>.
              Les seuls éléments stockés dans votre navigateur sont :
            </p>
            <ul className="mt-2 text-sm list-disc list-inside space-y-1">
              <li>Cookies d&apos;authentification Supabase (essentiels au fonctionnement de
                votre espace personnel — exemptés de consentement).</li>
              <li>Identifiant visiteur pseudonyme dans le <code className="bg-light px-1 rounded text-xs">localStorage</code> du
                navigateur, utilisé uniquement pour la mesure d&apos;audience interne (durée de
                vie : 13 mois maximum, supprimable depuis les paramètres de votre navigateur).</li>
              <li>Préférence d&apos;affichage de la bannière cookies.</li>
            </ul>
            <p className="mt-3 text-sm">
              Vous pouvez supprimer ces informations à tout moment via les paramètres de votre
              navigateur (vider le stockage local et les cookies du site).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">8. Modifications</h2>
            <p className="mt-3">
              Nous pouvons être amenés à modifier cette politique pour refléter une évolution
              de nos pratiques ou de la réglementation. La version applicable est celle publiée
              sur cette page à la date de votre consultation. La date de dernière mise à jour
              est indiquée en haut de la page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">9. Contact</h2>
            <p className="mt-3">
              Pour toute question relative à la protection de vos données :{' '}
              <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>{' '}
              — ou par courrier à : CKIM SECURITE FORMATION, 391 avenue du Maréchal Koenig,
              83300 Draguignan.
            </p>
            <p className="mt-3 text-sm">
              Voir aussi nos <Link href="/mentions-legales" className="text-teal hover:underline">mentions légales</Link>.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
