/**
 * RENEW — OCR (photo → text) behind a pluggable engine interface.
 *
 * Privacy first: the default engine runs **entirely on the user's device**
 * (Tesseract.js / WASM) — the photo of a receipt or bill never leaves the
 * phone. A more accurate paid engine (Google Vision / Textract, via a server
 * route) can be dropped in later WITHOUT touching any UI: implement `OcrEngine`
 * server-side and select it in `getOcrEngine()` behind an env flag. Everything
 * extracted still flows through the same review-and-confirm step before saving.
 */

export interface OcrEngine {
  readonly id: string;
  /** Read all text from an image. `onProgress` reports 0..1 while recognising. */
  recognize(image: File | Blob, onProgress?: (progress: number) => void): Promise<string>;
}

/** On-device OCR. Tesseract is imported lazily so it never weighs down the app
 *  bundle — the ~2MB engine + language data load only when someone scans. */
const onDeviceEngine: OcrEngine = {
  id: "on-device",
  async recognize(image, onProgress) {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", undefined, {
      logger: onProgress
        ? (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") onProgress(m.progress);
          }
        : undefined,
    });
    try {
      const { data } = await worker.recognize(image);
      return data.text ?? "";
    } finally {
      await worker.terminate();
    }
  },
};

/**
 * The active OCR engine. On-device today; when the owner provisions a paid OCR
 * provider (server-side key), select a server engine here behind an env flag —
 * no UI change required.
 */
export function getOcrEngine(): OcrEngine {
  return onDeviceEngine;
}

/* ---- Server vision scan (Tech Reference §1) ------------------------------ */

/** Structured receipt read returned by the vision model. Any field may be null
 *  when it can't be read confidently — the caller must NOT invent a value. */
export interface VisionReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null; // YYYY-MM-DD
  type: "income" | "expense";
  category: string | null;
  confidence: number; // 0..1
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Preprocess a receipt photo before upload (Tech Ref §4 Step 1): honour EXIF
 * orientation, downscale the longest edge to 1568px (past which OCR accuracy
 * stops improving but cost/upload time keep rising) and re-encode JPEG q85.
 * Falls back to the raw data URL if the canvas path isn't available.
 */
const MAX_EDGE = 1568;
async function preprocessImage(file: File | Blob): Promise<string> {
  try {
    if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
      return await fileToDataUrl(file);
    }
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close?.(); return await fileToDataUrl(file); }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return fileToDataUrl(file);
  }
}

/**
 * Ask the server vision model to read a receipt/bill into structured fields.
 * Returns null when the model is unavailable (no key / rate-limited / error) or
 * the image is unreadable, so the caller falls back to the on-device engine.
 * The photo is sent only to our own server route, which holds the API key.
 */
export async function scanReceiptImage(file: File | Blob): Promise<VisionReceipt | null> {
  try {
    const image = await preprocessImage(file);
    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ({ ok: true } & VisionReceipt) | { ok: false };
    if (!data || data.ok !== true) return null;
    return {
      amount: typeof data.amount === "number" ? data.amount : null,
      merchant: data.merchant ?? null,
      date: data.date ?? null,
      type: data.type === "income" ? "income" : "expense",
      category: data.category ?? null,
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
    };
  } catch {
    return null;
  }
}
