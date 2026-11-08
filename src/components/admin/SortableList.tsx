"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { reorderItems } from "@/lib/actions/admin-gallery";
import { useFeedback } from "./feedback";

type SortableTable = "gallery_albums" | "gallery_photos" | "debut_participants" | "event_program";

const TOUCH_HOLD_MS = 180;

/** Applies a just-made drag order on top of what the server last sent. */
function applyOrder<T extends { id: string }>(items: T[], order: string[] | null): T[] {
  if (!order) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const arranged = order.flatMap((id) => byId.get(id) ?? []);
  const known = new Set(order);
  return [...arranged, ...items.filter((item) => !known.has(item.id))];
}

interface SortableListProps<T> {
  items: T[];
  table: SortableTable;
  layout?: "list" | "grid";
  className?: string;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}

export function SortableList<T extends { id: string }>({ items, table, layout = "list", className, renderItem }: SortableListProps<T>) {
  const contextId = useId();
  const router = useRouter();
  const { notify } = useFeedback();
  const [order, setOrder] = useState<string[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_HOLD_MS, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const visible = applyOrder(items, order);
  const ids = visible.map((item) => item.id);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrder(next);
    const result = await reorderItems({ table, ids: next });
    if (result.ok) {
      router.refresh();
    } else {
      setOrder(null);
      notify(result.error, true);
    }
  };

  return (
    <DndContext id={contextId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {visible.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
      className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center text-taupe hover:text-umber"
    >
      <GripVertical className="size-5" strokeWidth={1.4} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined, opacity: isDragging ? 0.75 : 1 }}>
      {children(handle)}
    </div>
  );
}
