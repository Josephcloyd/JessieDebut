"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { getCountdown } from "@/lib/domain/countdown";

function subscribeToSeconds(onTick: () => void): () => void {
  const interval = window.setInterval(onTick, 1000);
  return () => window.clearInterval(interval);
}

const currentSecond = () => Math.floor(Date.now() / 1000);
const noSecondOnServer = () => null;

const TIME_UNITS = ["hours", "minutes", "seconds"] as const;

function Ticking({ value, className }: { value: string; className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="block" initial={{ opacity: 0, y: "35%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "-35%" }} transition={{ duration: 0.45 }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

interface CountdownProps {
  target: string;
  celebrantName: string;
  label: string;
}

/** One enormous figure for the days, with the smaller units running beside it. */
export function Countdown({ target, celebrantName, label }: CountdownProps) {
  const second = useSyncExternalStore(subscribeToSeconds, currentSecond, noSecondOnServer);
  const values = second === null ? null : getCountdown(target, second * 1000);

  if (values?.isPast) {
    return <p className="font-script text-5xl leading-tight md:text-7xl">The celebration of {celebrantName} has begun</p>;
  }

  const show = (unit: "days" | (typeof TIME_UNITS)[number]) => (values ? String(values[unit]).padStart(2, "0") : "--");

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-16" role="timer" aria-label="Time remaining until the debut">
      <div>
        <p className="font-display text-3xl italic leading-none text-beige md:text-4xl">{label}</p>
        <Ticking value={show("days")} className="numerals mt-3 text-[clamp(7.5rem,36vw,22rem)] leading-[0.92] text-gold" />
        <p className="font-display text-2xl italic leading-none md:text-3xl">days</p>
      </div>
      <dl className="grid grid-cols-3 gap-5 border-t border-gold/30 pt-5 md:grid-cols-1 md:gap-0 md:border-t-0 md:pt-0">
        {TIME_UNITS.map((unit) => (
          <div key={unit} className="md:flex md:w-64 md:items-baseline md:justify-between md:border-t md:border-gold/30 md:py-3">
            <dt className="order-2 font-display text-lg italic text-beige md:text-xl">{unit}</dt>
            <dd className="order-1 mt-1 md:mt-0">
              <Ticking value={show(unit)} className="numerals text-4xl leading-none md:text-5xl" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
