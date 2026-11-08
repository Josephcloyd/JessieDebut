"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

const CENTER_X = 320;
const CENTER_Y = 210;
const RADIUS_X = 292;
const RADIUS_Y = 188;
const BRANCH_START = 98;
const BRANCH_SWEEP = 160;
const LEAF_COUNT = 9;
const BLOSSOM_STOPS = [0.14, 0.5, 0.86];
const PETALS = 5;
const WRITE_SECONDS = 2.2;
const FERN = "#4d2c32";
const GOLD = "#c58b95";
const CHAMPAGNE = "#ffd2d7";
const INK = "#4d2c32";

const round = (value: number) => Math.round(value * 10) / 10;

function pointAt(progress: number): { x: number; y: number; angle: number } {
  const degrees = BRANCH_START + progress * BRANCH_SWEEP;
  const radians = (degrees * Math.PI) / 180;
  return {
    x: round(CENTER_X + RADIUS_X * Math.cos(radians)),
    y: round(CENTER_Y + RADIUS_Y * Math.sin(radians)),
    angle: degrees + 90,
  };
}

function buildPetals(size: number): string {
  const rotate = (x: number, y: number, turns: number) => {
    const radians = (turns * 2 * Math.PI) / PETALS;
    return `${round(size * (x * Math.cos(radians) - y * Math.sin(radians)))} ${round(size * (x * Math.sin(radians) + y * Math.cos(radians)))}`;
  };
  return Array.from({ length: PETALS }, (_, turn) =>
    `M0 0C${rotate(-9, -8, turn)} ${rotate(-9, -20, turn)} ${rotate(0, -24, turn)}C${rotate(9, -20, turn)} ${rotate(9, -8, turn)} 0 0Z`,
  ).join("");
}

const LARGE_BLOSSOM = buildPetals(1);
const SMALL_BLOSSOM = buildPetals(0.72);
const LEAF = "M0 0C6-9 18-10 26-3 18 4 7 5 0 0Z";
const start = pointAt(0);
const end = pointAt(1);
const STEM = `M${start.x} ${start.y}A${RADIUS_X} ${RADIUS_Y} 0 0 1 ${end.x} ${end.y}`;
const LEAVES = Array.from({ length: LEAF_COUNT }, (_, index) => pointAt((index + 0.5) / LEAF_COUNT));

interface DrawProps {
  isStill: boolean;
  delay: number;
}

const drawn = ({ isStill, delay }: DrawProps) => ({
  initial: isStill ? (false as const) : { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 0.75, delay, ease: "easeOut" as const },
});

function Blossom({ x, y, large, isStill, delay }: DrawProps & { x: number; y: number; large: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.path d={large ? LARGE_BLOSSOM : SMALL_BLOSSOM} stroke={GOLD} strokeWidth="1" fill={CHAMPAGNE} fillOpacity="0.9" {...drawn({ isStill, delay })} />
      <circle r={large ? 2.6 : 2} fill={GOLD} />
    </g>
  );
}

function Branch({ isStill }: { isStill: boolean }) {
  return (
    <g fill="none">
      <motion.path d={STEM} stroke={FERN} strokeWidth="1.1" strokeLinecap="round" {...drawn({ isStill, delay: 0 })} transition={{ duration: 1.5, ease: "easeInOut" }} />
      {LEAVES.map((leaf, index) => (
        <g key={leaf.angle}>
          {[-40, 40].map((spread) => (
            <g key={spread} transform={`translate(${leaf.x} ${leaf.y}) rotate(${round(leaf.angle + spread)})`}>
              <motion.path d={LEAF} stroke={FERN} strokeWidth="0.9" {...drawn({ isStill, delay: 0.15 + index * 0.11 })} />
            </g>
          ))}
        </g>
      ))}
      {BLOSSOM_STOPS.map((stop, index) => {
        const point = pointAt(stop);
        return <Blossom key={stop} x={point.x} y={point.y} large={index === 1} isStill={isStill} delay={0.5 + stop * 1.1} />;
      })}
    </g>
  );
}

interface NameLoadingScreenProps {
  name: string;
  eventTitle: string;
}

/** Her name writes itself inside a hand-drawn wreath while the cover gets ready. */
export function NameLoadingScreen({ name, eventTitle }: NameLoadingScreenProps) {
  const isStill = Boolean(useReducedMotion());
  const maskId = `name-ink-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fontSize = Math.min(112, Math.round(900 / Math.max(Array.from(name).length, 1)));
  const textProps = {
    x: CENTER_X,
    y: 228,
    textAnchor: "middle" as const,
    fontFamily: "var(--font-pinyon), cursive",
    fontSize,
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ivory px-3"
      role="status"
      aria-label={`Opening ${name}'s invitation`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 640 420" className="w-full max-w-2xl" aria-hidden="true">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="420">
            <motion.rect
              x="0"
              y="0"
              height="420"
              fill="white"
              initial={isStill ? false : { width: 40 }}
              animate={{ width: 640 }}
              transition={{ duration: WRITE_SECONDS, delay: 0.35, ease: [0.4, 0.1, 0.5, 0.95] }}
            />
          </mask>
        </defs>

        <Branch isStill={isStill} />
        <g transform="translate(640 0) scale(-1 1)">
          <Branch isStill={isStill} />
        </g>
        <Blossom x={CENTER_X} y={CENTER_Y + RADIUS_Y} large isStill={isStill} delay={0.25} />

        <g mask={`url(#${maskId})`}>
          <motion.text
            {...textProps}
            fill="none"
            stroke={INK}
            strokeWidth="0.9"
            strokeDasharray="900"
            initial={isStill ? false : { strokeDashoffset: 900 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: WRITE_SECONDS + 0.2, delay: 0.35, ease: "easeInOut" }}
          >
            {name}
          </motion.text>
          <motion.text
            {...textProps}
            fill={INK}
            initial={isStill ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 1.5, ease: "easeIn" }}
          >
            {name}
          </motion.text>
        </g>

        <motion.text
          x={CENTER_X}
          y="284"
          textAnchor="middle"
          fontFamily="var(--font-manrope), sans-serif"
          fontSize="13"
          letterSpacing="5"
          fontWeight="600"
          fill="#6e4a51"
          initial={isStill ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.5 }}
        >
          {eventTitle.toUpperCase()}
        </motion.text>
      </svg>
    </motion.div>
  );
}
