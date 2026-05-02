import { Container } from '@/components/ui/Container';
import { LetterReveal } from '@/components/motion/LetterReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { StatCounter } from '@/components/motion/StatCounter';
import { Marquee } from '@/components/motion/Marquee';

export default function Home() {
  return (
    <main className="min-h-[200vh] bg-white py-24">
      <Container>
        <h1 className="font-display text-7xl tracking-wide">
          <LetterReveal text="FORMER POUR AGIR" />
        </h1>
        <div className="mt-32">
          <FadeUp>
            <p className="font-display text-4xl">
              <StatCounter to={15} /> formations
            </p>
          </FadeUp>
        </div>
        <div className="mt-16">
          <Marquee>
            <span className="font-display text-3xl">QUALIOPI</span>
            <span className="font-display text-3xl">·</span>
            <span className="font-display text-3xl">INRS</span>
            <span className="font-display text-3xl">·</span>
            <span className="font-display text-3xl">AFNOR</span>
            <span className="font-display text-3xl">·</span>
          </Marquee>
        </div>
      </Container>
    </main>
  );
}
