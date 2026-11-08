"use client";

import { useEffect, useState, type RefObject } from "react";
import { CANDLE_COUNT } from "./candle-layout";

const DESKTOP_QUERY = "(min-width: 1024px)";
const DESKTOP_LINE = 0.6;
const PHONE_LINE_OFFSET = 150;

/**
 * Counts how many of the first eighteen rows have scrolled past a reading line,
 * so each number in the list lights its candle as the guest reaches it.
 */
export function useLitCount(list: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>, isEnabled: boolean): number {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!isEnabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rows = list.current?.querySelectorAll("li");
      if (!rows) return;
      const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
      const stageBottom = stage.current?.getBoundingClientRect().bottom ?? 0;
      const line = isDesktop ? window.innerHeight * DESKTOP_LINE : stageBottom + PHONE_LINE_OFFSET;
      let count = 0;
      for (let index = 0; index < Math.min(rows.length, CANDLE_COUNT); index += 1) {
        if (rows[index].getBoundingClientRect().top < line) count = index + 1;
      }
      setLit(count);
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
  }, [list, stage, isEnabled]);

  return lit;
}
