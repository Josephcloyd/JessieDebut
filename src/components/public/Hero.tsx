"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { formatCoverDate, formatEventDate, formatEventTime } from "@/lib/domain/time";
import type { EventSettings } from "@/lib/types";
import { usePrefersStill } from "./candles/usePrefersStill";
import { EASE_ELEGANT, useInvitationOpened } from "./motion-helpers";
import { SakuraBranch } from "./sakura";

const DOORS_SHUT = "inset(0 50% 0 50%)";
const DOORS_OPEN = "inset(0 0% 0 0%)";
const ARCH_PATH = "M0 100V34A50 34 0 0 1 100 34V100";

/** Her portrait inside the window arch. Text never sits on the photo, whatever its composition. */
function PortraitArch({ settings, isOpened, isStill }: { settings: EventSettings; isOpened: boolean; isStill: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start start", "end start"] });
  const shift = useTransform(scrollYProgress, [0, 1], ["0%", isStill ? "0%" : "-9%"]);
  const isShown = isOpened || isStill;

  return (
    <div ref={frameRef} className="relative mx-auto mt-5 h-[52svh] min-h-[21rem] w-full md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:h-auto">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute -left-2 -top-2 h-[calc(100%+0.5rem)] w-[calc(100%+1rem)] overflow-visible" aria-hidden="true">
        <motion.path d={ARCH_PATH} fill="none" stroke="var(--color-gold)" strokeWidth="0.3" initial={false} animate={{ pathLength: isShown ? 1 : 0, opacity: isShown ? 1 : 0 }} transition={{ duration: isStill ? 0 : 2.2, ease: EASE_ELEGANT, delay: isStill ? 0 : 0.7 }} />
      </svg>
      <motion.div className="arch relative size-full overflow-hidden bg-beige" initial={false} animate={{ clipPath: isShown ? DOORS_OPEN : DOORS_SHUT }} transition={{ duration: isStill ? 0 : 1.7, ease: EASE_ELEGANT, delay: isStill ? 0 : 0.2 }}>
        {settings.hero_image_url && (
          <motion.div className="absolute inset-x-0 top-0 h-[112%]" style={{ y: shift }}>
            <motion.div className="absolute inset-0" initial={false} animate={{ scale: isShown ? 1 : 1.08 }} transition={{ duration: 2.6, ease: EASE_ELEGANT }}>
              <Image src={settings.hero_image_url} alt={`Portrait of ${settings.celebrant_name}`} fill priority sizes="(min-width: 768px) 42vw, 100vw" className="object-cover" style={{ objectPosition: settings.hero_image_position }} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export function Hero({ settings }: { settings: EventSettings }) {
  const isOpened = useInvitationOpened();
  const isStill = usePrefersStill();
  const stage = { opacity: isOpened ? 1 : 0, y: isOpened ? 0 : 16 };

  return (
    <section className="relative overflow-hidden px-4 pt-6 md:grid md:min-h-svh md:grid-cols-[7fr_5fr] md:grid-rows-[1fr_auto] md:gap-x-10 md:px-10 md:pt-10 lg:gap-x-16 lg:px-14">
      <SakuraBranch className="absolute left-0 top-0 hidden w-[23vw] md:block" />

      <p className="pointer-events-none absolute left-[calc((100%-5rem)*0.583-11.5rem)] top-[5svh] hidden text-right md:block" aria-hidden="true">
        <span className="numerals block text-[clamp(8rem,15vw,14rem)] leading-[0.9] text-gold">18</span>
        <span className="font-display text-xl italic text-soft-ink">The Debut Issue</span>
      </p>

      <motion.div className="relative pr-14 md:col-start-1 md:row-start-1 md:self-end md:pr-0" initial={false} animate={stage} transition={{ duration: 1.1, ease: EASE_ELEGANT, delay: 0.15 }}>
        <p className="font-display text-xl italic text-soft-ink md:text-2xl">{settings.hero_eyebrow}</p>
        <h1 className="masthead -ml-1 mt-1 whitespace-nowrap font-display font-medium uppercase leading-none text-umber" style={{ "--letters": Array.from(settings.celebrant_name).length } as CSSProperties}>
          {settings.celebrant_name}
        </h1>
      </motion.div>

      <PortraitArch settings={settings} isOpened={isOpened} isStill={isStill} />

      <motion.div className="relative py-7 md:col-start-1 md:row-start-2 md:pb-12 md:pt-8" initial={false} animate={stage} transition={{ duration: 1.1, ease: EASE_ELEGANT, delay: 0.45 }}>
        <p className="font-display text-5xl italic leading-none md:text-7xl">{settings.event_title}</p>
        <p className="mt-3 max-w-md font-display text-xl leading-snug text-soft-ink md:text-2xl">{settings.hero_description}</p>
        <div className="mt-6 flex flex-col gap-5 border-t border-umber/20 pt-5 md:mt-9 md:flex-row md:items-center md:justify-between md:pt-6">
          <div className="flex items-baseline gap-4 md:gap-6">
            <p className="numerals text-4xl leading-none text-umber md:text-6xl">{formatCoverDate(settings.event_at)}</p>
            <p className="text-sm leading-snug text-soft-ink">
              {formatEventDate(settings.event_at)}, {formatEventTime(settings.event_at)}
              {settings.venue_name && <span className="block">{settings.venue_name}</span>}
            </p>
          </div>
          {settings.hero_cta && <a href="#rsvp" className="btn btn-solid shrink-0">{settings.hero_cta}</a>}
        </div>
      </motion.div>
    </section>
  );
}
