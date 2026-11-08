"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { formatProgramTime } from "@/lib/domain/time";
import type { ProgramItem } from "@/lib/types";
import { Reveal } from "./motion-helpers";
import { SectionHeading } from "./SectionHeading";

const TIME_COLUMN = "grid-cols-[5rem_1fr] md:grid-cols-[9rem_1fr]";
const LINE_POSITION = "left-[5rem] md:left-[9rem]";

export function Program({ items, folio }: { items: ProgramItem[]; folio: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 60%"] });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });

  if (items.length === 0) return null;

  return (
    <section id="program" className="px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="The Program" />
      <ol ref={listRef} className="relative mx-auto max-w-4xl">
        <span className={`absolute top-0 h-full w-px bg-champagne/60 ${LINE_POSITION}`} aria-hidden="true" />
        {/* The gold line draws itself down the program as the guest scrolls. */}
        <motion.span className={`absolute top-0 h-full w-px origin-top bg-gold ${LINE_POSITION}`} style={{ scaleY: prefersReducedMotion ? 1 : lineProgress }} aria-hidden="true" />
        {items.map((item) => (
          <li key={item.id} className={`grid ${TIME_COLUMN}`}>
            <p className="pr-4 pt-2 text-right font-display text-lg tabular-nums text-soft-ink md:text-2xl">{formatProgramTime(item.start_time)}</p>
            <Reveal className="pb-9 pl-6 md:pl-10">
              <h3 className="font-display text-3xl leading-tight md:text-4xl">{item.title}</h3>
              {item.description && <p className="mt-1 leading-relaxed text-soft-ink">{item.description}</p>}
              {item.image_url && (
                <div className="relative mt-4 aspect-[16/9] overflow-hidden">
                  <Image src={item.image_url} alt={item.title} fill sizes="(min-width: 768px) 640px, 80vw" className="object-cover" />
                </div>
              )}
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
