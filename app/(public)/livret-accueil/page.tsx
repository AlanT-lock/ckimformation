import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LegalArticle,
  LegalBody,
  LegalCallout,
  LegalDocHero,
  LegalList,
} from '@/components/sections/LegalDoc';

export const metadata: Metadata = {
  title: "Livret d'accueil stagiaire — C-KIM Formation",
  description:
    "Livret d'accueil des stagiaires de C-KIM Sécurité Formation : déroulement de la formation, règles de vie, respect et adaptations, évaluation, réclamations et contacts.",
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-teal-l pl-4 space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-dark">{title}</p>
      {children}
    </div>
  );
}

export default function LivretAccueilPage() {
  return (
    <>
      <LegalDocHero
        eyebrow="C-KIM Sécurité Formation · Draguignan"
        title="Livret d'accueil stagiaire"
        subtitle="L'essentiel pour bien vivre votre formation : où et comment elle se déroule, les règles de vie, le respect et la sécurité de chacun, l'évaluation et qui contacter."
        meta="Version 10/2026"
        pdfHref="/documents/livret-accueil-ckim-formation.pdf"
      />

      <LegalBody>
        <LegalArticle title="Bienvenue">
          <p>Bienvenue chez C-KIM Sécurité Formation !</p>
          <p>
            Nous formons à Draguignan et dans tout le Var aux gestes qui protègent (SST, incendie, SSIAP,
            CACES, habilitations, hygiène alimentaire) et aux compétences qui font avancer les équipes
            (management, communication).
          </p>
          <p>
            Nos formateurs sont des professionnels de terrain, qualifiés et habilités dans leur domaine : nos
            formations sont concrètes et directement applicables à votre poste.
          </p>
          <p>Ce livret réunit l&apos;essentiel pour bien vivre votre formation :</p>
          <LegalList
            items={[
              'où et comment elle se déroule',
              'les règles de vie en formation',
              'le respect et la sécurité de chacun',
              'les adaptations possibles',
              "l'évaluation, vos documents et votre avis",
              'qui contacter en cas de question ou de difficulté',
            ]}
          />
          <p>Gardez-le à portée de main et n&apos;hésitez jamais à nous solliciter.</p>
          <p className="italic">L&apos;équipe C-KIM Sécurité Formation</p>
        </LegalArticle>

        <LegalArticle title="Votre formation en pratique">
          <p className="font-semibold text-dark">Où, quand, comment</p>
          <Block title="Lieux, convocation et déroulement de la journée">
            <p>
              <strong>Inter-entreprises :</strong> au siège (391 avenue du Maréchal Koenig, Draguignan) ou à
              l&apos;Espace Bertin (13-15 boulevard Maréchal Foch, Draguignan). Salles équipées et accessibles.
            </p>
            <p>
              <strong>Intra-entreprise :</strong> dans vos locaux, avec vos équipements et vos situations de
              travail réelles. Nous apportons le matériel pédagogique.
            </p>
            <p>
              Votre convocation, reçue avant la formation, précise : dates, horaires, adresse, accès et
              stationnement, nom du formateur et numéro à appeler le jour J. Le règlement intérieur y est joint.
            </p>
            <p>
              <strong>Le jour J :</strong> accueil 15 minutes avant le début, signature de la feuille
              d&apos;émargement, présentation des objectifs, du programme et des règles du groupe. Pauses le
              matin et l&apos;après-midi ; déjeuner libre (restaurants à proximité ou sur place selon le lieu).
            </p>
          </Block>
        </LegalArticle>

        <LegalArticle title="Pendant la formation">
          <div className="space-y-6">
            <Block title="Présence">
              <p>
                Signez la feuille d&apos;émargement chaque matin et chaque après-midi. Pour les formations
                certifiantes (SST, SSIAP, CACES…), une absence peut empêcher le passage des épreuves.
              </p>
            </Block>
            <Block title="Retard ou absence">
              <p>
                Prévenez le formateur ou C-KIM dès que possible (numéro indiqué sur votre convocation) et
                fournissez un justificatif. C-KIM en informe votre employeur ou votre financeur.
              </p>
            </Block>
            <Block title="Téléphone et images">
              <p>
                Téléphone en silencieux, consulté aux pauses. Pas de photo, de vidéo ni d&apos;enregistrement
                sans l&apos;accord des personnes.
              </p>
            </Block>
            <Block title="Tenue et sécurité">
              <p>
                Tenue adaptée aux exercices pratiques. Consignes d&apos;évacuation présentées en début de
                formation. Alcool, drogues, tabac et vapotage interdits.
              </p>
            </Block>
            <Block title="Règlement intérieur">
              <p>
                Toutes ces règles sont détaillées dans le{' '}
                <Link href="/reglement-interieur" className="text-teal hover:underline">
                  règlement intérieur
                </Link>
                , joint à votre convocation et disponible sur ckimformation.fr.
              </p>
            </Block>
          </div>
        </LegalArticle>

        <LegalArticle title="Respect et adaptations">
          <p className="font-semibold text-dark">Chacun doit pouvoir apprendre en confiance</p>
          <LegalCallout tone="orange" title="Violences, harcèlement, discriminations : tolérance zéro">
            <p>
              Les violences, les violences sexistes et sexuelles, le harcèlement et les discriminations sont
              interdits, en formation comme sur les messageries liées à la formation.
            </p>
            <p>
              Victime ou témoin ? Parlez-en au formateur, à notre référent ou écrivez à contact@ckimformation.fr
              (objet « Signalement confidentiel »). Prise en charge sous 24 h, en toute confidentialité, sans
              conséquence pour vous.
            </p>
            <p className="text-sm">
              Urgence : 17 ou 112 · Violences femmes info : 3919 · Défenseur des droits : 39 28
            </p>
          </LegalCallout>
          <Block title="Handicap et besoins particuliers">
            <p>
              Situation de handicap, trouble de l&apos;apprentissage, contrainte de santé ou de langue ?
              Contactez notre référent handicap avant la formation (coordonnées ci-dessous).
            </p>
            <p>
              Nous étudions avec vous les adaptations possibles : supports, rythme, temps d&apos;épreuve,
              matériel, lieu. Si besoin, nous mobilisons nos partenaires (Cap emploi, Agefiph). Vos informations
              restent confidentielles.
            </p>
          </Block>
        </LegalArticle>

        <LegalArticle title="Évaluation et documents">
          <p className="font-semibold text-dark">Mesurer vos acquis, valoriser vos compétences</p>
          <Block title="Avant, pendant, après la formation">
            <p>
              <strong>Avant :</strong> un positionnement pour adapter la formation à votre niveau et à vos
              besoins.
            </p>
            <p>
              <strong>Pendant :</strong> exercices et mises en situation, avec un retour du formateur. Les
              critères d&apos;évaluation vous sont expliqués dès le début.
            </p>
            <p>
              <strong>À la fin :</strong> évaluation des acquis ; pour les formations certifiantes, épreuves
              selon le référentiel du certificateur (INRS pour le SST, jury pour le SSIAP, testeur OTC pour le
              CACES).
            </p>
            <p>
              <strong>Documents remis :</strong> certificat de réalisation et, selon la formation, certificat,
              diplôme ou attestation de fin de formation.
            </p>
            <p>
              <strong>Votre avis compte :</strong> questionnaire de satisfaction en fin de formation (QR code),
              puis questionnaire de suivi quelques semaines après. Vos réponses nous servent à améliorer nos
              contenus et nos méthodes.
            </p>
          </Block>
        </LegalArticle>

        <LegalArticle title="Une difficulté ?">
          <p className="font-semibold text-dark">Réclamations, aléas et données personnelles</p>
          <Block title="Nous vous répondons dans des délais précis">
            <p>
              Pendant la formation : parlez-en d&apos;abord au formateur, la plupart des situations se règlent
              tout de suite.
            </p>
            <p>
              Une réclamation ? Écrivez à contact@ckimformation.fr ou demandez le formulaire de réclamation.
            </p>
            <LegalList
              items={['Accusé de réception sous 48 h ouvrées', 'Réponse écrite et motivée sous 10 jours ouvrés']}
            />
            <p>
              Si vous êtes un particulier et restez en désaccord, vous pouvez saisir gratuitement le médiateur de
              la consommation indiqué dans nos{' '}
              <Link href="/cgv" className="text-teal hover:underline">
                conditions générales de vente
              </Link>
              .
            </p>
            <p>
              Vos données personnelles servent uniquement à la gestion de votre formation, aux obligations
              légales et au suivi qualité. Pour exercer vos droits (accès, rectification, effacement) :
              contact@ckimformation.fr.
            </p>
          </Block>
        </LegalArticle>

        <LegalArticle title="Contacts">
          <div className="grid gap-6 md:grid-cols-3">
            <Block title="C-KIM Sécurité Formation">
              <p className="text-sm">
                391 avenue du Maréchal Koenig – 83300 Draguignan
                <br />
                Téléphone : <a href="tel:0662515559" className="text-teal hover:underline">06 62 51 55 59</a>
                <br />
                E-mail :{' '}
                <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline break-all">
                  contact@ckimformation.fr
                </a>
                <br />
                Site : ckimformation.fr
                <br />
                Du lundi au vendredi, 9 h – 17 h
              </p>
            </Block>
            <Block title="Référent handicap">
              <p className="text-sm">
                Camel ATIL – 06 62 51 55 59
                <br />
                contact@ckimformation.fr
                <br />
                À contacter de préférence avant l&apos;inscription pour préparer les adaptations.
              </p>
            </Block>
            <Block title="Référent violences, harcèlement, discriminations">
              <p className="text-sm">
                Camel ATIL – 06 62 51 55 59
                <br />
                contact@ckimformation.fr
                <br />
                Objet du message : « Signalement confidentiel »
              </p>
            </Block>
          </div>
        </LegalArticle>

        <p className="pt-6 border-t border-dark/10 text-xs text-dark/50 text-center">
          SAS – SIRET 991 764 580 00015 – NDA 93 83 08588 83 (préfet de région PACA) – Exonération de TVA, art.
          261-4-4° a du CGI – Organisme certifié Qualiopi n° 772911-1
        </p>
      </LegalBody>
    </>
  );
}
