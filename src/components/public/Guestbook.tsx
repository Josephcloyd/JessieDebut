"use client";

import { useState, type FormEvent } from "react";
import { submitWish } from "@/lib/actions/guest";
import type { GuestWish } from "@/lib/types";
import { wishSchema } from "@/lib/validation/guest-forms";
import { FormField, Honeypot } from "./FormField";
import { Reveal } from "./motion-helpers";
import { SectionHeading } from "./SectionHeading";

interface GuestbookProps {
  folio: string;
  wishes: GuestWish[];
  isOpen: boolean;
  isPreview: boolean;
  guestName?: string;
}

export function Guestbook({ folio, wishes, isOpen, isPreview, guestName }: GuestbookProps) {
  return (
    <section id="wishes" className="px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="Wishes" />
      {isOpen && !isPreview && <WishForm defaultName={guestName ?? ""} />}
      {wishes.length > 0 ? (
        <div className="mx-auto mt-14 max-w-6xl gap-5 sm:columns-2 lg:columns-3">
          {wishes.map((wish, index) => (
            <Reveal key={wish.id} className="mb-7 break-inside-avoid border-t border-umber/25 pt-3" delay={(index % 3) * 0.08}>
              <article>
                <p className={`font-display leading-snug ${wish.is_featured ? "text-4xl italic text-umber" : "text-2xl"}`}>{wish.message}</p>
                <p className="eyebrow mt-3 text-[0.6rem] text-soft-ink">{wish.guest_name}</p>
              </article>
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center font-display text-2xl italic text-soft-ink">Be the first to leave a wish.</p>
      )}
    </section>
  );
}

function WishForm({ defaultName }: { defaultName: string }) {
  const [guestName, setGuestName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<{ guestName?: string; message?: string; form?: string }>({});
  const [isBusy, setIsBusy] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = wishSchema.safeParse({ guestName, message });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ guestName: fields.guestName?.[0], message: fields.message?.[0] });
      return;
    }
    setErrors({});
    setIsBusy(true);
    const result = await submitWish({ guestName, message }, honeypot);
    setIsBusy(false);
    if (result.ok) setIsSent(true);
    else setErrors({ form: result.error });
  };

  if (isSent) {
    return (
      <p role="status" className="mx-auto max-w-xl text-center font-display text-2xl italic text-soft-ink">
        Thank you. Your wish will appear here once it has been reviewed.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative mx-auto max-w-xl space-y-5">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <FormField id="wish-name" label="Your Name" error={errors.guestName}>
        <input id="wish-name" className="field" value={guestName} onChange={(event) => setGuestName(event.target.value)} aria-invalid={Boolean(errors.guestName)} />
      </FormField>
      <FormField id="wish-message" label="Your Wish" error={errors.message}>
        <textarea id="wish-message" rows={4} className="field" value={message} onChange={(event) => setMessage(event.target.value)} aria-invalid={Boolean(errors.message)} />
      </FormField>
      {errors.form && <p role="alert" className="text-center text-sm text-[#9a3b2f]">{errors.form}</p>}
      <button type="submit" disabled={isBusy} className="btn btn-line w-full">{isBusy ? "Sending" : "Leave a Wish"}</button>
    </form>
  );
}
