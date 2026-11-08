"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { deleteParticipant, saveParticipant } from "@/lib/actions/admin-content";
import { saveDraftSettings } from "@/lib/actions/admin-settings";
import type { Participant, TraditionKey, TraditionsConfig } from "@/lib/types";
import { Modal, useActionRunner, useFeedback } from "./feedback";
import { EmptyState, ImageField, PageTitle, Panel, TextInput, Toggle } from "./fields";
import { SortableList } from "./SortableList";

const KEYS: TraditionKey[] = ["roses", "candles", "treasures", "blue_bills", "wishes"];

const MESSAGE_LABEL: Record<TraditionKey, string> = {
  roses: "Note",
  candles: "Personal wish",
  treasures: "Gift or description",
  blue_bills: "Note",
  wishes: "Message",
};

export function TraditionsManager({ config, participants }: { config: TraditionsConfig; participants: Participant[] }) {
  const { isBusy, run } = useActionRunner();
  const [draft, setDraft] = useState(config);
  const [active, setActive] = useState<TraditionKey>("roses");
  const [editing, setEditing] = useState<Participant | "new" | null>(null);
  const people = participants.filter((person) => person.tradition === active);
  const setField = (patch: Partial<TraditionsConfig[TraditionKey]>) => setDraft((current) => ({ ...current, [active]: { ...current[active], ...patch } }));
  const save = () => run(() => saveDraftSettings({ traditions: draft }), "Saved. Publish when you're ready for guests to see it.");

  return (
    <>
      <PageTitle title="18 Traditions" description="Only enabled traditions appear on the invitation. Names go live when saved. Titles and on/off switches go live on Publish." actions={<button type="button" className="btn btn-solid" onClick={save} disabled={isBusy}>Save Changes</button>} />
      <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-beige" role="tablist">
        {KEYS.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={key === active} onClick={() => setActive(key)} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm ${key === active ? "border-umber" : "border-transparent text-soft-ink"}`}>
            {draft[key].title} {!draft[key].enabled && <span className="text-xs">(off)</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Panel title="Section">
          <div className="space-y-4">
            <Toggle label="Show on the invitation" checked={draft[active].enabled} onChange={(enabled) => setField({ enabled })} />
            <TextInput label="Title" value={draft[active].title} onChange={(title) => setField({ title })} />
            <TextInput label="Introduction" multiline value={draft[active].intro} onChange={(intro) => setField({ intro })} />
          </div>
        </Panel>
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-editorial text-xl">Participants ({people.length} of 18)</h2>
            <button type="button" className="btn btn-line !min-h-10 !px-3 !py-2" onClick={() => setEditing("new")}><Plus className="size-4" /> Add</button>
          </div>
          {people.length === 0 ? <EmptyState>Add the first participant.</EmptyState> : (
            <SortableList key={active} items={people} table="debut_participants" className="divide-y divide-beige" renderItem={(person, handle) => <ParticipantRow person={person} handle={handle} onEdit={() => setEditing(person)} />} />
          )}
        </Panel>
      </div>
      {editing && <ParticipantForm tradition={active} person={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ParticipantRow({ person, handle, onEdit }: { person: Participant; handle: React.ReactNode; onEdit: () => void }) {
  const { confirm } = useFeedback();
  const { run } = useActionRunner();

  const remove = async () => {
    const isConfirmed = await confirm({ title: `Remove ${person.name}?`, body: "This participant will be permanently removed.", confirmLabel: "Remove" });
    if (isConfirmed) await run(() => deleteParticipant(person.id), "Participant removed.");
  };

  return (
    <div className={`flex items-center gap-2 bg-white py-2 ${person.is_visible ? "" : "opacity-60"}`}>
      {handle}
      <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-beige">
        {person.photo_url && <Image src={person.photo_url} alt="" fill unoptimized className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate">{person.name}</p>
        <p className="truncate text-xs text-soft-ink">{person.relationship || person.message}</p>
      </div>
      <button type="button" aria-label={person.is_visible ? `Hide ${person.name}` : `Show ${person.name}`} className="flex size-10 items-center justify-center" onClick={() => run(() => saveParticipant(person.id, { ...person, is_visible: !person.is_visible }))}>{person.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
      <button type="button" aria-label={`Edit ${person.name}`} className="flex size-10 items-center justify-center" onClick={onEdit}><Pencil className="size-4" /></button>
      <button type="button" aria-label={`Remove ${person.name}`} className="flex size-10 items-center justify-center text-[#9a3b2f]" onClick={remove}><Trash2 className="size-4" /></button>
    </div>
  );
}

function ParticipantForm({ tradition, person, onClose }: { tradition: TraditionKey; person: Participant | null; onClose: () => void }) {
  const { isBusy, run } = useActionRunner();
  const [values, setValues] = useState({
    name: person?.name ?? "",
    relationship: person?.relationship ?? "",
    message: person?.message ?? "",
    photo_url: person?.photo_url ?? null,
    photo_path: person?.photo_path ?? null,
  });

  const save = async () => {
    const result = await run(() => saveParticipant(person?.id ?? null, { ...values, tradition, is_visible: person?.is_visible ?? true }), "Participant saved.");
    if (result.ok) onClose();
  };

  return (
    <Modal title={person ? "Edit Participant" : "Add Participant"} onClose={onClose}>
      <div className="space-y-4">
        <ImageField label="Photo (optional)" value={values.photo_url} folder="participants" onChange={(photo_url, photo_path) => setValues((current) => ({ ...current, photo_url, photo_path }))} />
        <TextInput label="Name" value={values.name} onChange={(name) => setValues((current) => ({ ...current, name }))} />
        <TextInput label="Relationship (optional)" value={values.relationship} onChange={(relationship) => setValues((current) => ({ ...current, relationship }))} />
        <TextInput label={MESSAGE_LABEL[tradition]} multiline value={values.message} onChange={(message) => setValues((current) => ({ ...current, message }))} />
        <div className="flex justify-end"><button type="button" className="btn btn-solid" onClick={save} disabled={isBusy || !values.name.trim()}>Save</button></div>
      </div>
    </Modal>
  );
}
