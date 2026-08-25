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
