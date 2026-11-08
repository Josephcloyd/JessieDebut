"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import type { Participant } from "@/lib/types";
import { CANDLE_COUNT } from "./candle-layout";
import { CandleStage } from "./CandleStage";
import { useLitCount } from "./useLitCount";
import { usePrefersStill } from "./usePrefersStill";

interface CandleCeremonyProps {
  intro?: string;
  /** The people lighting the candles, in order. Unfilled places simply show their number. */
  people: Participant[];
}

/** The guest scrolls and the candles light, one year at a time, while the page holds still. */
export function CandleCeremony({ intro, people }: CandleCeremonyProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isStill = usePrefersStill();
  const scrolled = useLitCount(trackRef, !isStill);
  const lit = isStill ? CANDLE_COUNT : scrolled;
  const isFull = lit >= CANDLE_COUNT;
  const person = lit > 0 ? people[lit - 1] : undefined;

  return (
    <div ref={trackRef} className={isStill ? "" : "h-[340svh] md:h-[300svh]"}>
      <div className={`relative overflow-hidden ${isStill ? "h-[88svh]" : "sticky top-0 h-svh"}`}>
        <div className="pointer-events-none absolute inset-0 transition-opacity duration-1000" style={{ opacity: lit / CANDLE_COUNT, background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgb(230 197 148 / 0.26), transparent 72%)" }} aria-hidden="true" />
        <CandleStage lit={lit} isStill={isStill} className="absolute inset-0" />

        <header className="absolute inset-x-0 top-0 z-10 px-6 pt-6 md:px-14 md:pt-10">
          <h2 className="pr-14 font-display text-6xl font-light italic leading-none md:text-8xl">The Eighteen</h2>
          {intro && <p className="mt-2 max-w-md pr-14 font-display text-xl italic leading-snug text-beige md:text-2xl">{intro}</p>}
        </header>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-16 pb-7 text-center md:pb-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={lit} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <p className={`numerals text-7xl leading-none md:text-9xl ${isFull ? "text-gold" : ""}`} style={isFull ? { textShadow: "0 0 34px rgb(230 197 148 / 0.65)" } : undefined}>{String(lit).padStart(2, "0")}</p>
              <p className="mt-2 min-h-14 text-balance font-display text-2xl italic leading-tight text-beige md:text-3xl">
                {isFull ? "Eighteen years, all aglow" : person ? <><span className="font-script not-italic text-ivory">{person.name}</span>{person.relationship && <span className="block text-lg">{person.relationship}</span>}</> : lit === 0 ? "Keep scrolling to light the candles" : `Candle ${lit}`}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
