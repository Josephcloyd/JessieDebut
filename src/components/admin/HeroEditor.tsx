"use client";

import Image from "next/image";
import type { EventSettings } from "@/lib/types";
import { ImageField, PageTitle, Panel, TextInput, Toggle } from "./fields";
import { useDraftForm } from "./useDraftForm";

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-semibold text-soft-ink">
      {label}: {value}%
      <input type="range" min={0} max={100} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 block w-full accent-umber" />
    </label>
  );
}

export function HeroEditor({ settings }: { settings: EventSettings }) {
  const { values, set, bind, save, isBusy } = useDraftForm({
    hero_eyebrow: settings.hero_eyebrow,
    hero_description: settings.hero_description,
    hero_cta: settings.hero_cta,
    hero_image_url: settings.hero_image_url,
    hero_image_position: settings.hero_image_position,
    hero_cutout_url: settings.hero_cutout_url,
    hero_masthead_light: settings.hero_masthead_light,
  });
  const [x, y] = values.hero_image_position.split(" ").map((part) => Number.parseInt(part, 10));

  return (
    <>
      <PageTitle
        title="Hero Section"
        description="The first thing guests see after opening the envelope."
        actions={<button type="button" className="btn btn-solid" onClick={save} disabled={isBusy}>{isBusy ? "Saving" : "Save Changes"}</button>}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Portrait">
          <div className="space-y-5">
            <ImageField label="Background photograph" value={values.hero_image_url} folder="hero" onChange={(url) => set("hero_image_url", url)} />
            <Slider label="Horizontal focus" value={x} onChange={(next) => set("hero_image_position", `${next}% ${y}%`)} />
            <Slider label="Vertical focus" value={y} onChange={(next) => set("hero_image_position", `${x}% ${next}%`)} />
            <p className="text-xs text-soft-ink">You can also choose any public gallery photo from the Gallery page.</p>
            <ImageField label="Cutout for the masthead (optional)" value={values.hero_cutout_url} folder="hero" onChange={(url) => set("hero_cutout_url", url)} />
            <p className="text-xs text-soft-ink">The same photo, same size, with its background removed. Her head will then overlap the name, like a magazine cover.</p>
            <Toggle label="Light-colored name with a soft shade behind it (turn off for a dark name)" checked={values.hero_masthead_light} onChange={(value) => set("hero_masthead_light", value)} />
          </div>
        </Panel>
        <Panel title="Phone preview">
          <div className="relative mx-auto aspect-[9/16] w-52 overflow-hidden bg-beige">
            {values.hero_image_url && <Image src={values.hero_image_url} alt="" fill unoptimized className="object-cover" style={{ objectPosition: values.hero_image_position }} />}
          </div>
        </Panel>
        <Panel title="Text">
          <div className="space-y-4">
            <TextInput label="Heading above the name" {...bind("hero_eyebrow")} />
            <TextInput label="Description" multiline {...bind("hero_description")} />
            <TextInput label="Button text" {...bind("hero_cta")} hint="Leave empty to hide the button." />
          </div>
        </Panel>
      </div>
    </>
  );
}
