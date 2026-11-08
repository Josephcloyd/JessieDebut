"use client";

import { Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { saveControls } from "@/lib/actions/admin-settings";
import { AUDIO_ACCEPT, validateUpload } from "@/lib/domain/upload-rules";
import type { SiteControls } from "@/lib/types";
import { useActionRunner, useFeedback } from "./feedback";
import { PageTitle, Panel, TextInput, Toggle } from "./fields";
import { uploadAudio } from "./upload";

export function MusicManager({ controls }: { controls: SiteControls }) {
  const { notify } = useFeedback();
  const { isBusy, run } = useActionRunner();
  const [title, setTitle] = useState(controls.music_title);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = validateUpload({ kind: "audio", contentType: file.type, size: file.size });
    if (problem) {
      notify(problem, true);
      return;
    }
    setIsUploading(true);
    try {
      const asset = await uploadAudio(file);
      await run(() => saveControls({ music_url: asset.url }), "Music updated.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "The upload didn't finish.", true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <PageTitle title="Music" description="Music stays off until a guest presses play. Changes go live when saved." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Track">
          <div className="space-y-4">
            {controls.music_url ? <audio controls preload="none" src={controls.music_url} className="w-full" /> : <p className="text-sm text-soft-ink">No music uploaded yet.</p>}
            <label className={`btn btn-solid ${isUploading ? "pointer-events-none opacity-70" : ""}`}>
              <Upload className="size-4" /> {isUploading ? "Uploading" : controls.music_url ? "Replace Music" : "Upload Music"}
              <input type="file" accept={AUDIO_ACCEPT} className="sr-only" onChange={upload} disabled={isUploading} />
            </label>
            <p className="text-xs text-soft-ink">MP3, M4A or AAC, up to 25 MB.</p>
          </div>
        </Panel>
        <Panel title="Settings">
          <div className="space-y-4">
            <Toggle label="Offer music on the invitation" checked={controls.music_enabled} disabled={isBusy || !controls.music_url} onChange={(value) => run(() => saveControls({ music_enabled: value }), value ? "Music turned on." : "Music turned off.")} />
            <TextInput label="Track name" value={title} onChange={setTitle} />
            <button type="button" className="btn btn-line" disabled={isBusy} onClick={() => run(() => saveControls({ music_title: title }), "Track name saved.")}>Save Name</button>
          </div>
        </Panel>
      </div>
    </>
  );
}
