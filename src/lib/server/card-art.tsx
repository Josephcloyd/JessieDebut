import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatEventDate, formatEventTime } from "@/lib/domain/time";
import { getPublishedInvitation } from "@/lib/data/invitation";

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

export async function loadCardFonts() {
  const [serif, script] = await Promise.all([
    readFile(path.join(FONT_DIR, "cormorant-garamond-latin-500-normal.woff")),
    readFile(path.join(FONT_DIR, "pinyon-script-latin-400-normal.woff")),
  ]);
  return [
    { name: "Cormorant", data: serif, weight: 500 as const, style: "normal" as const },
    { name: "Pinyon", data: script, weight: 400 as const, style: "normal" as const },
  ];
}

export interface CardDetails {
  name: string;
  monogram: string;
  title: string;
  eventAt: string | null;
  venue: string;
}

/** Falls back to a plain card so a database hiccup never breaks an image route. */
export async function getCardDetails(): Promise<CardDetails> {
  try {
    const data = await getPublishedInvitation();
    if (data) {
      const { settings } = data;
      return { name: settings.celebrant_name, monogram: settings.monogram, title: settings.event_title, eventAt: settings.event_at, venue: settings.venue_name };
    }
  } catch (error) {
    console.error("[card]", error);
  }
  return { name: "Jessiemae", monogram: "J", title: "The Grand Debut", eventAt: null, venue: "" };
}

const IVORY = "#FFF9F4";
const UMBER = "#4D2C32";
const GOLD = "#E6C594";
const INK = "#6E4A51";

export function CardArt({ details, guestName, scale = 1 }: { details: CardDetails; guestName?: string; scale?: number }) {
  const size = (value: number) => value * scale;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFD2D7", padding: size(36) }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: IVORY, border: `2px solid ${GOLD}`, color: UMBER, fontFamily: "Cormorant", textAlign: "center", padding: size(40) }}>
        <div style={{ display: "flex", fontSize: size(26), letterSpacing: size(8), color: INK }}>YOU ARE CORDIALLY INVITED</div>
        {guestName && <div style={{ display: "flex", fontSize: size(38), marginTop: size(22), color: INK }}>{`Dear ${guestName}`}</div>}
        <div style={{ display: "flex", fontSize: size(128), letterSpacing: size(6), marginTop: size(36) }}>{details.name.toUpperCase()}</div>
        <div style={{ display: "flex", fontFamily: "Pinyon", fontSize: size(84), color: UMBER }}>{details.title}</div>
        <div style={{ display: "flex", width: size(240), height: 1, background: GOLD, margin: `${size(28)}px 0` }} />
        {details.eventAt && <div style={{ display: "flex", fontSize: size(40) }}>{formatEventDate(details.eventAt)}</div>}
        {details.eventAt && <div style={{ display: "flex", fontSize: size(36), color: INK }}>{formatEventTime(details.eventAt)}</div>}
        {details.venue && <div style={{ display: "flex", fontSize: size(36), marginTop: size(10), color: INK }}>{details.venue}</div>}
      </div>
    </div>
  );
}
