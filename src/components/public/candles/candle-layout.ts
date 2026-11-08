export const CANDLE_COUNT = 18;

/** World-space spot for one candle. Candle 0 is the first year and the shortest. */
export interface CandleSpot {
  x: number;
  z: number;
  height: number;
}

const SPACING = 0.66;
const ROW_DEPTH = 1.05;
const MIN_HEIGHT = 0.8;
const HEIGHT_RANGE = 1.25;
const WIDE_ASPECT = 1.9;
const SQUARE_ASPECT = 0.55;

/** Wide stages hold one row, squarer ones two, tall ones three. */
export function candleRows(aspect: number): number {
  if (aspect >= WIDE_ASPECT) return 1;
  return aspect >= SQUARE_ASPECT ? 2 : 3;
}

/**
 * Candles climb in height from one to eighteen and run in rows from front to
 * back, so the eighteenth stands tallest at the back of the last row.
 */
export function layoutCandles(count: number, rows: number): CandleSpot[] {
  const perRow = Math.ceil(count / rows);
  const spots: CandleSpot[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / perRow);
    const column = index % perRow;
    const rowStart = row * perRow;
    const inRow = Math.min(perRow, count - rowStart);
    const stagger = row % 2 === 1 ? SPACING / 2 : 0;
    const unit = inRow > 1 ? (column / (inRow - 1)) * 2 - 1 : 0;
    const x = (column - (inRow - 1) / 2) * SPACING + stagger - (rows > 1 ? SPACING / 4 : 0);
    const z = -row * ROW_DEPTH + 0.28 * unit * unit;
    const progress = index / (count - 1);
    spots.push({ x, z, height: MIN_HEIGHT + HEIGHT_RANGE * progress });
  }
  return spots;
}
