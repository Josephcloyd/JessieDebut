import { describe, expect, it } from "vitest";
import { getCountdown } from "@/lib/domain/countdown";
import { toCsv } from "@/lib/domain/csv";
import { detectFileType, matchesDeclaredType } from "@/lib/domain/file-type";
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from "@/lib/domain/invite-code";
import { formatEventDate, formatEventTime, formatProgramTime, isoToManilaInput, manilaInputToIso } from "@/lib/domain/time";
import { buildStoragePath, validateUpload } from "@/lib/domain/upload-rules";

describe("getCountdown", () => {
  const target = "2027-03-20T10:00:00.000Z";
  const targetMs = Date.parse(target);

  it("splits the remaining time into units", () => {
    const remaining = 2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000;
    expect(getCountdown(target, targetMs - remaining)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, isPast: false });
  });

  it("reports the moment of the event as past", () => {
    expect(getCountdown(target, targetMs).isPast).toBe(true);
  });

  it("returns zeros once the event has passed", () => {
    expect(getCountdown(target, targetMs + 1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
  });

  it("treats an unreadable date as past", () => {
    expect(getCountdown("not-a-date", 0).isPast).toBe(true);
  });
});

describe("time helpers", () => {
  it("reads admin input as Manila time", () => {
    expect(manilaInputToIso("2027-03-20T18:00")).toBe("2027-03-20T10:00:00.000Z");
  });

  it("round-trips a stored instant into the admin input", () => {
    expect(isoToManilaInput("2027-03-20T10:00:00.000Z")).toBe("2027-03-20T18:00");
  });

  it("rejects malformed admin input", () => {
    expect(() => manilaInputToIso("tomorrow")).toThrow();
  });

  it("formats the date and time in Manila regardless of server timezone", () => {
    expect(formatEventDate("2027-03-20T17:00:00.000Z")).toBe("Sunday, March 21, 2027");
    expect(formatEventTime("2027-03-20T10:00:00.000Z")).toBe("6:00 PM");
  });

  it("formats program times and tolerates blanks", () => {
    expect(formatProgramTime("18:30:00")).toBe("6:30 PM");
    expect(formatProgramTime("00:05")).toBe("12:05 AM");
    expect(formatProgramTime("12:00")).toBe("12:00 PM");
    expect(formatProgramTime(null)).toBe("");
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    const csv = toCsv(["a", "b"], [['x,y', 'say "hi"'], ["line\nbreak", 3]]);
    expect(csv).toBe('﻿a,b\r\n"x,y","say ""hi"""\r\n"line\nbreak",3');
  });

  it("neutralizes spreadsheet formulas", () => {
    for (const payload of ["=SUM(A1)", "+1", "-1", "@cmd", "\tx"]) {
      expect(toCsv(["a"], [[payload]])).toContain(`'${payload}`);
    }
  });

  it("writes empty cells for null values", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("﻿a,b\r\n,");
  });
});

describe("invite codes", () => {
  it("generates codes that satisfy the database format", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateInviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{10}$/);
    }
  });

  it("does not repeat in a small sample", () => {
    expect(new Set(Array.from({ length: 500 }, generateInviteCode)).size).toBe(500);
  });

  it("normalizes typed codes", () => {
    expect(normalizeInviteCode(" abcd-2345 ")).toBe("ABCD2345");
  });

  it("validates code shape", () => {
    expect(isValidInviteCode("ABCD2345")).toBe(true);
    expect(isValidInviteCode("abc")).toBe(false);
    expect(isValidInviteCode("ABCD 2345; drop")).toBe(false);
  });
});

describe("detectFileType", () => {
  const ascii = (text: string) => Array.from(text, (c) => c.charCodeAt(0));
  const ftyp = (brand: string) => new Uint8Array([0, 0, 0, 24, ...ascii("ftyp"), ...ascii(brand), 0, 0, 0, 0]);

  it.each([
    ["image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
    ["image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["image/webp", new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")])],
    ["image/avif", ftyp("avif")],
    ["audio/mp4", ftyp("M4A ")],
    ["audio/mpeg", new Uint8Array([...ascii("ID3"), 4, 0])],
    ["audio/mpeg", new Uint8Array([0xff, 0xfb, 0x90, 0x00])],
    ["audio/aac", new Uint8Array([0xff, 0xf1, 0x50, 0x80])],
  ])("recognizes %s", (type, bytes) => {
    expect(detectFileType(bytes)).toBe(type);
  });

  it("rejects disguised content", () => {
    expect(detectFileType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(detectFileType(new Uint8Array([]))).toBeNull();
  });

  it("treats m4a labels as the same family", () => {
    expect(matchesDeclaredType("audio/mp4", "audio/x-m4a")).toBe(true);
    expect(matchesDeclaredType("image/png", "image/jpeg")).toBe(false);
  });
});

describe("upload rules", () => {
  it("accepts an image within limits", () => {
    expect(validateUpload({ kind: "image", contentType: "image/webp", size: 1024 })).toBeNull();
  });

  it("rejects the wrong type for the kind", () => {
    expect(validateUpload({ kind: "image", contentType: "audio/mpeg", size: 1024 })).toMatch(/JPG/);
    expect(validateUpload({ kind: "audio", contentType: "image/png", size: 1024 })).toMatch(/MP3/);
  });

  it("rejects empty and oversized files", () => {
    expect(validateUpload({ kind: "image", contentType: "image/png", size: 0 })).toMatch(/empty/);
    expect(validateUpload({ kind: "image", contentType: "image/png", size: 16 * 1024 * 1024 })).toMatch(/15 MB/);
    expect(validateUpload({ kind: "audio", contentType: "audio/mpeg", size: 26 * 1024 * 1024 })).toMatch(/25 MB/);
  });

  it("builds a path from trusted parts only", () => {
    expect(buildStoragePath("gallery", "image/webp", "abc")).toBe("gallery/abc.webp");
    expect(buildStoragePath("music", "audio/mpeg", "abc")).toBe("music/abc.mp3");
  });
});
