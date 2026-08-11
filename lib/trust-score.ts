// lib/trust-score.ts
import { connectDB } from "@/lib/db";
import { ReviewModel, UserModel, ListingModel } from "@/lib/models";
import type { TrustScores } from "@/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

async function aggregateScores(targetType: "profile" | "listing", targetId: string) {
  const reviews = await ReviewModel.find({ targetType, targetId });
  const scores: TrustScores = {
    reliability: average(reviews.map((r) => r.scores.reliability)),
    respect: average(reviews.map((r) => r.scores.respect)),
    social: average(reviews.map((r) => r.scores.social)),
  };
  return { scores, count: reviews.length };
}

/** Recomputes a profile's trustScores from scratch after a review is
 * added/removed — collections are small enough that a full recompute
 * is simpler and safer than incremental running averages. */
export async function recomputeUserTrustScore(userId: string): Promise<void> {
  await connectDB();
  const { scores, count } = await aggregateScores("profile", userId);
  await UserModel.findByIdAndUpdate(userId, { $set: { trustScores: scores, reviewCount: count } });
}

export async function recomputeListingTrustScore(listingId: string): Promise<void> {
  await connectDB();
  const { scores, count } = await aggregateScores("listing", listingId);
  const listing = await ListingModel.findById(listingId);
  if (!listing) return;

  listing.trustScores = scores;
  listing.reviewCount = count;
  listing.badges = computeListingBadges(listing, scores, count);
  await listing.save();
}

function computeListingBadges(
  listing: { createdAt: Date },
  scores: TrustScores,
  reviewCount: number
): string[] {
  const badges: string[] = [];
  const avg = (scores.reliability + scores.respect + scores.social) / 3;

  if (reviewCount >= 3 && avg >= 4.3) badges.push("bien_note");

  const ageInDays = (Date.now() - new Date(listing.createdAt).getTime()) / 86_400_000;
  if (ageInDays <= 7) badges.push("nouveau");

  return badges;
}
