// lib/listing-lifecycle.ts
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/lib/models";

/**
 * Owners confirm a listing is still available every so often, resetting
 * `lastConfirmedAt` (see confirmListingStillAvailable). Unconfirmed
 * listings quietly fall out of search rather than being deleted —
 * deletion always stays an explicit, reversible-until-final action.
 */
export const LISTING_LIFECYCLE = {
  reminderAfterDays: 10, // active -> pending_confirmation (drops out of search)
  trashAfterDays: 15, // pending_confirmation -> trash
  archiveAfterTrashDays: 30, // trash -> archived (kept for records, never auto-deleted)
} as const;

export interface LifecycleSweepResult {
  markedPendingConfirmation: number;
  movedToTrash: number;
  archived: number;
}

export async function runListingLifecycleSweep(): Promise<LifecycleSweepResult> {
  await connectDB();
  const now = Date.now();

  const reminderCutoff = new Date(now - LISTING_LIFECYCLE.reminderAfterDays * 86_400_000);
  const trashCutoff = new Date(now - LISTING_LIFECYCLE.trashAfterDays * 86_400_000);
  const archiveCutoff = new Date(now - LISTING_LIFECYCLE.archiveAfterTrashDays * 86_400_000);

  const pendingResult = await ListingModel.updateMany(
    { status: "active", lastConfirmedAt: { $lte: reminderCutoff } },
    { $set: { status: "pending_confirmation" } }
  );

  const trashResult = await ListingModel.updateMany(
    { status: "pending_confirmation", lastConfirmedAt: { $lte: trashCutoff } },
    { $set: { status: "trash" } }
  );

  const archiveResult = await ListingModel.updateMany(
    { status: "trash", updatedAt: { $lte: archiveCutoff } },
    { $set: { status: "archived" } }
  );

  return {
    markedPendingConfirmation: pendingResult.modifiedCount,
    movedToTrash: trashResult.modifiedCount,
    archived: archiveResult.modifiedCount,
  };
}
