type CsvCell = string | number | boolean | null | undefined;

const BYTE_ORDER_MARK = "﻿";
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

function formatCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // A leading apostrophe stops spreadsheets from running guest-supplied text as a formula.
  const safe = typeof value === "string" && FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(","));
  return BYTE_ORDER_MARK + lines.join("\r\n");
}
