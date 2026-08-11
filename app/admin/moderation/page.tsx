// app/admin/moderation/page.tsx
import { notFound } from "next/navigation";
import { requireAdminUserId } from "@/lib/auth";
import { getPendingCertifications, getPendingEvents, getOpenReports } from "@/lib/actions/admin";
import { ModerationDashboard } from "@/components/moderation-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const adminId = await requireAdminUserId();
  if (!adminId) notFound();

  const [certifications, events, reports] = await Promise.all([
    getPendingCertifications(),
    getPendingEvents(),
    getOpenReports(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl italic text-paper">Moderation</h1>
      <ModerationDashboard
        initialCertifications={certifications.ok ? certifications.data : []}
        initialEvents={events.ok ? events.data : []}
        initialReports={reports.ok ? reports.data : []}
      />
    </div>
  );
}
