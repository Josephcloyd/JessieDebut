"use client";

import { useEffect, useRef, useState } from "react";
import { CANDLE_COUNT, candleRows } from "./candle-layout";
import type { CandleScene } from "./candle-scene";
import { CandlePoster } from "./CandlePoster";

const LOAD_MARGIN = "900px 0px";
/** Softens the scene edges so the light fades into the section instead of ending in a box. */
const FEATHER = "[mask-image:radial-gradient(ellipse_closest-side,#000_72%,transparent)] [-webkit-mask-image:radial-gradient(ellipse_closest-side,#000_72%,transparent)]";

function hasWebGl(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
  } catch {
    return false;
  }
}

interface CandleStageProps {
  lit: number;
  /** True when the visitor prefers reduced motion: shows the still, fully lit picture. */
  isStill: boolean;
  className?: string;
}

/** Eighteen candles in 3D. three.js loads only when the section nears the screen. */
export function CandleStage({ lit, isStill, className = "" }: CandleStageProps) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<CandleScene | null>(null);
  const litRef = useRef(lit);
  const [isReady, setIsReady] = useState(false);
  const [rows, setRows] = useState(2);

  useEffect(() => {
    litRef.current = lit;
    scene.current?.setLit(lit);
  }, [lit]);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width < 2 || height < 2) return;
      setRows(candleRows(width / height));
      scene.current?.resize(width, height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = holder.current;
    const target = canvas.current;
    if (!node || !target || isStill) return;
    let isCancelled = false;
    let isLoading = false;
    let isVisible = false;

    const load = async () => {
      if (isLoading || scene.current || !hasWebGl()) return;
      isLoading = true;
      try {
        const { createCandleScene } = await import("./candle-scene");
        if (isCancelled) return;
        const created = createCandleScene(target);
        const { width, height } = node.getBoundingClientRect();
        created.resize(width, height);
        created.setLit(litRef.current);
        scene.current = created;
        setIsReady(true);
        created.setActive(isVisible);
      } catch {
        isLoading = false;
      }
    };

    const nearObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void load();
    }, { rootMargin: LOAD_MARGIN });
    const viewObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      scene.current?.setActive(isVisible && !document.hidden);
    });
    const onVisibility = () => scene.current?.setActive(isVisible && !document.hidden);
    nearObserver.observe(node);
    viewObserver.observe(node);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isCancelled = true;
      nearObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scene.current?.dispose();
      scene.current = null;
      setIsReady(false);
    };
  }, [isStill]);

  const shown = isStill ? CANDLE_COUNT : lit;
  const isFull = shown >= CANDLE_COUNT;

  return (
    <div ref={holder} className={`relative overflow-hidden ${className}`} role="img" aria-label={`${shown} of ${CANDLE_COUNT} candles lit`}>
      <div className={`absolute inset-0 transition-opacity duration-1000 ${FEATHER} ${isReady ? "opacity-0" : "opacity-100"}`}>
        <CandlePoster lit={shown} rows={rows} isAnimated={!isStill} />
      </div>
      <canvas ref={canvas} className={`absolute inset-0 size-full transition-opacity duration-1000 ${FEATHER} ${isReady ? "opacity-100" : "opacity-0"}`} />
      <p className="pointer-events-none absolute bottom-3 left-4 flex items-baseline gap-2 text-[#FFF9F4] md:bottom-6 md:left-6" aria-hidden="true">
        <span className={`font-display text-6xl font-light leading-none tabular-nums transition-colors duration-700 md:text-8xl ${isFull ? "text-[#E6C594]" : "text-[#FFF9F4]"}`} style={isFull ? { textShadow: "0 0 32px rgb(230 197 148 / 0.7)" } : undefined}>
          {String(shown).padStart(2, "0")}
        </span>
        <span className="eyebrow text-[0.58rem] text-[#FFD2D7]">{isFull ? "All aglow" : `of ${CANDLE_COUNT} lit`}</span>
      </p>
    </div>
  );
}
