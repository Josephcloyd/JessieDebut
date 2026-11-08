"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { IMAGE_ACCEPT } from "@/lib/domain/upload-rules";
import { useFeedback } from "./feedback";
import { uploadPublicImage, type AssetFolder } from "./upload";

export function Panel({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="border border-beige bg-white p-5 md:p-6">
      {title && <h2 className="font-editorial text-xl">{title}</h2>}
      {description && <p className="mt-1 text-sm text-soft-ink">{description}</p>}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-editorial text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-soft-ink">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  hint?: string;
  placeholder?: string;
}

export function TextInput({ label, value, onChange, multiline, type = "text", hint, placeholder }: TextInputProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-soft-ink">{label}</label>
      {multiline ? (
        <textarea id={id} rows={4} className="field" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} type={type} className="field" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && <p className="mt-1 text-xs text-soft-ink">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-champagne transition-colors peer-checked:bg-umber peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-umber peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

interface ImageFieldProps {
  label: string;
  value: string | null;
  folder: AssetFolder;
  onChange: (url: string | null, path: string | null) => void;
}

export function ImageField({ label, value, folder, onChange }: ImageFieldProps) {
  const { notify } = useFeedback();
  const [isUploading, setIsUploading] = useState(false);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const asset = await uploadPublicImage(file, folder);
      onChange(asset.url, asset.path);
    } catch (error) {
      notify(error instanceof Error ? error.message : "The upload didn't finish.", true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-soft-ink">{label}</p>
      <div className="flex items-center gap-4">
        <div className="relative size-28 shrink-0 overflow-hidden border border-beige bg-ivory">
          {value ? <Image src={value} alt="" fill unoptimized className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto size-6 text-taupe" strokeWidth={1.2} />}
        </div>
        <div className="flex flex-col gap-2">
          <label className={`btn btn-line !min-h-10 !px-4 !py-2 ${isUploading ? "pointer-events-none opacity-60" : ""}`}>
            {isUploading && <LoaderCircle className="size-4 animate-spin" />}
            {isUploading ? "Uploading" : value ? "Replace" : "Upload"}
            <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={choose} disabled={isUploading} />
          </label>
          {value && (
            <button type="button" className="inline-flex items-center gap-1 text-xs text-[#9a3b2f]" onClick={() => onChange(null, null)}>
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-champagne px-6 py-12 text-center text-sm text-soft-ink">{children}</p>;
}
