// lib/actions/listings.ts
"use server";

import mongoose, { type HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/db";
import { ListingModel, FavoriteModel, ReportModel, type ListingDocument } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth";
import { UserModel } from "@/lib/models";
import { listingCreateSchema, panoramaSceneListSchema } from "@/lib/validation";
import { haversineDistanceKm, fuzzyRoomRange, fuzzyPriceRange } from "@/lib/geo";
import { deleteListingCascade } from "@/lib/cascade-delete";
import { extractPublicId, deleteAsset } from "@/lib/cloudinary";
import { toPublicUserDTO, toListingDTO, type PublicUserDTO } from "@/lib/serializers";
import {
  actionOk,
  actionError,
  type ActionResult,
  type ListingDTO,
  type ListingSearchFilters,
  type PanoramaScene,
} from "@/types";

export interface ListingWithDistance extends ListingDTO {
  distanceKm?: number;
}

export interface ListingSearchResult {
  listings: ListingWithDistance[];
  total: number;
}

const PAGE_SIZE = 24;

export async function searchListings(
  filters: ListingSearchFilters,
  page = 1
): Promise<ActionResult<ListingSearchResult>> {
  await connectDB();

  const match: Record<string, unknown> = { status: "active" };

  if (filters.city) match["location.city"] = new RegExp(`^${escapeRegex(filters.city)}$`, "i");
  if (filters.neighborhood)
    match["location.neighborhood"] = new RegExp(escapeRegex(filters.neighborhood), "i");
  if (filters.contractType) match.contractType = filters.contractType;
  if (filters.hasPool) match.hasPool = true;

  const roomsRange: Record<string, number> = {};
  if (filters.minRooms !== undefined) roomsRange.$gte = fuzzyRoomRange(filters.minRooms).min;
  if (filters.maxRooms !== undefined) roomsRange.$lte = fuzzyRoomRange(filters.maxRooms).max;
  if (Object.keys(roomsRange).length) match.rooms = roomsRange;

  if (filters.minBathrooms !== undefined) match.bathrooms = { $gte: filters.minBathrooms };
  if (filters.minBalconies !== undefined) match.balconies = { $gte: filters.minBalconies };

  const priceRange: Record<string, number> = {};
  if (filters.minPrice !== undefined) priceRange.$gte = fuzzyPriceRange(filters.minPrice).min;
  if (filters.maxPrice !== undefined) priceRange.$lte = fuzzyPriceRange(filters.maxPrice).max;
  if (Object.keys(priceRange).length) match.price = priceRange;

  if (filters.has360Tour) match["panoramaScenes.0"] = { $exists: true };

  const pipeline: mongoose.PipelineStage[] = [{ $match: match }];

  if (filters.certifiedOnly) {
    pipeline.push(
      { $lookup: { from: "users", localField: "ownerId", foreignField: "_id", as: "owner" } },
      { $unwind: "$owner" },
      { $match: { "owner.certificationStatus": "verified" } }
    );
  }

  pipeline.push({ $sort: { isBoosted: -1, createdAt: -1 } }, { $limit: 300 });

  const raw = await ListingModel.aggregate(pipeline);
  let listings: ListingWithDistance[] = raw.map((doc) => toListingDTO(doc as HydratedDocument<ListingDocument>));

  if (filters.nearLat !== undefined && filters.nearLng !== undefined) {
    const origin = { lat: filters.nearLat, lng: filters.nearLng };
    listings = listings
      .map((l) => ({ ...l, distanceKm: haversineDistanceKm(origin, { lat: l.location.lat, lng: l.location.lng }) }))
      .filter((l) => (filters.maxDistanceKm ? (l.distanceKm ?? Infinity) <= filters.maxDistanceKm : true))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  const total = listings.length;
  const start = (page - 1) * PAGE_SIZE;
  const paged = listings.slice(start, start + PAGE_SIZE);

  return actionOk({ listings: paged, total });
}

export async function getListingById(
  id: string
): Promise<ActionResult<ListingDTO & { owner: PublicUserDTO }>> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return actionError("NOT_FOUND", "Annonce introuvable");

  const listing = await ListingModel.findById(id);
  if (!listing || listing.status === "trash") return actionError("NOT_FOUND", "Annonce introuvable");

  const owner = await UserModel.findById(listing.ownerId);
  if (!owner) return actionError("NOT_FOUND", "Annonce introuvable");

  return actionOk({ ...toListingDTO(listing), owner: toPublicUserDTO(owner) });
}

export async function getListingsByOwner(ownerId: string): Promise<ActionResult<ListingDTO[]>> {
  await connectDB();
  const listings = await ListingModel.find({ ownerId, status: { $ne: "trash" } }).sort({ createdAt: -1 });
  return actionOk(listings.map(toListingDTO));
}

export async function getMyListings(): Promise<ActionResult<ListingDTO[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour voir tes annonces");
  await connectDB();
  const listings = await ListingModel.find({ ownerId: sessionUserId }).sort({ createdAt: -1 });
  return actionOk(listings.map(toListingDTO));
}

export async function createListing(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour publier une annonce");

  const parsed = listingCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  await connectDB();
  const created = await ListingModel.create({
    ...parsed.data,
    ownerId: sessionUserId,
    status: "active",
    lastConfirmedAt: new Date(),
  });

  return actionOk({ id: created._id.toString() });
}

async function assertOwnership(listingId: string, sessionUserId: string) {
  const listing = await ListingModel.findById(listingId);
  if (!listing) return { error: actionError("NOT_FOUND", "Annonce introuvable"), listing: null };
  if (listing.ownerId.toString() !== sessionUserId) {
    return { error: actionError("FORBIDDEN", "Cette annonce ne t'appartient pas"), listing: null };
  }
  return { error: null, listing };
}

const EDITABLE_LISTING_FIELDS = [
  "title",
  "description",
  "price",
  "rooms",
  "bathrooms",
  "balconies",
  "hasPool",
  "propertyType",
  "contractType",
] as const;
type EditableListingField = (typeof EDITABLE_LISTING_FIELDS)[number];

/** Autosave/immediate-apply single-field editor (§6.3). */
export async function updateListingField(
  listingId: string,
  field: EditableListingField,
  value: string | number | boolean
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");
  if (!EDITABLE_LISTING_FIELDS.includes(field)) {
    return actionError("VALIDATION_ERROR", "Champ non editable");
  }

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.set(field, value);
  await listing.save();
  return actionOk({ updated: true });
}

export async function updateListingLocation(
  listingId: string,
  location: ListingDTO["location"]
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.location = { ...location, geo: { type: "Point", coordinates: [location.lng, location.lat] } };
  await listing.save();
  return actionOk({ updated: true });
}

export async function updateListingMedia(
  listingId: string,
  media: { photos?: string[]; videoClips?: string[] }
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  if (media.photos) listing.photos = media.photos;
  if (media.videoClips) listing.videoClips = media.videoClips;
  await listing.save();
  return actionOk({ updated: true });
}

export async function updatePanoramaScenes(
  listingId: string,
  scenes: PanoramaScene[]
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");

  const parsed = panoramaSceneListSchema.safeParse(scenes);
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Visite 360 invalide");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.panoramaScenes = parsed.data;
  await listing.save();
  return actionOk({ updated: true });
}

/** "Toujours disponible" — resets the relance clock (§2 lifecycle). */
export async function confirmListingStillAvailable(
  listingId: string
): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour confirmer cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.lastConfirmedAt = new Date();
  if (listing.status === "pending_confirmation") listing.status = "active";
  await listing.save();
  return actionOk({ updated: true });
}

