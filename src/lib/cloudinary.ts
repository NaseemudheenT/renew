import "server-only";

/**
 * Cloudinary server SDK — used for signed uploads and transformations of user
 * attachments (documents, avatars). Configured once from server env.
 */
import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/lib/env";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const { cloudName, apiKey, apiSecret } = getServerEnv().cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "[cloudinary] Missing CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET in .env.local.",
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/**
 * Build a signature for direct, secure browser → Cloudinary uploads so large
 * files never pass through our server. Returns everything the client needs.
 */
export function signUpload(params: {
  folder: string;
  publicId?: string;
}): { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string } {
  const cld = getCloudinary();
  const { cloudName, apiKey, apiSecret } = getServerEnv().cloudinary;
  const timestamp = Math.round(Date.now() / 1000);

  const toSign: Record<string, string | number> = {
    folder: params.folder,
    timestamp,
    ...(params.publicId ? { public_id: params.publicId } : {}),
  };

  const signature = cld.utils.api_sign_request(toSign, apiSecret);
  return { timestamp, signature, apiKey, cloudName, folder: params.folder };
}
