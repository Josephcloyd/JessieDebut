"use client";

import { useEffect, useState, type RefObject } from "react";
import { CANDLE_COUNT } from "./candle-layout";

/** Share of the pinned scroll at which the last candle lights, leaving a held moment after. */
const ALL_LIT_AT = 0.88;

/** Lights the candles in step with how far the guest has scrolled through the pinned ceremony. */
export function useLitCount(track: RefObject<HTMLElement | null>, isEnabled: boolean): number {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!isEnabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const node = track.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 1;
      setLit(Math.min(CANDLE_COUNT, Math.floor((progress / ALL_LIT_AT) * CANDLE_COUNT)));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [track, isEnabled]);

  return lit;
}
