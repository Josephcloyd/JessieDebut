import type { ContentsEntry } from "@/lib/domain/contents";

export function ContentsList({ contents, heading }: { contents: ContentsEntry[]; heading: string }) {
  return (
    <nav aria-label={heading}>
      <h2 className="eyebrow text-[0.62rem] text-soft-ink">{heading}</h2>
      <ol className="mt-3 grid grid-cols-1 gap-x-10 lg:grid-cols-2">
        {contents.map((entry) => (
          <li key={entry.id} className="border-t border-champagne/70">
            <a href={`#${entry.id}`} className="flex min-h-11 items-baseline justify-between gap-4 py-2 font-display text-2xl transition-colors hover:text-soft-ink">
              {entry.title}
              <span className="eyebrow text-[0.6rem] text-soft-ink">{entry.folio}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
