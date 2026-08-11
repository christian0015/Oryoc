// scripts/seed.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  UserModel,
  ListingModel,
  EventModel,
  ReviewModel,
  CompensationRequestModel,
} from "../lib/models";

const PLACEHOLDER = (label: string, size = "800x600") =>
  `https://placehold.co/${size}/1c2024/f3efe7?text=${encodeURIComponent(label)}`;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant dans .env.local");

  await mongoose.connect(uri);
  console.log("Connecte a MongoDB — nettoyage des collections existantes...");

  await Promise.all([
    UserModel.deleteMany({}),
    ListingModel.deleteMany({}),
    EventModel.deleteMany({}),
    ReviewModel.deleteMany({}),
    CompensationRequestModel.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 12);

  console.log("Creation des utilisateurs...");
  const [admin, yasmine, karim, atlasAgency, sofiane] = await UserModel.create([
    {
      email: "admin@oryoc.ma",
      passwordHash,
      name: "Admin ORYOC",
      role: "owner",
      isAdmin: true,
      certificationStatus: "verified",
      authProvider: "credentials",
    },
    {
      email: "yasmine@example.com",
      passwordHash,
      name: "Yasmine Idrissi",
      phone: "+212 6 12 34 56 78",
      role: "owner",
      certificationStatus: "verified",
      certificationDocuments: [PLACEHOLDER("ID Yasmine", "400x300")],
      authProvider: "credentials",
    },
    {
      email: "karim@example.com",
      passwordHash,
      name: "Karim Bensouda",
      role: "tenant",
      certificationStatus: "unverified",
      authProvider: "credentials",
    },
    {
      email: "contact@atlas-immobilier.ma",
      passwordHash,
      name: "Atlas Immobilier",
      phone: "+212 5 22 11 22 33",
      role: "agency",
      certificationStatus: "verified",
      certificationDocuments: [PLACEHOLDER("Mandat Atlas", "400x300")],
      authProvider: "credentials",
    },
    {
      email: "sofiane@example.com",
      passwordHash,
      name: "Sofiane El Amrani",
      role: "broker",
      certificationStatus: "pending",
      certificationDocuments: [PLACEHOLDER("ID Sofiane", "400x300")],
      authProvider: "credentials",
    },
  ]);

  console.log("Creation des annonces...");

  const listingsData: Array<{
    ownerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    propertyType: "apartment" | "studio" | "villa" | "shared_room";
    contractType: "long_term" | "student_lease" | "roommate_share";
    price: number;
    rooms: number;
    bathrooms: number;
    balconies: number;
    hasPool: boolean;
    location: { address: string; lat: number; lng: number; neighborhood?: string; city: string };
    photos: string[];
    isBoosted?: boolean;
    panoramaScenes?: {
      id: string;
      name: string;
      imageUrl: string;
      links: { targetSceneId: string; hotspotYaw: number; hotspotPitch: number }[];
    }[];
  }> = [
    {
      ownerId: yasmine._id,
      title: "Appartement lumineux avec vue sur mer — Ain Diab",
      description:
        "Bel appartement de 3 pieces entierement renove, a deux pas de la corniche. Cuisine equipee, double vitrage, parking securise inclus.",
      propertyType: "apartment",
      contractType: "long_term",
      price: 8500,
      rooms: 3,
      bathrooms: 2,
      balconies: 1,
      hasPool: false,
      location: { address: "Boulevard de la Corniche", lat: 33.5952, lng: -7.6598, neighborhood: "Ain Diab", city: "Casablanca" },
      photos: [PLACEHOLDER("Salon"), PLACEHOLDER("Chambre"), PLACEHOLDER("Cuisine")],
      isBoosted: true,
      panoramaScenes: [
        { id: "scene-1", name: "Salon", imageUrl: PLACEHOLDER("360 Salon", "1600x800"), links: [{ targetSceneId: "scene-2", hotspotYaw: 90, hotspotPitch: 0 }] },
        { id: "scene-2", name: "Chambre", imageUrl: PLACEHOLDER("360 Chambre", "1600x800"), links: [{ targetSceneId: "scene-1", hotspotYaw: -90, hotspotPitch: 0 }] },
      ],
    },
    {
      ownerId: atlasAgency._id,
      title: "Studio moderne proche universite — Agdal",
      description: "Studio ideal pour etudiant, entierement meuble, proche des transports et commerces. Charges comprises.",
      propertyType: "studio",
      contractType: "student_lease",
      price: 3200,
      rooms: 1,
      bathrooms: 1,
      balconies: 0,
      hasPool: false,
      location: { address: "Avenue Ibn Sina", lat: 33.9927, lng: -6.8498, neighborhood: "Agdal", city: "Rabat" },
      photos: [PLACEHOLDER("Studio 1"), PLACEHOLDER("Studio 2")],
    },
    {
      ownerId: atlasAgency._id,
      title: "Villa avec piscine — Palmeraie",
      description: "Villa d'exception de 5 pieces, jardin arbore, piscine privee, quartier calme et securise.",
      propertyType: "villa",
      contractType: "long_term",
      price: 25000,
      rooms: 5,
      bathrooms: 4,
      balconies: 2,
      hasPool: true,
      location: { address: "Route de Fes", lat: 31.6717, lng: -7.9598, neighborhood: "Palmeraie", city: "Marrakech" },
      photos: [PLACEHOLDER("Villa exterieur"), PLACEHOLDER("Piscine"), PLACEHOLDER("Salon villa")],
      isBoosted: true,
    },
    {
      ownerId: yasmine._id,
      title: "Colocation conviviale — Maarif",
      description: "Chambre disponible dans appartement partage de 4 pieces, ambiance jeune et internationale.",
      propertyType: "shared_room",
      contractType: "roommate_share",
      price: 2200,
      rooms: 4,
      bathrooms: 2,
      balconies: 1,
      hasPool: false,
      location: { address: "Rue Ibnou Khatib", lat: 33.5731, lng: -7.6298, neighborhood: "Maarif", city: "Casablanca" },
      photos: [PLACEHOLDER("Coloc salon"), PLACEHOLDER("Coloc chambre")],
    },
  ];

  const listings = await ListingModel.create(
    listingsData.map((l) => ({ ...l, status: "active" as const, lastConfirmedAt: new Date() }))
  );

  console.log("Creation des evenements...");
  await EventModel.create([
    {
      organizerId: karim._id,
      title: "Aperitif communautaire ORYOC",
      description: "Rencontre entre locataires et proprietaires de la plateforme, autour d'un verre.",
      category: "social",
      photos: [PLACEHOLDER("Evenement social")],
      dateTime: new Date(Date.now() + 7 * 86_400_000),
      location: { lat: 33.5951, lng: -7.6187, address: "Rick's Cafe, Casablanca" },
      isFree: true,
      status: "published",
    },
    {
      organizerId: sofiane._id,
      title: "Atelier investissement locatif",
      description: "Session d'introduction a l'investissement locatif au Maroc, animee par des experts.",
      category: "networking",
      photos: [PLACEHOLDER("Atelier networking")],
      dateTime: new Date(Date.now() + 14 * 86_400_000),
      location: { lat: 33.9716, lng: -6.8498, address: "Technopark, Rabat" },
      isFree: false,
      price: 150,
      status: "pending_moderation",
    },
  ]);

  console.log("Creation des demandes de compensation...");
  await CompensationRequestModel.create([
    {
      requesterId: karim._id,
      type: "trip_offer",
      fromCity: "Paris",
      toCity: "Casablanca",
      fromCountry: "France",
      toCountry: "Maroc",
      travelDate: new Date(Date.now() + 10 * 86_400_000),
      availableWeightKg: 8,
      compensationOffer: "Frais de bagage rembourses",
      status: "open",
    },
    {
      requesterId: sofiane._id,
      type: "transport_request",
      fromCity: "Montreal",
      toCity: "Rabat",
      fromCountry: "Canada",
      toCountry: "Maroc",
      travelDate: new Date(Date.now() + 20 * 86_400_000),
      packageDescription: "Un colis de documents et quelques vetements",
      weightKg: 3,
      status: "open",
    },
  ]);

  console.log("Creation des avis et recalcul des scores de confiance...");
  await ReviewModel.create([
    { authorId: karim._id, targetType: "profile", targetId: yasmine._id, scores: { reliability: 5, respect: 5, social: 4 }, comment: "Proprietaire tres reactive et honnete." },
    { authorId: sofiane._id, targetType: "profile", targetId: yasmine._id, scores: { reliability: 4, respect: 5, social: 5 }, comment: "Excellente experience, je recommande." },
    { authorId: karim._id, targetType: "listing", targetId: listings[0]._id, scores: { reliability: 5, respect: 4, social: 5 }, comment: "Appartement conforme aux photos, quartier agreable." },
  ]);

  function average(values: number[]) {
    return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
  }

  const yasmineReviews = await ReviewModel.find({ targetType: "profile", targetId: yasmine._id });
  await UserModel.findByIdAndUpdate(yasmine._id, {
    $set: {
      trustScores: {
        reliability: average(yasmineReviews.map((r) => r.scores.reliability)),
        respect: average(yasmineReviews.map((r) => r.scores.respect)),
        social: average(yasmineReviews.map((r) => r.scores.social)),
      },
      reviewCount: yasmineReviews.length,
    },
  });

  const listing0Reviews = await ReviewModel.find({ targetType: "listing", targetId: listings[0]._id });
  await ListingModel.findByIdAndUpdate(listings[0]._id, {
    $set: {
      trustScores: {
        reliability: average(listing0Reviews.map((r) => r.scores.reliability)),
        respect: average(listing0Reviews.map((r) => r.scores.respect)),
        social: average(listing0Reviews.map((r) => r.scores.social)),
      },
      reviewCount: listing0Reviews.length,
      badges: ["bien_note"],
    },
  });

  console.log("\nTermine !");
  console.log("Comptes de demonstration (mot de passe: password123) :");
  console.log("  admin@oryoc.ma          — administrateur / moderation sur /admin/moderation");
  console.log("  yasmine@example.com     — proprietaire certifiee");
  console.log("  karim@example.com       — locataire");
  console.log("  contact@atlas-immobilier.ma — agence certifiee");
  console.log("  sofiane@example.com     — demarcheur (certification en attente)");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
