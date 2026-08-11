// lib/models.ts
import mongoose, { Schema, model, models, type Model, type Document } from "mongoose";
import type {
  UserRole,
  CertificationStatus,
  AuthProvider,
  Locale,
  PropertyType,
  ContractType,
  ListingStatus,
  ReviewTargetType,
  EventStatus,
  EventCategory,
  ReportTargetType,
  ReportStatus,
  CompensationType,
  CompensationStatus,
  FavoriteTargetType,
} from "@/types";

/**
 * All field/enum names below are kept in English, matching the product
 * spec's language rule. Every geo-bearing schema mirrors its lat/lng
 * into a GeoJSON `geo` subfield so we can keep a real `2dsphere` index
 * while the app-facing shape stays `{ address, lat, lng, ... }`.
 */

const TrustScoresSchema = new Schema(
  {
    reliability: { type: Number, default: 0, min: 0, max: 5 },
    respect: { type: Number, default: 0, min: 0, max: 5 },
    social: { type: Number, default: 0, min: 0, max: 5 },
  },
  { _id: false }
);

const GeoJSONPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface UserDocument extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  certificationStatus: CertificationStatus;
  certificationDocuments: string[];
  trustScores: { reliability: number; respect: number; social: number };
  reviewCount: number;
  isAdmin: boolean;
  authProvider: AuthProvider;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["tenant", "owner", "agency", "broker", "recurring_landlord"],
      required: true,
      default: "tenant",
    },
    certificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    certificationDocuments: { type: [String], default: [] },
    trustScores: { type: TrustScoresSchema, default: () => ({}) },
    reviewCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["google", "credentials"], required: true },
    locale: { type: String, enum: ["fr", "en"], default: "fr" },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

const PanoramaLinkSchema = new Schema(
  {
    targetSceneId: { type: String, required: true },
    hotspotYaw: { type: Number, required: true },
    hotspotPitch: { type: Number, required: true },
  },
  { _id: false }
);

const PanoramaSceneSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    links: { type: [PanoramaLinkSchema], default: [] },
  },
  { _id: false }
);

const ListingLocationSchema = new Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    neighborhood: { type: String },
    city: { type: String, required: true, index: true },
    geo: { type: GeoJSONPointSchema, default: () => ({}) },
  },
  { _id: false }
);

export interface ListingDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
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
  location: {
    address: string;
    lat: number;
    lng: number;
    neighborhood?: string;
    city: string;
    geo: { type: string; coordinates: number[] };
  };
  photos: string[];
  videoClips: string[];
  panoramaScenes: {
    id: string;
    name: string;
    imageUrl: string;
    links: { targetSceneId: string; hotspotYaw: number; hotspotPitch: number }[];
  }[];
  status: ListingStatus;
  lastConfirmedAt: Date;
  isBoosted: boolean;
  boostExpiresAt?: Date;
  badges: string[];
  trustScores: { reliability: number; respect: number; social: number };
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<ListingDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ["apartment", "studio", "villa", "shared_room"],
      required: true,
    },
    contractType: {
      type: String,
      enum: ["long_term", "student_lease", "roommate_share"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "MAD" },
    rooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    balconies: { type: Number, default: 0, min: 0 },
    hasPool: { type: Boolean, default: false },
    location: { type: ListingLocationSchema, required: true },
    photos: { type: [String], default: [] },
    videoClips: { type: [String], default: [] },
    panoramaScenes: { type: [PanoramaSceneSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "pending_confirmation", "trash", "archived"],
      default: "pending_confirmation",
      index: true,
    },
    lastConfirmedAt: { type: Date, default: () => new Date() },
    isBoosted: { type: Boolean, default: false },
    boostExpiresAt: { type: Date },
    badges: { type: [String], default: [] },
    trustScores: { type: TrustScoresSchema, default: () => ({}) },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ListingSchema.index({ "location.geo": "2dsphere" });
ListingSchema.index({ status: 1, isBoosted: -1, createdAt: -1 });
ListingSchema.index({ title: "text", description: "text" });

ListingSchema.pre("save", function () {
  if (this.isModified("location") && this.location) {
    this.location.geo = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat],
    };
  }
});

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export interface ReviewDocument extends Document {
  authorId: mongoose.Types.ObjectId;
  targetType: ReviewTargetType;
  targetId: mongoose.Types.ObjectId;
  scores: { reliability: number; respect: number; social: number };
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["profile", "listing"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    scores: { type: TrustScoresSchema, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReviewSchema.index({ targetType: 1, targetId: 1 });

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

const EventLocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    geo: { type: GeoJSONPointSchema, default: () => ({}) },
  },
  { _id: false }
);

export interface EventDocument extends Document {
  organizerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: EventCategory;
  photos: string[];
  dateTime: Date;
  location: { lat: number; lng: number; address: string; geo: { type: string; coordinates: number[] } };
  price?: number;
  isFree: boolean;
  capacity?: number;
  contactLink?: string;
  status: EventStatus;
  favoritesCount: number;
  reportsCount: number;
  createdAt: Date;
}

const EventSchema = new Schema<EventDocument>(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["social", "culture", "sport", "networking", "music", "other"],
      default: "other",
    },
    photos: { type: [String], default: [] },
    dateTime: { type: Date, required: true, index: true },
    location: { type: EventLocationSchema, required: true },
    price: { type: Number },
    isFree: { type: Boolean, default: true },
    capacity: { type: Number },
    contactLink: { type: String },
    status: {
      type: String,
      enum: ["pending_moderation", "published", "rejected", "cancelled"],
      default: "pending_moderation",
      index: true,
    },
    favoritesCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EventSchema.index({ "location.geo": "2dsphere" });

EventSchema.pre("save", function () {
  if (this.isModified("location") && this.location) {
    this.location.geo = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat],
    };
  }
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface ReportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
}

