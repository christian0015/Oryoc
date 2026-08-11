// lib/actions/admin.ts
"use server";

import { connectDB } from "@/lib/db";
import { UserModel, EventModel, ReportModel, ListingModel, ReviewModel } from "@/lib/models";
import { requireAdminUserId } from "@/lib/auth";
import { toPublicUserDTO, type PublicUserDTO } from "@/lib/serializers";
import { actionOk, actionError, type ActionResult, type ReportDTO, type EventDTO } from "@/types";

export interface PendingCertificationDTO extends PublicUserDTO {
  certificationDocuments: string[];
  email: string;
}

export async function getPendingCertifications(): Promise<ActionResult<PendingCertificationDTO[]>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  const users = await UserModel.find({ certificationStatus: "pending" });
  return actionOk(
    users.map((u) => ({ ...toPublicUserDTO(u), certificationDocuments: u.certificationDocuments, email: u.email }))
  );
}

export async function decideCertification(
  userId: string,
  decision: "verified" | "rejected"
): Promise<ActionResult<{ updated: true }>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  await UserModel.findByIdAndUpdate(userId, { $set: { certificationStatus: decision } });
  return actionOk({ updated: true });
}

export async function getPendingEvents(): Promise<ActionResult<EventDTO[]>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  const events = await EventModel.find({ status: "pending_moderation" }).sort({ createdAt: 1 });
  return actionOk(
    events.map((e) => ({
      id: e._id.toString(),
      organizerId: e.organizerId.toString(),
      title: e.title,
      description: e.description,
      category: e.category,
      photos: e.photos,
      dateTime: e.dateTime.toISOString(),
      location: e.location,
      price: e.price,
      isFree: e.isFree,
      capacity: e.capacity,
      contactLink: e.contactLink,
      status: e.status,
      favoritesCount: e.favoritesCount,
      reportsCount: e.reportsCount,
      createdAt: e.createdAt.toISOString(),
    }))
  );
}

export async function decideEvent(
  eventId: string,
  decision: "published" | "rejected"
): Promise<ActionResult<{ updated: true }>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  await EventModel.findByIdAndUpdate(eventId, { $set: { status: decision } });
  return actionOk({ updated: true });
}

export interface ReportWithContext extends ReportDTO {
  reporter: PublicUserDTO;
  targetLabel: string;
}

export async function getOpenReports(): Promise<ActionResult<ReportWithContext[]>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  const reports = await ReportModel.find({ status: "open" }).sort({ createdAt: 1 });
  const reporterIds = [...new Set(reports.map((r) => r.reporterId.toString()))];
  const reporters = await UserModel.find({ _id: { $in: reporterIds } });
  const reporterMap = new Map(reporters.map((r) => [r._id.toString(), toPublicUserDTO(r)]));

  const results: ReportWithContext[] = [];
  for (const r of reports) {
    const reporter = reporterMap.get(r.reporterId.toString());
    if (!reporter) continue;

    let targetLabel = r.targetId.toString();
    if (r.targetType === "listing") {
      const l = await ListingModel.findById(r.targetId);
      targetLabel = l?.title ?? "Annonce supprimee";
    } else if (r.targetType === "event") {
      const e = await EventModel.findById(r.targetId);
      targetLabel = e?.title ?? "Evenement supprime";
    } else if (r.targetType === "profile") {
      const u = await UserModel.findById(r.targetId);
      targetLabel = u?.name ?? "Profil supprime";
    } else if (r.targetType === "review") {
      const rev = await ReviewModel.findById(r.targetId);
      targetLabel = rev ? `Avis de ${rev.comment.slice(0, 40)}` : "Avis supprime";
    }

    results.push({
      id: r._id.toString(),
      reporterId: r.reporterId.toString(),
      targetType: r.targetType,
      targetId: r.targetId.toString(),
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter,
      targetLabel,
    });
  }

  return actionOk(results);
}

export async function resolveReport(
  reportId: string,
  decision: "dismissed" | "actioned"
): Promise<ActionResult<{ updated: true }>> {
  const adminId = await requireAdminUserId();
  if (!adminId) return actionError("FORBIDDEN", "Reserve aux moderateurs");

  await connectDB();
  const report = await ReportModel.findById(reportId);
  if (!report) return actionError("NOT_FOUND", "Signalement introuvable");

  report.status = decision;
  await report.save();

  if (decision === "actioned") {
    if (report.targetType === "listing") {
      await ListingModel.findByIdAndUpdate(report.targetId, { $set: { status: "trash" } });
    } else if (report.targetType === "event") {
      await EventModel.findByIdAndUpdate(report.targetId, { $set: { status: "rejected" } });
    } else if (report.targetType === "review") {
      await ReviewModel.findByIdAndDelete(report.targetId);
    }
  }

  return actionOk({ updated: true });
}
