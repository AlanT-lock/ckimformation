import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';

export function MethodeCkim() {
  return (
    <section className="bg-dark text-white py-24">
      <Container>
        <FadeUp>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Méthode C-KIM</p>
          <h2 className="font-display text-4xl md:text-6xl tracking-wide leading-[0.95] max-w-3xl">
            Apprendre en <em className="not-italic text-teal-l">faisant</em>.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <p className="font-display text-5xl text-orange leading-none">60-80%</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">de pratique</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Mises en situation réelles, matériel professionnel.</p>
            </div>
            <div>
              <p className="font-display text-5xl text-teal-l leading-none">SUR SITE</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">intervention chez vous</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Adaptation au contexte métier de vos équipes.</p>
            </div>
            <div>
              <p className="font-display text-5xl text-teal-l leading-none">CERTIFIÉS</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">INRS · AFNOR · FPA</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Auditeurs Qualiopi, formateurs professionnels d&apos;adultes.</p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