const ReportSchema = new Schema<ReportDocument>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["listing", "event", "profile", "review"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["open", "reviewed", "dismissed", "actioned"], default: "open", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------------------------------------------------------------------------
// CompensationRequest
// ---------------------------------------------------------------------------

export interface CompensationRequestDocument extends Document {
  requesterId: mongoose.Types.ObjectId;
  type: CompensationType;
  fromCity: string;
  toCity: string;
  fromCountry: string;
  toCountry: string;
  travelDate: Date;
  availableWeightKg?: number;
  packageDescription?: string;
  weightKg?: number;
  compensationOffer?: string;
  status: CompensationStatus;
  createdAt: Date;
}

const CompensationRequestSchema = new Schema<CompensationRequestDocument>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["trip_offer", "transport_request"], required: true, index: true },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    fromCountry: { type: String, required: true },
    toCountry: { type: String, required: true },
    travelDate: { type: Date, required: true },
    availableWeightKg: { type: Number, min: 0 },
    packageDescription: { type: String },
    weightKg: { type: Number, min: 0 },
    compensationOffer: { type: String },
    status: { type: String, enum: ["open", "negotiating", "closed", "cancelled"], default: "open", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------------------------------------------------------------------------
// Favorite
// ---------------------------------------------------------------------------

export interface FavoriteDocument extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: FavoriteTargetType;
  targetId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["listing", "event"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FavoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model exports — `models.X ?? model(...)` guards against Next.js hot
// reload re-registering the same schema.
// ---------------------------------------------------------------------------

export const UserModel: Model<UserDocument> =
  (models.User as Model<UserDocument>) ?? model<UserDocument>("User", UserSchema);

export const ListingModel: Model<ListingDocument> =
  (models.Listing as Model<ListingDocument>) ?? model<ListingDocument>("Listing", ListingSchema);

export const ReviewModel: Model<ReviewDocument> =
  (models.Review as Model<ReviewDocument>) ?? model<ReviewDocument>("Review", ReviewSchema);

export const EventModel: Model<EventDocument> =
  (models.Event as Model<EventDocument>) ?? model<EventDocument>("Event", EventSchema);

export const ReportModel: Model<ReportDocument> =
  (models.Report as Model<ReportDocument>) ?? model<ReportDocument>("Report", ReportSchema);

export const CompensationRequestModel: Model<CompensationRequestDocument> =
  (models.CompensationRequest as Model<CompensationRequestDocument>) ??
  model<CompensationRequestDocument>("CompensationRequest", CompensationRequestSchema);

export const FavoriteModel: Model<FavoriteDocument> =
  (models.Favorite as Model<FavoriteDocument>) ?? model<FavoriteDocument>("Favorite", FavoriteSchema);
