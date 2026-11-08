"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { EASE_ELEGANT, InvitationOpenedProvider } from "./motion-helpers";
import { NameLoadingScreen } from "./NameLoadingScreen";
import { Sprig, WaxSeal } from "./ornaments";

type Stage = "sealed" | "opening" | "writing" | "open";

const STAGE_MS = { opening: 2600, writing: 3600 };
const REDUCED_STAGE_MS = { opening: 300, writing: 1000 };
const PAPER_FRONT = "#fff3ec";
const PAPER_SIDE = "#ffece3";
const PAPER_FLAP = "#fff9f4";
const PAPER_INSIDE = "#c58b95";

interface EnvelopeGateProps {
  monogram: string;
  celebrantName: string;
  eventTitle: string;
  guestName?: string;
  children: ReactNode;
}

export function EnvelopeGate({ monogram, celebrantName, eventTitle, guestName, children }: EnvelopeGateProps) {
  const [stage, setStage] = useState<Stage>("sealed");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = stage === "open" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "opening" && stage !== "writing") return;
    const durations = prefersReducedMotion ? REDUCED_STAGE_MS : STAGE_MS;
    const timer = window.setTimeout(() => setStage(stage === "opening" ? "writing" : "open"), durations[stage]);
    return () => window.clearTimeout(timer);
  }, [stage, prefersReducedMotion]);

  const open = () => {
    if (stage === "sealed") setStage("opening");
  };

  const isOpening = stage === "opening";

  return (
    <InvitationOpenedProvider value={stage === "open"}>
      {children}
      <AnimatePresence>
        {stage === "writing" && <NameLoadingScreen key="writing" name={celebrantName} eventTitle={eventTitle} />}
        {(stage === "sealed" || isOpening) && (
          <motion.div
            key="envelope"
            className="linen fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4"
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.9, ease: EASE_ELEGANT }}
          >
            <Sprig className="absolute -left-6 top-8 w-52 text-taupe md:w-72" />
            <Sprig className="absolute -right-6 bottom-8 w-52 rotate-180 text-gold/60 md:w-72" />

            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: isOpening ? 0 : 1, y: isOpening ? -14 : 0 }}
              transition={{ duration: isOpening ? 0.5 : 1, ease: EASE_ELEGANT }}
            >
              {guestName && <p className="eyebrow mb-3 text-soft-ink">Dear {guestName}</p>}
              <p className="font-script text-5xl text-umber md:text-6xl">You Are Cordially Invited</p>
              <div className="mt-3">
                <span className="mx-auto block h-px w-40 bg-gold" aria-hidden="true" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 46, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1.2, delay: 0.25, ease: EASE_ELEGANT }}>
              <Envelope monogram={monogram} celebrantName={celebrantName} eventTitle={eventTitle} isOpening={isOpening} onOpen={open} />
            </motion.div>

            <motion.button
              type="button"
              onClick={open}
              disabled={isOpening}
              className="btn btn-solid mt-10"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: isOpening ? 0 : 1, y: 0 }}
              transition={{ duration: isOpening ? 0.4 : 0.9, delay: isOpening ? 0 : 0.7 }}
            >
              Open Your Invitation
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </InvitationOpenedProvider>
  );
}

interface EnvelopeProps {
  monogram: string;
  celebrantName: string;
  eventTitle: string;
  isOpening: boolean;
  onOpen: () => void;
}

function Envelope({ monogram, celebrantName, eventTitle, isOpening, onOpen }: EnvelopeProps) {
  return (
    <motion.div
      onClick={onOpen}
      className="relative aspect-[3/2] w-[min(88vw,30rem)] cursor-pointer shadow-soft"
      style={{ perspective: 1200 }}
      aria-hidden="true"
      animate={{ y: isOpening ? 40 : 0 }}
      transition={{ duration: 0.9, ease: EASE_ELEGANT }}
    >
      <div className="absolute inset-0" style={{ background: PAPER_INSIDE }} />

      <motion.div
        className="absolute inset-x-[6%] bottom-[4%] top-[6%] flex flex-col items-center justify-center bg-ivory text-center shadow-card"
        animate={isOpening ? { y: ["0%", "-62%", "-40%"], scale: [1, 1, 1.14], zIndex: 3 } : { y: "0%", scale: 1, zIndex: 1 }}
        transition={{ duration: 1.5, delay: 1.05, ease: EASE_ELEGANT, times: [0, 0.6, 1] }}
      >
        <div className="absolute inset-2 border border-champagne" />
        <p className="eyebrow text-[0.55rem] text-soft-ink">The Celebration of</p>
        <p className="mt-1 font-display text-3xl tracking-wide md:text-4xl">{celebrantName}</p>
        <p className="font-script text-2xl text-soft-ink">{eventTitle}</p>
      </motion.div>

      <div className="absolute inset-0 z-[2]" style={{ background: PAPER_SIDE, clipPath: "polygon(0 0, 50% 55%, 0 100%)" }} />
      <div className="absolute inset-0 z-[2]" style={{ background: PAPER_SIDE, clipPath: "polygon(100% 0, 50% 55%, 100% 100%)" }} />
      <div className="absolute inset-0 z-[2]" style={{ background: PAPER_FRONT, clipPath: "polygon(0 100%, 50% 48%, 100% 100%)" }} />

      <motion.div
        className="absolute inset-x-0 top-0 h-[60%] origin-top"
        style={{ background: PAPER_FLAP, clipPath: "polygon(0 0, 100% 0, 50% 100%)", backfaceVisibility: "visible" }}
        initial={{ rotateX: 0, zIndex: 4 }}
        animate={isOpening ? { rotateX: 180, zIndex: 0 } : { rotateX: 0, zIndex: 4 }}
        transition={{ duration: 0.75, delay: 0.35, ease: EASE_ELEGANT, zIndex: { delay: 0.75, duration: 0 } }}
      />

      <motion.div
        className="absolute left-[40%] top-[47%] z-[5] w-[20%]"
        animate={isOpening ? { scale: 1.25, opacity: 0, rotate: -14 } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: EASE_ELEGANT }}
      >
        <WaxSeal letters={monogram} className="w-full drop-shadow-md" />
      </motion.div>
    </motion.div>
  );
}
