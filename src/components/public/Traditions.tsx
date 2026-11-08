"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Participant, TraditionKey, TraditionsConfig } from "@/lib/types";
import { CANDLE_COUNT } from "./candles/candle-layout";
import { CandleStage } from "./candles/CandleStage";
import { useLitCount } from "./candles/useLitCount";
import { usePrefersStill } from "./candles/usePrefersStill";
import { SectionHeading } from "./SectionHeading";

const ORDER: TraditionKey[] = ["roses", "candles", "treasures", "blue_bills", "wishes"];
const FULL_LIST = CANDLE_COUNT;

function CreditRow({ number, person, isLit, isNewest }: { number: number; person?: Participant; isLit: boolean; isNewest: boolean }) {
  return (
    <li className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-t border-[#FFF9F4]/20 py-3 md:grid-cols-[6rem_1fr_auto] md:py-4">
      <span className={`font-display text-4xl font-light leading-none tabular-nums transition-[color,text-shadow] duration-700 md:text-6xl ${isLit ? "text-[#E6C594]" : person ? "text-[#FFD2D7]" : "text-[#FFF9F4]/25"}`} style={isNewest ? { textShadow: "0 0 22px rgb(230 197 148 / 0.75)" } : undefined}>{String(number).padStart(2, "0")}</span>
      <div className="min-w-0">
        {person ? (
          <>
            <p className="font-display text-2xl leading-tight md:text-4xl">{person.name}</p>
            {person.relationship && <p className="eyebrow mt-1 text-[0.58rem] text-[#FFD2D7]">{person.relationship}</p>}
            {person.message && <p className="mt-1 font-display text-lg italic leading-snug text-[#FFD2D7]">{person.message}</p>}
          </>
        ) : (
          <p className="font-display text-2xl text-[#FFF9F4]/55">To be announced</p>
        )}
      </div>
      {person?.photo_url && (
        <div className="relative size-14 overflow-hidden md:size-20">
          <Image src={person.photo_url} alt={person.name} fill sizes="80px" className="object-cover" />
        </div>
      )}
    </li>
  );
}

interface TraditionsProps {
  config: TraditionsConfig;
  participants: Participant[];
  folio: string;
}

export function Traditions({ config, participants, folio }: TraditionsProps) {
  const enabled = ORDER.filter((key) => config[key]?.enabled);
  const [active, setActive] = useState<TraditionKey | undefined>(enabled[0]);
  const prefersReducedMotion = usePrefersStill();
  const stageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrolled = useLitCount(listRef, stageRef, !prefersReducedMotion);
  const lit = prefersReducedMotion ? CANDLE_COUNT : scrolled;
  if (enabled.length === 0) return null;

  const current = active && enabled.includes(active) ? active : enabled[0];
  const people = participants.filter((person) => person.tradition === current);
  const rows = Array.from({ length: Math.max(FULL_LIST, people.length) }, (_, index) => people[index]);

  return (
    <section id="traditions" className="relative bg-[#4D2C32] px-5 py-20 text-[#FFF9F4] md:py-28">
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-1000" style={{ opacity: lit / CANDLE_COUNT, background: "radial-gradient(ellipse 70% 55% at 28% 48%, rgb(230 197 148 / 0.24), transparent 70%)" }} aria-hidden="true" />
      <SectionHeading folio={folio} title="The Eighteen" />
      <div className="relative mx-auto max-w-6xl">
        <div className="no-scrollbar mb-8 flex gap-6 overflow-x-auto" role="tablist" aria-label="Debut traditions">
          {enabled.map((key) => (
            <button key={key} type="button" role="tab" aria-selected={key === current} onClick={() => setActive(key)} className={`min-h-11 shrink-0 font-display text-2xl italic transition-colors md:text-3xl ${key === current ? "text-[#FFF9F4] underline decoration-[#E6C594] decoration-1 underline-offset-8" : "text-[#FFF9F4]/55 hover:text-[#FFF9F4]"}`}>
              {config[key].title}
            </button>
          ))}
        </div>
        <div className="lg:grid lg:grid-cols-[6fr_6fr] lg:gap-10">
          <div ref={stageRef} className="sticky top-0 z-10 -mx-5 mb-6 h-[42svh] bg-[#4D2C32] lg:top-6 lg:mx-0 lg:mb-0 lg:h-[min(66svh,600px)] lg:self-start lg:bg-transparent">
            <CandleStage lit={lit} isStill={prefersReducedMotion} className="size-full" />
            <div className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-[#4D2C32] to-transparent lg:hidden" aria-hidden="true" />
          </div>
          <div ref={listRef}>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {config[current].intro && <p className="mb-8 max-w-xl font-display text-xl italic leading-snug text-[#FFD2D7]">{config[current].intro}</p>}
            <ol className="grid">
              {rows.map((person, index) => <CreditRow key={person?.id ?? `open-${index}`} number={index + 1} person={person} isLit={index < lit} isNewest={index === lit - 1 && !prefersReducedMotion} />)}
            </ol>
          </motion.div>
        </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
