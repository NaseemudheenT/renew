"use client";

/**
 * Client-side PDF → text extraction (for bank-statement import). Runs entirely
 * on the person's device via pdfjs — nothing is uploaded. Only text PDFs work;
 * scanned/image PDFs need OCR (a later phase). Text is reconstructed line by line
 * (grouping runs by their vertical position) so the statement parser can read it.
 */

let workerReady = false;

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerReady = true;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const byRow = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round((item.transform[5] as number) / 2) * 2; // bucket ~2px
      const arr = byRow.get(y) ?? [];
      arr.push({ x: item.transform[4] as number, str: item.str });
      byRow.set(y, arr);
    }
    const ys = Array.from(byRow.keys()).sort((a, b) => b - a); // top → bottom
    for (const y of ys) {
      const line = byRow
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((r) => r.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) lines.push(line);
    }
  }
  return lines.join("\n");
}
