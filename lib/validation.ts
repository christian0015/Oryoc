// lib/validation.ts
import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres").max(80),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(8, "8 caracteres minimum"),
  role: z.enum(["tenant", "owner", "agency", "broker", "recurring_landlord"]),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  locale: z.enum(["fr", "en"]).optional(),
  role: z.enum(["tenant", "owner", "agency", "broker", "recurring_landlord"]).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const certificationSubmitSchema = z.object({
  documentUrls: z.array(z.string().url()).min(1, "Ajoute au moins un document"),
});

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const locationSchema = z.object({
  address: z.string().trim().min(3),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().min(2),
});

export const listingCreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(4000),
  propertyType: z.enum(["apartment", "studio", "villa", "shared_room"]),
  contractType: z.enum(["long_term", "student_lease", "roommate_share"]),
  price: z.number().min(0),
  currency: z.string().default("MAD"),
  rooms: z.number().min(0).max(30),
  bathrooms: z.number().min(0).max(15),
  balconies: z.number().min(0).max(10).default(0),
  hasPool: z.boolean().default(false),
  location: locationSchema,
  photos: z.array(z.string().url()).min(3, "Ajoute au moins 3 photos").max(30),
  videoClips: z.array(z.string().url()).max(6).default([]),
});
export type ListingCreateInput = z.infer<typeof listingCreateSchema>;

export const listingSearchSchema = z.object({
  city: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  minRooms: z.number().optional(),
  maxRooms: z.number().optional(),
  minBathrooms: z.number().optional(),
  minBalconies: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  contractType: z.enum(["long_term", "student_lease", "roommate_share"]).optional(),
  hasPool: z.boolean().optional(),
  certifiedOnly: z.boolean().optional(),
  has360Tour: z.boolean().optional(),
  nearLat: z.number().optional(),
  nearLng: z.number().optional(),
  maxDistanceKm: z.number().optional(),
});

export const panoramaSceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().url(),
  links: z
    .array(
      z.object({
        targetSceneId: z.string(),
        hotspotYaw: z.number(),
        hotspotPitch: z.number(),
      })
    )
    .default([]),
});
export const panoramaSceneListSchema = z.array(panoramaSceneSchema).max(20);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewCreateSchema = z.object({
  targetType: z.enum(["profile", "listing"]),
  targetId: z.string().min(1),
  scores: z.object({
    reliability: z.number().min(1).max(5),
    respect: z.number().min(1).max(5),
    social: z.number().min(1).max(5),
  }),
  comment: z.string().trim().max(1000).default(""),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const eventLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().trim().min(3),
});

export const eventCreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(3000),
  category: z.enum(["social", "culture", "sport", "networking", "music", "other"]),
  photos: z.array(z.string().url()).max(10).default([]),
  dateTime: z.string().datetime().or(z.string().min(1)),
  location: eventLocationSchema,
  price: z.number().min(0).optional(),
  isFree: z.boolean().default(true),
  capacity: z.number().min(1).optional(),
  contactLink: z.string().url().optional().or(z.literal("")),
});
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

// ---------------------------------------------------------------------------
// Compensation (cross-border trip / transport matching)
// ---------------------------------------------------------------------------

export const compensationCreateSchema = z
  .object({
    type: z.enum(["trip_offer", "transport_request"]),
    fromCity: z.string().trim().min(2),
    toCity: z.string().trim().min(2),
    fromCountry: z.string().trim().min(2),
    toCountry: z.string().trim().min(2),
    travelDate: z.string().min(1),
    availableWeightKg: z.number().min(0).optional(),
    packageDescription: z.string().trim().max(500).optional(),
    weightKg: z.number().min(0).optional(),
    compensationOffer: z.string().trim().max(300).optional(),
  })
  .refine((v) => (v.type === "trip_offer" ? v.availableWeightKg !== undefined : true), {
    message: "Precise le poids disponible",
    path: ["availableWeightKg"],
  })
  .refine((v) => (v.type === "transport_request" ? !!v.packageDescription : true), {
    message: "Decris ce qui doit etre transporte",
    path: ["packageDescription"],
  });
export type CompensationCreateInput = z.infer<typeof compensationCreateSchema>;
