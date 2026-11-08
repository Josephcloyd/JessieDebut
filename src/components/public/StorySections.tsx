"use client";

import { MapPin, Navigation } from "lucide-react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { formatCoverDate, formatEventDate, formatEventTime } from "@/lib/domain/time";
import type { EventSettings } from "@/lib/types";
import Image from "next/image";
import { Countdown } from "./Countdown";
import { EASE_ELEGANT, Reveal } from "./motion-helpers";
import { SakuraBranch } from "./sakura";

interface SectionProps {
  settings: EventSettings;
}

export function Welcome({ settings }: SectionProps) {
  return (
    <section id="welcome" className="relative overflow-hidden px-6 pb-20 pt-28 md:pb-32 md:pt-44">
      <SakuraBranch className="absolute right-0 top-0 w-36 -scale-x-100 md:w-[26rem]" />
      <Reveal className="relative mx-auto max-w-4xl text-center">
        <h2 className="font-script text-5xl leading-tight md:text-7xl">{settings.welcome_heading}</h2>
        <p className="mt-6 whitespace-pre-line text-balance font-display text-[1.9rem] font-light leading-[1.2] md:mt-8 md:text-6xl md:leading-[1.14]">{settings.welcome_message}</p>
      </Reveal>
    </section>
  );
}

/** When About reuses the cover photo, zoom in close around her rather than the gazebo above. */
const COVER_PHOTO_CROP: CSSProperties = { objectPosition: "50% 58%", transform: "scale(2)", transformOrigin: "50% 58%" };

