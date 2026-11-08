"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProgramItem, saveProgramItem } from "@/lib/actions/admin-content";
import { formatProgramTime } from "@/lib/domain/time";
import type { ProgramItem } from "@/lib/types";
import { Modal, useActionRunner, useFeedback } from "./feedback";
import { EmptyState, ImageField, PageTitle, Panel, TextInput } from "./fields";
import { SortableList } from "./SortableList";

export function ProgramManager({ items }: { items: ProgramItem[] }) {
  const [editing, setEditing] = useState<ProgramItem | "new" | null>(null);

  return (
    <>
      <PageTitle title="Program" description="Drag to change the sequence. Changes go live when saved." actions={<button type="button" className="btn btn-solid" onClick={() => setEditing("new")}><Plus className="size-4" /> Add Activity</button>} />
      <Panel>
        {items.length === 0 ? <EmptyState>Add the first activity.</EmptyState> : (
          <SortableList items={items} table="event_program" className="divide-y divide-beige" renderItem={(item, handle) => <ProgramRow item={item} handle={handle} onEdit={() => setEditing(item)} />} />
        )}
      </Panel>
      {editing && <ProgramForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ProgramRow({ item, handle, onEdit }: { item: ProgramItem; handle: React.ReactNode; onEdit: () => void }) {
  const { confirm } = useFeedback();
  const { run } = useActionRunner();

  const remove = async () => {
    const isConfirmed = await confirm({ title: `Remove "${item.title}"?`, body: "This activity will be permanently removed from the program.", confirmLabel: "Remove" });
    if (isConfirmed) await run(() => deleteProgramItem(item.id), "Activity removed.");
  };

  return (
    <div className={`flex items-center gap-2 bg-white py-2 ${item.is_visible ? "" : "opacity-60"}`}>
      {handle}
      <span className="w-20 shrink-0 text-xs text-soft-ink">{formatProgramTime(item.start_time)}</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate">{item.title}</p>
        <p className="truncate text-xs text-soft-ink">{item.description}</p>
      </div>
      <button type="button" aria-label={item.is_visible ? `Hide ${item.title}` : `Show ${item.title}`} className="flex size-10 items-center justify-center" onClick={() => run(() => saveProgramItem(item.id, { ...item, start_time: item.start_time ?? "", is_visible: !item.is_visible }))}>{item.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
      <button type="button" aria-label={`Edit ${item.title}`} className="flex size-10 items-center justify-center" onClick={onEdit}><Pencil className="size-4" /></button>
      <button type="button" aria-label={`Remove ${item.title}`} className="flex size-10 items-center justify-center text-[#9a3b2f]" onClick={remove}><Trash2 className="size-4" /></button>
    </div>
  );
}

function ProgramForm({ item, onClose }: { item: ProgramItem | null; onClose: () => void }) {
  const { isBusy, run } = useActionRunner();
  const [values, setValues] = useState({
    title: item?.title ?? "",
    start_time: item?.start_time?.slice(0, 5) ?? "",
    description: item?.description ?? "",
    image_url: item?.image_url ?? null,
    image_path: item?.image_path ?? null,
  });

  const save = async () => {
    const result = await run(() => saveProgramItem(item?.id ?? null, { ...values, is_visible: item?.is_visible ?? true }), "Activity saved.");
    if (result.ok) onClose();
  };

  return (
    <Modal title={item ? "Edit Activity" : "Add Activity"} onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Title" value={values.title} onChange={(title) => setValues((current) => ({ ...current, title }))} />
        <TextInput label="Time" type="time" value={values.start_time} onChange={(start_time) => setValues((current) => ({ ...current, start_time }))} />
        <TextInput label="Description" multiline value={values.description} onChange={(description) => setValues((current) => ({ ...current, description }))} />
        <ImageField label="Image (optional)" value={values.image_url} folder="program" onChange={(image_url, image_path) => setValues((current) => ({ ...current, image_url, image_path }))} />
        <div className="flex justify-end"><button type="button" className="btn btn-solid" onClick={save} disabled={isBusy || !values.title.trim()}>Save</button></div>
      </div>
    </Modal>
  );
}
