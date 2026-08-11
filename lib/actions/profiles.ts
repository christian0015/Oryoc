// lib/actions/profiles.ts
"use server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth";
import { profileUpdateSchema, certificationSubmitSchema } from "@/lib/validation";
import { actionOk, actionError, type ActionResult, type UserDTO } from "@/types";
import { toPublicUserDTO, toPrivateUserDTO, type PublicUserDTO } from "@/lib/serializers";

export type { PublicUserDTO };

/** Public profile — accessible without an account (§5.0). */
export async function getPublicProfile(userId: string): Promise<ActionResult<PublicUserDTO>> {
  await connectDB();
  const user = await UserModel.findById(userId);
  if (!user) return actionError("NOT_FOUND", "Profil introuvable");
  return actionOk(toPublicUserDTO(user));
}

export async function getMyProfile(): Promise<ActionResult<UserDTO>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour voir ton profil");

  await connectDB();
  const user = await UserModel.findById(sessionUserId);
  if (!user) return actionError("NOT_FOUND", "Profil introuvable");
  return actionOk(toPrivateUserDTO(user));
}

/** Autosaving field editor (§6.3) — one call per field. */
export async function updateProfileField(
  field: "name" | "phone" | "locale" | "role",
  value: string
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier ton profil");

  const parsed = profileUpdateSchema.safeParse({ [field]: value });
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Valeur invalide", parsed.error.flatten().fieldErrors);
  }

  await connectDB();
  await UserModel.findByIdAndUpdate(sessionUserId, { $set: { [field]: value } });
  return actionOk({ updated: true });
}

export async function updateAvatar(url: string): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier ton profil");

  await connectDB();
  await UserModel.findByIdAndUpdate(sessionUserId, { $set: { avatarUrl: url } });
  return actionOk({ updated: true });
}

/** Certification documents go to moderation (§5.1) — never auto-approved. */
export async function submitCertificationDocuments(
  documentUrls: string[]
): Promise<ActionResult<{ submitted: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour soumettre tes documents");

  const parsed = certificationSubmitSchema.safeParse({ documentUrls });
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Documents invalides", parsed.error.flatten().fieldErrors);
  }

  await connectDB();
  await UserModel.findByIdAndUpdate(sessionUserId, {
    $set: {
      certificationDocuments: parsed.data.documentUrls,
      certificationStatus: "pending",
    },
  });
  return actionOk({ submitted: true });
}

/** Revealing an owner's contact details requires an account (§5.0). */
export async function revealContact(
  targetUserId: string
): Promise<ActionResult<{ email: string; phone?: string }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return actionError("AUTH_REQUIRED", "Connecte-toi pour voir les coordonnees");
  }

  await connectDB();
  const target = await UserModel.findById(targetUserId);
  if (!target) return actionError("NOT_FOUND", "Utilisateur introuvable");

  return actionOk({ email: target.email, phone: target.phone });
}
