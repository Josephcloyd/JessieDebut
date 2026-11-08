"use client";

import { useState, type FormEvent } from "react";
import { confirmGuestUpload, createGuestUploadTicket } from "@/lib/actions/guest";
import { IMAGE_ACCEPT } from "@/lib/domain/upload-rules";
import { prepareImage, sendToStorage } from "@/lib/upload/client";
import { FormField } from "./FormField";

const MAX_FILES_PER_VISIT = 10;

async function uploadOne(original: File, uploaderName: string): Promise<void> {
  const prepared = await prepareImage(original);
  const ticket = await createGuestUploadTicket({ contentType: prepared.file.type, size: prepared.file.size });
  if (!ticket.ok) throw new Error(ticket.error);
  await sendToStorage("private-media", ticket.data.path, ticket.data.token, prepared.file);
  const confirmed = await confirmGuestUpload({
    uploaderName,
    photo: {
      storagePath: ticket.data.path,
      caption: "",
      width: prepared.width,
      height: prepared.height,
      blurDataUrl: prepared.blurDataUrl,
    },
  });
  if (!confirmed.ok) throw new Error(confirmed.error);
}

export function GuestPhotoUpload() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const [isDone, setIsDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError(undefined);
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Sending photo ${index + 1} of ${files.length}`);
        await uploadOne(file, name.trim());
      }
      setIsDone(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The upload didn't finish. Please try again.");
    } finally {
      setProgress(undefined);
    }
  };

  if (isDone) {
    return <p role="status" className="mt-6 font-display text-2xl italic text-soft-ink">Thank you for sharing. Your photos will appear after review.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5 text-left">
      <FormField id="upload-name" label="Your Name">
        <input id="upload-name" className="field" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField id="upload-files" label={`Photos (up to ${MAX_FILES_PER_VISIT})`}>
        <input
          id="upload-files"
          type="file"
          multiple
          accept={IMAGE_ACCEPT}
          className="field"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_FILES_PER_VISIT))}
        />
      </FormField>
      {error && <p role="alert" className="text-sm text-[#9a3b2f]">{error}</p>}
      <button type="submit" disabled={files.length === 0 || Boolean(progress)} className="btn btn-solid w-full">{progress ?? "Share Photos"}</button>
    </form>
  );
}
