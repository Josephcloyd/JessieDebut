export const CANDLE_COUNT = 18;

/** World-space spot for one candle. Candle 0 is the first year. */
export interface CandleSpot {
  x: number;
  z: number;
  height: number;
}

export const TRAY_RADIUS = 3.05;
export const VIEW_ELEVATION = 0.36;

const RING_RADIUS = 2.55;
const RING_COUNT = CANDLE_COUNT - 1;
const FIRST_HEIGHT = 0.8;
const HEIGHT_RISE = 0.62;
const LAST_HEIGHT = 2.05;

/** Server and browser disagree in the last digits of sin and cos, which would break hydration. */
export const settle = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Seventeen candles climb a spiral around the tray, one for each year, and the
 * eighteenth stands tallest at the centre. The first stands nearest the guest.
 */
export function layoutCandles(): CandleSpot[] {
  const ring = Array.from({ length: RING_COUNT }, (_, index) => {
    const angle = Math.PI / 2 - (index / RING_COUNT) * Math.PI * 2;
    return { x: settle(Math.cos(angle) * RING_RADIUS), z: settle(Math.sin(angle) * RING_RADIUS), height: settle(FIRST_HEIGHT + HEIGHT_RISE * (index / (RING_COUNT - 1))) };
  });
  return [...ring, { x: 0, z: 0, height: LAST_HEIGHT }];
}
