"use client";

import { ChevronLeft, ChevronRight, Expand, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/types";
import { GalleryImage } from "./GalleryImage";
import { useSwipe } from "./useSwipe";

interface SlideshowProps {
  photos: GalleryPhoto[];
  autoplay: boolean;
  intervalSeconds: number;
  isPaused: boolean;
  onExpand: (index: number) => void;
}

const CONTROL = "flex size-11 items-center justify-center rounded-full bg-ivory/85 text-umber shadow-card transition-colors hover:bg-gold";
const ICON = { className: "size-5", strokeWidth: 1.3 };

export function Slideshow({ photos, autoplay, intervalSeconds, isPaused, onExpand }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.35 });
  const prefersReducedMotion = useReducedMotion();
  const count = photos.length;
  const previous = () => setIndex((value) => (value - 1 + count) % count);
  const next = () => setIndex((value) => (value + 1) % count);
  const swipe = useSwipe(previous, next);
  const isRunning = isPlaying && isInView && !isPaused && count > 1 && !prefersReducedMotion;

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % count), intervalSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [isRunning, index, intervalSeconds, count]);

  const photo = photos[index];

  return (
    <div ref={rootRef} className="lg:grid lg:grid-cols-[1fr_17rem] lg:gap-10">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-umber sm:aspect-[16/10]" {...swipe}>
          <AnimatePresence initial={false}>
            <motion.div key={photo.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 1.2, ease: "easeOut" }}>
              <GalleryImage photo={photo} sizes="(min-width: 1024px) 860px, 100vw" fit="contain" priority={index === 0} />
            </motion.div>
          </AnimatePresence>

          <div className="absolute right-4 top-4 z-10">
            <button type="button" onClick={() => onExpand(index)} aria-label="View photo full screen" className={CONTROL}><Expand {...ICON} /></button>
          </div>
          {count > 1 && (
            <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-center gap-3">
              <button type="button" onClick={previous} aria-label="Previous photo" className={CONTROL}><ChevronLeft {...ICON} /></button>
              <button type="button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"} className={CONTROL}>
                {isPlaying ? <Pause {...ICON} /> : <Play {...ICON} />}
              </button>
              <button type="button" onClick={next} aria-label="Next photo" className={CONTROL}><ChevronRight {...ICON} /></button>
            </div>
          )}
        </div>
        {count > 1 && (
          <div className="mt-3 h-px w-full bg-gold/60" aria-hidden="true">
            <motion.div
              key={`${photo.id}-${isRunning}`}
              className="h-px origin-left bg-umber"
              initial={{ scaleX: isRunning ? 0 : (index + 1) / count }}
              animate={{ scaleX: isRunning ? 1 : (index + 1) / count }}
              transition={isRunning ? { duration: intervalSeconds, ease: "linear" } : { duration: 0.3 }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 lg:mt-0 lg:flex lg:flex-col">
        <p className="numerals text-5xl leading-none lg:text-7xl">{index + 1}<span className="text-2xl text-soft-ink lg:text-3xl"> / {count}</span></p>
        <motion.p key={`caption-${photo.id}`} className="mt-3 min-h-7 font-display text-2xl italic leading-snug text-soft-ink" aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>{photo.caption}</motion.p>
        {count > 1 && (
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-auto lg:grid lg:max-h-80 lg:grid-cols-3 lg:overflow-y-auto">
            {photos.map((thumb, thumbIndex) => (
              <button key={thumb.id} type="button" onClick={() => setIndex(thumbIndex)} aria-label={`Show photo ${thumbIndex + 1}`} aria-current={thumbIndex === index} className={`relative aspect-square w-20 shrink-0 overflow-hidden border transition-opacity lg:w-auto ${thumbIndex === index ? "border-umber opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <GalleryImage photo={thumb} sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
