"use client";

import { Check, Menu, Music, Pause, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  ["#about", "About"], ["#details", "Details"], ["#gallery", "Gallery"], ["#traditions", "The Eighteen"],
  ["#program", "Program"], ["#rsvp", "RSVP"], ["#wishes", "Wishes"],
] as const;

const ROUND = "flex size-12 items-center justify-center rounded-full border border-champagne bg-ivory/90 text-umber shadow-card backdrop-blur-sm transition-colors hover:bg-white";
const ICON = { className: "size-5", strokeWidth: 1.3 };

export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} aria-label="Open menu" aria-expanded={isOpen} className={`${ROUND} fixed right-4 top-4 z-40`}>
        <Menu {...ICON} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.nav aria-label="Invitation sections" className="linen fixed inset-0 z-[45] flex flex-col items-center justify-center gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close menu" className={`${ROUND} absolute right-4 top-4`}><X {...ICON} /></button>
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setIsOpen(false)} className="font-display text-4xl transition-colors hover:text-soft-ink">{label}</a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

const COPIED_NOTICE_MS = 2000;

export function ShareButton({ title }: { title: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const share = async () => {
    // Always the general address, so a guest never forwards their personal link by accident.
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), COPIED_NOTICE_MS);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.prompt("Copy this link to share the invitation:", url);
    }
  };

  return (
    <button type="button" onClick={share} aria-label={isCopied ? "Link copied" : "Share invitation"} className={ROUND}>
      {isCopied ? <Check {...ICON} /> : <Share2 {...ICON} />}
    </button>
  );
}

const BARS = [0, 0.15, 0.3];

export function MusicToggle({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = async () => {
    // Created on first press so nothing downloads for guests who never play it.
    audioRef.current ??= Object.assign(new Audio(src), { loop: true, preload: "none", volume: 0.55 });
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setHasFailed(false);
    } catch (error) {
      console.error("[music]", error);
      setHasFailed(true);
    }
  };

  const label = hasFailed ? "Music could not play. Try again." : isPlaying ? `Pause ${title || "music"}` : `Play ${title || "music"}`;

  return (
    <button type="button" onClick={toggle} aria-label={label} aria-pressed={isPlaying} title={label} className={ROUND}>
      {isPlaying ? (
        <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
          {BARS.map((delay) => (
            <motion.span key={delay} className="w-[2px] origin-bottom bg-umber" style={{ height: 16 }} animate={{ scaleY: [0.35, 1, 0.5] }} transition={{ duration: 1.1, repeat: Infinity, repeatType: "mirror", delay }} />
          ))}
        </span>
      ) : hasFailed ? (
        <Pause {...ICON} />
      ) : (
        <Music {...ICON} />
      )}
    </button>
  );
}
