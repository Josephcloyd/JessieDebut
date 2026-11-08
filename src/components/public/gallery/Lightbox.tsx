"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryPhoto } from "@/lib/types";
import { GalleryImage } from "./GalleryImage";
import { useSwipe } from "./useSwipe";

interface LightboxProps {
  photos: GalleryPhoto[];
  startIndex: number;
  onClose: () => void;
}

const ROUND_BUTTON = "flex size-12 items-center justify-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/25";

export function Lightbox({ photos, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;
  const previous = () => setIndex((value) => (value - 1 + count) % count);
  const next = () => setIndex((value) => (value + 1) % count);
  const swipe = useSwipe(previous, next);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + count) % count);
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = scrollLock;
      opener?.focus();
    };
  }, [count, onClose]);

  const photo = photos[index];

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen photo viewer"
      className="fixed inset-0 z-[60] flex flex-col bg-[#2a171b]/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...swipe}
    >
      <div className="flex items-center justify-between p-3 text-ivory">
        <p className="eyebrow pl-2 text-[0.62rem]">{index + 1} / {count}</p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo viewer" className={ROUND_BUTTON}>
          <X className="size-5" strokeWidth={1.4} />
        </button>
      </div>
      <div className="relative flex-1">
        <AnimatePresence initial={false}>
          <motion.div key={photo.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <GalleryImage photo={photo} sizes="100vw" fit="contain" />
          </motion.div>
        </AnimatePresence>
        {count > 1 && (
          <>
            <button type="button" onClick={previous} aria-label="Previous photo" className={`${ROUND_BUTTON} absolute left-3 top-1/2 -translate-y-1/2`}>
              <ChevronLeft className="size-6" strokeWidth={1.2} />
            </button>
            <button type="button" onClick={next} aria-label="Next photo" className={`${ROUND_BUTTON} absolute right-3 top-1/2 -translate-y-1/2`}>
              <ChevronRight className="size-6" strokeWidth={1.2} />
            </button>
          </>
        )}
      </div>
      <p className="min-h-16 px-6 py-4 text-center font-display text-xl italic text-ivory">{photo.caption}</p>
    </motion.div>,
    document.body,
  );
}
