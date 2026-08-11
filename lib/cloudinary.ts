// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_FOLDERS, type CloudinaryFolder } from "@/lib/cloudinary-folders";

export { CLOUDINARY_FOLDERS, type CloudinaryFolder };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Signs the params for a direct, server-signed client upload — the file
 * bytes never transit our server (§2: "upload signé côté serveur
 * uniquement" means the *signature*, not the bytes, is server-side).
 */
export function signUploadParams(params: {
  folder: CloudinaryFolder;
  publicId?: string;
}) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder: params.folder,
    ...(params.publicId ? { public_id: params.publicId } : {}),
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: params.folder,
    publicId: params.publicId,
  };
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<{ ok: boolean }> {
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { ok: res.result === "ok" || res.result === "not found" };
  } catch (err) {
    console.error(`[cloudinary] failed to delete ${publicId}`, err);
    return { ok: false };
  }
}

export async function deleteAssets(publicIds: string[], resourceType: "image" | "video" = "image") {
  const results = await Promise.allSettled(publicIds.map((id) => deleteAsset(id, resourceType)));
  const failed = results
    .map((r, i) => ({ r, id: publicIds[i] }))
    .filter(({ r }) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok))
    .map(({ id }) => id);
  if (failed.length) {
    console.error("[cloudinary] partial cleanup failure, orphaned public_ids:", failed);
  }
  return { failed };
}

/** Derives a Cloudinary public_id (including folder) from a secure_url,
 * so cascade-delete can work from stored URLs alone. */
export function extractPublicId(url: string): string | null {
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExtension = withoutVersion.replace(/\.[a-zA-Z0-9]+$/, "");
    return withoutExtension;
  } catch {
    return null;
  }
}

export default cloudinary;
