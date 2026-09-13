"use client";

/**
 * Client-side PDF → text extraction (for bank-statement import). Runs entirely
 * on the person's device via pdfjs — nothing is uploaded. Only text PDFs work;
 * scanned/image PDFs need OCR (a later phase). Text is reconstructed line by line
 * (grouping runs by their vertical position) so the statement parser can read it.
 */

let workerReady = false;

/**
 * Thrown when a PDF is locked. `wrong` distinguishes "we need the password"
 * (first try) from "that password was incorrect" so the UI can react cleanly.
 * The password is only ever used in-memory on the device to open the file — it
 * is never stored or sent anywhere.
 */
export class PdfPasswordError extends Error {
  constructor(public readonly wrong: boolean) {
    super(wrong ? "Incorrect PDF password" : "This PDF is password protected");
    this.name = "PdfPasswordError";
  }
}

export async function extractPdfText(file: File, password?: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerReady = true;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  let doc;
  try {
    doc = await pdfjs.getDocument({ data, password }).promise;
  } catch (e) {
    // pdf.js PasswordException: code 1 = need password, 2 = wrong password.
    const ex = e as { name?: string; code?: number };
    if (ex?.name === "PasswordException") throw new PdfPasswordError(ex.code === 2);
    throw e;
  }
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
