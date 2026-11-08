/** The event happens in the Philippines, which has no daylight saving. */
const EVENT_TIME_ZONE = "Asia/Manila";
const MANILA_OFFSET = "+08:00";
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const LOCAL_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function manilaInputToIso(localValue: string): string {
  if (!LOCAL_INPUT_PATTERN.test(localValue)) {
    throw new Error("Enter a valid date and time.");
  }
  return new Date(`${localValue}:00${MANILA_OFFSET}`).toISOString();
}

export function isoToManilaInput(iso: string): string {
  return new Date(Date.parse(iso) + MANILA_OFFSET_MS).toISOString().slice(0, 16);
}

/** The date as it appears on the cover, for example "20.03.27". */
export function formatCoverDate(iso: string): string {
  const [year, month, day] = isoToManilaInput(iso).slice(0, 10).split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/ /g, " ");
}

/** Formats a stored time of day such as "18:30:00" as "6:30 PM". */
export function formatProgramTime(value: string | null): string {
  if (!value) return "";
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${period}`;
}

export function formatSubmittedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
