"use client";

import { useState } from "react";
import { saveDraftSettings } from "@/lib/actions/admin-settings";
import type { EventSettings } from "@/lib/types";
import type { SettingsDraftInput } from "@/lib/validation/settings";
import { useActionRunner } from "./feedback";

type TextKey = { [K in keyof EventSettings]: EventSettings[K] extends string ? K : never }[keyof EventSettings];

/** Holds edits to the draft settings until the admin presses Save Changes. */
export function useDraftForm<K extends keyof SettingsDraftInput>(initial: Pick<EventSettings, K & keyof EventSettings>) {
  const [values, setValues] = useState(initial);
  const { isBusy, run } = useActionRunner();

  const set = <F extends K & keyof EventSettings>(key: F, value: EventSettings[F]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const bind = (key: K & TextKey) => ({
    value: values[key as keyof typeof values] as string,
    onChange: (value: string) => set(key as K & keyof EventSettings, value as never),
  });

  const save = () => run(() => saveDraftSettings(values as SettingsDraftInput), "Saved. Publish when you're ready for guests to see it.");

  return { values, set, bind, save, isBusy };
}