export function About({ settings }: SectionProps) {
  const portrait = settings.about_image_url ?? settings.hero_image_url;

  return (
    <section id="about" className="relative overflow-hidden pb-20 md:pb-28">
      <div className="absolute inset-x-0 top-0 h-72 bg-beige md:inset-y-0 md:right-auto md:h-auto md:w-[38%]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pt-14 md:grid-cols-[5fr_6fr] md:gap-20 md:pt-24">
        <Reveal className="relative mx-auto w-[74%] md:w-full">
          <div className="absolute -inset-3 rounded-[50%] border border-gold md:-inset-4" aria-hidden="true" />
          <div className="relative aspect-[3/4] overflow-hidden rounded-[50%] bg-beige">
            {portrait && <Image src={portrait} alt={`Portrait of ${settings.celebrant_name}`} fill sizes="(min-width: 768px) 70vw, 150vw" className="object-cover" style={settings.about_image_url ? { objectPosition: "50% 50%" } : COVER_PHOTO_CROP} />}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-5xl font-light leading-[1.02] md:text-7xl">{settings.about_title}</h2>
          <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-soft-ink">{settings.about_bio}</p>
          {settings.about_message && <p className="mt-7 max-w-xl whitespace-pre-line border-l border-gold pl-5 font-display text-3xl italic leading-tight">{settings.about_message}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function CountdownSection({ settings }: SectionProps) {
  return (
    <section className="bg-umber px-6 py-16 text-ivory md:px-14 md:py-24">
      <Reveal className="mx-auto max-w-6xl">
        <Countdown target={settings.event_at} celebrantName={settings.celebrant_name} label="Until the evening" />
      </Reveal>
    </section>
  );
}

/** The invitation as a folded card: the left leaf swings open when it comes into view. */
export function EventDetails({ settings }: SectionProps) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${settings.venue_name}, ${settings.venue_address}`)}`;
  const notes = [["Reception", settings.reception_info], ["Attire", settings.dress_code], ["Kindly Note", settings.special_instructions]];

  return (
    <section id="details" className="relative overflow-hidden bg-beige px-5 py-20 md:py-28">
      <SakuraBranch petals="cream" className="absolute left-0 top-0 hidden w-80 lg:block" />
      <h2 className="relative text-center font-display text-5xl font-light leading-none md:text-7xl">The Invitation</h2>
      <div className="relative mx-auto mt-10 grid max-w-5xl md:mt-14 md:grid-cols-[2fr_3fr]" style={{ perspective: "1600px" }}>
        <motion.div
          className="flex flex-col justify-center bg-umber px-8 py-12 text-center text-ivory md:px-10"
          style={{ transformOrigin: "right center" }}
          initial={{ rotateY: -72 }}
          whileInView={{ rotateY: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.5, ease: EASE_ELEGANT }}
        >
          {settings.invitation_hosts && <p className="font-display text-2xl italic leading-snug">{settings.invitation_hosts}</p>}
          <p className="mx-auto mt-3 max-w-xs font-display text-xl leading-snug text-beige">{settings.invitation_request}</p>
          <p className="mt-7 font-script text-6xl leading-none text-gold md:text-7xl">{settings.celebrant_name}</p>
        </motion.div>
        <div className="bg-ivory px-7 py-12 text-center shadow-soft md:px-14 md:py-14 md:text-left">
          <p className="numerals text-[clamp(4rem,14vw,7.5rem)] leading-none">{formatCoverDate(settings.event_at)}</p>
          <p className="mt-3 font-display text-2xl leading-snug">{formatEventDate(settings.event_at)}, {formatEventTime(settings.event_at)}</p>
          <p className="mt-6 font-display text-3xl italic">{settings.venue_name}</p>
          <p className="mt-1 max-w-sm leading-relaxed text-soft-ink md:mx-0">{settings.venue_address}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {settings.maps_url && <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="btn btn-solid"><MapPin className="size-4" strokeWidth={1.5} /> View Location</a>}
            <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-line"><Navigation className="size-4" strokeWidth={1.5} /> Get Directions</a>
          </div>
        </div>
      </div>
      <Reveal className="relative mx-auto mt-10 max-w-5xl">
        <dl className="grid gap-5 md:grid-cols-3 md:gap-10">
          {notes.map(([term, text]) => (
            <div key={term}>
              <dt className="font-display text-xl italic">{term}</dt>
              <dd className="mt-1 whitespace-pre-line leading-relaxed text-soft-ink">{text}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

/** The zigzag edge a dressmaker's pinking shears leave, as a clip-path. */
function pinkedEdge(teeth: number): string {
  const step = 100 / teeth;
  const depth = 2.6;
  const points: string[] = [];
  for (let tooth = 0; tooth < teeth; tooth += 1) points.push(`${(tooth * step).toFixed(2)}% 0%`, `${((tooth + 0.5) * step).toFixed(2)}% ${depth}%`);
  for (let tooth = 0; tooth < teeth; tooth += 1) points.push(`100% ${(tooth * step).toFixed(2)}%`, `${100 - depth}% ${((tooth + 0.5) * step).toFixed(2)}%`);
  for (let tooth = 0; tooth < teeth; tooth += 1) points.push(`${(100 - tooth * step).toFixed(2)}% 100%`, `${(100 - (tooth + 0.5) * step).toFixed(2)}% ${100 - depth}%`);
  for (let tooth = 0; tooth < teeth; tooth += 1) points.push(`0% ${(100 - tooth * step).toFixed(2)}%`, `${depth}% ${(100 - (tooth + 0.5) * step).toFixed(2)}%`);
  return `polygon(${points.join(", ")})`;
}

const PINKED_EDGE = pinkedEdge(15);

const FABRICS = [
  { colors: "#FFF9F4, #EFE3D0", turn: "-rotate-6", place: "left-[2%] top-[6%]" },
  { colors: "#F3E3CC, #E0CDAF", turn: "rotate-3", place: "left-[34%] top-0" },
  { colors: "#E6C594, #CFAA74", turn: "-rotate-2", place: "left-[10%] top-[46%]" },
  { colors: "#D8C3A5, #B79B70", turn: "rotate-6", place: "left-[50%] top-[40%]" },
];

/** A dressmaker's sample card: pinked squares of fabric, each lifting when touched. */
export function DressCode({ settings }: SectionProps) {
  return (
    <section id="dress-code" className="overflow-hidden px-6 py-20 md:py-32">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="font-display text-2xl italic text-soft-ink">Attire</h2>
          <p className="mt-2 font-display text-5xl font-light leading-[1.02] md:text-8xl">{settings.dress_code}</p>
          <p className="mt-6 max-w-md whitespace-pre-line text-lg leading-relaxed text-soft-ink">{settings.dress_code_notes}</p>
        </div>
        <div className="relative mx-auto h-72 w-full max-w-md md:h-[26rem]" aria-hidden="true">
          {FABRICS.map(({ colors, turn, place }) => (
            <div key={colors} className={`absolute ${place} ${turn} size-40 transition-transform duration-500 hover:-translate-y-3 hover:scale-105 md:size-56`} style={{ filter: "drop-shadow(0 14px 16px rgb(77 44 50 / 0.2))" }}>
              <div className="size-full" style={{ clipPath: PINKED_EDGE, background: `linear-gradient(135deg, ${colors})` }} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
