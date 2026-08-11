// components/manage-events-list.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EventDTO, EventStatus } from "@/types";
import { cancelEvent, deleteEventPermanently } from "@/lib/actions/events";
import { Badge, Button, Modal, EmptyState } from "@/components/ui";
import { IconCalendar, IconTrash } from "@/components/icons";

const statusMeta: Record<EventStatus, { label: string; tone: "brass" | "neutral" | "alert" | "zellige" }> = {
  pending_moderation: { label: "En moderation", tone: "brass" },
  published: { label: "Publie", tone: "zellige" },
  rejected: { label: "Refuse", tone: "alert" },
  cancelled: { label: "Annule", tone: "neutral" },
};

export function ManageEventsList({ initialEvents }: { initialEvents: EventDTO[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleCancel(id: string) {
    const res = await cancelEvent(id);
    if (res.ok) setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)));
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const res = await deleteEventPermanently(pendingDelete);
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== pendingDelete));
    setPendingDelete(null);
  }

  if (events.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState icon={<IconCalendar size={28} />} title="Aucun evenement pour l'instant" description="Cree ton premier evenement pour le voir apparaitre ici." />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {events.map((e) => {
        const meta = statusMeta[e.status];
        return (
          <div key={e.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-raised">
              {e.photos[0] && <Image src={e.photos[0]} alt={e.title} fill className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-paper">{e.title}</p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-mist-dim">{new Date(e.dateTime).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link href={`/events/${e.id}`}>
                <Button size="sm" variant="secondary">
                  Voir
                </Button>
              </Link>
              {e.status !== "cancelled" && (
                <Button size="sm" variant="ghost" onClick={() => handleCancel(e.id)}>
                  Annuler
                </Button>
              )}
              <button
                onClick={() => setPendingDelete(e.id)}
                aria-label="Supprimer"
                className="rounded-full p-2 text-mist hover:bg-surface-raised hover:text-alert-bright"
              >
                <IconTrash size={15} />
              </button>
            </div>
          </div>
        );
      })}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Supprimer definitivement ?">
        <p className="text-sm text-mist">Cette action supprime l&apos;evenement et ses photos de facon irreversible.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setPendingDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
