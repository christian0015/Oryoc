// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { signUploadParams, CLOUDINARY_FOLDERS, type CloudinaryFolder } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = new Set<string>(Object.values(CLOUDINARY_FOLDERS));

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, code: "AUTH_REQUIRED", message: "Connexion requise" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const folder = body?.folder as string | undefined;

  if (!folder || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Dossier de stockage invalide" },
      { status: 400 }
    );
  }

  const signed = signUploadParams({ folder: folder as CloudinaryFolder });
  return NextResponse.json({ ok: true, data: signed });
}
