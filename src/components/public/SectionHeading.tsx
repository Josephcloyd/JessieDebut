import { Reveal } from "./motion-helpers";

/** A magazine-style running head: page number, a thin rule and a large title. */
export function SectionHeading({ folio, title }: { folio: string; title: string }) {
  return (
    <Reveal className="mx-auto mb-10 flex max-w-6xl items-baseline gap-5 border-t border-current/25 pt-3 md:mb-14">
      <span className="eyebrow shrink-0 text-[0.65rem]">{folio}</span>
      <h2 className="font-display text-5xl font-light leading-none md:text-7xl">{title}</h2>
    </Reveal>
  );
}