export async function moveListingToTrash(listingId: string): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour supprimer cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.status = "trash";
  await listing.save();
  return actionOk({ updated: true });
}

export async function deleteListingPermanently(
  listingId: string
): Promise<ActionResult<{ deleted: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour supprimer cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  await deleteListingCascade(listingId);
  return actionOk({ deleted: true });
}

/** Called by the gallery uploader before wiring a replaced photo array in,
 * so a removed photo never lingers as an orphaned Cloudinary asset. */
export async function removeListingPhoto(listingId: string, url: string): Promise<ActionResult<{ removed: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour modifier cette annonce");

  await connectDB();
  const { error, listing } = await assertOwnership(listingId, sessionUserId);
  if (error || !listing) return error!;

  listing.photos = listing.photos.filter((p) => p !== url);
  await listing.save();

  const publicId = extractPublicId(url);
  if (publicId) await deleteAsset(publicId, "image");

  return actionOk({ removed: true });
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export async function toggleFavoriteListing(listingId: string): Promise<ActionResult<{ favorited: boolean }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour ajouter aux favoris");

  await connectDB();
  const existing = await FavoriteModel.findOne({
    userId: sessionUserId,
    targetType: "listing",
    targetId: listingId,
  });

  if (existing) {
    await existing.deleteOne();
    return actionOk({ favorited: false });
  }

  await FavoriteModel.create({ userId: sessionUserId, targetType: "listing", targetId: listingId });
  return actionOk({ favorited: true });
}

export async function getMyFavoriteListingIds(): Promise<ActionResult<string[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionOk([]); // silent — favorites just render unfilled for guests
  await connectDB();
  const favorites = await FavoriteModel.find({ userId: sessionUserId, targetType: "listing" });
  return actionOk(favorites.map((f) => f.targetId.toString()));
}

export async function getMyFavoriteListings(): Promise<ActionResult<ListingDTO[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour voir tes favoris");
  await connectDB();
  const favorites = await FavoriteModel.find({ userId: sessionUserId, targetType: "listing" });
  const ids = favorites.map((f) => f.targetId);
  const listings = await ListingModel.find({ _id: { $in: ids } });
  return actionOk(listings.map(toListingDTO));
}

export async function reportListing(listingId: string, reason: string): Promise<ActionResult<{ reported: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour signaler cette annonce");
  if (!reason.trim()) return actionError("VALIDATION_ERROR", "Precise une raison");

  await connectDB();
  await ReportModel.create({ reporterId: sessionUserId, targetType: "listing", targetId: listingId, reason });
  return actionOk({ reported: true });
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function geocodeAddressAction(
  query: string
): Promise<ActionResult<{ lat: number; lng: number; displayName: string }>> {
  const { geocodeAddress } = await import("@/lib/geo");
  const result = await geocodeAddress(query);
  if (!result) return actionError("NOT_FOUND", "Adresse introuvable — precise la ville et le quartier");
  return actionOk(result);
}
