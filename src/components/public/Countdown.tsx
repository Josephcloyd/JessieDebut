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

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

interface CountdownProps {
  target: string;
  celebrantName: string;
  tone?: "dark" | "light" | "responsive";
  size?: "compact" | "large";
}

const TONE_CLASS = { dark: "text-umber", light: "text-ivory", responsive: "text-ivory md:text-umber" };

export function Countdown({ target, celebrantName, tone = "dark", size = "large" }: CountdownProps) {
  const second = useSyncExternalStore(subscribeToSeconds, currentSecond, noSecondOnServer);
  const toneClass = TONE_CLASS[tone];

  if (second !== null) {
    const preview = getCountdown(target, second * 1000);
    if (preview.isPast) {
      return (
        <p className={`font-script text-4xl md:text-5xl ${toneClass}`}>
          The celebration of {celebrantName} has begun
        </p>
      );
    }
  }

  const values = second === null ? null : getCountdown(target, second * 1000);
  const numberSize = size === "large" ? "text-5xl md:text-7xl" : "text-3xl md:text-4xl";

  return (
    <div className={`flex justify-center gap-5 md:gap-10 ${toneClass}`} role="timer" aria-label="Time remaining until the debut">
      {UNITS.map((unit) => (
        <div key={unit} className="min-w-12 text-center md:min-w-16">
          <div className={`relative overflow-hidden font-display leading-none tabular-nums ${numberSize}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={values?.[unit] ?? "pending"}
                className="block"
                initial={{ opacity: 0, y: "35%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-35%" }}
                transition={{ duration: 0.45 }}
              >
                {values ? String(values[unit]).padStart(2, "0") : "--"}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="eyebrow mt-2 text-[0.58rem] opacity-80">{unit}</p>
        </div>
      ))}
    </div>
  );
}
