"use client";

import { ClipboardList, Download, Pencil, Plus, QrCode, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { applyCompanionAllowanceToAll, deleteGuest } from "@/lib/actions/admin-guests";
import { saveControls } from "@/lib/actions/admin-settings";
import { formatSubmittedAt } from "@/lib/domain/time";
import type { GuestWithRsvp, SiteControls } from "@/lib/types";
import { useActionRunner, useFeedback } from "./feedback";
import { EmptyState, PageTitle, Panel, TextInput, Toggle } from "./fields";
import { BulkGuestForm, GuestForm, QrShare, ResponseForm, inviteLink } from "./GuestDialogs";

type Filter = "all" | "attending" | "declined" | "pending";
type Dialog =
  | { kind: "add" }
  | { kind: "bulk" }
  | { kind: "edit"; guest: GuestWithRsvp }
  | { kind: "response"; guest: GuestWithRsvp }
  | { kind: "share"; guest: GuestWithRsvp };

const FILTERS: [Filter, string][] = [["all", "All"], ["attending", "Confirmed"], ["declined", "Declined"], ["pending", "Pending"]];
const statusOf = (guest: GuestWithRsvp): Exclude<Filter, "all"> => guest.rsvp?.status ?? "pending";
const STATUS_LABEL = { attending: "Confirmed", declined: "Declined", pending: "Pending" };
const STATUS_STYLE = { attending: "bg-umber text-ivory", declined: "border border-taupe text-soft-ink", pending: "bg-beige text-umber" };

export function GuestManager({ guests, controls }: { guests: GuestWithRsvp[]; controls: SiteControls }) {
  const { isBusy, run } = useActionRunner();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [allowance, setAllowance] = useState(controls.default_max_companions);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesFilter = filter === "all" || statusOf(guest) === filter;
      const haystack = `${guest.full_name} ${guest.email ?? ""} ${guest.phone ?? ""} ${guest.invite_code}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [guests, query, filter]);

  const attending = guests.filter((guest) => guest.rsvp?.status === "attending");
  const expected = attending.reduce((sum, guest) => sum + 1 + (guest.rsvp?.companions ?? 0), 0);
  const close = () => setDialog(null);

  return (
    <>
      <PageTitle
        title="RSVP & Guests"
        description={`${guests.length} invited, ${attending.length} confirmed, ${expected} expected attendees including companions.`}
        actions={
          <>
            <a href="/api/admin/guests-export" className="btn btn-line"><Download className="size-4" /> Export CSV</a>
            <button type="button" className="btn btn-line" onClick={() => setDialog({ kind: "bulk" })}><Users className="size-4" /> Add Many</button>
            <button type="button" className="btn btn-solid" onClick={() => setDialog({ kind: "add" })}><Plus className="size-4" /> Add Guest</button>
          </>
        }
      />
      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <Panel title="RSVP submissions">
          <Toggle label={controls.rsvp_open ? "RSVPs are open" : "RSVPs are closed"} checked={controls.rsvp_open} disabled={isBusy} onChange={(value) => run(() => saveControls({ rsvp_open: value }), value ? "RSVPs reopened." : "RSVPs closed.")} />
        </Panel>
        <Panel title="Companion allowance">
          <div className="flex items-end gap-3">
            <div className="flex-1"><TextInput label="Default per guest" type="number" value={String(allowance)} onChange={(value) => setAllowance(Number(value))} /></div>
            <button type="button" className="btn btn-line" disabled={isBusy} onClick={() => run(() => saveControls({ default_max_companions: allowance }), "Default saved.")}>Save</button>
            <ApplyToAll allowance={allowance} />
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input aria-label="Search guests" type="search" placeholder="Search by name, email, phone or code" className="field min-w-56 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {FILTERS.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 px-3 text-sm ${filter === value ? "bg-umber text-ivory" : "hover:bg-beige"}`}>{label}</button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? <EmptyState>{guests.length === 0 ? "Add your first guest to create a personal invitation link." : "No guests match your search."}</EmptyState> : (
          <ul className="divide-y divide-beige">
            {visible.map((guest) => <GuestRow key={guest.id} guest={guest} onDialog={setDialog} />)}
          </ul>
        )}
      </Panel>

      {dialog?.kind === "add" && <GuestForm guest={null} defaultCompanions={controls.default_max_companions} onClose={close} />}
      {dialog?.kind === "bulk" && <BulkGuestForm defaultCompanions={controls.default_max_companions} onClose={close} />}
      {dialog?.kind === "edit" && <GuestForm guest={dialog.guest} defaultCompanions={controls.default_max_companions} onClose={close} />}
      {dialog?.kind === "response" && <ResponseForm guest={dialog.guest} onClose={close} />}
      {dialog?.kind === "share" && <QrShare title={`Invitation for ${dialog.guest.full_name}`} url={inviteLink(dialog.guest.invite_code)} fileName={`invitation-${dialog.guest.invite_code}.png`} onClose={close} />}
    </>
  );
}

