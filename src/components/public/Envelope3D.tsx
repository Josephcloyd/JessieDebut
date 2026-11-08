"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, type CSSProperties, type KeyboardEvent } from "react";
import { EASE_ELEGANT } from "./motion-helpers";
import { WaxSeal } from "./ornaments";
import { SakuraCluster } from "./sakura";

const POCKET_BOTTOM = "linear-gradient(to top, #fff8f3, #fff0e8)";
const POCKET_LEFT = "linear-gradient(100deg, #fff6f0, #ffe9df)";
const POCKET_RIGHT = "linear-gradient(260deg, #fff6f0, #ffe9df)";
const FLAP_PAPER = "linear-gradient(to bottom, #fffbf7, #fff4ec)";
const LINER = "#c58b95";
const FOIL = "#e6c594";
const PAPER_EDGE = "#f1d9cc";
const ENVELOPE_SHADOW = "0 34px 60px -30px rgb(77 44 50 / 0.5), 0 8px 18px -10px rgb(77 44 50 / 0.28)";
const SEAM_SHADOW = "drop-shadow(0 -2px 3px rgb(77 44 50 / 0.14))";
const FLAP_SHADOW = "drop-shadow(0 4px 6px rgb(77 44 50 / 0.2))";

// Distances from the back of the envelope, in pixels. The browser sorts the layers by these.
const THICKNESS = 8;
const CARD_DEPTH = 3;
const FLAP_CLOSED_DEPTH = THICKNESS + 2;
const FLAP_OPEN_DEPTH = -3;
const SEAL_DEPTH = THICKNESS + 12;

const IN_3D: CSSProperties = { transformStyle: "preserve-3d" };
const POINTER_TILT = 11;
const SPRING = { stiffness: 70, damping: 18 };

function FoilLine({ d, viewBox }: { d: string; viewBox: string }) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
      <path d={d} stroke={FOIL} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** The four thin sides that make the envelope a solid object. */
function PaperEdges({ hasClosedTop }: { hasClosedTop: boolean }) {
  // The transparent outline smooths the jagged edges browsers draw on 3D planes.
  const edge: CSSProperties = { background: PAPER_EDGE, position: "absolute", outline: "1px solid transparent" };
  return (
    <>
      <div style={{ ...edge, left: 0, top: 0, bottom: 0, width: THICKNESS, transformOrigin: "left", transform: "rotateY(-90deg)" }} />
      <div style={{ ...edge, right: 0, top: 0, bottom: 0, width: THICKNESS, transformOrigin: "right", transform: "rotateY(90deg)" }} />
      <div style={{ ...edge, left: 0, right: 0, bottom: 0, height: THICKNESS, transformOrigin: "bottom", transform: "rotateX(-90deg)" }} />
      {hasClosedTop && <div style={{ ...edge, left: 0, right: 0, top: 0, height: THICKNESS, transformOrigin: "top", transform: "rotateX(90deg)" }} />}
    </>
  );
}

function Pockets() {
  return (
    <div className="absolute inset-0" style={{ transform: `translateZ(${THICKNESS}px)` }}>
      <div className="absolute inset-0" style={{ background: POCKET_LEFT, clipPath: "polygon(0 0, 50% 55%, 0 100%)" }} />
      <div className="absolute inset-0" style={{ background: POCKET_RIGHT, clipPath: "polygon(100% 0, 50% 55%, 100% 100%)" }} />
      <div className="absolute inset-0" style={{ filter: SEAM_SHADOW }}>
        <div className="absolute inset-0" style={{ background: POCKET_BOTTOM, clipPath: "polygon(0 100%, 50% 48%, 100% 100%)" }} />
      </div>
      <FoilLine d="M8 200L150 100 292 200" viewBox="0 0 300 200" />
      <SakuraCluster className="absolute bottom-[4%] left-[3%] w-[24%]" />
      <SakuraCluster className="absolute bottom-[4%] right-[3%] w-[24%] -scale-x-100" />
    </div>
  );
}

interface Envelope3DProps {
  monogram: string;
  celebrantName: string;
  eventTitle: string;
  isOpening: boolean;
  onOpen: () => void;
}

