"use client";

import {
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import type { Category } from "@/lib/types";

interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  original_filename: string;
}

/** Upload a file straight to Cloudinary using a server-signed payload. */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryResult> {
  const signRes = await fetch("/api/documents/sign", { method: "POST" });
  if (!signRes.ok) {
    const data = (await signRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not prepare upload.");
  }
  const { signature, timestamp, apiKey, cloudName, folder } =
    (await signRes.json()) as {
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
    };

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  return new Promise<CloudinaryResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryResult);
      } else {
        reject(new Error("Upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

export interface DocMetaInput {
  name: string;
  category: Category;
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  expiresAt?: number | null;
  notes?: string;
}

export async function createDocument(
  uid: string,
  input: DocMetaInput,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, "documents"), {
    ...input,
    expiresAt: input.expiresAt ?? null,
    notes: input.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(
  uid: string,
  id: string,
  patch: Partial<Pick<DocMetaInput, "name" | "category" | "notes" | "expiresAt">>,
): Promise<void> {
  await updateDoc(userDoc(uid, "documents", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Delete via the server (removes the Cloudinary asset + metadata). */
export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch("/api/documents/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not delete document.");
  }
}

/** Convenience: full upload + metadata creation with a friendly default name. */
export async function uploadAndSaveDocument(
  uid: string,
  file: File,
  meta: { category: Category },
  onProgress?: (pct: number) => void,
): Promise<void> {
  const result = await uploadToCloudinary(file, onProgress);
  const name = file.name.replace(/\.[^.]+$/, "") || result.original_filename;
  await createDocument(uid, {
    name,
    category: meta.category,
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format || file.name.split(".").pop() || "file",
    bytes: result.bytes || file.size,
  });
}
