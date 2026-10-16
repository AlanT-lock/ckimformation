import type { Metadata } from 'next';
import {
  LegalArticle,
  LegalBody,
  LegalCallout,
  LegalDocHero,
  LegalList,
  LegalTable,
} from '@/components/sections/LegalDoc';

export const metadata: Metadata = {
  title: 'Conditions générales de vente — C-KIM Formation',
  description:
    'Conditions générales de vente de C-KIM Sécurité Formation : contractualisation, rétractation, annulation, prix, accessibilité, données personnelles et médiation.',
};

export default function CgvPage() {
  return (
    <>
      <LegalDocHero
        eyebrow="C-KIM Sécurité Formation"
        title="Conditions générales de vente"
        meta="Version 2.1 – octobre 2026 (remplace la version 2.0)"
        pdfHref="/documents/cgv-ckim-formation.pdf"
      />

      <LegalBody>
        <div className="rounded-lg bg-light p-5 text-sm text-center space-y-1">
          <p>
            <strong>C-KIM SÉCURITÉ FORMATION</strong>, SAS – 391 avenue du Maréchal Koenig, 83300 Draguignan
          </p>
          <p>
            SIRET 991 764 580 00015 – Déclaration d&apos;activité n° 93 83 08588 83 auprès du préfet de région
            PACA (cet enregistrement ne vaut pas agrément de l&apos;État)
          </p>
          <p>
            Certification Qualiopi n° 772911-1 au titre des actions de formation –{' '}
            <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>{' '}
            – <a href="tel:0662515559" className="text-teal hover:underline">06 62 51 55 59</a> – ckimformation.fr
          </p>
        </div>

        <LegalArticle number="Article 1" title="Définitions">
          <LegalList
            items={[
              <><strong>Client :</strong> personne physique ou morale qui commande une formation.</>,
              <><strong>Stagiaire :</strong> personne qui suit la formation.</>,
              <><strong>Client consommateur :</strong> personne physique qui finance elle-même sa formation, à titre individuel et à ses frais.</>,
              <><strong>Inter-entreprises :</strong> formation du catalogue réunissant des stagiaires de structures différentes.</>,
              <><strong>Intra-entreprise :</strong> formation organisée pour un seul client.</>,
              <><strong>OPCO :</strong> opérateur de compétences.</>,
            ]}
          />
        </LegalArticle>

        <LegalArticle number="Article 2" title="Objet">
          <p>
            Les présentes CGV s&apos;appliquent à toutes les prestations de formation de C-KIM SÉCURITÉ
            FORMATION (articles L.6353-1 et suivants du Code du travail). Toute commande vaut acceptation des
            CGV, qui prévalent sur les conditions d&apos;achat du Client sauf accord écrit contraire. C-KIM
            SÉCURITÉ FORMATION peut sous-traiter tout ou partie d&apos;une prestation à un intervenant qualifié,
            qui s&apos;engage à respecter le référentiel national qualité.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 3" title="Information préalable et contractualisation">
          <p>
            Avant toute inscription, C-KIM SÉCURITÉ FORMATION met à disposition sur ckimformation.fr et dans le
            programme : objectifs, prérequis, durée, modalités et délais d&apos;accès, méthodes, modalités
            d&apos;évaluation, tarifs, accessibilité aux personnes en situation de handicap et, pour les
            formations certifiantes, les résultats et suites de parcours. Les résultats affichés (satisfaction,
            réussite) sont calculés selon la méthode publiée sur le site ; les premiers résultats seront publiés
            en janvier 2027.
          </p>
          <LegalList
            items={[
              <><strong>Entreprise :</strong> devis puis convention de formation (articles L.6353-1 et L.6353-2), à retourner signés au moins 15 jours avant le début de la formation.</>,
              <><strong>Particulier finançant lui-même sa formation :</strong> contrat de formation (articles L.6353-3 à L.6353-7).</>,
            ]}
          />
          <LegalCallout title="Droit de rétractation du Client consommateur">
            <p>
              Le stagiaire dispose d&apos;un <strong>délai de rétractation de 10 jours</strong> à compter de la
              signature du contrat, porté à <strong>14 jours</strong> lorsque le contrat est conclu à distance ou
              hors établissement (article L.221-18 du Code de la consommation).
            </p>
            <p>
              Aucun paiement ne peut être exigé avant l&apos;expiration de ce délai, et le premier paiement ne
              peut excéder <strong>30 % du prix</strong> ; le solde est échelonné au fur et à mesure du
              déroulement de la formation (article L.6353-6 du Code du travail).
            </p>
          </LegalCallout>
        </LegalArticle>

        <LegalArticle number="Article 4" title="Report, annulation">
          <p>
            <strong>Par C-KIM SÉCURITÉ FORMATION :</strong> si l&apos;effectif est insuffisant, C-KIM SÉCURITÉ
            FORMATION peut reporter une session au plus tard 7 jours avant son début. Le Client choisit alors une
            autre date ou l&apos;annulation sans frais, avec remboursement des sommes versées.
          </p>
          <p>
            <strong>Par le Client entreprise,</strong> par écrit, selon le barème suivant :
          </p>
          <LegalTable
            head={['Annulation reçue par écrit', 'Montant dû', 'Remarque']}
            rows={[
              ['Plus de 15 jours ouvrés avant le début', 'Sans frais', ''],
              [
                'Entre 15 et 7 jours ouvrés avant le début',
                '50 % du prix HT',
                'Dédommagement non imputable sur les fonds de la formation professionnelle',
              ],
              ['Moins de 7 jours ouvrés avant le début', '100 % du prix HT', 'Idem'],
            ]}
          />
          <p>
            Toute formation commencée est due au prorata des heures réalisées en cas d&apos;abandon pour force
            majeure dûment reconnue, et en totalité dans les autres cas.
          </p>
          <p>
            <strong>Par le Client consommateur :</strong> en dehors du délai de rétractation, les conditions
            d&apos;annulation et d&apos;abandon sont fixées par le contrat de formation. En cas de force majeure
            dûment reconnue, seules les prestations effectivement dispensées sont dues, au prorata temporis
            (article L.6353-7 du Code du travail).
          </p>
          <p>
            <strong>Remplacement</strong> d&apos;un stagiaire possible sans frais jusqu&apos;à la veille de la
            formation.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 5" title="Prix et paiement">
          <p>
            Prix en euros. <strong>Exonération de TVA, art. 261-4-4° a du CGI.</strong> Paiement à 30 jours à
            compter de la facture. Tout retard entraîne des pénalités égales à trois fois le taux d&apos;intérêt
            légal et, pour les professionnels uniquement, une indemnité forfaitaire de 40 € pour frais de
            recouvrement.
          </p>
          <p>
            En cas de prise en charge par un OPCO, le Client effectue la demande avant le début de la formation
            et transmet l&apos;accord à C-KIM SÉCURITÉ FORMATION. À défaut d&apos;accord reçu la veille de la
            formation, ou en cas de prise en charge partielle, le montant non couvert est facturé au Client.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 6" title="Documents remis">
          <p>
            Convocation, programme, règlement intérieur et livret d&apos;accueil sont transmis avant la
            formation, de façon dématérialisée. À l&apos;issue : certificat de réalisation et, selon la
            formation, attestation ou certificat prévu par le référentiel (pour le SST : certificat SST, carte
            INRS).
          </p>
        </LegalArticle>

        <LegalArticle number="Article 7" title="Accessibilité">
          <p>
            Toute personne en situation de handicap peut contacter le référent handicap,{' '}
            <strong>Camel ATIL</strong> (06 62 51 55 59 – contact@ckimformation.fr), avant l&apos;inscription
            pour étudier les adaptations possibles.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 8" title="Responsabilité">
          <p>
            C-KIM SÉCURITÉ FORMATION est tenue d&apos;une obligation de moyens. Elle n&apos;est pas responsable
            en cas de force majeure ni des objets personnels des stagiaires. Sa responsabilité est limitée au
            prix payé pour la prestation concernée. C-KIM SÉCURITÉ FORMATION est assurée en responsabilité civile
            professionnelle.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 9" title="Propriété intellectuelle et confidentialité">
          <p>
            Les supports pédagogiques restent la propriété de C-KIM SÉCURITÉ FORMATION ou de leurs auteurs ;
            toute reproduction ou réutilisation sans accord écrit est interdite. Chaque partie garde
            confidentielles les informations échangées. C-KIM SÉCURITÉ FORMATION peut citer le Client comme
            référence commerciale, sauf opposition écrite de sa part.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 10" title="Données personnelles">
          <p>
            C-KIM SÉCURITÉ FORMATION traite les données des Clients et Stagiaires pour la gestion des
            formations, le suivi qualité et les obligations légales, et les conserve pendant la durée nécessaire
            à ces finalités. Droits d&apos;accès, de rectification, d&apos;effacement, de limitation et de
            portabilité : contact@ckimformation.fr ou par courrier à l&apos;adresse du siège. Réclamation
            possible auprès de la CNIL.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 11" title="Réclamations et médiation">
          <p>
            Toute réclamation peut être adressée à contact@ckimformation.fr. Accusé de réception sous 48 h
            ouvrées, réponse écrite sous 10 jours ouvrés.
          </p>
          <LegalCallout title="Médiateur de la consommation">
            <p>
              Le Client consommateur peut, après une réclamation écrite adressée à C-KIM SÉCURITÉ FORMATION et
              restée sans solution satisfaisante, saisir gratuitement le médiateur de la consommation dans un
              délai d&apos;un an à compter de cette réclamation :
            </p>
            <p>
              <strong>Médiation Professionnelle (Société Médiation Professionnelle – Alteritae)</strong>
              <br />
              5 rue Salvaing, 12000 Rodez
              <br />
              <a
                href="https://www.mediateur-consommation-smp.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline"
              >
                www.mediateur-consommation-smp.fr
              </a>{' '}
              – formulaire « Demander une médiation »
            </p>
          </LegalCallout>
        </LegalArticle>

        <LegalArticle number="Article 12" title="Droit applicable et litiges">
          <p>
            Droit français. À défaut d&apos;accord amiable, tout litige avec un professionnel relève du tribunal
            compétent de Draguignan. Le consommateur peut saisir la juridiction de son domicile.
          </p>
        </LegalArticle>

        <p className="pt-6 border-t border-dark/10 text-xs italic text-dark/50">
          Historique : V2.0 du 02/10/2026 (référents, dénomination légale, TVA, SST) – V2.1 du 07/10/2026
          (rétractation de 14 jours pour les contrats conclus à distance, conditions d&apos;annulation du Client
          consommateur, médiateur de la consommation, mise en forme).
        </p>
      </LegalBody>
    </>
  );
}
