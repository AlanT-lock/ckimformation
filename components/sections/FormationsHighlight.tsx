'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import type { Formation } from '@/lib/types/formation';
import { getParcoursMeta } from '@/lib/parcours';

interface Props {
  formations: Formation[];
}

const AUTOPLAY_MS = 6000;

export function FormationsHighlight({ formations }: Props) {
  return (
    <section className="bg-light py-24 overflow-hidden">
      <Container>
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-teal">À l&apos;affiche</p>
            <h2 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">
              Nos formations <em className="not-italic text-teal">phares</em>.
            </h2>
            <p className="mt-5 text-dark/70 leading-relaxed">
              Cinq formations qui répondent aux besoins les plus fréquents : sécurité au travail,
              prévention, santé et hygiène. Toutes certifiées Qualiopi.
            </p>
          </div>
        </FadeUp>

        <div className="mt-16">
          <Carousel formations={formations} />
        </div>

        <div className="mt-16">
          <Cards formations={formations} />
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------------- Carousel ----------------------------------- */

function Carousel({ formations }: { formations: Formation[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goto = (next: number, dir: 1 | -1) => {
    setDirection(dir);
    setIndex(((next % formations.length) + formations.length) % formations.length);
    setProgressKey((k) => k + 1);
  };

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => goto(index + 1, 1), AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  const current = formations[index];
  const meta = getParcoursMeta(current.parcours);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide */}
      <div className="relative bg-white rounded-2xl border border-dark/10 shadow-xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] z-10" style={{ backgroundColor: meta.couleur }} />

        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={current.slug}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-5 min-h-[480px]"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] lg:aspect-auto lg:col-span-3 bg-light">
              <Image
                src={current.hero.image}
                alt={current.hero.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-dark/30 via-transparent to-transparent lg:from-transparent lg:to-white/20" />
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 lg:col-span-2 flex flex-col justify-center">
              <p
                className="text-xs uppercase tracking-[0.3em] mb-3"
                style={{ color: meta.couleur }}
              >
                {meta.label} · {current.ref}
              </p>
              <h3 className="font-display text-3xl md:text-4xl tracking-wide leading-[1.05]">
                {current.titre}
                {current.sousTitre && (
                  <>
                    <br />
                    <em className="not-italic" style={{ color: meta.couleur }}>
                      {current.sousTitre}
                    </em>
                  </>
                )}
              </h3>
              <p className="mt-5 text-dark/70 leading-relaxed line-clamp-4">
                {current.objectifs}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.2em] text-dark/50">
                <span>{current.infosPratiques.duree}</span>
                <span className="opacity-30">·</span>
                <span>{current.infosPratiques.modalite}</span>
              </div>
              <Link
                href={`/formations/${current.slug}`}
                className="mt-8 inline-flex items-center gap-2 self-start text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider transition hover:opacity-90 hover:gap-3"
                style={{ backgroundColor: meta.couleur }}
              >
                <span>Découvrir</span>
                <span aria-hidden>→</span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-dark/5">
          <motion.div
            key={progressKey}
            initial={{ width: '0%' }}
            animate={{ width: paused ? '0%' : '100%' }}
            transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
            className="h-full"
            style={{ backgroundColor: meta.couleur }}
          />
        </div>
      </div>

      {/* Prev / Next buttons */}
      <button
        onClick={() => goto(index - 1, -1)}
        aria-label="Formation précédente"
        className="group absolute top-1/2 -translate-y-1/2 left-2 lg:-left-6 w-12 h-12 rounded-full bg-white border border-dark/10 shadow-lg hover:bg-dark hover:text-white hover:border-dark transition-all flex items-center justify-center z-10"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:-translate-x-0.5">
          <path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => goto(index + 1, 1)}
        aria-label="Formation suivante"
        className="group absolute top-1/2 -translate-y-1/2 right-2 lg:-right-6 w-12 h-12 rounded-full bg-white border border-dark/10 shadow-lg hover:bg-dark hover:text-white hover:border-dark transition-all flex items-center justify-center z-10"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
          <path d="M5 1L11 7L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dots */}
      <div className="mt-8 flex justify-center items-center gap-3">
        {formations.map((f, i) => (
          <button
            key={f.slug}
            onClick={() => goto(i, i > index ? 1 : -1)}
            aria-label={`Aller à : ${f.titre}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-10' : 'w-3 hover:w-5'
            }`}
            style={{
              backgroundColor: i === index ? meta.couleur : 'rgba(10,10,10,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------ Cards ------------------------------------ */

function Cards({ formations }: { formations: Formation[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {formations.map((f, i) => {
        const meta = getParcoursMeta(f.parcours);
        return (
          <FadeUp key={f.slug} delay={i * 0.05}>
            <Link
              href={`/formations/${f.slug}`}
              className="group bg-white rounded-lg border border-dark/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
            >
              <div className="relative h-36 overflow-hidden bg-light">
                <Image
                  src={f.hero.image}
                  alt={f.hero.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
                <div
                  className="absolute top-0 inset-x-0 h-1"
                  style={{ backgroundColor: meta.couleur }}
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <span
                  className="text-[10px] uppercase tracking-[0.25em] font-semibold"
                  style={{ color: meta.couleur }}
                >
                  {f.ref}
                </span>
                <h4 className="mt-2 font-display text-lg tracking-wide leading-tight">
                  {f.titre}
                </h4>
                {f.sousTitre && (
                  <p className="text-xs text-dark/50 mt-0.5 leading-snug">{f.sousTitre}</p>
                )}
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-dark/50">
                  {f.infosPratiques.duree}
                </p>
                <span
                  className="mt-auto pt-4 text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                  style={{ color: meta.couleur }}
                >
                  Voir la formation
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </FadeUp>
        );
      })}
    </div>
  );
}
