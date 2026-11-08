"use client";

import { Check, QrCode, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { approveGuestUpload, deleteGuestUpload, deleteMessage, updateMessage } from "@/lib/actions/admin-guests";
import { saveControls } from "@/lib/actions/admin-settings";
import { formatSubmittedAt } from "@/lib/domain/time";
import { SITE_URL } from "@/lib/supabase/env";
import type { GuestUploadRow, MessageRow, MessageStatus, SiteControls } from "@/lib/types";
import { useActionRunner, useFeedback } from "./feedback";
import { EmptyState, PageTitle, Panel, Toggle } from "./fields";
import { QrShare } from "./GuestDialogs";

const TABS: [MessageStatus, string][] = [["pending", "Waiting"], ["approved", "Published"], ["rejected", "Rejected"]];

function StatusTabs({ value, counts, onChange }: { value: MessageStatus; counts: Record<MessageStatus, number>; onChange: (value: MessageStatus) => void }) {
  return (
    <div className="mb-4 flex gap-1" role="group" aria-label="Filter by review status">
      {TABS.map(([status, label]) => (
        <button key={status} type="button" aria-pressed={value === status} onClick={() => onChange(status)} className={`min-h-11 px-3 text-sm ${value === status ? "bg-umber text-ivory" : "hover:bg-beige"}`}>{label} ({counts[status]})</button>
      ))}
    </div>
  );
}

function countByStatus(items: { status: MessageStatus }[]): Record<MessageStatus, number> {
  return {
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  };
}

export function GuestbookManager({ messages, controls }: { messages: MessageRow[]; controls: SiteControls }) {
  const { isBusy, run } = useActionRunner();
  const [tab, setTab] = useState<MessageStatus>("pending");
  const visible = messages.filter((message) => message.status === tab);

  return (
    <>
      <PageTitle title="Guestbook" description="Only approved messages appear on the invitation." />
      <div className="mb-5"><Panel><Toggle label="Accept new wishes" checked={controls.guestbook_open} disabled={isBusy} onChange={(value) => run(() => saveControls({ guestbook_open: value }), value ? "Guestbook opened." : "Guestbook closed.")} /></Panel></div>
      <Panel>
        <StatusTabs value={tab} counts={countByStatus(messages)} onChange={setTab} />
        {visible.length === 0 ? <EmptyState>Nothing here right now.</EmptyState> : <ul className="divide-y divide-beige">{visible.map((message) => <MessageRowItem key={message.id} message={message} />)}</ul>}
      </Panel>
    </>
  );
}

const ROW_BUTTON = "flex size-10 items-center justify-center hover:bg-beige";

function MessageRowItem({ message }: { message: MessageRow }) {
  const { confirm } = useFeedback();
  const { run } = useActionRunner();

  const remove = async () => {
    const isConfirmed = await confirm({ title: "Delete this message?", body: "It will be permanently removed.", confirmLabel: "Delete" });
    if (isConfirmed) await run(() => deleteMessage(message.id), "Message deleted.");
  };

  return (
    <li className="flex flex-wrap items-start gap-3 py-3 text-sm">
      <div className="min-w-48 flex-1">
        <p className="whitespace-pre-line">{message.message}</p>
        <p className="mt-1 text-xs text-soft-ink">{message.guest_name}, {formatSubmittedAt(message.created_at)}</p>
      </div>
      <div className="flex">
        {message.status !== "approved" && <button type="button" aria-label={`Approve message from ${message.guest_name}`} title="Approve" className={ROW_BUTTON} onClick={() => run(() => updateMessage(message.id, { status: "approved" }), "Message published.")}><Check className="size-4" /></button>}
        {message.status !== "rejected" && <button type="button" aria-label={`Reject message from ${message.guest_name}`} title="Reject" className={ROW_BUTTON} onClick={() => run(() => updateMessage(message.id, { status: "rejected", is_featured: false }), "Message rejected.")}><X className="size-4" /></button>}
        {message.status === "approved" && <button type="button" aria-label={message.is_featured ? "Stop featuring" : "Feature message"} aria-pressed={message.is_featured} title="Feature" className={ROW_BUTTON} onClick={() => run(() => updateMessage(message.id, { is_featured: !message.is_featured }))}><Star className={`size-4 ${message.is_featured ? "fill-taupe text-taupe" : ""}`} /></button>}
        <button type="button" aria-label={`Delete message from ${message.guest_name}`} title="Delete" className={`${ROW_BUTTON} text-[#9a3b2f]`} onClick={remove}><Trash2 className="size-4" /></button>
      </div>
    </li>
  );
}

export function GuestPhotosManager({ uploads, previews, controls }: { uploads: GuestUploadRow[]; previews: Record<string, string>; controls: SiteControls }) {
  const { isBusy, run } = useActionRunner();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const pending = uploads.filter((upload) => upload.status === "pending");

  return (
    <>
      <PageTitle title="Guest Photos" description="Photos guests share after the event. Approved photos join the Guest Moments album." actions={<button type="button" className="btn btn-line" onClick={() => setIsQrOpen(true)}><QrCode className="size-4" /> Upload QR Code</button>} />
      <div className="mb-5"><Panel><Toggle label="Allow guests to upload photos" checked={controls.guest_uploads_enabled} disabled={isBusy} onChange={(value) => run(() => saveControls({ guest_uploads_enabled: value }), value ? "Guest uploads opened." : "Guest uploads closed.")} /></Panel></div>
      <Panel title={`Waiting for review (${pending.length})`}>
        {pending.length === 0 ? <EmptyState>No photos are waiting for review.</EmptyState> : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {pending.map((upload) => <UploadCard key={upload.id} upload={upload} url={previews[upload.storage_path]} />)}
          </ul>
        )}
      </Panel>
      {isQrOpen && <QrShare title="Guest photo upload" url={`${SITE_URL}/upload`} fileName="guest-photo-upload-qr.png" onClose={() => setIsQrOpen(false)} />}
    </>
  );
}

function UploadCard({ upload, url }: { upload: GuestUploadRow; url?: string }) {
  const { confirm } = useFeedback();
  const { run } = useActionRunner();

  const remove = async () => {
    const isConfirmed = await confirm({ title: "Delete this photo?", body: "It will be permanently deleted and never shown to guests.", confirmLabel: "Delete" });
    if (isConfirmed) await run(() => deleteGuestUpload(upload.id), "Photo deleted.");
  };

  return (
    <li className="border border-beige">
      <div className="relative aspect-square bg-beige">{url && <Image src={url} alt={`Shared by ${upload.uploader_name}`} fill unoptimized className="object-cover" />}</div>
      <p className="truncate px-2 pt-2 text-xs text-soft-ink">{upload.uploader_name}</p>
      <div className="flex justify-end">
        <button type="button" aria-label={`Approve photo from ${upload.uploader_name}`} className={ROW_BUTTON} onClick={() => run(() => approveGuestUpload(upload.id), "Photo published.")}><Check className="size-4" /></button>
        <button type="button" aria-label={`Delete photo from ${upload.uploader_name}`} className={`${ROW_BUTTON} text-[#9a3b2f]`} onClick={remove}><Trash2 className="size-4" /></button>
      </div>
    </li>
  );
}
