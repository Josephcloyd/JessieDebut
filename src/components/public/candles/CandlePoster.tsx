import { layoutCandles, settle, TRAY_RADIUS, VIEW_ELEVATION } from "./candle-layout";

const UNIT = 62;
const BODY_WIDTH = 17;
const DEPTH = settle(Math.sin(VIEW_ELEVATION));
const RISE = settle(Math.cos(VIEW_ELEVATION));
const MARGIN_X = UNIT * 0.6;
const MARGIN_TOP = 120;
const MARGIN_BOTTOM = 70;
const RIM_RADIUS = TRAY_RADIUS * UNIT;
const RIM_DEPTH = RIM_RADIUS * DEPTH;

interface CandlePosterProps {
  lit: number;
  /** Fades each flame in and out instead of switching instantly. */
  isAnimated: boolean;
}

/**
 * The same eighteen candles drawn flat. It is the placeholder while the 3D scene
 * loads and the finished picture when motion or WebGL is not available.
 */
export function CandlePoster({ lit, isAnimated }: CandlePosterProps) {
  const items = layoutCandles()
    .map((spot, index) => ({ spot, index, baseY: spot.z * UNIT * DEPTH, topY: spot.z * UNIT * DEPTH - spot.height * UNIT * RISE }))
    .sort((a, b) => a.spot.z - b.spot.z);
  const minX = -RIM_RADIUS - MARGIN_X;
  const width = RIM_RADIUS * 2 + MARGIN_X * 2;
  const minY = -RIM_DEPTH - MARGIN_TOP;
  const height = RIM_DEPTH * 2 + MARGIN_TOP + MARGIN_BOTTOM;
  const fade = isAnimated ? "transition-opacity duration-700 ease-out" : "";

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="size-full overflow-visible" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
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
      <ellipse cx="0" cy="0" rx={RIM_RADIUS} ry={RIM_DEPTH} fill="#3a1f25" stroke="#E6C594" strokeWidth="2" />
      {items.map(({ spot, index, baseY, topY }) => {
        const cx = spot.x * UNIT;
        const isLit = index < lit;
        const opacity = isLit ? 1 : 0;
        return (
          <g key={index}>
            <ellipse cx={cx} cy={baseY + 3} rx={BODY_WIDTH * 1.4} ry={5} fill="#1d0c10" opacity="0.5" />
            <ellipse cx={cx} cy={baseY + 4} rx={UNIT * 1.1} ry={UNIT * 0.4} fill="url(#poster-pool)" opacity={opacity} className={fade} />
            <rect x={cx - BODY_WIDTH / 2} y={topY} width={BODY_WIDTH} height={baseY - topY} fill="url(#poster-wax)" />
            <rect x={cx - BODY_WIDTH / 2} y={topY} width={BODY_WIDTH} height={baseY - topY} fill="#2a1519" opacity={0.42 * (1 - opacity)} className={fade} />
            <ellipse cx={cx} cy={topY} rx={BODY_WIDTH / 2} ry={2.6} fill={isLit ? "#F3DDB4" : "#e6d6cc"} />
            <circle cx={cx} cy={topY - 36} r={50} fill="url(#poster-halo)" opacity={opacity} className={fade} />
            <path d={`M ${cx} ${topY - 42} C ${cx + 7} ${topY - 26} ${cx + 8} ${topY - 10} ${cx} ${topY - 2} C ${cx - 8} ${topY - 10} ${cx - 7} ${topY - 26} ${cx} ${topY - 42} Z`} fill="url(#poster-flame)" opacity={opacity} className={fade} />
          </g>
        );
      })}
    </svg>
  );
}

