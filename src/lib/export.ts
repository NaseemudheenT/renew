/**
 * RENEW — client-side data export.
 *
 * Financial records are the user's own — they can always take a copy. Exports
 * run entirely in the browser (no upload); data is presented in the raw stored
 * form (numbers + ISO currency codes + epoch millis) so it re-imports cleanly.
 */

/** Escape a single CSV field per RFC 4180. */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Convert an array of flat records to CSV using the union of keys as headers. */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set()),
  );
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvField(row[h])).join(","));
  }
  return lines.join("\n");
}

/** Trigger a browser download of the given text content. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** yyyy-mm-dd for filenames (local date). */
export function fileDateStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
