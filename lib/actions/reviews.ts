// lib/actions/reviews.ts
"use server";

import { connectDB } from "@/lib/db";
import { ReviewModel, UserModel, ListingModel, type ReviewDocument } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth";
import { reviewCreateSchema } from "@/lib/validation";
import { recomputeUserTrustScore, recomputeListingTrustScore } from "@/lib/trust-score";
import { toPublicUserDTO, type PublicUserDTO } from "@/lib/serializers";
import { actionOk, actionError, type ActionResult, type ReviewDTO } from "@/types";
import type { HydratedDocument } from "mongoose";

export interface ReviewWithAuthor extends ReviewDTO {
  author: PublicUserDTO;
}

function toReviewDTO(doc: HydratedDocument<ReviewDocument>): ReviewDTO {
  return {
    id: doc._id.toString(),
    authorId: doc.authorId.toString(),
    targetType: doc.targetType,
    targetId: doc.targetId.toString(),
    scores: doc.scores,
    comment: doc.comment,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createReview(input: unknown): Promise<ActionResult<{ id: string }>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionError("AUTH_REQUIRED", "Connecte-toi pour laisser un avis");

  const parsed = reviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "Avis invalide", parsed.error.flatten().fieldErrors);
  }
  const { targetType, targetId, scores, comment } = parsed.data;

  await connectDB();

  if (targetType === "profile" && targetId === sessionUserId) {
    return actionError("FORBIDDEN", "Tu ne peux pas t'auto-evaluer");
  }
  if (targetType === "listing") {
    const listing = await ListingModel.findById(targetId);
    if (!listing) return actionError("NOT_FOUND", "Annonce introuvable");
    if (listing.ownerId.toString() === sessionUserId) {
      return actionError("FORBIDDEN", "Tu ne peux pas evaluer ta propre annonce");
    }
  }

  const existing = await ReviewModel.findOne({ authorId: sessionUserId, targetType, targetId });
  if (existing) {
    existing.scores = scores;
    existing.comment = comment;
    await existing.save();
  } else {
    await ReviewModel.create({ authorId: sessionUserId, targetType, targetId, scores, comment });
  }

  if (targetType === "profile") await recomputeUserTrustScore(targetId);
  else await recomputeListingTrustScore(targetId);

  return actionOk({ id: targetId });
}

export async function getReviewsForTarget(
  targetType: "profile" | "listing",
  targetId: string
): Promise<ActionResult<ReviewWithAuthor[]>> {
  await connectDB();
  const reviews = await ReviewModel.find({ targetType, targetId }).sort({ createdAt: -1 });
  const authorIds = [...new Set(reviews.map((r) => r.authorId.toString()))];
  const authors = await UserModel.find({ _id: { $in: authorIds } });
  const authorMap = new Map(authors.map((a) => [a._id.toString(), toPublicUserDTO(a)]));

  const withAuthors: ReviewWithAuthor[] = reviews
    .map((r) => {
      const author = authorMap.get(r.authorId.toString());
      if (!author) return null;
      return { ...toReviewDTO(r), author };
    })
    .filter((r): r is ReviewWithAuthor => r !== null);

  return actionOk(withAuthors);
}

export async function getMyReviewForTarget(
  targetType: "profile" | "listing",
  targetId: string
): Promise<ActionResult<ReviewDTO | null>> {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return actionOk(null);
  await connectDB();
  const review = await ReviewModel.findOne({ authorId: sessionUserId, targetType, targetId });
  return actionOk(review ? toReviewDTO(review) : null);
}
