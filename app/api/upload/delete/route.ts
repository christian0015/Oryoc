// app/api/upload/delete/route.ts
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { deleteAsset, extractPublicId } from "@/lib/cloudinary";

/**
 * Called by the autosave image field before a replacement upload
 * completes, so nothing orphaned ever lingers on Cloudinary (§6.3).
 */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, code: "AUTH_REQUIRED", message: "Connexion requise" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = body?.url as string | undefined;
  const publicIdInput = body?.publicId as string | undefined;
  const resourceType = (body?.resourceType as "image" | "video" | undefined) ?? "image";

  const publicId = publicIdInput ?? (url ? extractPublicId(url) : null);
  if (!publicId) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Impossible de determiner l'asset a supprimer" },
      { status: 400 }
    );
  }

  const result = await deleteAsset(publicId, resourceType);
  return NextResponse.json({ ok: result.ok, data: { publicId, deleted: result.ok } });
}