export function Envelope3D({ monogram, celebrantName, eventTitle, isOpening, onOpen }: Envelope3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltY = useSpring(useTransform(pointerX, [-1, 1], [-POINTER_TILT, POINTER_TILT]), SPRING);
  const tiltX = useSpring(useTransform(pointerY, [-1, 1], [POINTER_TILT, -POINTER_TILT]), SPRING);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const follow = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [prefersReducedMotion, pointerX, pointerY]);

  const openFromKeyboard = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Open Your Invitation"
      aria-disabled={isOpening}
      onClick={onOpen}
      onKeyDown={openFromKeyboard}
      className="relative aspect-[3/2] w-[min(84vw,30rem)] cursor-pointer"
      style={{ perspective: 1100 }}
      animate={{ y: isOpening ? 40 : 0 }}
      transition={{ duration: 0.9, ease: EASE_ELEGANT }}
    >
      <div className="absolute inset-x-[10%] -bottom-12 h-16 rounded-full bg-umber/25 blur-2xl" aria-hidden="true" />

      <motion.div
        className="absolute inset-0"
        style={IN_3D}
        initial={{ rotateX: 14, rotateY: -12 }}
        animate={isOpening ? { rotateX: 0, rotateY: 0 } : { rotateX: [14, 9, 14], rotateY: [-12, -5, -12] }}
        transition={isOpening ? { duration: 0.7, ease: EASE_ELEGANT } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div className="absolute inset-0" style={{ ...IN_3D, rotateX: isOpening ? 0 : tiltX, rotateY: isOpening ? 0 : tiltY }}>
          <div className="absolute inset-0 overflow-hidden rounded-[2px]" style={{ background: LINER, boxShadow: ENVELOPE_SHADOW }}>
            <SakuraCluster className="absolute left-[6%] top-[3%] w-[34%]" />
            <SakuraCluster className="absolute right-[6%] top-[3%] w-[34%] -scale-x-100" />
          </div>

          <PaperEdges hasClosedTop={!isOpening} />

          {/* The card stays behind the front pockets, so it slides out from inside. */}
          <motion.div
            className="absolute inset-x-[6%] bottom-[4%] top-[6%] flex flex-col items-center justify-center bg-ivory text-center"
            initial={{ z: CARD_DEPTH, y: "0%" }}
            animate={{ z: CARD_DEPTH, y: isOpening ? "-45%" : "0%" }}
            transition={{ duration: 1.1, delay: 1.05, ease: EASE_ELEGANT }}
          >
            <div className="absolute inset-2 border border-champagne" />
            <p className="eyebrow text-[0.55rem] text-soft-ink">The Celebration of</p>
            <p className="mt-1 font-display text-3xl tracking-wide md:text-4xl">{celebrantName}</p>
            <p className="font-script text-2xl text-soft-ink">{eventTitle}</p>
          </motion.div>

          <Pockets />

          <motion.div
            className="absolute inset-x-0 top-0 h-[60%] origin-top"
            style={{ filter: FLAP_SHADOW }}
            initial={{ rotateX: 0, z: FLAP_CLOSED_DEPTH }}
            animate={isOpening ? { rotateX: 180, z: FLAP_OPEN_DEPTH } : { rotateX: 0, z: FLAP_CLOSED_DEPTH }}
            transition={{ rotateX: { duration: 0.75, delay: 0.35, ease: EASE_ELEGANT }, z: { duration: 0, delay: 1.05 } }}
          >
            <div className="absolute inset-0" style={{ background: FLAP_PAPER, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}>
              <FoilLine d="M12 0L150 112 288 0" viewBox="0 0 300 120" />
            </div>
          </motion.div>

          <motion.div
            className="absolute left-[40%] top-[47%] w-[20%]"
            initial={{ z: SEAL_DEPTH }}
            animate={isOpening ? { z: SEAL_DEPTH, scale: 1.25, opacity: 0, rotate: -14 } : { z: SEAL_DEPTH, scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.45, ease: EASE_ELEGANT }}
          >
            <WaxSeal letters={monogram} className="w-full drop-shadow-md" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
