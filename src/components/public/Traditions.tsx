"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import type { Participant, TraditionKey, TraditionsConfig } from "@/lib/types";
import { CANDLE_COUNT } from "./candles/candle-layout";
import { CandleCeremony } from "./candles/CandleCeremony";

const ORDER: TraditionKey[] = ["roses", "candles", "treasures", "blue_bills", "wishes"];

/** One line of the dance card. A place not yet filled is simply a blank ruled line. */
function CardLine({ number, person }: { number: number; person?: Participant }) {
  return (
    <li className="flex break-inside-avoid items-start gap-3 border-b border-umber/15 py-2.5">
      <span className="numerals w-7 shrink-0 pt-1 text-right text-sm text-soft-ink">{number}</span>
      {person ? (
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-tight">{person.name}</p>
          {person.relationship && <p className="text-sm text-soft-ink">{person.relationship}</p>}
          {person.message && <p className="mt-0.5 font-display text-lg italic leading-snug text-soft-ink">{person.message}</p>}
        </div>
      ) : (
        <span className="min-h-7 flex-1"><span className="sr-only">To be announced</span></span>
      )}
      {person?.photo_url && (
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
          <Image src={person.photo_url} alt={person.name} fill sizes="44px" className="object-cover" />
        </div>
      )}
    </li>
  );
}

interface TraditionsProps {
  config: TraditionsConfig;
  participants: Participant[];
}

/** After the candles, the printed dance card: every tradition has its own numbered page. */
function DanceCard({ config, participants, enabled }: TraditionsProps & { enabled: TraditionKey[] }) {
  const [active, setActive] = useState<TraditionKey>(enabled[0]);
  const current = enabled.includes(active) ? active : enabled[0];
  const people = participants.filter((person) => person.tradition === current);
  const rows = Array.from({ length: Math.max(CANDLE_COUNT, people.length) }, (_, index) => people[index]);

  return (
    <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-14 md:pb-32">
      <div className="flex flex-wrap justify-center gap-x-1 gap-y-1" role="tablist" aria-label="Debut traditions">
        {enabled.map((key) => (
          <button key={key} id={`tradition-${key}`} type="button" role="tab" aria-selected={key === current} aria-controls="tradition-card" onClick={() => setActive(key)} className={`min-h-11 px-4 pb-2 pt-2.5 font-display text-xl italic transition-colors md:text-2xl ${key === current ? "bg-ivory text-umber" : "text-beige hover:text-gold"}`}>
            {config[key].title}
          </button>
        ))}
      </div>
      <div id="tradition-card" role="tabpanel" aria-labelledby={`tradition-${current}`} className="bg-ivory p-2 text-umber shadow-soft md:p-3">
        <div className="border border-gold px-5 py-9 md:px-12 md:py-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="text-center font-script text-6xl leading-none md:text-7xl">{config[current].title}</h3>
              {config[current].intro && <p className="mx-auto mt-3 max-w-md text-center font-display text-xl italic leading-snug text-soft-ink">{config[current].intro}</p>}
              <ol className="mt-8 md:columns-2 md:gap-12">
                {rows.map((person, index) => <CardLine key={person?.id ?? `open-${index}`} number={index + 1} person={person} />)}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function Traditions({ config, participants }: TraditionsProps) {
  const enabled = ORDER.filter((key) => config[key]?.enabled);
  if (enabled.length === 0) return null;
  const candles = config.candles?.enabled ? config.candles : undefined;

  return (
    <>
      <div className="h-[26svh] bg-gradient-to-b from-transparent to-umber md:h-[32svh]" aria-hidden="true" />
      <section id="traditions" className="bg-umber text-ivory">
        <CandleCeremony intro={candles?.intro} people={candles ? participants.filter((person) => person.tradition === "candles") : []} />
        <DanceCard config={config} participants={participants} enabled={enabled} />
      </section>
    </>
  );
}
