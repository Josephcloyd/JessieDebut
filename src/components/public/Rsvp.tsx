"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { findInvitation, submitRsvp } from "@/lib/actions/guest";
import type { InvitedGuest } from "@/lib/types";
import { rsvpSchema } from "@/lib/validation/guest-forms";
import { FormField, Honeypot } from "./FormField";
import { Reveal } from "./motion-helpers";
import { SectionHeading } from "./SectionHeading";

interface RsvpProps {
  folio: string;
  celebrantName: string;
  isOpen: boolean;
  guest?: InvitedGuest;
  isPreview: boolean;
}

export function Rsvp({ folio, celebrantName, isOpen, guest, isPreview }: RsvpProps) {
  const [currentGuest, setCurrentGuest] = useState(guest);
  const [response, setResponse] = useState<"attending" | "declined" | null>(null);

  return (
    <section id="rsvp" className="bg-beige px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="RSVP" />
      <Reveal className="mx-auto max-w-xl">
        <div className="bg-ivory px-6 py-10 md:px-10">
          <AnimatePresence mode="wait">
            {response ? (
              <Confirmation key="done" celebrantName={celebrantName} response={response} />
            ) : isPreview ? (
              <p key="preview" className="text-center text-soft-ink">Guests will see the RSVP form here. It is turned off in preview.</p>
            ) : !isOpen ? (
              <p key="closed" className="text-center font-display text-2xl italic text-soft-ink">RSVPs are now closed. Thank you.</p>
            ) : currentGuest ? (
              <RsvpForm key="form" guest={currentGuest} onDone={setResponse} />
            ) : (
              <CodeEntry key="code" onFound={setCurrentGuest} />
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}

function CodeEntry({ onFound }: { onFound: (guest: InvitedGuest) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setError(undefined);
    const result = await findInvitation(code);
    setIsBusy(false);
    if (result.ok) onFound(result.data);
    else setError(result.error);
  };

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <p className="text-center leading-relaxed text-soft-ink">Please enter the invitation code printed on your invitation.</p>
      <FormField id="invite-code" label="Invitation Code" error={error}>
        <input id="invite-code" className="field text-center uppercase tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" aria-invalid={Boolean(error)} required />
      </FormField>
      <button type="submit" disabled={isBusy || !code.trim()} className="btn btn-solid w-full">{isBusy ? "Finding your invitation" : "Continue"}</button>
    </motion.form>
  );
}

interface RsvpFormProps {
  guest: InvitedGuest;
  onDone: (response: "attending" | "declined") => void;
}

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "status" | "companions" | "dietary" | "message", string>>;

function RsvpForm({ guest, onDone }: RsvpFormProps) {
  const [values, setValues] = useState({
    fullName: guest.rsvp?.full_name ?? guest.name,
    email: guest.rsvp?.email ?? "",
    phone: guest.rsvp?.phone ?? "",
    status: guest.rsvp?.status ?? ("" as "attending" | "declined" | ""),
    companions: guest.rsvp?.companions ?? 0,
    dietary: guest.rsvp?.dietary ?? "",
    message: guest.rsvp?.message ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [honeypot, setHoneypot] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...values, code: guest.code, companions: values.status === "attending" ? values.companions : 0 };
    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])));
      return;
    }
    setErrors({});
    setFormError(undefined);
    setIsBusy(true);
    const result = await submitRsvp(payload as Parameters<typeof submitRsvp>[0], honeypot);
    setIsBusy(false);
    if (result.ok) onDone(parsed.data.status);
    else setFormError(result.error);
  };

  return (
    <motion.form onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative space-y-5">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <p className="text-center font-display text-2xl">Dear {guest.name}</p>
      {guest.rsvp && <p className="text-center text-sm text-soft-ink">We have your response. You can update it below.</p>}

      <FormField id="rsvp-name" label="Full Name" error={errors.fullName}>
        <input id="rsvp-name" className="field" value={values.fullName} onChange={(event) => set("fullName", event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.fullName)} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="rsvp-email" label="Email (optional)" error={errors.email}>
          <input id="rsvp-email" type="email" className="field" value={values.email} onChange={(event) => set("email", event.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} />
        </FormField>
        <FormField id="rsvp-phone" label="Contact Number (optional)" error={errors.phone}>
          <input id="rsvp-phone" type="tel" className="field" value={values.phone} onChange={(event) => set("phone", event.target.value)} autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
        </FormField>
      </div>

      <fieldset>
        <legend className="eyebrow mb-2 text-[0.62rem] text-soft-ink">Will You Attend?</legend>
        <div className="grid grid-cols-2 gap-3">
          {([["attending", "Attending"], ["declined", "Unable to Attend"]] as const).map(([value, label]) => (
            <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center border px-2 text-center text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-umber ${values.status === value ? "border-umber bg-umber text-ivory" : "border-champagne bg-white/60"}`}>
              <input type="radio" name="rsvp-status" className="sr-only" checked={values.status === value} onChange={() => set("status", value)} />
              {label}
            </label>
          ))}
        </div>
        {errors.status && <p role="alert" className="mt-1 text-sm text-[#9a3b2f]">{errors.status}</p>}
      </fieldset>

      {values.status === "attending" && guest.maxCompanions > 0 && (
        <div>
          <p id="companions-label" className="eyebrow mb-2 text-[0.62rem] text-soft-ink">Accompanying Guests (up to {guest.maxCompanions})</p>
          <div className="flex items-center gap-5" role="group" aria-labelledby="companions-label">
            <button type="button" aria-label="Fewer guests" className="btn btn-line !px-4" disabled={values.companions <= 0} onClick={() => set("companions", values.companions - 1)}><Minus className="size-4" /></button>
            <output className="min-w-8 text-center font-display text-3xl">{values.companions}</output>
            <button type="button" aria-label="More guests" className="btn btn-line !px-4" disabled={values.companions >= guest.maxCompanions} onClick={() => set("companions", values.companions + 1)}><Plus className="size-4" /></button>
          </div>
        </div>
      )}

      <FormField id="rsvp-dietary" label="Dietary Restrictions (optional)" error={errors.dietary}>
        <input id="rsvp-dietary" className="field" value={values.dietary} onChange={(event) => set("dietary", event.target.value)} />
      </FormField>
      <FormField id="rsvp-message" label="A Special Message (optional)" error={errors.message}>
        <textarea id="rsvp-message" rows={4} className="field" value={values.message} onChange={(event) => set("message", event.target.value)} />
      </FormField>

      {formError && <p role="alert" className="text-center text-sm text-[#9a3b2f]">{formError}</p>}
      <button type="submit" disabled={isBusy} className="btn btn-solid w-full">{isBusy ? "Sending" : guest.rsvp ? "Update My RSVP" : "Send My RSVP"}</button>
    </motion.form>
  );
}

function Confirmation({ celebrantName, response }: { celebrantName: string; response: "attending" | "declined" }) {
  return (
    <motion.div className="py-6 text-center" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <svg viewBox="0 0 80 80" className="mx-auto size-20 text-taupe" fill="none" aria-hidden="true">
        <motion.circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
        <motion.path d="M26 41l10 10 19-22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.8 }} />
      </svg>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}>
        <h3 className="mt-6 font-editorial text-3xl leading-snug">Thank you for being part of {celebrantName}&apos;s special day!</h3>
        <p className="mt-3 text-soft-ink">{response === "attending" ? "We can't wait to celebrate with you." : "You will be missed, and we are grateful for your kind reply."}</p>
      </motion.div>
    </motion.div>
  );
}
