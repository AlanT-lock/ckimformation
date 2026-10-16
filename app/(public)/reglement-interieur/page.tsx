import type { Metadata } from 'next';
import {
  LegalArticle,
  LegalBody,
  LegalCallout,
  LegalDocHero,
  LegalList,
} from '@/components/sections/LegalDoc';

export const metadata: Metadata = {
  title: 'Règlement intérieur — C-KIM Formation',
  description:
    'Règlement intérieur applicable aux stagiaires de C-KIM Sécurité Formation : hygiène et sécurité, assiduité, comportement, violences et harcèlement, sanctions.',
};

export default function ReglementInterieurPage() {
  return (
    <>
      <LegalDocHero
        eyebrow="C-KIM Sécurité Formation"
        title="Règlement intérieur"
        subtitle="Applicable aux stagiaires. Établi conformément aux articles L.6352-3 à L.6352-5 et R.6352-1 à R.6352-15 du Code du travail."
        meta="Version 2 – octobre 2026"
        pdfHref="/documents/reglement-interieur-ckim-formation.pdf"
      />

      <LegalBody>
        <LegalArticle number="Article 1" title="Objet et champ d'application">
          <p>
            Le présent règlement s&apos;applique à toute personne participant à une action de formation
            organisée par C-KIM SÉCURITÉ FORMATION, en inter-entreprises, en intra-entreprise ou à distance. Il
            fixe les règles d&apos;hygiène et de sécurité, les règles de discipline, la nature et l&apos;échelle
            des sanctions et les garanties de procédure. Lorsque la formation se déroule dans une entreprise ou
            un établissement déjà doté d&apos;un règlement intérieur, les règles d&apos;hygiène et de sécurité
            de ce dernier s&apos;appliquent.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 2" title="Hygiène et sécurité">
          <p>
            Chaque stagiaire respecte les consignes d&apos;hygiène et de sécurité applicables sur le lieu de
            formation, ainsi que les consignes données par le formateur, notamment pour l&apos;usage du matériel
            pédagogique (mannequins, défibrillateurs de formation, extincteurs, etc.). Tout dysfonctionnement
            constaté est signalé immédiatement au formateur.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 3" title="Consignes d'incendie">
          <p>
            Les consignes d&apos;incendie, l&apos;emplacement des extincteurs et des issues de secours sont
            affichés ou présentés en début de formation. En cas d&apos;alerte, le stagiaire cesse toute activité
            et suit dans le calme les instructions du formateur ou des secours. Tout témoin d&apos;un début
            d&apos;incendie alerte immédiatement le formateur ou, à défaut, appelle le 18 ou le 112.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 4" title="Alcool, drogues, tabac">
          <p>
            Il est interdit d&apos;introduire ou de consommer des boissons alcoolisées ou des stupéfiants, et de
            se présenter en formation sous leur emprise. Il est interdit de fumer ou de vapoter dans les salles
            et lieux de formation.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 5" title="Accident">
          <p>
            Tout accident ou incident survenu pendant la formation ou sur le trajet est déclaré sans délai au
            formateur ou à C-KIM SÉCURITÉ FORMATION. Pour un salarié, la déclaration d&apos;accident est établie
            par l&apos;employeur ; dans les autres cas, par le stagiaire ou son organisme de prise en charge.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 6" title="Assiduité, horaires, absences">
          <p>
            Les stagiaires respectent les horaires communiqués dans la convocation et émargent en ligne par
            demi-journée. Toute absence, tout retard ou départ anticipé est signalé à C-KIM SÉCURITÉ FORMATION
            et justifié ; C-KIM SÉCURITÉ FORMATION en informe l&apos;employeur ou le financeur. Une absence non
            justifiée peut être facturée selon les conditions générales de vente. Pour les formations
            certifiantes (SST notamment), une absence peut empêcher le passage des épreuves selon le référentiel
            du certificateur.
          </p>
          <p>
            Le stagiaire remet sa fiche d&apos;inscription avant la formation et signale toute modification de
            sa situation. À l&apos;issue de la formation, il reçoit une attestation de fin de formation et, le
            cas échéant, l&apos;attestation ou le certificat prévu par le référentiel (pour le SST : certificat
            SST, carte INRS).
          </p>
        </LegalArticle>

        <LegalArticle number="Article 7" title="Accès aux locaux">
          <p>
            Sauf autorisation de C-KIM SÉCURITÉ FORMATION, le stagiaire ne peut demeurer dans les locaux à
            d&apos;autres fins que la formation, y introduire des personnes extérieures ou y vendre des biens ou
            services.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 8" title="Tenue et comportement">
          <p>
            Le stagiaire se présente dans une tenue adaptée à la formation (tenue permettant les exercices
            pratiques au sol pour le SST, par exemple) et adopte un comportement respectueux envers le
            formateur, les autres stagiaires et le personnel des lieux d&apos;accueil.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 9" title="Matériel, Internet, enregistrements">
          <p>
            Le matériel confié est utilisé conformément à son objet et rendu en bon état. Toute anomalie est
            signalée au formateur. La connexion Internet éventuellement fournie est utilisée de façon licite. Il
            est interdit de photographier, filmer ou enregistrer la formation, le formateur ou les autres
            stagiaires sans leur accord écrit.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 10" title="Formation à distance">
          <p>
            En formation à distance ou mixte, les mêmes règles d&apos;assiduité, de tenue et de comportement
            s&apos;appliquent. Les codes d&apos;accès sont personnels et ne doivent pas être communiqués.
            L&apos;émargement est réalisé selon les modalités communiquées par C-KIM SÉCURITÉ FORMATION.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 10 bis" title="Violences, harcèlement et discriminations">
          <LegalCallout>
            <p>
              Toute forme de violence physique ou verbale, de violences sexistes et sexuelles, de harcèlement
              moral ou sexuel et de discrimination est strictement interdite, pendant la formation comme dans les
              échanges qui s&apos;y rattachent (messageries, réseaux sociaux).
            </p>
            <p>
              Toute personne victime ou témoin peut le signaler au formateur, au référent VHSS de C-KIM SÉCURITÉ
              FORMATION, <strong>Camel ATIL (06 62 51 55 59)</strong>, ou par écrit à contact@ckimformation.fr.
              Le signalement est traité de manière confidentielle selon la procédure de C-KIM SÉCURITÉ
              FORMATION, sans délai, et aucune mesure défavorable ne peut être prise contre une personne ayant
              signalé ou témoigné de bonne foi. Les faits avérés exposent leur auteur aux sanctions de
              l&apos;article 12, sans préjudice des poursuites prévues par la loi.
            </p>
          </LegalCallout>
        </LegalArticle>

        <LegalArticle number="Article 11" title="Propriété intellectuelle">
          <p>
            Les supports remis restent la propriété de C-KIM SÉCURITÉ FORMATION ou de leurs auteurs. Ils sont
            destinés à l&apos;usage personnel du stagiaire. Toute reproduction, diffusion ou réutilisation,
            notamment pour animer une formation, est interdite sans autorisation écrite.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 12" title="Sanctions">
          <p>Tout manquement au présent règlement peut, selon sa gravité, donner lieu à :</p>
          <LegalList
            ordered
            items={[
              "rappel à l'ordre ;",
              'avertissement écrit ;',
              'exclusion temporaire ;',
              'exclusion définitive de la formation.',
            ]}
          />
          <p>
            Les amendes et sanctions pécuniaires sont interdites. L&apos;employeur et, le cas échéant, le
            financeur sont informés de la sanction.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 13" title="Garanties de procédure">
          <p>
            Aucune sanction ne peut être prononcée sans que le stagiaire ait été informé au préalable des
            griefs retenus contre lui. Lorsqu&apos;une sanction autre qu&apos;un rappel à l&apos;ordre est
            envisagée, le stagiaire est convoqué par écrit, avec l&apos;indication de l&apos;objet, de la date,
            de l&apos;heure et du lieu de l&apos;entretien ; il peut se faire assister d&apos;une personne de son
            choix. La sanction, motivée, est notifiée par écrit au plus tôt un jour franc et au plus tard quinze
            jours après l&apos;entretien. En cas d&apos;agissement rendant indispensable une mesure
            conservatoire d&apos;exclusion temporaire, aucune sanction définitive ne peut être prise sans cette
            procédure.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 14" title="Représentation des stagiaires">
          <p>
            Pour les actions de formation d&apos;une durée totale supérieure à 500 heures, un délégué titulaire
            et un délégué suppléant sont élus selon les articles R.6352-9 à R.6352-12 du Code du travail.
          </p>
        </LegalArticle>

        <LegalArticle number="Article 15" title="Publicité">
          <p>
            Le présent règlement est remis à chaque stagiaire avant l&apos;entrée en formation (avec la
            convocation ou la convention), publié sur ckimformation.fr et affiché ou consultable sur le lieu de
            formation.
          </p>
        </LegalArticle>

        <div className="pt-6 border-t border-dark/10 text-sm text-right space-y-0.5">
          <p>Fait à Draguignan, le 01/10/2026</p>
          <p className="font-semibold text-dark">Pour C-KIM SÉCURITÉ FORMATION,</p>
          <p>M. Camel ATIL, Président</p>
        </div>
      </LegalBody>
    </>
  );
}
