// lib/actions/compensation.ts
"use server";

import type { HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/db";
import { CompensationRequestModel, type CompensationRequestDocument, UserModel } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth";
import { compensationCreateSchema } from "@/lib/validation";
import {
  actionOk,
  actionError,
  type ActionResult,
  type CompensationRequestDTO,
  type CompensationType,
} from "@/types";
import { toPublicUserDTO, type PublicUserDTO } from "@/lib/serializers";

function toDTO(doc: HydratedDocument<CompensationRequestDocument>): CompensationRequestDTO {
  return {
    id: doc._id.toString(),
    requesterId: doc.requesterId.toString(),
    type: doc.type,
    fromCity: doc.fromCity,
    toCity: doc.toCity,
    fromCountry: doc.fromCountry,
    toCountry: doc.toCountry,
    travelDate: doc.travelDate.toISOString(),
    availableWeightKg: doc.availableWeightKg,
    packageDescription: doc.packageDescription,
    weightKg: doc.weightKg,
    compensationOffer: doc.compensationOffer,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface CompensationWithRequester extends CompensationRequestDTO {
  requester: PublicUserDTO;
}

export interface CompensationSearchFilters {
  type?: CompensationType;
  fromCity?: string;
  toCity?: string;
  fromCountry?: string;
  toCountry?: string;
}

export async function searchCompensationRequests(
  filters: CompensationSearchFilters
): Promise<ActionResult<CompensationWithRequester[]>> {
  await connectDB();

  const match: Record<string, unknown> = { status: "open" };
  if (filters.type) match.type = filters.type;
  if (filters.fromCity) match.fromCity = new RegExp(escapeRegex(filters.fromCity), "i");
  if (filters.toCity) match.toCity = new RegExp(escapeRegex(filters.toCity), "i");
  if (filters.fromCountry) match.fromCountry = new RegExp(escapeRegex(filters.fromCountry), "i");
  if (filters.toCountry) match.toCountry = new RegExp(escapeRegex(filters.toCountry), "i");

  const docs = await CompensationRequestModel.find(match).sort({ travelDate: 1 }).limit(200);
  const requesterIds = [...new Set(docs.map((d) => d.requesterId.toString()))];
  const requesters = await UserModel.find({ _id: { $in: requesterIds } });
  const requesterMap = new Map(requesters.map((r) => [r._id.toString(), toPublicUserDTO(r)]));

  const results: CompensationWithRequester[] = docs
    .map((d) => {
      const requester = requesterMap.get(d.requesterId.toString());
      if (!requester) return null;
      return { ...toDTO(d), requester };
    })
    .filter((d): d is CompensationWithRequester => d !== null);

  return actionOk(results);
}

export async function getMyCompensationRequests(): Promise<ActionResult<CompensationRequestDTO[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour voir tes annonces");
  await connectDB();
  const docs = await CompensationRequestModel.find({ requesterId: sessionUserId }).sort({ createdAt: -1 });
  return actionOk(docs.map(toDTO));
}

export async function createCompensationRequest(input: unknown): Promise<ActionResult<{ id: string }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour publier une annonce");

  const parsed = compensationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  await connectDB();
  const created = await CompensationRequestModel.create({
    ...parsed.data,
    travelDate: new Date(parsed.data.travelDate),
    requesterId: sessionUserId,
    status: "open",
  });

  return actionOk({ id: created._id.toString() });
}

async function assertRequester(id: string, sessionUserId: string) {
  const doc = await CompensationRequestModel.findById(id);
  if (!doc) return { error: actionError("NOT_FOUND", "Annonce introuvable"), doc: null };
  if (doc.requesterId.toString() !== sessionUserId) {
    return { error: actionError("FORBIDDEN", "Cette annonce ne t'appartient pas"), doc: null };
  }
  return { error: null, doc };
}

export async function closeCompensationRequest(id: string): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");

  await connectDB();
  const { error, doc } = await assertRequester(id, sessionUserId);
  if (error || !doc) return error!;

  doc.status = "closed";
  await doc.save();
  return actionOk({ updated: true });
}

export async function deleteCompensationRequest(id: string): Promise<ActionResult<{ deleted: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour supprimer cette annonce");

  await connectDB();
  const { error, doc } = await assertRequester(id, sessionUserId);
  if (error || !doc) return error!;

  await doc.deleteOne();
  return actionOk({ deleted: true });
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
