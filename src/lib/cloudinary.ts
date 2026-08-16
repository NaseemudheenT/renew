import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { getServerEnv, publicEnv } from "@/lib/env";

let configured = false;

function configure() {
  if (configured) return;
  const { cloudinary: c } = getServerEnv();
  cloudinary.config({
    cloud_name: c.cloudName || publicEnv.cloudinaryCloudName,
    api_key: c.apiKey,
    api_secret: c.apiSecret,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  const { cloudinary: c } = getServerEnv();
  return Boolean(
    (c.cloudName || publicEnv.cloudinaryCloudName) && c.apiKey && c.apiSecret,
  );
}

export interface SignedUpload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Produce a signed direct-upload payload scoped to the user's folder. The
 * browser uploads straight to Cloudinary with this signature — the file never
 * passes through our server, but only authenticated users can obtain one.
 */
export function signUpload(uid: string): SignedUpload {
  configure();
  const { cloudinary: c } = getServerEnv();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `renew/${uid}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    c.apiSecret,
  );
  return {
    signature,
    timestamp,
    apiKey: c.apiKey,
    cloudName: c.cloudName || publicEnv.cloudinaryCloudName,
    folder,
  };
}

/** Delete an asset by public_id. Best-effort; resource_type auto-detected. */
export async function destroyAsset(publicId: string): Promise<void> {
  configure();
  // Try common resource types; images/pdf are "image", others often "raw".
  for (const resourceType of ["image", "raw", "video"] as const) {
    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
      if (res.result === "ok") return;
    } catch {
      /* try next resource type */
    }
  }
}