function ApplyToAll({ allowance }: { allowance: number }) {
  const { confirm } = useFeedback();
  const { isBusy, run } = useActionRunner();

  const apply = async () => {
    const isConfirmed = await confirm({ title: "Apply to every guest?", body: `All guests will be allowed ${allowance} companion(s). Individual allowances will be overwritten.`, confirmLabel: "Apply to All" });
    if (isConfirmed) await run(() => applyCompanionAllowanceToAll(allowance), "Allowance applied to all guests.");
  };

  return <button type="button" className="btn btn-line" disabled={isBusy} onClick={apply}>Apply to All</button>;
}

const ROW_BUTTON = "flex size-10 items-center justify-center hover:bg-beige";

function GuestRow({ guest, onDialog }: { guest: GuestWithRsvp; onDialog: (dialog: Dialog) => void }) {
  const { confirm } = useFeedback();
  const { run } = useActionRunner();
  const status = statusOf(guest);

  const remove = async () => {
    const isConfirmed = await confirm({ title: `Remove ${guest.full_name}?`, body: "The guest, their personal link and any RSVP will be permanently deleted.", confirmLabel: "Remove Guest" });
    if (isConfirmed) await run(() => deleteGuest(guest.id), "Guest removed.");
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
      <div className="min-w-48 flex-1">
        <p className="font-medium">{guest.full_name}{guest.rsvp && guest.rsvp.companions > 0 && <span className="text-soft-ink"> +{guest.rsvp.companions}</span>}</p>
        <p className="text-xs text-soft-ink">{[guest.rsvp?.email ?? guest.email, guest.rsvp?.phone ?? guest.phone].filter(Boolean).join(", ") || `Code ${guest.invite_code}`}</p>
        {guest.rsvp?.dietary && <p className="text-xs text-soft-ink">Dietary: {guest.rsvp.dietary}</p>}
        {guest.rsvp?.message && <p className="mt-1 text-xs italic text-soft-ink">“{guest.rsvp.message}”</p>}
        {guest.rsvp && <p className="text-xs text-soft-ink">Submitted {formatSubmittedAt(guest.rsvp.submitted_at)}</p>}
      </div>
      <span className={`px-2 py-0.5 text-xs ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
      <div className="flex">
        <button type="button" title="Invitation link and QR" aria-label={`Invitation link for ${guest.full_name}`} className={ROW_BUTTON} onClick={() => onDialog({ kind: "share", guest })}><QrCode className="size-4" /></button>
        <button type="button" title="Update response" aria-label={`Update response for ${guest.full_name}`} className={ROW_BUTTON} onClick={() => onDialog({ kind: "response", guest })}><ClipboardList className="size-4" /></button>
        <button type="button" title="Edit guest" aria-label={`Edit ${guest.full_name}`} className={ROW_BUTTON} onClick={() => onDialog({ kind: "edit", guest })}><Pencil className="size-4" /></button>
        <button type="button" title="Remove guest" aria-label={`Remove ${guest.full_name}`} className={`${ROW_BUTTON} text-[#9a3b2f]`} onClick={remove}><Trash2 className="size-4" /></button>
      </div>
    </li>
  );
}
