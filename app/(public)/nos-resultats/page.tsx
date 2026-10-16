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
  title: 'Nos résultats — C-KIM Formation',
  description:
    'Résultats des formations C-KIM Sécurité Formation et méthode de calcul des indicateurs : stagiaires formés, satisfaction, taux de réponse, réussite, abandon.',
};

export default function NosResultatsPage() {
  return (
    <>
      <LegalDocHero
        eyebrow="C-KIM Sécurité Formation"
        title="Nos résultats"
        subtitle="Nous publions les résultats de nos formations et la façon dont nous les calculons, pour que vous puissiez les vérifier et comparer. Chaque chiffre affiché sur nos fiches formation renvoie à cette page."
        meta="Dernière mise à jour : 2 octobre 2026 · Prochaine mise à jour : janvier 2027"
        pdfHref="/documents/nos-resultats-ckim-formation.pdf"
      />

      <LegalBody>
        <LegalCallout title="Calendrier de publication">
          <p>
            Nos premières sessions de formation ont été animées à partir de janvier 2026. Les premiers
            résultats, calculés sur les sessions terminées entre le 1er janvier et le 31 décembre 2026,
            seront publiés en janvier 2027. Ils seront ensuite mis à jour chaque trimestre.
          </p>
        </LegalCallout>

        <LegalArticle title="Comment nous calculons nos indicateurs">
          <p>
            Les résultats portent sur toutes les sessions terminées pendant la période indiquée, en
            inter-entreprises comme en intra-entreprise.
          </p>
          <LegalTable
            head={['Indicateur', 'Mode de calcul', 'Source']}
            rows={[
              [
                'Stagiaires formés',
                'Nombre de stagiaires ayant suivi au moins une demi-journée de formation',
                "Feuilles d'émargement",
              ],
              [
                'Taux de satisfaction',
                'Réponses « satisfait » ou « très satisfait » (4 ou 5 sur 5) à la question de satisfaction globale ÷ nombre de réponses à cette question × 100',
                'Questionnaire de fin de formation',
              ],
              [
                'Taux de réponse',
                'Questionnaires complétés ÷ stagiaires présents en fin de formation × 100. Il est toujours affiché à côté du taux de satisfaction.',
                'Questionnaire de fin de formation',
              ],
              [
                'Taux de réussite',
                'Stagiaires ayant obtenu leur certificat ÷ stagiaires présentés aux épreuves × 100 (formations certifiantes uniquement)',
                'Procès-verbaux de certification',
              ],
              [
                "Taux d'abandon",
                'Stagiaires ayant quitté la formation avant la fin ÷ stagiaires entrés en formation × 100',
                "Émargements, fiches d'abandon",
              ],
              [
                'Satisfaction des entreprises',
                'Même calcul que la satisfaction des stagiaires',
                'Questionnaire entreprises en ligne',
              ],
            ]}
          />
        </LegalArticle>

        <LegalArticle title="Nos règles de publication">
          <LegalList
            items={[
              "Aucun chiffre n'est publié sans les données sources qui permettent de le recalculer.",
              "Quand un taux porte sur moins de 10 personnes, nous indiquons l'effectif (par exemple « 100 % – 6 répondants »).",
              'Nous n’utilisons pas de mentions comme « 100 % de réussite garantie ».',
              'Les résultats affichés sur les fiches formation sont calculés selon cette méthode et mis à jour aux mêmes dates.',
              "Les résultats d'une session réalisée pour le compte d'un autre organisme ne sont comptés que si nous en détenons les données.",
            ]}
          />
        </LegalArticle>

        <LegalArticle title="Où trouver les résultats de chaque formation">
          <p>
            Les résultats de chaque formation sont affichés sur sa fiche formation, téléchargeable depuis
            la page de la formation. Chaque fiche indique la période couverte et la date de mise à jour.
          </p>
          <p>
            Quand aucune session n&apos;a eu lieu sur la période, la fiche l&apos;indique : aucun chiffre
            n&apos;est affiché tant qu&apos;il n&apos;existe pas de données.
          </p>
        </LegalArticle>

        <LegalArticle title="Une question sur nos résultats ?">
          <p>
            Contactez-nous au{' '}
            <a href="tel:0619798776" className="text-teal hover:underline">06 19 79 87 76</a> ou à{' '}
            <a href="mailto:administratif@ckimformation.fr" className="text-teal hover:underline">
              administratif@ckimformation.fr
            </a>
            . Nous pouvons vous transmettre le détail du calcul pour une formation ou une période.
          </p>
        </LegalArticle>

        <p className="pt-6 border-t border-dark/10 text-xs text-dark/50">
          C-KIM SÉCURITÉ FORMATION · SAS · Draguignan (83) · NDA 93830858883
        </p>
      </LegalBody>
    </>
  );
}
