export interface ContentsEntry {
  id: string;
  title: string;
  folio: string;
}

interface ContentsOptions {
  hasTraditions: boolean;
  hasProgram: boolean;
  hasFaqs: boolean;
}

/** The magazine's table of contents. Numbers close up when a section is switched off. */
export function buildContents({ hasTraditions, hasProgram, hasFaqs }: ContentsOptions): ContentsEntry[] {
  const sections: [string, string, boolean][] = [
    ["welcome", "A Welcome", true],
    ["about", "The Debutant", true],
    ["details", "The Invitation", true],
    ["gallery", "The Gallery", true],
    ["traditions", "The Eighteen", hasTraditions],
    ["program", "The Program", hasProgram],
    ["dress-code", "Attire", true],
    ["rsvp", "RSVP", true],
    ["wishes", "Wishes", true],
    ["faq", "Questions", hasFaqs],
  ];

  return sections
    .filter(([, , isIncluded]) => isIncluded)
    .map(([id, title], index) => ({ id, title, folio: String(index + 1).padStart(2, "0") }));
}

export function folioFor(contents: readonly ContentsEntry[], id: string): string {
  return contents.find((entry) => entry.id === id)?.folio ?? "";
}
