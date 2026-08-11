// types/index.ts

export type UserRole =
  | "tenant"
  | "owner"
  | "agency"
  | "broker"
  | "recurring_landlord";

export type CertificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type AuthProvider = "google" | "credentials";

export type Locale = "fr" | "en";

export type PropertyType = "apartment" | "studio" | "villa" | "shared_room";

export type ContractType = "long_term" | "student_lease" | "roommate_share";

export type ListingStatus = "active" | "pending_confirmation" | "trash" | "archived";

export type ReviewTargetType = "profile" | "listing";

export type EventStatus = "pending_moderation" | "published" | "rejected" | "cancelled";

export type EventCategory =
  | "social"
  | "culture"
  | "sport"
  | "networking"
  | "music"
  | "other";

export type ReportTargetType = "listing" | "event" | "profile" | "review";

export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

export type CompensationType = "trip_offer" | "transport_request";

export type CompensationStatus = "open" | "negotiating" | "closed" | "cancelled";

export type FavoriteTargetType = "listing" | "event";

export interface TrustScores {
  reliability: number;
  respect: number;
  social: number;
}

export interface GeoPoint {
  address: string;
  lat: number;
  lng: number;
  neighborhood?: string;
  city: string;
}

export interface PanoramaLink {
  targetSceneId: string;
  hotspotYaw: number;
  hotspotPitch: number;
}

export interface PanoramaScene {
  id: string;
  name: string;
  imageUrl: string;
  links: PanoramaLink[];
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  certificationStatus: CertificationStatus;
  certificationDocuments: string[];
  trustScores: TrustScores;
  reviewCount: number;
  authProvider: AuthProvider;
  locale: Locale;
  createdAt: string;
  updatedAt: string;
}

export interface ListingDTO {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  contractType: ContractType;
  price: number;
  currency: string;
  rooms: number;
  bathrooms: number;
  balconies: number;
  hasPool: boolean;
  location: GeoPoint;
  photos: string[];
  videoClips: string[];
  panoramaScenes: PanoramaScene[];
  status: ListingStatus;
  lastConfirmedAt: string;
  isBoosted: boolean;
  boostExpiresAt?: string;
  badges: string[];
  trustScores: TrustScores;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDTO {
  id: string;
  authorId: string;
  targetType: ReviewTargetType;
  targetId: string;
  scores: TrustScores;
  comment: string;
  createdAt: string;
}

export interface EventLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface EventDTO {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  category: EventCategory;
  photos: string[];
  dateTime: string;
  location: EventLocation;
  price?: number;
  isFree: boolean;
  capacity?: number;
  contactLink?: string;
  status: EventStatus;
  favoritesCount: number;
  reportsCount: number;
  createdAt: string;
}

export interface ReportDTO {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface CompensationRequestDTO {
  id: string;
  requesterId: string;
  type: CompensationType;
  fromCity: string;
  toCity: string;
  fromCountry: string;
  toCountry: string;
  travelDate: string;
  availableWeightKg?: number;
  packageDescription?: string;
  weightKg?: number;
  compensationOffer?: string;
  status: CompensationStatus;
  createdAt: string;
}

export interface FavoriteDTO {
  id: string;
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt: string;
}

// Typed action error, returned instead of throwing so client code can
// branch on `code` (e.g. open the auth modal on AUTH_REQUIRED).
export type ActionErrorCode =
  | "AUTH_REQUIRED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "SERVER_ERROR";

export interface ActionError {
  ok: false;
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ActionSuccess<T> {
  ok: true;
  data: T;
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export function actionOk<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function actionError(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionError {
  return { ok: false, code, message, fieldErrors };
}

// Search filters — deliberately capped, see §5.6 of the product spec.
export interface ListingSearchFilters {
  city?: string;
  neighborhood?: string;
  minRooms?: number;
  maxRooms?: number;
  minBathrooms?: number;
  minBalconies?: number;
  minPrice?: number;
  maxPrice?: number;
  contractType?: ContractType;
  hasPool?: boolean;
  certifiedOnly?: boolean;
  has360Tour?: boolean;
  nearLat?: number;
  nearLng?: number;
  maxDistanceKm?: number;
}
