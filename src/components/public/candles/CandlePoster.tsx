import { CANDLE_COUNT, layoutCandles } from "./candle-layout";

const UNIT = 62;
const DEPTH = 34;
const BODY_WIDTH = 17;

interface CandlePosterProps {
  lit: number;
  rows: number;
  /** Fades each flame in and out instead of switching instantly. */
  isAnimated: boolean;
}

/**
 * The same eighteen candles drawn flat. It is the placeholder while the 3D scene
 * loads and the finished picture when motion or WebGL is not available.
 */
export function CandlePoster({ lit, rows, isAnimated }: CandlePosterProps) {
  const spots = layoutCandles(CANDLE_COUNT, rows);
  const items = spots
    .map((spot, index) => ({ spot, index, baseY: spot.z * DEPTH, topY: spot.z * DEPTH - spot.height * UNIT }))
    .sort((a, b) => a.spot.z - b.spot.z);
  const minX = Math.min(...items.map((item) => item.spot.x)) * UNIT - 60;
  const maxX = Math.max(...items.map((item) => item.spot.x)) * UNIT + 60;
  const minY = Math.min(...items.map((item) => item.topY)) - 90;
  const maxY = Math.max(...items.map((item) => item.baseY)) + 60;
  const fade = isAnimated ? "transition-opacity duration-700 ease-out" : "";

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="size-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="poster-pool">
          <stop offset="0" stopColor="#E6C594" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#d9b27a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#c9985a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="poster-halo">
          <stop offset="0" stopColor="#F3DDB4" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#E6C594" stopOpacity="0.22" />
          <stop offset="1" stopColor="#d9b27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="poster-wax" x1="0" x2="1">
          <stop offset="0" stopColor="#d8c6b8" />
          <stop offset="0.5" stopColor="#FFF9F4" />
          <stop offset="1" stopColor="#b89fa0" />
        </linearGradient>
        <linearGradient id="poster-flame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E6C594" />
          <stop offset="0.7" stopColor="#FFF3DA" />
          <stop offset="1" stopColor="#FFD2D7" />
        </linearGradient>
      </defs>
      {items.map(({ spot, index, baseY, topY }) => {
        const cx = spot.x * UNIT;
        const opacity = index < lit ? 1 : 0;
        return (
          <g key={index}>
            <ellipse cx={cx} cy={baseY + 3} rx={BODY_WIDTH * 1.6} ry={6} fill="#1d0c10" opacity="0.55" />
            <ellipse cx={cx} cy={baseY + 4} rx={UNIT * 1.1} ry={UNIT * 0.4} fill="url(#poster-pool)" opacity={opacity} className={fade} />
            <rect x={cx - BODY_WIDTH / 2} y={topY} width={BODY_WIDTH} height={baseY - topY} fill="url(#poster-wax)" />
            <rect x={cx - BODY_WIDTH / 2} y={topY} width={BODY_WIDTH} height={baseY - topY} fill="#2a1519" opacity={0.5 * (1 - opacity)} className={fade} />
            <ellipse cx={cx} cy={topY} rx={BODY_WIDTH / 2} ry={2.6} fill={index < lit ? "#F3DDB4" : "#e6d6cc"} />
            <circle cx={cx} cy={topY - 36} r={50} fill="url(#poster-halo)" opacity={opacity} className={fade} />
            <path d={`M ${cx} ${topY - 42} C ${cx + 7} ${topY - 26} ${cx + 8} ${topY - 10} ${cx} ${topY - 2} C ${cx - 8} ${topY - 10} ${cx - 7} ${topY - 26} ${cx} ${topY - 42} Z`} fill="url(#poster-flame)" opacity={opacity} className={fade} />
          </g>
        );
      })}
    </svg>
  );
}
