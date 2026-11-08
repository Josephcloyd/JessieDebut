import { describe, expect, it } from "vitest";
import { buildContents, folioFor } from "@/lib/domain/contents";
import { formatCoverDate } from "@/lib/domain/time";

const everything = { hasTraditions: true, hasProgram: true, hasFaqs: true };

describe("buildContents", () => {
  it("numbers every section in reading order", () => {
    const contents = buildContents(everything);
    expect(contents[0]).toEqual({ id: "welcome", title: "A Welcome", folio: "01" });
    expect(contents.map((entry) => entry.id)).toEqual([
      "welcome", "about", "details", "gallery", "traditions", "program", "dress-code", "rsvp", "wishes", "faq",
    ]);
    expect(contents[9].folio).toBe("10");
  });

  it("leaves no gaps in numbering when sections are switched off", () => {
    const contents = buildContents({ hasTraditions: false, hasProgram: false, hasFaqs: false });
    expect(contents.map((entry) => entry.id)).not.toContain("traditions");
    expect(contents.map((entry) => entry.folio)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
  });
});

describe("folioFor", () => {
  it("finds a section's number", () => {
    expect(folioFor(buildContents(everything), "gallery")).toBe("04");
  });

  it("returns blank for a section that isn't listed", () => {
    expect(folioFor(buildContents(everything), "missing")).toBe("");
  });
});

describe("formatCoverDate", () => {
  it("writes the date as day.month.year in Philippine time", () => {
    expect(formatCoverDate("2027-03-20T10:00:00.000Z")).toBe("20.03.27");
    expect(formatCoverDate("2027-03-20T17:00:00.000Z")).toBe("21.03.27");
  });
});
