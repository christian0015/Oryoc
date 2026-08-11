// lib/serializers.ts
import type { HydratedDocument } from "mongoose";
import type { UserDocument, ListingDocument } from "@/lib/models";
import type { UserDTO, ListingDTO } from "@/types";

export type PublicUserDTO = Omit<UserDTO, "certificationDocuments" | "email" | "phone">;

export function toPublicUserDTO(doc: HydratedDocument<UserDocument>): PublicUserDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    role: doc.role,
    certificationStatus: doc.certificationStatus,
    trustScores: doc.trustScores,
    reviewCount: doc.reviewCount,
    authProvider: doc.authProvider,
    locale: doc.locale,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPrivateUserDTO(doc: HydratedDocument<UserDocument>): UserDTO {
  return {
    ...toPublicUserDTO(doc),
    email: doc.email,
    phone: doc.phone,
    certificationDocuments: doc.certificationDocuments,
  };
}

export function toListingDTO(doc: HydratedDocument<ListingDocument>): ListingDTO {
  return {
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    title: doc.title,
    description: doc.description,
    propertyType: doc.propertyType,
    contractType: doc.contractType,
    price: doc.price,
    currency: doc.currency,
    rooms: doc.rooms,
    bathrooms: doc.bathrooms,
    balconies: doc.balconies,
    hasPool: doc.hasPool,
    location: {
      address: doc.location.address,
      lat: doc.location.lat,
      lng: doc.location.lng,
      neighborhood: doc.location.neighborhood,
      city: doc.location.city,
    },
    photos: doc.photos,
    videoClips: doc.videoClips,
    panoramaScenes: doc.panoramaScenes,
    status: doc.status,
    lastConfirmedAt: doc.lastConfirmedAt.toISOString(),
    isBoosted: doc.isBoosted,
    boostExpiresAt: doc.boostExpiresAt?.toISOString(),
    badges: doc.badges,
    trustScores: doc.trustScores,
    reviewCount: doc.reviewCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
