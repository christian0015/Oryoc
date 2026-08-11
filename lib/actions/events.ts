// lib/actions/events.ts
"use server";

import mongoose, { type HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/db";
import { EventModel, FavoriteModel, ReportModel, type EventDocument } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth";
import { eventCreateSchema } from "@/lib/validation";
import { haversineDistanceKm } from "@/lib/geo";
import { deleteEventCascade } from "@/lib/cascade-delete";
import { toPublicUserDTO, type PublicUserDTO } from "@/lib/serializers";
import { UserModel } from "@/lib/models";
import { actionOk, actionError, type ActionResult, type EventDTO, type EventCategory } from "@/types";

function toEventDTO(doc: HydratedDocument<EventDocument>): EventDTO {
  return {
    id: doc._id.toString(),
    organizerId: doc.organizerId.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    photos: doc.photos,
    dateTime: doc.dateTime.toISOString(),
    location: { lat: doc.location.lat, lng: doc.location.lng, address: doc.location.address },
    price: doc.price,
    isFree: doc.isFree,
    capacity: doc.capacity,
    contactLink: doc.contactLink,
    status: doc.status,
    favoritesCount: doc.favoritesCount,
    reportsCount: doc.reportsCount,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface EventWithDistance extends EventDTO {
  distanceKm?: number;
}

export interface EventSearchFilters {
  category?: EventCategory;
  freeOnly?: boolean;
  nearLat?: number;
  nearLng?: number;
  maxDistanceKm?: number;
}

export async function searchEvents(filters: EventSearchFilters): Promise<ActionResult<EventWithDistance[]>> {
  await connectDB();

  const match: Record<string, unknown> = { status: "published", dateTime: { $gte: new Date() } };
  if (filters.category) match.category = filters.category;
  if (filters.freeOnly) match.isFree = true;

  const docs = await EventModel.find(match).sort({ dateTime: 1 }).limit(200);
  let events: EventWithDistance[] = docs.map(toEventDTO);

  if (filters.nearLat !== undefined && filters.nearLng !== undefined) {
    const origin = { lat: filters.nearLat, lng: filters.nearLng };
    events = events
      .map((e) => ({ ...e, distanceKm: haversineDistanceKm(origin, { lat: e.location.lat, lng: e.location.lng }) }))
      .filter((e) => (filters.maxDistanceKm ? (e.distanceKm ?? Infinity) <= filters.maxDistanceKm : true))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return actionOk(events);
}

export async function getEventById(id: string): Promise<ActionResult<EventDTO & { organizer: PublicUserDTO }>> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return actionError("NOT_FOUND", "Evenement introuvable");

  const event = await EventModel.findById(id);
  if (!event) return actionError("NOT_FOUND", "Evenement introuvable");

  const organizer = await UserModel.findById(event.organizerId);
  if (!organizer) return actionError("NOT_FOUND", "Evenement introuvable");

  return actionOk({ ...toEventDTO(event), organizer: toPublicUserDTO(organizer) });
}

export async function getMyEvents(): Promise<ActionResult<EventDTO[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour voir tes evenements");
  await connectDB();
  const events = await EventModel.find({ organizerId: sessionUserId }).sort({ dateTime: -1 });
  return actionOk(events.map(toEventDTO));
}

export async function createEvent(input: unknown): Promise<ActionResult<{ id: string }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour creer un evenement");

  const parsed = eventCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Formulaire invalide", parsed.error.flatten().fieldErrors);
  }

  await connectDB();
  const created = await EventModel.create({
    ...parsed.data,
    contactLink: parsed.data.contactLink || undefined,
    dateTime: new Date(parsed.data.dateTime),
    organizerId: sessionUserId,
    status: "pending_moderation",
  });

  return actionOk({ id: created._id.toString() });
}

async function assertOrganizer(eventId: string, sessionUserId: string) {
  const event = await EventModel.findById(eventId);
  if (!event) return { error: actionError("NOT_FOUND", "Evenement introuvable"), event: null };
  if (event.organizerId.toString() !== sessionUserId) {
    return { error: actionError("FORBIDDEN", "Cet evenement ne t'appartient pas"), event: null };
  }
  return { error: null, event };
}

export async function cancelEvent(eventId: string): Promise<ActionResult<{ updated: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour annuler cet evenement");

  await connectDB();
  const { error, event } = await assertOrganizer(eventId, sessionUserId);
  if (error || !event) return error!;

  event.status = "cancelled";
  await event.save();
  return actionOk({ updated: true });
}

export async function deleteEventPermanently(eventId: string): Promise<ActionResult<{ deleted: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour supprimer cet evenement");

  await connectDB();
  const { error, event } = await assertOrganizer(eventId, sessionUserId);
  if (error || !event) return error!;

  await deleteEventCascade(eventId);
  return actionOk({ deleted: true });
}

export async function toggleFavoriteEvent(eventId: string): Promise<ActionResult<{ favorited: boolean }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour ajouter aux favoris");

  await connectDB();
  const existing = await FavoriteModel.findOne({ userId: sessionUserId, targetType: "event", targetId: eventId });

  if (existing) {
    await existing.deleteOne();
    await EventModel.findByIdAndUpdate(eventId, { $inc: { favoritesCount: -1 } });
    return actionOk({ favorited: false });
  }

  await FavoriteModel.create({ userId: sessionUserId, targetType: "event", targetId: eventId });
  await EventModel.findByIdAndUpdate(eventId, { $inc: { favoritesCount: 1 } });
  return actionOk({ favorited: true });
}

export async function getMyFavoriteEventIds(): Promise<ActionResult<string[]>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionOk([]);
  await connectDB();
  const favorites = await FavoriteModel.find({ userId: sessionUserId, targetType: "event" });
  return actionOk(favorites.map((f) => f.targetId.toString()));
}

export async function reportEvent(eventId: string, reason: string): Promise<ActionResult<{ reported: true }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour signaler cet evenement");
  if (!reason.trim()) return actionError("VALIDATION_ERROR", "Precise une raison");

  await connectDB();
  await Promise.all([
    ReportModel.create({ reporterId: sessionUserId, targetType: "event", targetId: eventId, reason }),
    EventModel.findByIdAndUpdate(eventId, { $inc: { reportsCount: 1 } }),
  ]);
  return actionOk({ reported: true });
}
