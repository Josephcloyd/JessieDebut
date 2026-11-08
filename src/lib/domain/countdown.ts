export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const FINISHED: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

export function getCountdown(targetIso: string, nowMs: number): Countdown {
  const remaining = Date.parse(targetIso) - nowMs;
  if (Number.isNaN(remaining) || remaining <= 0) return FINISHED;
  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
    isPast: false,
  };
}
