"use client";

import { useEffect, useRef, useState } from "react";
import { CANDLE_COUNT } from "./candle-layout";
import type { CandleScene } from "./candle-scene";
import { CandlePoster } from "./CandlePoster";

const LOAD_MARGIN = "900px 0px";

/** Asks for WebGL once, then gives the context straight back so the scene can have it. */
function hasWebGl(): boolean {
  try {
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2") ?? probe.getContext("webgl");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
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
    let hasStarted = false;
    let isVisible = false;

    const load = async () => {
      if (hasStarted || !hasWebGl()) return;
      hasStarted = true;
      try {
        const { createCandleScene } = await import("./candle-scene");
        if (isCancelled) return;
        const created = createCandleScene(target);
        const { width, height } = node.getBoundingClientRect();
        created.resize(width, height);
        created.setLit(litRef.current);
        scene.current = created;
        setIsReady(true);
        created.setActive(isVisible && !document.hidden);
      } catch (error) {
        // The poster is already showing, so the guest still sees the candles.
        console.error("[candles]", error);
      }
    };

    const onContextLost = () => setIsReady(false);
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
    target.addEventListener("webglcontextlost", onContextLost);

    return () => {
      isCancelled = true;
      nearObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      target.removeEventListener("webglcontextlost", onContextLost);
      scene.current?.dispose();
      scene.current = null;
      setIsReady(false);
    };
  }, [isStill]);

  const shown = isStill ? CANDLE_COUNT : lit;

  return (
    <div ref={holder} className={`overflow-hidden ${className}`} role="img" aria-label={`${shown} of ${CANDLE_COUNT} candles lit`}>
      <div className={`absolute inset-x-0 bottom-[28%] top-[17%] transition-opacity duration-1000 ${isReady ? "opacity-0" : "opacity-100"}`}>
        <CandlePoster lit={shown} isAnimated={!isStill} />
      </div>
      <canvas ref={canvas} className={`absolute inset-0 size-full transition-opacity duration-1000 ${isReady ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
