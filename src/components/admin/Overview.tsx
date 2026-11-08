import { formatSubmittedAt } from "@/lib/domain/time";
import type { AdminStats, RsvpRow } from "@/lib/types";
import { EmptyState, PageTitle, Panel } from "./fields";

// Validated for color-blind separation and 3:1 contrast on white.
const SERIES = {
  attending: { label: "Confirmed", color: "#A8741A" },
  pending: { label: "Pending", color: "#2C78B4" },
  declined: { label: "Declined", color: "#C05A3C" },
} as const;

const TIMELINE_DAYS = 14;
const DAY_MS = 86_400_000;
const MANILA_OFFSET_MS = 8 * 3_600_000;

function Tile({ label, value, emphasized }: { label: string; value: number; emphasized?: boolean }) {
  return (
    <div className={`border p-4 ${emphasized ? "border-umber bg-umber text-ivory" : "border-beige bg-white"}`}>
      <p className={`text-xs ${emphasized ? "text-beige" : "text-soft-ink"}`}>{label}</p>
      <p className="mt-1 font-display text-4xl leading-none tabular-nums">{value}</p>
    </div>
  );
}

function ResponseSplit({ stats, pending }: { stats: AdminStats; pending: number }) {
  const values = { attending: stats.attending, pending, declined: stats.declined };
  const entries = (Object.keys(SERIES) as (keyof typeof SERIES)[]).map((key) => ({ key, ...SERIES[key], value: values[key] }));
  const visible = entries.filter((entry) => entry.value > 0);

  return (
    <Panel title="Response status" description={`Out of ${stats.invited} invited guests`}>
      {stats.invited === 0 ? (
        <EmptyState>Add guests to see how responses are coming in.</EmptyState>
      ) : (
        <>
          <div className="flex h-8 gap-0.5" role="img" aria-label={entries.map((entry) => `${entry.label}: ${entry.value}`).join(", ")}>
            {visible.map((entry) => (
              <div key={entry.key} className="rounded-[4px] transition-opacity hover:opacity-80" style={{ flexGrow: entry.value, background: entry.color }} title={`${entry.label}: ${entry.value}`} />
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {entries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ background: entry.color }} aria-hidden="true" />
                {entry.label} <strong className="tabular-nums">{entry.value}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function dayKey(ms: number): string {
  return new Date(ms + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

function buildTimeline(rsvps: Pick<RsvpRow, "submitted_at">[], nowMs: number) {
  const counts = new Map<string, number>();
  rsvps.forEach((rsvp) => {
    const key = dayKey(Date.parse(rsvp.submitted_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from({ length: TIMELINE_DAYS }, (_, index) => {
    const key = dayKey(nowMs - (TIMELINE_DAYS - 1 - index) * DAY_MS);
    return { key, label: key.slice(5).replace("-", "/"), count: counts.get(key) ?? 0 };
  });
}

function ResponseTimeline({ days }: { days: ReturnType<typeof buildTimeline> }) {
  const max = Math.max(...days.map((day) => day.count), 1);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <Panel title="Responses per day" description={`Last ${TIMELINE_DAYS} days, ${total} in total`}>
      {total === 0 ? (
        <EmptyState>No responses in the last {TIMELINE_DAYS} days.</EmptyState>
      ) : (
        <>
          <div className="flex h-40 items-end gap-0.5 border-b border-beige">
            {days.map((day) => (
              <div key={day.key} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-[4px] bg-[#A8741A] group-hover:opacity-80" style={{ height: `${(day.count / max) * 100}%` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap bg-umber px-2 py-1 text-xs text-ivory group-hover:block">{day.label}: {day.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-soft-ink"><span>{days[0].label}</span><span>{days[days.length - 1].label}</span></div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-soft-ink">View as table</summary>
            <table className="mt-2 w-full text-left"><thead><tr><th scope="col" className="font-medium">Date</th><th scope="col" className="font-medium">Responses</th></tr></thead>
              <tbody>{days.filter((day) => day.count > 0).map((day) => <tr key={day.key}><td>{day.label}</td><td className="tabular-nums">{day.count}</td></tr>)}</tbody>
            </table>
          </details>
        </>
      )}
    </Panel>
  );
}

interface OverviewProps {
  stats: AdminStats;
  rsvps: Pick<RsvpRow, "full_name" | "status" | "companions" | "submitted_at">[];
}

export function Overview({ stats, rsvps }: OverviewProps) {
  const total = stats.attending + stats.declined;
  const pending = Math.max(stats.invited - total, 0);
  const expected = stats.attending + stats.companions;
  const recent = rsvps.slice(0, 6);

  return (
    <>
      <PageTitle title="Overview" description="Where things stand with the celebration." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Expected attendees" value={expected} emphasized />
        <Tile label="Total RSVPs" value={total} />
        <Tile label="Confirmed guests" value={stats.attending} />
        <Tile label="Declined guests" value={stats.declined} />
        <Tile label="Pending RSVPs" value={pending} />
        <Tile label="Invited guests" value={stats.invited} />
        <Tile label="Gallery images" value={stats.photos} />
        <Tile label="Published wishes" value={stats.wishes_published} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ResponseSplit stats={stats} pending={pending} />
        <ResponseTimeline days={buildTimeline(rsvps, new Date().getTime())} />
      </div>
      <div className="mt-5">
        <Panel title="Latest responses" description={stats.wishes_pending + stats.uploads_pending > 0 ? `${stats.wishes_pending} wishes and ${stats.uploads_pending} photos are waiting for review.` : undefined}>
          {recent.length === 0 ? <EmptyState>Responses will appear here as guests reply.</EmptyState> : (
            <ul className="divide-y divide-beige text-sm">
              {recent.map((rsvp) => (
                <li key={`${rsvp.full_name}-${rsvp.submitted_at}`} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{rsvp.full_name}{rsvp.companions > 0 && ` +${rsvp.companions}`}</span>
                  <span className="text-soft-ink">{rsvp.status === "attending" ? "Confirmed" : "Declined"}, {formatSubmittedAt(rsvp.submitted_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
