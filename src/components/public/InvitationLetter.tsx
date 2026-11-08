"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatEventDate, formatEventTime } from "@/lib/domain/time";
import type { EventSettings, InvitedGuest } from "@/lib/types";
import { LetterReply } from "./LetterReply";
import { EASE_ELEGANT } from "./motion-helpers";
import { SakuraCluster } from "./sakura";

interface InvitationLetterProps {
  settings: EventSettings;
  guest?: InvitedGuest;
  isRsvpOpen: boolean;
  isPreview: boolean;
  onContinue: () => void;
}

/** A short personal note the guest reads after the card comes out of the envelope. */
export function InvitationLetter({ settings, guest, isRsvpOpen, isPreview, onContinue }: InvitationLetterProps) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-4 py-6">
      <motion.article
        className="relative max-h-full w-full max-w-md overflow-y-auto bg-ivory px-7 pb-12 pt-14 text-center shadow-soft md:px-12"
        initial={{ opacity: 0, y: 70, scale: 0.86 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.9, ease: EASE_ELEGANT }}
      >
        <div className="pointer-events-none absolute inset-3 border border-champagne" aria-hidden="true" />
        <SakuraCluster className="absolute right-4 top-4 w-16 -scale-x-100" />
        <SakuraCluster className="absolute bottom-4 left-4 w-16 -scale-y-100" />

        <div className="relative">
          <p className="font-script text-4xl">Dear {guest?.name ?? "Honored Guest"},</p>
          {settings.invitation_hosts && <p className="mt-5 font-display text-2xl italic leading-snug">{settings.invitation_hosts}</p>}
          <p className="mx-auto mt-2 max-w-xs font-display text-xl leading-snug text-soft-ink">{settings.invitation_request}</p>
          <p className="mt-5 font-display text-4xl uppercase tracking-[0.08em]">{settings.celebrant_name}</p>
          <p className="eyebrow mt-5 leading-loose">
            {formatEventDate(settings.event_at)}
            <span className="block">{formatEventTime(settings.event_at)}</span>
          </p>
          {settings.venue_name && <p className="mt-3 font-display text-2xl leading-tight">{settings.venue_name}</p>}
          <p className="mx-auto mt-5 max-w-xs font-display text-xl italic leading-snug text-soft-ink">
            It would mean so much to celebrate this evening with you.
          </p>
          <p className="mt-3 font-display text-lg text-soft-ink">With love,</p>
          <p className="font-script text-4xl leading-tight">{settings.celebrant_name}</p>
          <LetterReply guest={guest} isOpen={isRsvpOpen} isPreview={isPreview} />
          <button ref={continueRef} type="button" onClick={onContinue} className="eyebrow mt-6 min-h-11 border-b border-umber/40 px-1 text-[0.62rem] transition-colors hover:border-umber">
            Continue to the Invitation
          </button>
        </div>
      </motion.article>
    </div>
  );
}
