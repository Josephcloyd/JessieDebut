"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import type { ContentsEntry } from "@/lib/domain/contents";
import { formatCoverDate, formatEventDate, formatEventTime } from "@/lib/domain/time";
import type { EventSettings } from "@/lib/types";
import { ContentsList } from "./ContentsList";
import { Countdown } from "./Countdown";
import { EASE_ELEGANT, useInvitationOpened } from "./motion-helpers";

const PHOTO_SIZES = "(min-width: 768px) 50vw, 100vw";

interface PhotoLayerProps {
  src: string;
  alt: string;
  position: string;
  shift: MotionValue<string>;
  isOpened: boolean;
  isPriority?: boolean;
}

/** The photo and its cutout both use this, so the two stay perfectly aligned. */
function PhotoLayer({ src, alt, position, shift, isOpened, isPriority }: PhotoLayerProps) {
  return (
    <motion.div className="absolute inset-x-0 top-0 h-[116%] md:h-[128%]" style={{ y: shift }}>
      <motion.div className="absolute inset-0" initial={{ scale: 1.05 }} animate={{ scale: isOpened ? 1 : 1.05 }} transition={{ duration: 2.4, ease: EASE_ELEGANT }}>
        <Image src={src} alt={alt} fill priority={isPriority} sizes={PHOTO_SIZES} className="object-cover" style={{ objectPosition: position }} />
      </motion.div>
    </motion.div>
  );
}

function EventFacts({ settings, tone }: { settings: EventSettings; tone: "dark" | "light" }) {
  return (
    <>
      <p className="eyebrow leading-loose">
        {formatEventDate(settings.event_at)}, {formatEventTime(settings.event_at)}
        {settings.venue_name && <span className="block">{settings.venue_name}</span>}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
        <Countdown target={settings.event_at} celebrantName={settings.celebrant_name} tone={tone} size="compact" />
        {settings.hero_cta && (
          <a href="#rsvp" className={`btn border ${tone === "light" ? "border-ivory text-ivory hover:bg-ivory hover:text-umber" : "border-umber hover:bg-umber hover:text-ivory"}`}>{settings.hero_cta}</a>
        )}
      </div>
    </>
  );
}

interface HeroProps {
  settings: EventSettings;
  contents: ContentsEntry[];
}

export function Hero({ settings, contents }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isOpened = useInvitationOpened();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const shift = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "-10%"]);
  const stage = { opacity: isOpened ? 1 : 0, y: isOpened ? 0 : 16 };
  const mastheadColor = settings.hero_masthead_light ? "text-ivory" : "text-umber";

  return (
    <section ref={sectionRef} className="md:grid md:min-h-svh md:grid-cols-2">
      <div className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-beige md:order-2">
        {settings.hero_image_url && (
          <PhotoLayer src={settings.hero_image_url} alt={`Portrait of ${settings.celebrant_name}`} position={settings.hero_image_position} shift={shift} isOpened={isOpened} isPriority />
        )}
        {settings.hero_image_url && <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-umber/85 to-transparent" aria-hidden="true" />}
        {settings.hero_image_url && settings.hero_masthead_light && <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-umber/70 to-transparent" aria-hidden="true" />}

        <motion.div className={`absolute inset-x-0 top-0 z-10 px-3 pt-5 md:pt-4 ${mastheadColor}`} initial={false} animate={stage} transition={{ duration: 1.1, ease: EASE_ELEGANT, delay: 0.15 }}>
          <p className="eyebrow pl-1 text-[0.58rem]">Issue No. 18</p>
          <h1 className="masthead mt-4 whitespace-nowrap md:mt-1 text-center font-display font-medium uppercase leading-none" style={{ "--letters": Array.from(settings.celebrant_name).length } as CSSProperties}>
            {settings.celebrant_name}
          </h1>
        </motion.div>

        {settings.hero_cutout_url && (
          <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
            <PhotoLayer src={settings.hero_cutout_url} alt="" position={settings.hero_image_position} shift={shift} isOpened={isOpened} />
          </div>
        )}

        <motion.div className="relative z-30 px-5 pb-8 text-ivory md:px-7" initial={false} animate={stage} transition={{ duration: 1.1, ease: EASE_ELEGANT, delay: 0.4 }}>
          <p className="eyebrow text-[0.62rem]">{settings.hero_eyebrow}</p>
          <p className="mt-1 font-display text-5xl italic leading-none md:text-6xl">{settings.event_title}</p>
          <p className="mt-3 max-w-md font-display text-xl leading-snug">{settings.hero_description}</p>
          <div className="mt-5 md:hidden">
            <EventFacts settings={settings} tone="light" />
          </div>
        </motion.div>
      </div>

      <motion.div className="hidden flex-col justify-between bg-ivory p-10 md:order-1 md:flex lg:p-14" initial={false} animate={stage} transition={{ duration: 1.1, ease: EASE_ELEGANT, delay: 0.3 }}>
        <div>
          <p className="eyebrow text-[0.62rem] text-soft-ink">The Debut Issue</p>
          <p className="mt-5 font-display text-[clamp(5rem,11vw,10rem)] font-light leading-none tracking-tight text-umber tabular-nums">{formatCoverDate(settings.event_at)}</p>
        </div>
        <ContentsList contents={contents} heading="In This Issue" />
        <EventFacts settings={settings} tone="dark" />
      </motion.div>
    </section>
  );
}
