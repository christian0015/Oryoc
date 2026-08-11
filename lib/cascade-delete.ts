// lib/cascade-delete.ts
import { connectDB } from "@/lib/db";
import {
  UserModel,
  ListingModel,
  EventModel,
  ReviewModel,
  ReportModel,
  FavoriteModel,
  CompensationRequestModel,
} from "@/lib/models";
import { deleteAssets, extractPublicId } from "@/lib/cloudinary";

function toPublicIds(urls: string[]): string[] {
  return urls.map(extractPublicId).filter((v): v is string => Boolean(v));
}

/** Deletes a listing, every Cloudinary asset it owns, its favorites, and
 * any reviews/reports that pointed at it (§2). */
export async function deleteListingCascade(listingId: string): Promise<{ ok: boolean }> {
  await connectDB();
  const listing = await ListingModel.findById(listingId);
  if (!listing) return { ok: true };

  const photoIds = toPublicIds(listing.photos);
  const panoramaIds = toPublicIds(listing.panoramaScenes.map((s) => s.imageUrl));
  const videoIds = toPublicIds(listing.videoClips);

  await Promise.all([
    photoIds.length || panoramaIds.length ? deleteAssets([...photoIds, ...panoramaIds], "image") : null,
    videoIds.length ? deleteAssets(videoIds, "video") : null,
    ReviewModel.deleteMany({ targetType: "listing", targetId: listing._id }),
    ReportModel.deleteMany({ targetType: "listing", targetId: listing._id }),
    FavoriteModel.deleteMany({ targetType: "listing", targetId: listing._id }),
    ListingModel.findByIdAndDelete(listingId),
  ]);

  return { ok: true };
}

/** Deletes an event, its photos, favorites, and reports. */
export async function deleteEventCascade(eventId: string): Promise<{ ok: boolean }> {
  await connectDB();
  const event = await EventModel.findById(eventId);
  if (!event) return { ok: true };

  const photoIds = toPublicIds(event.photos);

  await Promise.all([
    photoIds.length ? deleteAssets(photoIds, "image") : null,
    ReportModel.deleteMany({ targetType: "event", targetId: event._id }),
    FavoriteModel.deleteMany({ targetType: "event", targetId: event._id }),
    EventModel.findByIdAndDelete(eventId),
  ]);

  return { ok: true };
}

/** Deletes a user account: every listing/event they own (cascading in
 * turn), their reviews, favorites, compensation requests, reports they
 * filed, and their avatar/certification assets. */
export async function deleteUserCascade(userId: string): Promise<{ ok: boolean }> {
  await connectDB();
  const user = await UserModel.findById(userId);
  if (!user) return { ok: true };

  const ownedListings = await ListingModel.find({ ownerId: user._id }, { _id: 1 });
  const ownedEvents = await EventModel.find({ organizerId: user._id }, { _id: 1 });

  await Promise.all(ownedListings.map((l) => deleteListingCascade(l._id.toString())));
  await Promise.all(ownedEvents.map((e) => deleteEventCascade(e._id.toString())));

  const personalAssetIds = toPublicIds([
    ...(user.avatarUrl ? [user.avatarUrl] : []),
    ...user.certificationDocuments,
  ]);

  await Promise.all([
    personalAssetIds.length ? deleteAssets(personalAssetIds, "image") : null,
    ReviewModel.deleteMany({ authorId: user._id }),
    ReviewModel.deleteMany({ targetType: "profile", targetId: user._id }),
    FavoriteModel.deleteMany({ userId: user._id }),
    ReportModel.deleteMany({ reporterId: user._id }),
    CompensationRequestModel.deleteMany({ requesterId: user._id }),
    UserModel.findByIdAndDelete(userId),
  ]);

  return { ok: true };
}
