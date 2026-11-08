"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { formatProgramTime } from "@/lib/domain/time";
import type { ProgramItem } from "@/lib/types";
import { usePrefersStill } from "./candles/usePrefersStill";
import { Reveal } from "./motion-helpers";

const TIME_COLUMN = "grid-cols-[4.75rem_1fr] md:grid-cols-[9rem_1fr]";
const LINE_POSITION = "left-[4.75rem] md:left-[9rem]";

/** A small flame that carries the candle-lighting down the evening's order of events. */
function TravellingFlame() {
  return (
    <span className="absolute -left-[5px] -top-1 block h-3.5 w-2.5 rounded-[50%_50%_50%_50%/70%_70%_30%_30%] bg-gold" style={{ boxShadow: "0 0 14px 5px rgb(230 197 148 / 0.75)" }} />
  );
}

export function Program({ items }: { items: ProgramItem[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const isStill = usePrefersStill();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 60%"] });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });
  const flameDrop = useTransform(lineProgress, (value) => `${value * 100}%`);

  if (items.length === 0) return null;

  return (
    <section id="program" className="px-6 py-20 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
        <Reveal className="md:sticky md:top-14 md:self-start">
          <h2 className="font-display text-6xl font-light leading-[0.95] md:text-8xl">The Program</h2>
        </Reveal>
        <ol ref={listRef} className="relative">
          <span className={`absolute top-0 h-full w-px bg-gold/50 ${LINE_POSITION}`} aria-hidden="true" />
          <motion.span className={`absolute top-0 h-full w-px origin-top bg-umber ${LINE_POSITION}`} style={{ scaleY: isStill ? 1 : lineProgress }} aria-hidden="true" />
          {!isStill && (
            <motion.span className={`pointer-events-none absolute top-0 h-full w-0 ${LINE_POSITION}`} style={{ y: flameDrop }} aria-hidden="true">
              <TravellingFlame />
            </motion.span>
          )}
          {items.map((item) => (
            <li key={item.id} className={`grid ${TIME_COLUMN}`}>
              <p className="numerals pr-4 pt-2 text-right text-base leading-tight text-soft-ink md:text-xl">{formatProgramTime(item.start_time)}</p>
              <Reveal className="pb-12 pl-6 md:pl-12">
                <h3 className="font-display text-4xl leading-tight md:text-5xl">{item.title}</h3>
                {item.description && <p className="mt-1 text-lg leading-relaxed text-soft-ink">{item.description}</p>}
                {item.image_url && (
                  <div className="relative mt-5 aspect-[16/9] overflow-hidden">
                    <Image src={item.image_url} alt={item.title} fill sizes="(min-width: 768px) 640px, 80vw" className="object-cover" />
                  </div>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
