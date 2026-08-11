// components/manage-compensation-list.tsx
"use client";

import { useState } from "react";
import type { CompensationRequestDTO, CompensationStatus } from "@/types";
import { closeCompensationRequest, deleteCompensationRequest } from "@/lib/actions/compensation";
import { Badge, Button, Modal, EmptyState } from "@/components/ui";
import { IconLuggage, IconTrash } from "@/components/icons";

const statusMeta: Record<CompensationStatus, { label: string; tone: "brass" | "neutral" | "alert" | "zellige" }> = {
  open: { label: "Ouverte", tone: "zellige" },
  negotiating: { label: "En discussion", tone: "brass" },
  closed: { label: "Fermee", tone: "neutral" },
  cancelled: { label: "Annulee", tone: "alert" },
};

export function ManageCompensationList({ initialRequests }: { initialRequests: CompensationRequestDTO[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleClose(id: string) {
    const res = await closeCompensationRequest(id);
    if (res.ok) setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "closed" } : r)));
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const res = await deleteCompensationRequest(pendingDelete);
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== pendingDelete));
    setPendingDelete(null);
  }

  if (requests.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState icon={<IconLuggage size={28} />} title="Aucune annonce pour l'instant" description="Publie ta premiere annonce de trajet ou de transport." />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {requests.map((r) => {
        const meta = statusMeta[r.status];
        return (
          <div key={r.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-paper">
                  {r.fromCity} → {r.toCity}
                </p>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-mist-dim">
                {r.type === "trip_offer" ? "Trajet propose" : "Demande de transport"} ·{" "}
                {new Date(r.travelDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {r.status === "open" && (
                <Button size="sm" variant="ghost" onClick={() => handleClose(r.id)}>
                  Fermer
                </Button>
              )}
              <button
                onClick={() => setPendingDelete(r.id)}
                aria-label="Supprimer"
                className="rounded-full p-2 text-mist hover:bg-surface-raised hover:text-alert-bright"
              >
                <IconTrash size={15} />
              </button>
            </div>
          </div>
        );
      })}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Supprimer cette annonce ?">
        <div className="flex gap-3">
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
