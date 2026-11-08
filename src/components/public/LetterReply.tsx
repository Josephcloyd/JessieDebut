"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { findInvitation, submitRsvp } from "@/lib/actions/guest";
import type { InvitedGuest, RsvpStatus } from "@/lib/types";

const REPLY_LABEL: Record<RsvpStatus, string> = { attending: "accepted", declined: "declined" };
const THANKS: Record<RsvpStatus, string> = {
  attending: "Thank you! We can't wait to celebrate with you. You can add your companions and any dietary needs in the RSVP section.",
  declined: "Thank you for letting us know. You will be dearly missed.",
};

interface LetterReplyProps {
  guest?: InvitedGuest;
  isOpen: boolean;
  isPreview: boolean;
}

/** Records a guest's answer directly from the invitation letter. */
export function LetterReply({ guest, isOpen, isPreview }: LetterReplyProps) {
  const router = useRouter();
  const [recorded, setRecorded] = useState<RsvpStatus | null>(null);
  const [awaitingCode, setAwaitingCode] = useState<RsvpStatus | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const record = async (target: InvitedGuest, status: RsvpStatus): Promise<void> => {
    const previous = target.rsvp;
    const result = await submitRsvp({
      code: target.code,
      fullName: previous?.full_name ?? target.name,
      email: previous?.email ?? "",
      phone: previous?.phone ?? "",
      status,
      companions: status === "attending" ? previous?.companions ?? 0 : 0,
      dietary: previous?.dietary ?? "",
      message: previous?.message ?? "",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRecorded(status);
    setAwaitingCode(null);
    // Reloads the guest's saved answer so the RSVP form further down shows it.
    router.refresh();
  };

  const reply = async (status: RsvpStatus) => {
    setError(undefined);
    if (!guest) {
      setAwaitingCode(status);
      return;
    }
    setIsBusy(true);
    await record(guest, status);
    setIsBusy(false);
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!awaitingCode) return;
    setError(undefined);
    setIsBusy(true);
    const found = await findInvitation(code);
    if (found.ok) await record(found.data, awaitingCode);
    else setError(found.error);
    setIsBusy(false);
  };

  if (recorded) {
    return <p role="status" className="mx-auto mt-6 max-w-xs font-display text-xl italic leading-snug">{THANKS[recorded]}</p>;
  }
  if (isPreview) {
    return <p className="mx-auto mt-6 max-w-xs text-sm text-soft-ink">Guests will see Accept and Decline here. They are turned off in preview.</p>;
  }
  if (!isOpen) {
    return <p className="mx-auto mt-6 max-w-xs font-display text-xl italic text-soft-ink">RSVPs are now closed.</p>;
  }

  if (awaitingCode) {
    return (
      <form onSubmit={submitCode} className="mx-auto mt-6 max-w-xs">
        <label htmlFor="letter-code" className="eyebrow mb-2 block text-[0.62rem] text-soft-ink">Invitation Code</label>
        <input id="letter-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" aria-invalid={Boolean(error)} className="field text-center uppercase tracking-[0.25em]" />
        {error && <p role="alert" className="mt-2 text-sm text-[#9a3b2f]">{error}</p>}
        <div className="mt-3 flex justify-center gap-2">
          <button type="button" className="btn btn-line" onClick={() => setAwaitingCode(null)}>Back</button>
          <button type="submit" className="btn btn-solid" disabled={isBusy || !code.trim()}>{isBusy ? "Saving" : "Confirm"}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-6">
      <p className="eyebrow text-[0.62rem] text-soft-ink">
        {guest?.rsvp ? `You have ${REPLY_LABEL[guest.rsvp.status]}. You may change your reply.` : "Will you join us?"}
      </p>
      <div className="mt-3 flex justify-center gap-3">
        <button type="button" className="btn btn-solid" disabled={isBusy} onClick={() => reply("attending")}>I Accept</button>
        <button type="button" className="btn btn-line" disabled={isBusy} onClick={() => reply("declined")}>I Decline</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-[#9a3b2f]">{error}</p>}
    </div>
  );
}
