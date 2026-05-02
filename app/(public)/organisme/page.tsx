import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { Tag } from '@/components/ui/Tag';

export const metadata: Metadata = {
  title: "L'organisme C-KIM Formation — Qualiopi, méthode, formateurs",
  description: 'Centre de formation certifié Qualiopi en région PACA. Formateurs certifiés INRS, AFNOR, FPA. 60-80% de pratique, intervention sur site.',
};

export default function OrganismePage() {
  return (
    <>
      {/* Hero - dark */}
      <section className="bg-dark text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container className="relative">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">L'organisme</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Une équipe<br/>
            <em className="not-italic text-teal-l">terrain.</em>
          </h1>
          <p className="mt-8 text-lg text-muted max-w-2xl leading-relaxed">
            C-KIM Formation est implanté en Provence-Alpes-Côte d'Azur, spécialisé dans la sécurité au travail, la prévention des risques professionnels et le développement humain. Certifié Qualiopi, nous intervenons directement sur site client pour des formations ancrées dans la réalité terrain.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Tag color="#3AB5CA">Qualiopi</Tag>
            <Tag color="#3AB5CA">INRS</Tag>
            <Tag color="#3AB5CA">AFNOR</Tag>
            <Tag color="#3AB5CA">FPA</Tag>
          </div>
        </Container>
      </section>

      {/* Méthode - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Notre méthode"
              titre="60 à 80 % de pratique."
              accent="pratique"
              description="Une approche ludopédagogique pour favoriser l'ancrage durable des compétences. Chaque session est construite autour de mises en situation réelles, adaptées au contexte métier de vos équipes."
            />
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { n: '01', t: 'Diagnostic terrain', d: 'Analyse de vos risques et besoins spécifiques avant la session.' },
              { n: '02', t: 'Pratique immersive', d: '60 à 80 % du temps en situation réelle, avec matériel professionnel.' },
              { n: '03', t: 'Ancrage durable', d: 'Évaluation continue + livrables (attestation, registre) pour assurer la conformité.' },
            ].map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.1}>
                <div className="bg-light rounded-lg p-8 h-full">
                  <p className="font-display text-5xl text-orange leading-none">{step.n}</p>
                  <h3 className="font-display text-2xl mt-4 tracking-wide">{step.t}</h3>
                  <p className="mt-3 text-sm text-dark/70 leading-relaxed">{step.d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Formateurs - light */}
      <section className="bg-light py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Nos formateurs"
              titre="Certifiés et expérimentés."
              accent="Certifiés"
              description="Tous nos formateurs sont titulaires du titre FPA (Formateur Professionnel d'Adultes), certifiés INRS et auditeurs Qualiopi AFNOR. Ils interviennent sur le terrain depuis plusieurs années."
            />
          </FadeUp>
        </Container>
      </section>

      {/* CTA - dark */}
      <section className="bg-dark text-white py-24">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl tracking-wide">Prêts à former vos équipes ?</h2>
              <p className="mt-4 text-muted">Devis sous 24h pour toute demande.</p>
              <div className="mt-8 flex justify-center gap-4 flex-wrap">
                <ButtonLink href="/formations" variant="primary">Voir les formations</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">Nous contacter</ButtonLink>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
