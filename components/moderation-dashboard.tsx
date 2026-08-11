// components/moderation-dashboard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EventDTO } from "@/types";
import type { PendingCertificationDTO } from "@/lib/actions/admin";
import type { ReportWithContext } from "@/lib/actions/admin";
import { decideCertification, decideEvent, resolveReport } from "@/lib/actions/admin";
import { Button, Badge, EmptyState } from "@/components/ui";
import { IconCertified, IconCalendar, IconReport, IconCheck, IconClose } from "@/components/icons";

type Tab = "certifications" | "events" | "reports";

export function ModerationDashboard({
  initialCertifications,
  initialEvents,
  initialReports,
}: {
  initialCertifications: PendingCertificationDTO[];
  initialEvents: EventDTO[];
  initialReports: ReportWithContext[];
}) {
  const [tab, setTab] = useState<Tab>("certifications");
  const [certifications, setCertifications] = useState(initialCertifications);
  const [events, setEvents] = useState(initialEvents);
  const [reports, setReports] = useState(initialReports);

  async function handleCertification(userId: string, decision: "verified" | "rejected") {
    const res = await decideCertification(userId, decision);
    if (res.ok) setCertifications((prev) => prev.filter((c) => c.id !== userId));
  }

  async function handleEvent(eventId: string, decision: "published" | "rejected") {
    const res = await decideEvent(eventId, decision);
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handleReport(reportId: string, decision: "dismissed" | "actioned") {
    const res = await resolveReport(reportId, decision);
    if (res.ok) setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "certifications", label: "Certifications", count: certifications.length },
    { key: "events", label: "Evenements", count: events.length },
    { key: "reports", label: "Signalements", count: reports.length },
  ];

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              tab === t.key ? "border-brass bg-brass text-ink" : "border-line bg-surface text-mist hover:text-paper"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-alert text-xs text-paper">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {tab === "certifications" &&
          (certifications.length === 0 ? (
            <EmptyState icon={<IconCertified size={26} />} title="Rien a examiner" description="Toutes les demandes de certification sont traitees." />
          ) : (
            certifications.map((c) => (
              <div key={c.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-paper">{c.name}</p>
                    <p className="text-xs text-mist-dim">{c.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" icon={<IconClose size={14} />} onClick={() => handleCertification(c.id, "rejected")}>
                      Refuser
                    </Button>
                    <Button size="sm" icon={<IconCheck size={14} />} onClick={() => handleCertification(c.id, "verified")}>
                      Verifier
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {c.certificationDocuments.map((doc) => (
                    <a key={doc} href={doc} target="_blank" rel="noreferrer" className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-line">
                      <Image src={doc} alt="Document" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ))
          ))}

        {tab === "events" &&
          (events.length === 0 ? (
            <EmptyState icon={<IconCalendar size={26} />} title="Rien a examiner" description="Tous les evenements sont traites." />
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="min-w-0">
                  <Link href={`/events/${e.id}`} className="font-medium text-paper hover:text-brass">
                    {e.title}
                  </Link>
                  <p className="text-xs text-mist-dim">{new Date(e.dateTime).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="danger" icon={<IconClose size={14} />} onClick={() => handleEvent(e.id, "rejected")}>
                    Refuser
                  </Button>
                  <Button size="sm" icon={<IconCheck size={14} />} onClick={() => handleEvent(e.id, "published")}>
                    Publier
                  </Button>
                </div>
              </div>
            ))
          ))}

        {tab === "reports" &&
          (reports.length === 0 ? (
            <EmptyState icon={<IconReport size={26} />} title="Rien a examiner" description="Aucun signalement en attente." />
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{r.targetType}</Badge>
                      <p className="font-medium text-paper">{r.targetLabel}</p>
                    </div>
                    <p className="mt-1 text-sm text-mist">{r.reason}</p>
                    <p className="mt-1 text-xs text-mist-dim">Signale par {r.reporter.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleReport(r.id, "dismissed")}>
                      Ignorer
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReport(r.id, "actioned")}>
                      Agir
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
