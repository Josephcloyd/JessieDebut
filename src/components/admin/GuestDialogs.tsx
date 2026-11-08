"use client";

import { Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createGuest, createGuestsInBulk, deleteRsvp, setGuestRsvp, updateGuest } from "@/lib/actions/admin-guests";
import { SITE_URL } from "@/lib/supabase/env";
import type { GuestWithRsvp, RsvpStatus } from "@/lib/types";
import { Modal, useActionRunner, useFeedback } from "./feedback";
import { TextInput } from "./fields";

const QR_OPTIONS = { width: 480, margin: 2, color: { dark: "#4D2C32", light: "#FFFFFF" } };

export function QrShare({ title, url, fileName, onClose }: { title: string; url: string; fileName: string; onClose: () => void }) {
  const { notify } = useFeedback();
  const [image, setImage] = useState<string>();

  useEffect(() => {
    let isCurrent = true;
    QRCode.toDataURL(url, QR_OPTIONS)
      .then((value) => {
        if (isCurrent) setImage(value);
      })
      .catch((error: unknown) => console.error("[qr]", error));
    return () => {
      isCurrent = false;
    };
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copied.");
    } catch {
      notify("Your browser blocked copying. Please select the link and copy it.", true);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      {image ? <img src={image} alt="QR code" className="mx-auto size-56" /> : <div className="mx-auto size-56 animate-pulse bg-beige" />}
      <p className="mt-4 break-all text-center text-sm text-soft-ink">{url}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-line" onClick={copy}><Copy className="size-4" /> Copy Link</button>
        {image && <a href={image} download={fileName} className="btn btn-solid"><Download className="size-4" /> Save QR</a>}
      </div>
    </Modal>
  );
}

export const inviteLink = (code: string): string => `${SITE_URL}/i/${code}`;

export function GuestForm({ guest, defaultCompanions, onClose }: { guest: GuestWithRsvp | null; defaultCompanions: number; onClose: () => void }) {
  const { isBusy, run } = useActionRunner();
  const [values, setValues] = useState({
    full_name: guest?.full_name ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    notes: guest?.notes ?? "",
    max_companions: guest?.max_companions ?? defaultCompanions,
  });
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));

  const save = async () => {
    const result = guest ? await run(() => updateGuest(guest.id, values), "Guest saved.") : await run(() => createGuest(values), "Guest added.");
    if (result.ok) onClose();
  };

  return (
    <Modal title={guest ? "Edit Guest" : "Add Guest"} onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Full name" value={values.full_name} onChange={(full_name) => set({ full_name })} />
        <TextInput label="Email" type="email" value={values.email} onChange={(email) => set({ email })} />
        <TextInput label="Contact number" type="tel" value={values.phone} onChange={(phone) => set({ phone })} />
        <TextInput label="Accompanying guests allowed" type="number" value={String(values.max_companions)} onChange={(value) => set({ max_companions: Number(value) })} />
        <TextInput label="Private notes" multiline value={values.notes} onChange={(notes) => set({ notes })} />
        <div className="flex justify-end"><button type="button" className="btn btn-solid" onClick={save} disabled={isBusy || !values.full_name.trim()}>Save</button></div>
      </div>
    </Modal>
  );
}

export function BulkGuestForm({ defaultCompanions, onClose }: { defaultCompanions: number; onClose: () => void }) {
  const { isBusy, run } = useActionRunner();
  const [text, setText] = useState("");
  const names = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const save = async () => {
    const result = await run(() => createGuestsInBulk({ names, maxCompanions: defaultCompanions }), `${names.length} guests added.`);
    if (result.ok) onClose();
  };

  return (
    <Modal title="Add Many Guests" onClose={onClose}>
      <TextInput label="One name per line" multiline value={text} onChange={setText} hint={`Each guest gets a personal link and ${defaultCompanions} companion(s).`} />
      <div className="mt-4 flex justify-end"><button type="button" className="btn btn-solid" onClick={save} disabled={isBusy || names.length === 0}>Add {names.length || ""} Guests</button></div>
    </Modal>
  );
}

export function ResponseForm({ guest, onClose }: { guest: GuestWithRsvp; onClose: () => void }) {
  const { confirm } = useFeedback();
  const { isBusy, run } = useActionRunner();
  const [status, setStatus] = useState<RsvpStatus>(guest.rsvp?.status ?? "attending");
  const [companions, setCompanions] = useState(guest.rsvp?.companions ?? 0);
  const [dietary, setDietary] = useState(guest.rsvp?.dietary ?? "");
  const [message, setMessage] = useState(guest.rsvp?.message ?? "");

  const save = async () => {
    const result = await run(() => setGuestRsvp(guest.id, { status, companions, dietary, message }), "Response saved.");
    if (result.ok) onClose();
  };

  const remove = async () => {
    const isConfirmed = await confirm({ title: "Delete this RSVP?", body: `${guest.full_name} will return to pending and can respond again.`, confirmLabel: "Delete RSVP" });
    if (!isConfirmed) return;
    const result = await run(() => deleteRsvp(guest.id), "RSVP deleted.");
    if (result.ok) onClose();
  };

  return (
    <Modal title={`Response: ${guest.full_name}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="response-status" className="mb-1 block text-xs font-semibold text-soft-ink">Attendance</label>
          <select id="response-status" className="field" value={status} onChange={(event) => setStatus(event.target.value as RsvpStatus)}>
            <option value="attending">Attending</option>
            <option value="declined">Unable to attend</option>
          </select>
        </div>
        {status === "attending" && <TextInput label="Accompanying guests" type="number" value={String(companions)} onChange={(value) => setCompanions(Number(value))} />}
        <TextInput label="Dietary restrictions" value={dietary} onChange={setDietary} />
        <TextInput label="Message" multiline value={message} onChange={setMessage} />
        <div className="flex flex-wrap justify-between gap-3">
          {guest.rsvp ? <button type="button" className="btn text-[#9a3b2f]" onClick={remove}>Delete RSVP</button> : <span />}
          <button type="button" className="btn btn-solid" onClick={save} disabled={isBusy}>Save</button>
        </div>
      </div>
    </Modal>
  );
}
