const DUSTY_ROSE = "#c58b95";
const BURGUNDY = "#4d2c32";
const SOFT_GOLD = "#e6c594";
const BLUSH = "#ffd2d7";
const CREAM = "#fff9f4";

const PETAL_ANGLES = [0, 72, 144, 216, 288];
// Sakura petals have a small notch at the tip, which is what makes them read as cherry blossom.
const PETAL = "M0 0C-11-6-14-20-6-28L0-23 6-28C14-20 11-6 0 0Z";
const PETAL_SHADE = "M0 0C-4-4-5-11-2-16L0-14 2-16C5-11 4-4 0 0Z";
const LEAF = "M0 0C9-12 30-14 44-3 30 6 10 8 0 0Z";
const STAMEN_ANGLES = [20, 92, 164, 236, 308];

function Blossom({ x, y, scale, turn, petal }: { x: number; y: number; scale: number; turn: number; petal: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}>
      {PETAL_ANGLES.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d={PETAL} fill={petal} stroke={DUSTY_ROSE} strokeWidth="0.7" strokeLinejoin="round" />
          <path d={PETAL_SHADE} fill={DUSTY_ROSE} opacity="0.55" />
        </g>
      ))}
      {STAMEN_ANGLES.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-10" stroke={BURGUNDY} strokeWidth="0.5" />
          <circle cy="-11" r="1.3" fill={SOFT_GOLD} stroke={BURGUNDY} strokeWidth="0.3" />
        </g>
      ))}
      <circle r="2.4" fill={DUSTY_ROSE} />
    </g>
  );
}

function Bud({ x, y, turn, petal }: { x: number; y: number; turn: number; petal: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`}>
      <path d="M0 0C-6-5-6-13 0-17 6-13 6-5 0 0Z" fill={petal} stroke={DUSTY_ROSE} strokeWidth="0.7" />
      <path d="M-4-1C-2 3 2 3 4-1 2-4-2-4-4-1Z" fill={BURGUNDY} />
    </g>
  );
}

function Leaf({ x, y, turn, scale = 1 }: { x: number; y: number; turn: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}>
      <path d={LEAF} fill={DUSTY_ROSE} stroke={BURGUNDY} strokeWidth="0.5" strokeOpacity="0.5" />
      <path d="M2 0C14-3 28-3 42-3" fill="none" stroke={BURGUNDY} strokeWidth="0.45" opacity="0.5" />
    </g>
  );
}

const BLOSSOMS = [
  { x: 92, y: 62, scale: 1.05, turn: 12 },
  { x: 168, y: 108, scale: 1.3, turn: -20 },
  { x: 246, y: 74, scale: 0.92, turn: 40 },
  { x: 236, y: 168, scale: 1.1, turn: 8 },
  { x: 316, y: 138, scale: 0.86, turn: -34 },
  { x: 118, y: 158, scale: 0.8, turn: 50 },
];
const BUDS = [
  { x: 306, y: 62, turn: 62 },
  { x: 356, y: 186, turn: 118 },
  { x: 62, y: 148, turn: 196 },
];
const LEAVES = [
  { x: 128, y: 88, turn: -58, scale: 0.8 },
  { x: 204, y: 132, turn: 72, scale: 0.9 },
  { x: 282, y: 112, turn: -42, scale: 0.72 },
  { x: 66, y: 44, turn: 34, scale: 0.66 },
];

interface SakuraBranchProps {
  className?: string;
  /** Use "cream" on blush or burgundy backgrounds, and "blush" on cream ones. */
  petals?: "cream" | "blush";
  /** Lightens the branch so it shows on burgundy. */
  isOnDark?: boolean;
}

/** A cherry branch growing in from the top-left corner. Flip it with CSS for other corners. */
export function SakuraBranch({ className, petals = "blush", isOnDark = false }: SakuraBranchProps) {
  const petal = petals === "cream" ? CREAM : BLUSH;
  const twig = isOnDark ? DUSTY_ROSE : BURGUNDY;

  return (
    <svg viewBox="0 0 400 240" fill="none" className={`pointer-events-none ${className ?? ""}`} aria-hidden="true">
      <path d="M-8-8C50 34 110 66 176 104S300 168 352 182" stroke={twig} strokeWidth="4" strokeLinecap="round" />
      <path d="M92 56C140 56 200 60 252 76S300 60 314 58" stroke={twig} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M150 92C146 118 130 142 110 158" stroke={twig} strokeWidth="2" strokeLinecap="round" />
      <path d="M240 134C250 138 300 142 322 138" stroke={twig} strokeWidth="1.8" strokeLinecap="round" />
      {LEAVES.map((leaf) => <Leaf key={`${leaf.x}-${leaf.y}`} {...leaf} />)}
      {BUDS.map((bud) => <Bud key={`${bud.x}-${bud.y}`} petal={petal} {...bud} />)}
      {BLOSSOMS.map((blossom) => <Blossom key={`${blossom.x}-${blossom.y}`} petal={petal} {...blossom} />)}
    </svg>
  );
}

/** A small printed cluster for the envelope and other paper surfaces. */
export function SakuraCluster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={`pointer-events-none ${className ?? ""}`} aria-hidden="true">
      <path d="M4 86C30 70 62 52 112 22" stroke={DUSTY_ROSE} strokeWidth="1.3" strokeLinecap="round" />
      <Leaf x={40} y={64} turn={-70} scale={0.5} />
      <Leaf x={76} y={44} turn={36} scale={0.5} />
      <Blossom x={30} y={62} scale={0.62} turn={14} petal={BLUSH} />
      <Blossom x={66} y={40} scale={0.78} turn={-18} petal={BLUSH} />
      <Blossom x={98} y={36} scale={0.48} turn={40} petal={BLUSH} />
      <Bud x={110} y={18} turn={48} petal={BLUSH} />
    </svg>
  );
}
