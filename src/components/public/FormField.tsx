import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block text-[0.62rem] text-soft-ink">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-soft-ink">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-[#9a3b2f]">{error}</p>}
    </div>
  );
}

/** Invisible to people. Bots that fill every field reveal themselves here. */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <label>
        Leave this empty
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    </div>
  );
}
