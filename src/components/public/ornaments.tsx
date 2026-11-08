const STROKE = "currentColor";

interface OrnamentProps {
  className?: string;
}

const SPRIG_LEAVES = [
  [34, 62, -48], [52, 50, 38], [66, 46, -44], [84, 34, 34], [98, 32, -40], [116, 22, 30], [130, 21, -34],
] as const;

/** A single line-drawn botanical branch, used on the envelope. */
export function Sprig({ className }: OrnamentProps) {
  return (
    <svg viewBox="0 0 170 80" fill="none" className={className} aria-hidden="true">
      <path d="M6 74C46 66 106 46 164 12" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" />
      {SPRIG_LEAVES.map(([x, y, angle]) => (
        <path key={`${x}-${y}`} d="M0 0C5-8 15-9 22-3 15 3 6 4 0 0Z" stroke={STROKE} strokeWidth="0.75" transform={`translate(${x} ${y}) rotate(${angle})`} />
      ))}
      <circle cx="165" cy="11" r="2.1" stroke={STROKE} strokeWidth="0.75" />
    </svg>
  );
}

export function WaxSeal({ letters, className }: { letters: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Wax seal">
      <path
        d="M50 4c8 0 11 5 18 8s13 1 18 7 2 12 5 19 8 10 7 18-7 10-10 17-1 13-8 17-12 0-20 3-11 7-19 5-9-8-16-11-14-2-18-9 0-12-3-19-8-11-6-19 8-9 11-16 1-13 8-17 12 1 19-1 11-2 14-2Z"
        fill="#e6c594"
      />
      <circle cx="50" cy="50" r="31" fill="#f0d9b5" stroke="#c58b95" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="#c58b95" strokeWidth="0.7" />
      <text x="50" y="50" dominantBaseline="central" textAnchor="middle" fontFamily="var(--font-cormorant), serif" fontSize="34" fill="#4d2c32">
        {letters}
      </text>
    </svg>
  );
}
