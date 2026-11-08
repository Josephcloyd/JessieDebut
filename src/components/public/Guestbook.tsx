"use client";

import { useState, type FormEvent } from "react";
import { submitWish } from "@/lib/actions/guest";
import type { GuestWish } from "@/lib/types";
import { wishSchema } from "@/lib/validation/guest-forms";
import { FormField, Honeypot } from "./FormField";
import { Reveal } from "./motion-helpers";

interface GuestbookProps {
  wishes: GuestWish[];
  isOpen: boolean;
  isPreview: boolean;
  guestName?: string;
}

export function Guestbook({ wishes, isOpen, isPreview, guestName }: GuestbookProps) {
  return (
    <section id="wishes" className="px-6 py-20 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[2fr_3fr] md:gap-20">
        <div className="md:sticky md:top-14 md:self-start">
          <h2 className="font-script text-7xl leading-none md:text-8xl">Wishes</h2>
          <p className="mt-2 font-display text-2xl italic leading-snug text-soft-ink">A few words for her to keep.</p>
          {isOpen && !isPreview && <WishForm defaultName={guestName ?? ""} />}
        </div>
        {wishes.length > 0 ? (
          <div className="flex flex-col gap-9">
            {wishes.map((wish, index) => (
              <Reveal key={wish.id} className={index % 2 === 1 ? "md:ml-20" : ""}>
                <article>
                  <p className={`font-display leading-[1.12] ${wish.is_featured ? "text-5xl font-light md:text-6xl" : "text-3xl"}`}>{wish.message}</p>
                  <p className="mt-3 font-display text-lg italic text-soft-ink">{wish.guest_name}</p>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="font-display text-3xl italic text-soft-ink md:pt-6">Be the first to leave a wish.</p>
        )}
      </div>
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
      <p role="status" className="mt-8 font-display text-2xl italic text-soft-ink">
        Thank you. Your wish will appear here once it has been reviewed.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative mt-8 space-y-5">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <FormField id="wish-name" label="Your Name" error={errors.guestName}>
        <input id="wish-name" className="field" value={guestName} onChange={(event) => setGuestName(event.target.value)} aria-invalid={Boolean(errors.guestName)} />
      </FormField>
      <FormField id="wish-message" label="Your Wish" error={errors.message}>
        <textarea id="wish-message" rows={4} className="field" value={message} onChange={(event) => setMessage(event.target.value)} aria-invalid={Boolean(errors.message)} />
      </FormField>
      {errors.form && <p role="alert" className="text-center text-sm text-[#9a3b2f]">{errors.form}</p>}
      <button type="submit" disabled={isBusy} className="btn btn-solid w-full">{isBusy ? "Sending" : "Leave a Wish"}</button>
    </form>
  );
}
