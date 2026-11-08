import { MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { formatCoverDate, formatEventDate, formatEventTime } from "@/lib/domain/time";
import type { EventSettings } from "@/lib/types";
import { Countdown } from "./Countdown";
import { Reveal } from "./motion-helpers";
import { SectionHeading } from "./SectionHeading";

interface SectionProps {
  settings: EventSettings;
  folio: string;
}

export function Welcome({ settings, folio }: SectionProps) {
  return (
    <section id="welcome" className="px-5 py-20 md:py-32">
      <SectionHeading folio={folio} title={settings.welcome_heading} />
      <Reveal className="mx-auto max-w-6xl md:pl-[33%]">
        <p className="whitespace-pre-line font-display text-3xl leading-[1.25] first-letter:float-left first-letter:mr-3 first-letter:font-editorial first-letter:text-7xl first-letter:leading-[0.85] first-letter:text-dusk md:text-5xl md:first-letter:text-8xl">
          {settings.welcome_message}
        </p>
      </Reveal>
    </section>
  );
}

export function About({ settings, folio }: SectionProps) {
  const portrait = settings.about_image_url ?? settings.hero_image_url;

  return (
    <section id="about" className="bg-beige pb-20 md:pb-0">
      <div className="grid items-end md:grid-cols-12">
        <Reveal className="relative aspect-[4/5] md:col-span-6 md:col-start-1 md:row-start-1 md:aspect-auto md:h-[46rem]">
          {portrait && (
            <Image src={portrait} alt={`Portrait of ${settings.celebrant_name}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" style={{ objectPosition: settings.about_image_url ? "50% 50%" : "50% 18%" }} />
          )}
        </Reveal>
        <Reveal className="relative z-10 -mt-16 bg-ivory px-6 py-10 md:col-span-7 md:col-start-6 md:row-start-1 md:mb-14 md:mt-0 md:self-end md:p-14" delay={0.1}>
          <p className="eyebrow text-[0.65rem] text-soft-ink">{folio}</p>
          <h2 className="mt-3 font-display text-5xl font-light leading-[1.02] md:text-7xl">{settings.about_title}</h2>
          <p className="mt-6 max-w-xl whitespace-pre-line leading-relaxed text-soft-ink">{settings.about_bio}</p>
          {settings.about_message && <p className="mt-6 max-w-xl whitespace-pre-line font-display text-2xl italic leading-snug text-umber">{settings.about_message}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export function CountdownSection({ settings }: { settings: EventSettings }) {
  return (
    <section className="bg-fern px-5 py-16 text-ivory md:py-24">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p className="font-display text-4xl italic leading-none md:text-5xl">Until the evening</p>
        <Countdown target={settings.event_at} celebrantName={settings.celebrant_name} tone="light" />
      </Reveal>
    </section>
  );
}

function Note({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-t border-umber/25 pt-3">
      <dt className="eyebrow text-[0.62rem] text-soft-ink">{term}</dt>
      <dd className="mt-2 whitespace-pre-line font-display text-xl leading-snug">{children}</dd>
    </div>
  );
}

/** Set like a printed invitation card rather than a grid of feature boxes. */
export function EventDetails({ settings, folio }: SectionProps) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${settings.venue_name}, ${settings.venue_address}`)}`;

  return (
    <section id="details" className="bg-beige px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="The Invitation" />
      <Reveal className="mx-auto max-w-3xl bg-ivory px-6 py-14 text-center shadow-soft md:px-16 md:py-20">
        {settings.invitation_hosts && <p className="font-display text-2xl italic">{settings.invitation_hosts}</p>}
        <p className="mx-auto mt-3 max-w-md font-display text-xl leading-snug text-soft-ink">{settings.invitation_request}</p>
        <p className="mt-7 font-display text-5xl uppercase tracking-[0.08em] md:text-6xl">{settings.celebrant_name}</p>
        <p className="mt-8 font-display text-[clamp(5rem,20vw,10rem)] font-light leading-none tracking-tight text-umber tabular-nums">{formatCoverDate(settings.event_at)}</p>
        <p className="eyebrow mt-5 leading-loose">{formatEventDate(settings.event_at)}<span className="block">{formatEventTime(settings.event_at)}</span></p>
        <p className="mt-8 font-display text-3xl">{settings.venue_name}</p>
        <p className="mx-auto mt-1 max-w-sm leading-relaxed text-soft-ink">{settings.venue_address}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {settings.maps_url && (
            <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="btn btn-solid"><MapPin className="size-4" strokeWidth={1.5} /> View Location</a>
          )}
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-line"><Navigation className="size-4" strokeWidth={1.5} /> Get Directions</a>
        </div>
      </Reveal>
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <dl className="grid gap-7 md:grid-cols-3">
          <Note term="Reception">{settings.reception_info}</Note>
          <Note term="Attire">{settings.dress_code}</Note>
          <Note term="Kindly Note">{settings.special_instructions}</Note>
        </dl>
      </Reveal>
    </section>
  );
}

const DRESS_SWATCHES = ["#F8F5EF", "#EFE3D0", "#D5C0A2", "#B79B70", "#9B8977"];

export function DressCode({ settings, folio }: SectionProps) {
  return (
    <section id="dress-code" className="px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="Attire" />
      <Reveal className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-end">
        <p className="font-display text-5xl italic leading-[1.05] md:text-7xl">{settings.dress_code}</p>
        <div>
          <div className="flex h-20" aria-hidden="true">
            {DRESS_SWATCHES.map((color) => <span key={color} className="flex-1" style={{ background: color }} />)}
          </div>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-soft-ink">{settings.dress_code_notes}</p>
        </div>
      </Reveal>
    </section>
  );
}
