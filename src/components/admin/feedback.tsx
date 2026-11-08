"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";

interface Toast {
  id: number;
  message: string;
  isError: boolean;
}

interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
}

interface FeedbackApi {
  notify: (message: string, isError?: boolean) => void;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);
const TOAST_MS = 4000;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const notify = useCallback((message: string, isError = false) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, message, isError }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  const confirm = useCallback((next: ConfirmRequest) => {
    resolver.current?.(false);
    setRequest(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  };

  const api = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} role={toast.isError ? "alert" : "status"} className={`px-4 py-3 text-sm text-ivory shadow-soft ${toast.isError ? "bg-[#9a3b2f]" : "bg-umber"}`}>
            {toast.message}
          </p>
        ))}
      </div>
      {request && (
        <Modal title={request.title} onClose={() => answer(false)}>
          <p className="leading-relaxed text-soft-ink">{request.body}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn btn-line" onClick={() => answer(false)}>Cancel</button>
            <button type="button" className="btn bg-[#9a3b2f] text-ivory" onClick={() => answer(true)}>{request.confirmLabel}</button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error("useFeedback must be used inside FeedbackProvider");
  return api;
}

interface ActionRunner {
  isBusy: boolean;
  run: <T>(action: () => Promise<ActionResult<T>>, successMessage?: string) => Promise<ActionResult<T>>;
}

/** Runs a server action, reports the outcome, and reloads the page's data. */
export function useActionRunner(): ActionRunner {
  const { notify } = useFeedback();
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  const run: ActionRunner["run"] = async (action, successMessage) => {
    setIsBusy(true);
    try {
      const result = await action();
      if (result.ok) {
        if (successMessage) notify(successMessage);
        router.refresh();
      } else {
        notify(result.error, true);
      }
      return result;
    } catch (error) {
      console.error("[admin action]", error);
      const message = "We couldn't reach the server. Please check your connection.";
      notify(message, true);
      return { ok: false, error: message };
    } finally {
      setIsBusy(false);
    }
  };

  return { isBusy, run };
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

/** Moves focus into the dialog, keeps Tab inside it, closes on Escape and restores focus after. */
function useDialogKeyboard(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const latestOnClose = useRef(onClose);

  useEffect(() => {
    latestOnClose.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    focusable()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        latestOnClose.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return panelRef;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const panelRef = useDialogKeyboard(onClose);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-umber/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={panelRef} className={`max-h-[92svh] w-full overflow-y-auto bg-ivory p-6 shadow-soft ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-editorial text-2xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center hover:bg-beige"><X className="size-5" strokeWidth={1.4} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
