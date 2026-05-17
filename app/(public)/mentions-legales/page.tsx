import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Mentions légales — C-KIM Formation',
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">Légal</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Mentions légales</h1>
        <p className="mt-4 text-sm text-dark/50">Dernière mise à jour : 10 mai 2026</p>

        <div className="mt-8 text-dark/80 leading-relaxed space-y-6">
          <section>
            <h2 className="font-display text-2xl">Éditeur du site</h2>
            <p className="mt-3">
              Le site <a href="https://ckim-formation.fr" className="text-teal hover:underline">ckim-formation.fr</a> est édité par :
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li><strong>CKIM SECURITE FORMATION</strong> (nom commercial : C-KIM Formation Sécurité)</li>
              <li>SAS (Société par actions simplifiée) au capital de 100 €</li>
              <li>Siège social : 391 avenue du Maréchal Koenig, 83300 Draguignan, France</li>
              <li>SIREN : 991 764 580 — SIRET du siège : 991 764 580 00015</li>
              <li>Code APE / NAF : 85.59A (Formation continue d&apos;adultes)</li>
              <li>N° de TVA intracommunautaire : FR45 991 764 580</li>
              <li>Immatriculée au Registre National des Entreprises (RNE) le 7 novembre 2025</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl">Directeur de la publication</h2>
            <p className="mt-3">
              Camel ATIL, en sa qualité de Président de la SAS CKIM SECURITE FORMATION.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Contact</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Téléphone : <a href="tel:0662515559" className="text-teal hover:underline">06 62 51 55 59</a></li>
              <li>Email : <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a></li>
              <li>Adresse postale : 391 avenue du Maréchal Koenig, 83300 Draguignan</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl">Activité de formation</h2>
            <p className="mt-3">
              CKIM SECURITE FORMATION est un organisme de formation déclaré sous le numéro
              d&apos;activité <strong className="font-mono">93830858883</strong> auprès de la Préfecture
              de Région Provence-Alpes-Côte d&apos;Azur. Cet enregistrement ne vaut pas agrément de l&apos;État.
            </p>
            <p className="mt-3">
              L&apos;organisme est certifié <strong>Qualiopi</strong> au titre de la catégorie
              d&apos;actions « Actions de formation » — N° de certificat <strong className="font-mono">772911-1</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Hébergement du site</h2>
            <p className="mt-3">
              Le site est hébergé par <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut,
              CA 91789, États-Unis. <a href="https://vercel.com" className="text-teal hover:underline">vercel.com</a>
            </p>
            <p className="mt-3">
              La base de données et l&apos;authentification sont fournies par <strong>Supabase</strong>{' '}
              (Supabase, Inc., 970 Toa Payoh North #07-04, Singapour 318992), avec un stockage des
              données dans la région <strong>Europe (Francfort, Allemagne)</strong>.{' '}
              <a href="https://supabase.com" className="text-teal hover:underline">supabase.com</a>
            </p>
            <p className="mt-3">
              L&apos;envoi des emails transactionnels est assuré par <strong>Resend</strong>{' '}
              (Resend Inc., 2261 Market Street #4191, San Francisco, CA 94114, États-Unis).{' '}
              <a href="https://resend.com" className="text-teal hover:underline">resend.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Propriété intellectuelle</h2>
            <p className="mt-3">
              L&apos;ensemble du contenu de ce site (textes, images, logos, structure, charte
              graphique, supports pédagogiques) est la propriété exclusive de CKIM SECURITE
              FORMATION ou de ses partenaires. Toute reproduction, représentation, modification,
              publication ou adaptation, totale ou partielle, par quelque procédé que ce soit, est
              interdite sans autorisation écrite préalable.
            </p>
            <p className="mt-3">
              Les marques et logos cités (Qualiopi, INRS, AFNOR, etc.) restent la propriété de
              leurs titulaires respectifs.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Données personnelles</h2>
            <p className="mt-3">
              Les conditions de collecte et de traitement des données personnelles sont décrites
              dans notre <Link href="/confidentialite" className="text-teal hover:underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Liens externes</h2>
            <p className="mt-3">
              Ce site peut contenir des liens vers des sites tiers. CKIM SECURITE FORMATION
              n&apos;exerce aucun contrôle sur le contenu de ces sites et décline toute
              responsabilité quant à leur utilisation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Droit applicable</h2>
            <p className="mt-3">
              Le présent site est soumis au droit français. Tout litige relatif à son utilisation
              relève de la compétence des tribunaux de Draguignan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">Signaler un problème</h2>
            <p className="mt-3">
              Pour toute question relative à ces mentions légales ou pour signaler un contenu
              illicite, contactez-nous à{' '}
              <a href="mailto:contact@ckimformation.fr" className="text-teal hover:underline">contact@ckimformation.fr</a>.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
