"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { EASE_ELEGANT, InvitationOpenedProvider } from "./motion-helpers";
import { NameLoadingScreen } from "./NameLoadingScreen";
import type { EventSettings, InvitedGuest } from "@/lib/types";
import { Envelope3D } from "./Envelope3D";
import { InvitationLetter } from "./InvitationLetter";
import { SakuraBranch } from "./sakura";

type Stage = "sealed" | "opening" | "letter" | "writing" | "open";

const STAGE_MS = { opening: 2600, writing: 3600 };
const REDUCED_STAGE_MS = { opening: 300, writing: 1000 };
const BACKDROP = "radial-gradient(ellipse 75% 65% at 50% 50%, #ffe7ea 0%, #ffd2d7 72%)";

interface EnvelopeGateProps {
  monogram: string;
  celebrantName: string;
  eventTitle: string;
  guest?: InvitedGuest;
  settings: EventSettings;
  isRsvpOpen: boolean;
  isPreview: boolean;
  children: ReactNode;
}

export function EnvelopeGate({ monogram, celebrantName, eventTitle, guest, settings, isRsvpOpen, isPreview, children }: EnvelopeGateProps) {
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
    const timer = window.setTimeout(() => setStage(stage === "opening" ? "letter" : "open"), durations[stage]);
    return () => window.clearTimeout(timer);
  }, [stage, prefersReducedMotion]);

  const open = () => {
    if (stage === "sealed") setStage("opening");
  };

  const isUnsealed = stage === "opening" || stage === "letter";
  const isShowingLetter = stage === "letter";

  return (
    <InvitationOpenedProvider value={stage === "open"}>
      {children}
      <AnimatePresence>
        {stage === "writing" && <NameLoadingScreen key="writing" name={celebrantName} eventTitle={eventTitle} />}
        {(stage === "sealed" || isUnsealed) && (
          <motion.div
            key="envelope"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4"
            style={{ background: BACKDROP }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.9, ease: EASE_ELEGANT }}
          >
            <motion.div className="absolute left-0 top-0 w-[66vw] max-w-[26rem] md:w-[34vw]" initial={{ opacity: 0, x: -28, y: -28 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 1.4, ease: EASE_ELEGANT }}>
              <SakuraBranch petals="cream" className="w-full" />
            </motion.div>
            <motion.div className="absolute bottom-0 right-0 w-[58vw] max-w-[26rem] md:w-[34vw]" initial={{ opacity: 0, x: 28, y: 28 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 1.4, ease: EASE_ELEGANT }}>
              <SakuraBranch petals="cream" className="w-full rotate-180" />
            </motion.div>

            <motion.div
              className="relative mb-8 text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: isUnsealed ? 0 : 1, y: isUnsealed ? -14 : 0 }}
              transition={{ duration: isUnsealed ? 0.5 : 1, ease: EASE_ELEGANT }}
            >
              {guest && <p className="eyebrow mb-3 text-soft-ink">Dear {guest.name}</p>}
              <p className="font-script text-5xl text-umber md:text-6xl">You Are Cordially Invited</p>
              <p className="eyebrow mt-4 text-[0.65rem] text-soft-ink">{eventTitle}</p>
            </motion.div>

            <motion.div className="relative" initial={{ opacity: 0, y: 46, rotate: -2 }} animate={{ opacity: isShowingLetter ? 0 : 1, y: isShowingLetter ? 150 : 0, rotate: 0 }} transition={{ duration: isShowingLetter ? 0.8 : 1.2, delay: isShowingLetter ? 0 : 0.25, ease: EASE_ELEGANT }}>
              <Envelope3D monogram={monogram} celebrantName={celebrantName} eventTitle={eventTitle} isOpening={isUnsealed} onOpen={open} />
            </motion.div>

            <motion.p
              className="eyebrow relative mt-16 text-[0.65rem] text-soft-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: isUnsealed ? 0 : 1 }}
              transition={{ duration: isUnsealed ? 0.4 : 0.9, delay: isUnsealed ? 0 : 0.9 }}
            >
              Tap the envelope to open
            </motion.p>

            {isShowingLetter && <InvitationLetter settings={settings} guest={guest} isRsvpOpen={isRsvpOpen} isPreview={isPreview} onContinue={() => setStage("writing")} />}
          </motion.div>
        )}
      </AnimatePresence>
    </InvitationOpenedProvider>
  );
}
