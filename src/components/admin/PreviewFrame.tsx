"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "./fields";

const WIDTHS = { Phone: "390px", Tablet: "820px", Desktop: "100%" } as const;
type Device = keyof typeof WIDTHS;

export function PreviewFrame() {
  const [device, setDevice] = useState<Device>("Phone");

  return (
    <>
      <PageTitle
        title="Preview"
        description="Your saved draft, exactly as guests will see it after you publish. RSVP and wish forms are turned off here."
        actions={<a href="/admin/preview" target="_blank" rel="noopener noreferrer" className="btn btn-line"><ExternalLink className="size-4" /> Open Full Page</a>}
      />
      <div className="mb-4 flex gap-1" role="group" aria-label="Preview size">
        {(Object.keys(WIDTHS) as Device[]).map((option) => (
          <button key={option} type="button" aria-pressed={device === option} onClick={() => setDevice(option)} className={`min-h-11 px-4 text-sm ${device === option ? "bg-umber text-ivory" : "hover:bg-beige"}`}>{option}</button>
        ))}
      </div>
      <div className="flex justify-center bg-beige p-3">
        <iframe src="/admin/preview" title="Invitation preview" className="h-[75svh] max-w-full border-0 bg-ivory" style={{ width: WIDTHS[device] }} />
      </div>
    </>
  );
}
